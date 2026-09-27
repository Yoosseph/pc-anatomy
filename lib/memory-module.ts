import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { surfaceTexture } from './surfaces.ts';

/**
 * The two memory modules: a DDR5 and a DDR4 UDIMM from the same retail line.
 *
 * Coordinates are millimetres in the module frame, 1 unit ≈ 6 mm, so the
 * 133.35 mm module comes out a little over twenty-two units long and both
 * generations sit at their true relative size in the comparison workbench.
 * The board lies flat: length along X, the component (primary) face up +Y,
 * and the 288-contact edge along -Z.
 *
 * Both modelled modules are the 16 GB single-rank build of their line — eight
 * 16 Gb x8 packages on the primary face, nothing on the secondary face — so
 * what differs between them is the generation, not the capacity:
 *
 * - DDR5 regulates its own power. A PMIC and its inductors sit in the gap at
 *   the centre of the module, fed 5 V through the slot; the SPD hub beside it
 *   carries a temperature sensor. The command bus is terminated on the die.
 * - DDR4 takes its 1.2 V from the motherboard. The centre carries only the
 *   SPD EEPROM, and the far end of the fly-by command bus carries resistor
 *   networks that terminate it to VTT.
 * - The contact edge of DDR4 is curved, so a module rocks into the slot a few
 *   contacts at a time; DDR5's is straight. Both key at a different offset so
 *   neither seats in the other's slot.
 *
 * Package placement, passives, key offset and the spreader facets are
 * illustrative; outline, pitch, contact count, heights and thicknesses follow
 * the JEDEC outline and the maker's data sheets.
 */

export type Generation = 'ddr5' | 'ddr4';

export const mm = (value: number) => value / 6;

/** JEDEC 288-pin DIMM outline, shared by both generations. */
export const MODULE = {
  length: 133.35,
  height: 31.25,
  thickness: 1.27,
  pitch: 0.85,
  contacts: 288,
  /** Height of the gold contact field above the bottom edge. */
  fingerHeight: 3.0,
  /** Free edge between the last contact of one field and the first of the next. */
  keyGap: 3.4,
  keyWidth: 2.7,
  keyDepth: 3.6,
} as const;

type GenerationSpec = {
  /** Contacts per face to the left of the key, looking at the primary face. */
  leftContacts: number;
  /** How far the ends of the contact edge rise above its middle. */
  edgeCurve: number;
  /** Overall height and thickness with the heat spreader, from the data sheet. */
  outerHeight: number;
  outerThickness: number;
  /** Package outline, from the DRAM maker's 78-ball FBGA drawing. */
  packageSize: [number, number, number];
  ids: {
    board: string;
    chip: string;
    spd: string;
    decap: string;
    contacts: string;
    spreaderFront: string;
    spreaderBack: string;
    pad: string;
  };
};

export const generations: Record<Generation, GenerationSpec> = {
  ddr5: {
    leftContacts: 64,
    edgeCurve: 0,
    outerHeight: 34.9,
    outerThickness: 6.62,
    packageSize: [7.5, 1.0, 11],
    ids: {
      board: 'dimmboard',
      chip: 'dramchip',
      spd: 'dimmspd',
      decap: 'dimmdecap',
      contacts: 'dimmcontacts',
      spreaderFront: 'dimmspreader',
      spreaderBack: 'dimmspreaderback',
      pad: 'dimmpad',
    },
  },
  ddr4: {
    leftContacts: 76,
    edgeCurve: 0.6,
    outerHeight: 34.0,
    outerThickness: 7.2,
    packageSize: [7.5, 1.0, 11],
    ids: {
      board: 'ddr4board',
      chip: 'ddr4chip',
      spd: 'ddr4spd',
      decap: 'ddr4decap',
      contacts: 'ddr4contacts',
      spreaderFront: 'ddr4spreader',
      spreaderBack: 'ddr4spreaderback',
      pad: 'ddr4pad',
    },
  },
};

/**
 * Centre of the key, in millimetres from the middle of the module. With the
 * same margin at both ends, the key sits wherever the contact count to its
 * left puts it: 72 would centre it.
 */
export const keyCenter = (gen: Generation) =>
  -MODULE.pitch * (72 - generations[gen].leftContacts);

/** Where the bottom edge is at a given X: straight on DDR5, bowed on DDR4. */
export const edgeBottom = (gen: Generation, x: number) => {
  const half = MODULE.length / 2;
  return -MODULE.height / 2 + generations[gen].edgeCurve * (x / half) ** 2;
};

/** Contact centres along X on one face, in pin order from the left. */
export function contactPositions(gen: Generation) {
  const left = generations[gen].leftContacts;
  const k = keyCenter(gen);
  const xs: number[] = [];
  for (let i = 0; i < 144; i++)
    xs.push(
      i < left
        ? k - MODULE.keyGap / 2 - (left - 1 - i) * MODULE.pitch
        : k + MODULE.keyGap / 2 + (i - left) * MODULE.pitch,
    );
  return xs;
}

/** Centres of the eight packages, four each side of the centre gap. */
export const chipCenters = [-55.5, -42.5, -29.5, -16.5, 16.5, 29.5, 42.5, 55.5];
const CHIP_Z = 3.0;

/** The module outline as a 2-D shape in (x, -z) so it extrudes the right way up. */
function boardShape(gen: Generation) {
  const L = MODULE.length / 2;
  const H = MODULE.height / 2;
  const k = keyCenter(gen);
  const w = MODULE.keyWidth / 2;
  const chamfer = 1.0;
  const latchZ = -H + 12.5;
  const latchR = 1.4;
  const s = new T.Shape();
  // Shape coordinates are (x, -z): the top of the module is at -H.
  const at = (x: number, z: number) => [x, -z] as const;
  s.moveTo(...at(-L, H));
  // Left end, top to bottom, with the latch notch.
  s.lineTo(...at(-L, latchZ + latchR));
  s.absarc(-L, -latchZ, latchR, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(...at(-L, edgeBottom(gen, -L) + chamfer));
  s.lineTo(...at(-L + chamfer, edgeBottom(gen, -L + chamfer)));
  // Bottom edge up to the key, sampled so DDR4's bow is drawn.
  const edge = (from: number, to: number) => {
    const steps = 24;
    for (let i = 1; i <= steps; i++) {
      const x = from + ((to - from) * i) / steps;
      s.lineTo(...at(x, edgeBottom(gen, x)));
    }
  };
  edge(-L + chamfer, k - w);
  // The key: straight sides, round top.
  const keyTop = edgeBottom(gen, k) + MODULE.keyDepth;
  s.lineTo(...at(k - w, keyTop - w));
  s.absarc(k, -(keyTop - w), w, Math.PI, 2 * Math.PI, false);
  s.lineTo(...at(k + w, edgeBottom(gen, k + w)));
  edge(k + w, L - chamfer);
  s.lineTo(...at(L, edgeBottom(gen, L) + chamfer));
  s.lineTo(...at(L, latchZ - latchR));
  s.absarc(L, -latchZ, latchR, Math.PI / 2, (3 * Math.PI) / 2, false);
  s.lineTo(...at(L, H));
  s.lineTo(...at(-L, H));
  return s;
}

/** A spreader plate outline in (x, -z), per generation. */
function plateShape(gen: Generation, bottom: number, top: number) {
  const L = 128 / 2;
  const s = new T.Shape();
  const at = (x: number, z: number) => [x, -z] as const;
  s.moveTo(...at(-L, bottom));
  s.lineTo(...at(L, bottom));
  if (gen === 'ddr5') {
    // Low and plain: one angled corner at each end of the top edge.
    s.lineTo(...at(L, top - 4.5));
    s.lineTo(...at(L - 5, top));
    s.lineTo(...at(-L + 7, top));
    s.lineTo(...at(-L, top - 7));
  } else {
    // Stepped top edge: a raised crown over the middle two thirds.
    s.lineTo(...at(L, top - 3.2));
    s.lineTo(...at(L - 18, top - 3.2));
    s.lineTo(...at(L - 22, top));
    s.lineTo(...at(-L + 30, top));
    s.lineTo(...at(-L + 34, top - 3.2));
    s.lineTo(...at(-L + 6, top - 3.2));
    s.lineTo(...at(-L, top - 7));
  }
  s.closePath();
  return s;
}

/** Extrude a (x, -z) shape along +Y by `depth` millimetres, in scene units. */
function slab(shape: T.Shape, depth: number, bevel = 0) {
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  g.scale(1 / 6, 1 / 6, 1 / 6);
  return g;
}

/** Replace an extrusion's UVs with its X/Z extent, so a board texture maps once. */
function planarUv(g: T.BufferGeometry) {
  g.computeBoundingBox();
  const b = g.boundingBox!;
  const pos = g.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - b.min.x) / (b.max.x - b.min.x);
    uv[i * 2 + 1] = (pos.getZ(i) - b.min.z) / (b.max.z - b.min.z);
  }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2));
  return g;
}

/** Small printed text on a transparent plane, facing +Y or -Y. */
function printed(
  text: string,
  width: number,
  color: string,
  facing: 1 | -1,
  weight = 500,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 48;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.font = `${weight} 30px monospace`;
  ctx.fillText(text, 256, 34, 490);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const plane = new T.Mesh(
    new T.PlaneGeometry(width, (width * 48) / 512),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  // Reading direction stays left to right from whichever side it faces.
  plane.rotation.x = facing > 0 ? -Math.PI / 2 : Math.PI / 2;
  if (facing < 0) plane.rotation.z = Math.PI;
  return plane;
}

export function buildMemoryModule(gen: Generation, tools: ModelTools) {
  const { add, box, pcb, label, material } = tools;
  const spec = generations[gen];
  const ids = spec.ids;
  const t = MODULE.thickness / 2;
  const place = (group: T.Group, object: T.Object3D, at: Vec3) => {
    object.position.set(...at);
    group.add(object);
    return object;
  };
  const v = (x: number, y: number, z: number): Vec3 => [mm(x), mm(y), mm(z)];

  // ── Board ───────────────────────────────────────────────────────────────
  // One extruded outline: the key, the latch notches and (on DDR4) the bowed
  // contact edge are cut into the laminate rather than approximated by boxes.
  const board = new T.Group();
  const reference = pcb([1, 0.1, 1], 'memory');
  const faces = reference.material as T.Material[];
  reference.geometry.dispose();
  const laminate = planarUv(slab(boardShape(gen), MODULE.thickness));
  laminate.translate(0, -mm(t), 0);
  board.add(new T.Mesh(laminate, [faces[2], faces[0]]));
  label(
    board,
    gen === 'ddr5' ? 'PC5-48000 · 1RX8' : 'PC4-25600 · 1RX8',
    v(0, t + 0.02, 11.8),
    mm(34),
    '#aeb6bd',
  );
  add(ids.board, board, [0, 0, 0], [0, -0.8, 0]);

  // ── DRAM packages ───────────────────────────────────────────────────────
  // Eight x8 packages, long side across the module, one rank. On DDR5 the
  // left four answer subchannel A and the right four subchannel B; on DDR4
  // all eight share one 64-bit channel.
  const [pw, ph, pd] = spec.packageSize;
  chipCenters.forEach((x) => {
    const chip = new T.Group();
    chip.add(box([mm(pw), mm(ph), mm(pd)], '#15171a', 0.08, mm(0.15)));
    // Pin-1 dot and a quiet laser marking.
    place(
      chip,
      new T.Mesh(
        new T.CylinderGeometry(mm(0.35), mm(0.35), mm(0.02), 12),
        material('#5b6166', 0.1, 0.6),
      ),
      v(-pw / 2 + 1, ph / 2 + 0.01, -pd / 2 + 1),
    );
    label(
      chip,
      gen === 'ddr5' ? 'DDR5 16GBIT' : 'DDR4 16GBIT',
      v(0, ph / 2 + 0.02, 1.2),
      mm(5.8),
      '#8c9397',
    );

    add(ids.chip, chip, v(x, t + ph / 2, CHIP_Z), [
      Math.sign(x) * 0.3,
      0.95,
      0.2,
    ]);
  });

  // ── Power and management ────────────────────────────────────────────────
  const smallIc = (size: [number, number], height: number, text: string) => {
    const g = new T.Group();
    g.add(
      box([mm(size[0]), mm(height), mm(size[1])], '#1b1e21', 0.1, mm(0.08)),
    );
    label(g, text, v(0, height / 2 + 0.02, 0), mm(size[0] * 0.8), '#8c9499');
    return g;
  };
  if (gen === 'ddr5') {
    // The PMIC: 5 V in through the slot, the DRAM rails out.
    add(
      'dimmpmic',
      smallIc([4, 4], 0.9, 'PMIC'),
      v(0, t + 0.45, 6),
      [0, 0.95, 0.2],
    );
    // One power inductor per buck output.
    const inductors = new T.Group();
    for (const [x, z] of [
      [-7.6, 8.8],
      [-7.6, 3.2],
      [7.6, 6.0],
    ]) {
      const coil = new T.Group();
      coil.add(box([mm(2.5), mm(1.1), mm(2.0)], '#2a2d30', 0.25, mm(0.1)));
      for (const side of [-1, 1])
        place(
          coil,
          box([mm(0.5), mm(0.4), mm(2.02)], '#a8763f', 0.9),
          v(side * 1.05, -0.35, 0),
        );
      place(inductors, coil, v(x, 0, z));
    }
    add('dimminductor', inductors, v(0, t + 0.55, 0), [0, 0.85, 0.1]);
    add(
      'dimmspd',
      smallIc([2.2, 2.0], 0.6, 'SPD'),
      v(0, t + 0.3, -5.2),
      [0, 0.8, -0.2],
    );
  } else {
    add(
      'ddr4spd',
      smallIc([3, 2], 0.8, 'SPD'),
      v(0, t + 0.4, -5.2),
      [0, 0.8, -0.2],
    );
    // Fly-by termination: resistor networks at the far end of the command bus.
    const term = new T.Group();
    for (const z of [-3, 0, 3, 6, 9]) {
      const array = new T.Group();
      array.add(box([mm(2.0), mm(0.45), mm(1.0)], '#1f2124', 0.2));
      for (let i = 0; i < 4; i++)
        for (const side of [-1, 1])
          place(
            array,
            box([mm(0.3), mm(0.47), mm(0.25)], '#b9bec2', 0.9),
            v(-0.75 + i * 0.5, 0, side * 0.45),
          );
      place(term, array, v(0, 0, z));
    }
    add('ddr4term', term, v(62.6, t + 0.23, 0), [0.5, 0.8, 0]);
  }

  // Decoupling: a row of MLCCs under every package, plus bulk parts beside
  // the regulator on DDR5. One concept, drawn as instances of one geometry.
  const decap = new T.Group();
  const capGeo = new T.BoxGeometry(mm(1.0), mm(0.5), mm(0.5));
  const capPositions: Vec3[] = [];
  for (const x of chipCenters)
    for (const dx of [-2.2, 0, 2.2]) capPositions.push(v(x + dx, 0, -4.4));
  if (gen === 'ddr5')
    for (const [x, z] of [
      [-3.2, 10.6],
      [-1.2, 10.6],
      [1.2, 10.6],
      [3.2, 10.6],
      [4.2, 2.4],
      [-4.2, 0.4],
    ])
      capPositions.push(v(x, 0, z));
  else for (const z of [-6.5, 11.5]) capPositions.push(v(62.6, 0, z));
  const caps = new T.InstancedMesh(
    capGeo,
    material('#b39c7a', 0.2, 0.55),
    capPositions.length,
  );
  capPositions.forEach((p, i) =>
    caps.setMatrixAt(i, new T.Matrix4().makeTranslation(...p)),
  );
  decap.add(caps);
  add(ids.decap, decap, v(0, t + 0.25, 0), [0, 0.6, 0]);

  // ── Contact edge ────────────────────────────────────────────────────────
  // 144 fingers on each face at 0.85 mm pitch, following the bottom edge, so
  // DDR4's fingers rise toward the ends with the board.
  const contacts = new T.Group();
  const xs = contactPositions(gen);
  const finger = new T.BoxGeometry(
    mm(0.6),
    mm(0.04),
    mm(MODULE.fingerHeight - 0.4),
  );
  const fingers = new T.InstancedMesh(
    finger,
    material('#d7b866', 0.95, 0.22),
    288,
  );
  let n = 0;
  for (const side of [1, -1])
    for (const x of xs) {
      const z = edgeBottom(gen, x) + 0.3 + (MODULE.fingerHeight - 0.4) / 2;
      fingers.setMatrixAt(
        n++,
        new T.Matrix4().makeTranslation(mm(x), side * mm(t + 0.02), mm(z)),
      );
    }
  contacts.add(fingers);
  contacts.userData.fingers = fingers;
  add(ids.contacts, contacts, [0, 0, 0], [0, -0.3, -1.4]);

  // ── Heat spreader and pads ──────────────────────────────────────────────
  // Two aluminium plates, one per face, bonded with thermal tape: over the
  // package tops on the primary face, straight onto the bare laminate on the
  // secondary. Their outer faces come out at the data sheet's thickness.
  const outer = spec.outerThickness / 2;
  const rib = gen === 'ddr5' ? 0.22 : 0.4;
  const plate = 0.8;
  const frontInner = outer - rib - plate;
  const chipTop = t + ph;
  const bottom = -9.2;
  const bevel = 0.25;
  const top = -MODULE.height / 2 + spec.outerHeight - bevel;

  // Every pad stops a hair short of the plate above it. A face shared with
  // the plate's underside, or with a neighbouring pad, is two surfaces at one
  // depth, and the renderer flickers between them as the camera moves.
  const gap = 0.02;
  const pads = new T.Group();
  const padMat = material('#3b4046', 0.05, 0.9);
  const padTop = frontInner - gap;
  for (const sign of [-1, 1]) {
    const pad = new T.Mesh(
      new T.BoxGeometry(mm(51), mm(padTop - chipTop), mm(pd - 1)),
      padMat,
    );
    pad.position.set(mm(sign * 36.5), mm((padTop + chipTop) / 2), mm(CHIP_Z));
    pads.add(pad);
  }
  if (gen === 'ddr5') {
    // A separate blue pad over the regulator in the middle, clear of the
    // inductors' tops and of the strips either side, so the PMIC also sheds
    // its heat into the plate.
    const coilTop = t + 0.55 + 0.55;
    const centre = new T.Mesh(
      new T.BoxGeometry(mm(20), mm(padTop - coilTop), mm(12)),
      material('#3d6f9e', 0.05, 0.85),
    );
    centre.position.set(0, mm((padTop + coilTop) / 2), mm(5.5));
    pads.add(centre);
  }
  add(ids.pad, pads, [0, 0, 0], [0, 1.8, -1.2]);
  // The adhesive tape on the bare secondary face, from the laminate to the
  // back plate. It leaves downward with that plate rather than up through the
  // board with the pads.
  const tape = new T.Group();
  const tapeBody = new T.Mesh(
    new T.BoxGeometry(mm(118), mm(frontInner - gap - t), mm(12)),
    padMat,
  );
  tapeBody.position.set(0, -mm((frontInner - gap + t) / 2), mm(CHIP_Z));
  tape.add(tapeBody);
  add(ids.pad, tape, [0, 0, 0], [0, -1.5, 0]);

  const brush = surfaceTexture('brushed');
  const finish = new T.MeshStandardMaterial({
    color: '#1d2023',
    metalness: 0.82,
    roughness: 0.46,
    bumpMap: brush,
    bumpScale: 0.002,
    roughnessMap: brush,
  });
  finish.envMapIntensity = 0.85;
  const ridge = material(gen === 'ddr5' ? '#2b2f34' : '#33383e', 0.9, 0.28);

  const spreader = (face: 1 | -1) => {
    const g = new T.Group();
    const body = slab(plateShape(gen, bottom, top), plate - 2 * bevel, bevel);
    // The bevel grows the extrusion both ways; shift it back inside [inner, inner + plate].
    body.translate(
      0,
      (face > 0 ? mm(frontInner) : -mm(frontInner + plate)) + mm(bevel),
      0,
    );
    g.add(new T.Mesh(body, finish));
    // Raised facet bands, proud of the plate by the rib height.
    // Thin raised ridges, leaning outward, in the plate's own finish: the
    // faces read as sculpted metal rather than as two flat sheets.
    const bands: [number, number, number][] =
      gen === 'ddr5'
        ? [
            [-50, 1.6, 0.3],
            [-46, 1.6, 0.3],
            [-42, 1.6, 0.3],
            [42, 1.6, -0.3],
            [46, 1.6, -0.3],
            [50, 1.6, -0.3],
          ]
        : [
            [-54, 2.4, 0.5],
            [-49, 2.4, 0.5],
            [36, 2.4, -0.5],
            [41, 2.4, -0.5],
            [46, 2.4, -0.5],
          ];
    for (const [x, width, lean] of bands) {
      const s = new T.Shape();
      const h0 = bottom + 2.5;
      const h1 = top - 5;
      const skew = (h1 - h0) * lean;
      s.moveTo(x - width / 2, -h0);
      s.lineTo(x + width / 2, -h0);
      s.lineTo(x + width / 2 + skew, -h1);
      s.lineTo(x - width / 2 + skew, -h1);
      s.closePath();
      const band = slab(s, rib);
      band.translate(
        0,
        face > 0 ? mm(frontInner + plate) : -mm(frontInner + plate + rib),
        0,
      );
      g.add(new T.Mesh(band, ridge));
    }
    // Printed on the plate itself, not floating at the height of the ridges.
    const y = face * mm(frontInner + plate + 0.03);
    const wordmark = printed('KINGSTON FURY', mm(58), '#d3d8dc', face, 700);
    wordmark.position.set(0, y, mm(4));
    g.add(wordmark);
    const series = printed(
      gen === 'ddr5' ? 'BEAST · DDR5' : 'BEAST · DDR4',
      mm(30),
      '#9aa2a8',
      face,
    );
    series.position.set(0, y, mm(-2.5));
    g.add(series);
    if (face < 0) {
      // Spec sticker on the secondary face.
      const sticker = box([mm(44), mm(0.1), mm(13)], '#d8dbdf', 0.05);
      sticker.position.set(mm(-2), -mm(outer - rib + 0.02), mm(1.5));
      g.add(sticker);
      const lines =
        gen === 'ddr5'
          ? ['KF560C36BBE-16', 'DDR5-6000 CL36 1.35V', '16GB 1RX8 · ON-DIE ECC']
          : ['KF432C16BB/16', 'DDR4-3200 CL16 1.35V', '16GB 1RX8'];
      lines.forEach((text, i) => {
        const line = printed(text, mm(38), '#33383d', -1);
        line.position.set(mm(-2), -mm(outer - rib + 0.09), mm(5.5 - i * 4));
        g.add(line);
      });
    } else {
      // The top interlock: the front plate folds over the edge to meet the back.
      const skin = frontInner + plate;
      const lip = box([mm(126), mm(skin * 2 - 0.1), mm(0.8)], '#1a1d20', 0.8);
      lip.position.set(0, 0, mm(top - 0.4));
      g.add(lip);
      // Two locking clips hold the halves together along the top edge. They
      // sit inside the plates' outline, so they read as part of the edge
      // instead of as tabs standing off it.
      for (const x of [-40, 40]) {
        const clip = box([mm(5), mm(skin * 2 - 0.1), mm(1.4)], '#1a1d20', 0.8);
        clip.position.set(mm(x), 0, mm(top - 1.5));
        g.add(clip);
      }
    }
    return g;
  };
  add(ids.spreaderFront, spreader(1), [0, 0, 0], [0, 3.0, -2.6]);
  add(ids.spreaderBack, spreader(-1), [0, 0, 0], [0, -2.4, 0]);
}

export function buildDimm(tools: ModelTools) {
  buildMemoryModule('ddr5', tools);
}

export function buildDdr4(tools: ModelTools) {
  buildMemoryModule('ddr4', tools);
}
