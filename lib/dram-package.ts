import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import type { Generation } from './memory-module.ts';

/**
 * Inside one DRAM package: a 78-ball x8 FBGA, opened up.
 *
 * Coordinates are millimetres in the package frame, 1 unit = 1 mm across the
 * package, with thickness drawn 2.5 × true so a stack barely a millimetre tall
 * can be read. Both generations use the same construction, which is the
 * reason the ball map looks the way it does:
 *
 * The die is mounted face down on the substrate. Its bond pads run in a
 * stripe down the middle of the die, and the substrate has a slot cut under
 * that stripe. Gold wires drop from the pads through the slot to bond fingers
 * on the substrate's underside, and a bead of encapsulant fills the slot and
 * covers them. That bead occupies the middle of the underside, which is why
 * the ball grid has three empty columns down its centre: 13 rows of 3 + 3
 * balls on a 0.8 mm pitch, 78 in all.
 *
 * Ball count, pitch, matrix and body size follow the DRAM makers' FBGA
 * drawings. Die size, pad and wire counts, layer thicknesses and the
 * encapsulant profile are illustrative; the package is sealed and no
 * particular vendor's die is claimed.
 */

const VZ = 2.5;
const y = (value: number) => value * VZ;

type PackageIds = {
  ball: string;
  encap: string;
  substrate: string;
  adhesive: string;
  die: string;
  pads: string;
  wire: string;
  mold: string;
};

export const packageIds: Record<Generation, PackageIds> = {
  ddr5: {
    ball: 'dramball',
    encap: 'dramencap',
    substrate: 'dramsubstrate',
    adhesive: 'dramadhesive',
    die: 'dramdie',
    pads: 'drampads',
    wire: 'drambondwire',
    mold: 'drammold',
  },
  ddr4: {
    ball: 'ddr4ball',
    encap: 'ddr4encap',
    substrate: 'ddr4substrate',
    adhesive: 'ddr4adhesive',
    die: 'ddr4die',
    pads: 'ddr4pads',
    wire: 'ddr4bondwire',
    mold: 'ddr4mold',
  },
};

/** Published package geometry, shared by both generations' x8 parts. */
export const FBGA = {
  body: [7.5, 11] as const,
  pitch: 0.8,
  rows: 13,
  /** Ball columns 1–3 and 7–9 of a nine-column grid; 4–6 are depopulated. */
  columns: [1, 2, 3, 7, 8, 9] as const,
  ballDiameter: 0.47,
  /** Half-width of the substrate slot under the die's pad stripe. */
  slot: 0.6,
} as const;

/** Stack heights in true millimetres, bottom of the substrate at zero. */
export const STACK = {
  ballBottom: -0.33,
  substrate: 0.21,
  adhesive: 0.05,
  die: 0.1,
  moldTop: 0.95,
  encapBottom: -0.2,
} as const;

const dies: Record<Generation, { size: [number, number]; mark: string[] }> = {
  ddr5: { size: [6.2, 9.8], mark: ['DDR5 SDRAM', '16Gb · x8'] },
  ddr4: { size: [6.6, 9.6], mark: ['DDR4 SDRAM', '16Gb · x8'] },
};

export function ballPositions(): Vec3[] {
  const out: Vec3[] = [];
  for (let r = 0; r < FBGA.rows; r++)
    for (const c of FBGA.columns)
      out.push([
        (c - 5) * FBGA.pitch,
        y(STACK.ballBottom / 2),
        (r - (FBGA.rows - 1) / 2) * FBGA.pitch,
      ]);
  return out;
}

export function buildDramPackage(gen: Generation, tools: ModelTools) {
  const { add, instances, box, material, label } = tools;
  const ids = packageIds[gen];
  const [bw, bl] = FBGA.body;
  const [dw, dl] = dies[gen].size;
  const subTop = STACK.substrate;
  const dieBottom = subTop + STACK.adhesive;
  const put = (g: T.Group, o: T.Object3D, at: Vec3) => {
    o.position.set(...at);
    g.add(o);
    return o;
  };

  // ── Mold cap ────────────────────────────────────────────────────────────
  const mold = new T.Group();
  const moldH = STACK.moldTop - subTop;
  put(mold, box([bw, y(moldH), bl], '#17191c', 0.06, 0.05), [0, 0, 0]);
  put(
    mold,
    new T.Mesh(
      new T.CylinderGeometry(0.28, 0.28, 0.02, 16),
      material('#50565b', 0.1, 0.6),
    ),
    [-bw / 2 + 0.75, y(moldH) / 2 + 0.005, -bl / 2 + 0.75],
  );
  label(
    mold,
    dies[gen].mark[0],
    [0, y(moldH) / 2 + 0.01, -1.2],
    5.2,
    '#7f878c',
  );
  label(mold, dies[gen].mark[1], [0, y(moldH) / 2 + 0.01, 0.3], 3.6, '#6c7378');
  label(mold, '78-BALL FBGA', [0, y(moldH) / 2 + 0.01, 1.8], 3.8, '#5d6367');
  add(ids.mold, mold, [0, y(subTop + moldH / 2), 0], [0, 1.9, 0]);

  // ── Die, face down ──────────────────────────────────────────────────────
  // The back of the die faces up into the mold; its circuitry faces the
  // substrate. The array halves and the centre pad stripe are drawn on the
  // underside, where they actually are.
  const die = new T.Group();
  put(die, box([dw, y(STACK.die), dl], '#3a4a57', 0.55, 0.01), [0, 0, 0]);
  const face = material('#27465a', 0.6, 0.35);
  for (const side of [-1, 1]) {
    const half = new T.Mesh(
      new T.BoxGeometry(dw / 2 - 0.5, 0.01, dl - 0.5),
      face,
    );
    half.position.set(side * (dw / 4 + 0.15), -y(STACK.die) / 2 - 0.004, 0);
    die.add(half);
  }
  label(die, 'BACK OF DIE', [0, y(STACK.die) / 2 + 0.01, 0], 3.4, '#9fb3c0');
  add(ids.die, die, [0, y(dieBottom + STACK.die / 2), 0], [0, 1.7, 0]);

  // Two rows of bond pads down the centre stripe of the die face.
  const padPitch = 0.28;
  const perRow = Math.floor((dl - 0.8) / padPitch);
  const pads: Vec3[] = [];
  const padZ = (i: number) => (i - (perRow - 1) / 2) * padPitch;
  for (const side of [-1, 1])
    for (let i = 0; i < perRow; i++)
      pads.push([side * 0.18, y(dieBottom) - 0.012, padZ(i)]);
  instances(ids.pads, pads, [0.12, 0.02, 0.14], 0, '#d8c07a').forEach((p) =>
    p.delta.set(0, 1.7, 0),
  );

  // ── Die attach ──────────────────────────────────────────────────────────
  const adhesive = new T.Group();
  for (const side of [-1, 1])
    put(
      adhesive,
      box([dw / 2 - FBGA.slot - 0.05, y(STACK.adhesive), dl], '#8a7a4e', 0.05),
      [side * (FBGA.slot + 0.05 + (dw / 2 - FBGA.slot - 0.05) / 2), 0, 0],
    );
  add(
    ids.adhesive,
    adhesive,
    [0, y(subTop + STACK.adhesive / 2), 0],
    [0, 1.0, 0],
  );

  // ── Substrate, with the slot cut through it ─────────────────────────────
  const substrate = new T.Group();
  const halfW = bw / 2 - FBGA.slot;
  for (const side of [-1, 1])
    put(substrate, box([halfW, y(subTop), bl], '#2c4a3a', 0.12, 0.01), [
      side * (FBGA.slot + halfW / 2),
      0,
      0,
    ]);
  // The slot runs the length of the pad stripe; the substrate closes at both ends.
  const bridge = (bl - dl) / 2 + 0.2;
  for (const end of [-1, 1])
    put(substrate, box([FBGA.slot * 2, y(subTop), bridge], '#2c4a3a', 0.12), [
      0,
      0,
      end * (bl / 2 - bridge / 2),
    ]);
  // Bond fingers along both slot edges on the underside, and ball lands.
  const gold = material('#d4b25e', 0.9, 0.3);
  const fingerGeo = new T.BoxGeometry(0.3, 0.02, 0.14);
  for (const side of [-1, 1])
    for (let i = 0; i < perRow; i++) {
      const f = new T.Mesh(fingerGeo, gold);
      f.position.set(
        side * (FBGA.slot + 0.22),
        -y(subTop) / 2 - 0.011,
        padZ(i),
      );
      substrate.add(f);
    }
  label(
    substrate,
    'SUBSTRATE · SLOT',
    [-bw / 4 - 0.3, y(subTop) / 2 + 0.01, -bl / 2 + 0.6],
    2.6,
    '#8fb09c',
  );
  add(ids.substrate, substrate, [0, y(subTop / 2), 0], [0, 0, 0]);

  // ── Bond wires ──────────────────────────────────────────────────────────
  // Each wire leaves a pad on the die face, drops through the slot and lands
  // on a finger on the underside of the substrate.
  const wires = new T.Group();
  const wireMat = material('#e2c46f', 0.95, 0.25);
  for (const side of [-1, 1])
    for (let i = 0; i < perRow; i++) {
      const z = padZ(i);
      const curve = new T.CubicBezierCurve3(
        new T.Vector3(side * 0.18, y(dieBottom) - 0.02, z),
        new T.Vector3(side * 0.12, y(-0.05), z),
        new T.Vector3(side * (FBGA.slot + 0.05), y(-0.16), z),
        new T.Vector3(side * (FBGA.slot + 0.22), -0.025, z),
      );
      wires.add(new T.Mesh(new T.TubeGeometry(curve, 10, 0.022, 5), wireMat));
    }
  add(ids.wire, wires, [0, 0, 0], [0, -0.35, 0]);

  // ── Encapsulant bead over the slot ──────────────────────────────────────
  const encap = new T.Group();
  const beadW = 1.9;
  const bead = new T.Mesh(
    new T.BoxGeometry(beadW, y(subTop - STACK.encapBottom), dl + 0.2),
    new T.MeshStandardMaterial({
      color: '#1f2226',
      roughness: 0.55,
      metalness: 0.02,
      transparent: true,
      opacity: 0.55,
    }),
  );
  encap.add(bead);
  add(
    ids.encap,
    encap,
    [0, y((subTop + STACK.encapBottom) / 2), 0],
    [0, -0.9, 0],
  );

  // ── Solder balls ────────────────────────────────────────────────────────
  const r = FBGA.ballDiameter / 2;
  const ball = new T.SphereGeometry(r, 14, 10);
  ball.scale(1, y(-STACK.ballBottom) / (2 * r), 1);
  // Instances drawn from custom geometry take their colour from the
  // geometry itself: the scene resets instance colours for highlighting.
  const silver = new T.Color('#aeb5bb');
  ball.setAttribute(
    'color',
    new T.BufferAttribute(
      new Float32Array(
        Array.from({ length: ball.getAttribute('position').count }, () =>
          silver.toArray(),
        ).flat(),
      ),
      3,
    ),
  );
  instances(
    ids.ball,
    ballPositions(),
    [FBGA.ballDiameter, y(-STACK.ballBottom), FBGA.ballDiameter],
    0,
    '#b9c0c6',
    ball,
  ).forEach((p, i) => p.delta.set(((i % 6) - 2.5) * 0.08, -1.5, 0));
}

export function buildDram(tools: ModelTools) {
  buildDramPackage('ddr5', tools);
}

export function buildDdr4Dram(tools: ModelTools) {
  buildDramPackage('ddr4', tools);
}
