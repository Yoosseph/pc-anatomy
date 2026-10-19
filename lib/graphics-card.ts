import * as T from 'three';
import { roundedBox } from './geometry-cache.ts';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import type { Finisher } from './materials.ts';
import { glowMaterial } from './parts.ts';

/**
 * One graphics card, built once and used at both scales.
 *
 * The card used to be modelled twice: a detailed two-fan version at its own
 * scale and a separate, cruder two-fan slab inside the tower. Two models of
 * one object drift, and these had — different proportions, different shroud,
 * different fans — so the card you pulled out of the machine was visibly not
 * the card that had been in it. Everything below is the single source, and
 * both callers build from it.
 *
 * The exterior follows the ASUS TUF RTX 5090 reference selected by the user.
 * The Founders Edition uses a different two-fan construction.
 *
 * ── Proportions ──────────────────────────────────────────────────────────
 * Everything is a fraction of the card's LENGTH, so one number sizes the whole
 * card and the two scales cannot disagree about its shape. The fractions are
 * based on ASUS's published 348 × 146 × 72 mm / 3.6-slot envelope.
 *
 * ── Local frame ──────────────────────────────────────────────────────────
 *   +X  along the card, away from the bracket   −X  the bracket end
 *   +Y  out of the board, the way the fans face
 *   +Z  across the card
 *
 * A card in a tower hangs cooler-downward, so `machine.ts` installs this by
 * turning it half a turn about X. That also swaps which long edge faces the
 * window, which is what `logoEdge` is for.
 */
export const CARD = {
  /** Across the slot, ÷ length. A 350 mm card stands about 150 mm tall. */
  width: 146 / 348,
  /** Total thickness of the cooler, ÷ length: three and a half slots. */
  depth: 68 / 348,
  /**
   * Where the three fans sit along the card, ÷ length.
   *
   * Spacing and radius are a pair, not two free numbers. The apertures are cut
   * out of one extruded plate, and two openings that overlap leave the plate's
   * top face impossible to triangulate: three.js then silently gives up on the
   * second and third holes and returns a solid panel with two faint circles
   * drawn on it. Keep `2 × fanRadius` comfortably under this spacing.
   */
  fans: [-0.315, 0, 0.315] as const,
  /** Fan radius ÷ length: about a 105 mm fan on a 350 mm card. */
  fanRadius: 0.15,
  /** The board inside is far shorter than the cooler around it. */
  pcb: { length: 0.66, width: 0.35, centerX: -0.15 },
};

/**
 * One axial fan blade, swept and twisted, with real thickness and closed rims.
 *
 * Authored at unit radius so a caller scales it to whatever fan it needs. A
 * flat fin rotated round a hub reads as a paper windmill; the sweep, the
 * twist toward the tip and the closed edge are what make it read as a moulded
 * impeller.
 */
export function bladeGeometry() {
  const verts: number[] = [],
    indices: number[] = [];
  const rows = 13,
    cols = 6;
  for (let side = 0; side < 2; side++)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const t = r / (rows - 1),
          u = c / (cols - 1) - 0.5;
        const radius = (0.32 + t * 1.13) / 1.45;
        const angle = 0.8 * Math.pow(t, 1.3) + u * (0.95 - 0.24 * t);
        const height =
          (0.12 * Math.sin(t * Math.PI * 0.85) + u * 0.24 * (0.25 + t)) / 1.45;
        verts.push(
          Math.cos(angle) * radius,
          height + side * (0.027 / 1.45),
          Math.sin(angle) * radius,
        );
      }
  for (let side = 0; side < 2; side++)
    for (let r = 0; r < rows - 1; r++)
      for (let c = 0; c < cols - 1; c++) {
        const a = side * rows * cols + r * cols + c,
          b = a + 1,
          d = a + cols,
          e = d + 1;
        indices.push(...(side ? [a, d, b, b, d, e] : [a, b, d, b, e, d]));
      }
  const layer = rows * cols;
  for (let r = 0; r < rows - 1; r++)
    for (const c of [0, cols - 1]) {
      const a = r * cols + c,
        b = (r + 1) * cols + c;
      indices.push(a, a + layer, b, b, a + layer, b + layer);
    }
  for (let c = 0; c < cols - 1; c++)
    for (const r of [0, rows - 1]) {
      const a = r * cols + c,
        b = a + 1;
      indices.push(a, b, a + layer, b, b + layer, a + layer);
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * One fan: seven blades on a hub, inside a rim.
 *
 * Blade count matters more than it looks. A card fan has an odd, prime-ish
 * count so the blades do not line up with the fins beneath and drone; the seven broad blades here follow the TUF reference.
 */
export function buildAxialFan(
  finish: Finisher,
  radius: number,
  blades: T.BufferGeometry,
  detail: 'full' | 'plain' = 'full',
) {
  const fan = new T.Group();
  const count = 7;
  const impeller = new T.InstancedMesh(
    blades,
    finish('plastic', '#080a0c'),
    count,
  );
  const helper = new T.Object3D();
  for (let i = 0; i < count; i++) {
    helper.position.set(0, 0, 0);
    helper.rotation.set(0, (i * Math.PI * 2) / count, 0);
    helper.scale.setScalar(radius);
    helper.updateMatrix();
    impeller.setMatrixAt(i, helper.matrix);
  }
  impeller.userData.spinRate = 6.4;
  fan.add(impeller);
  // The hub, and the plate on top of it that carries the marking.
  const hub = new T.Mesh(
    new T.CylinderGeometry(radius * 0.285, radius * 0.3, radius * 0.17, 40),
    finish('plasticGloss', '#090b0d'),
  );
  hub.position.y = radius * 0.03;
  fan.add(hub);
  const cap = new T.Mesh(
    new T.CylinderGeometry(radius * 0.27, radius * 0.27, radius * 0.01, 40),
    finish('plastic', '#111315'),
  );
  cap.position.y = radius * 0.12;
  fan.add(cap);
  if (detail === 'full')
    // The ring that ties the blade tips together. A rim-linked fan is the
    // current standard on a card: it holds static pressure through a dense
    // fin stack where a free-tip fan would spill at the edge.
    for (const [r, y] of [
      [radius * 1.0, radius * 0.005],
      [radius * 0.985, radius * 0.055],
    ] as const) {
      const ring = new T.Mesh(
        new T.TorusGeometry(r, radius * 0.018, 8, 64),
        finish('anodized', '#4a5258'),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      fan.add(ring);
    }
  return fan;
}

export type CardParts = {
  shroud: T.Group;
  fans: { object: T.Group; x: number }[];
  backplate: T.Group;
  bracket: T.Group;
  /** Fin banks, one under each fan, for callers that want them separately. */
  fins: T.Group;
};

/**
 * The cooler assembly, sized to a card of length `L` in the caller's units.
 *
 * `logoEdge` is which long edge carries the lit wordmark: +1 puts it on the
 * +Z side, −1 on the −Z side. The tower turns the card half over to install
 * it, so it asks for −1 in order to end up with the mark facing the window.
 */
export function buildCardCooler(
  tools: ModelTools,
  finish: Finisher,
  L: number,
  options: {
    logoEdge?: 1 | -1;
    accent?: string;
    detail?: 'full' | 'plain';
  } = {},
): CardParts {
  const { material } = tools;
  // Fit printed markings to their physical width, including short hub badges.
  const label = (
    parent: T.Group,
    text: string,
    pos: Vec3,
    width: number,
    color = '#b7bbbc',
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '700 120px sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const measured = ctx.measureText(text)?.width || 480;
    ctx.translate(256, 96);
    ctx.scale(480 / measured, 1);
    ctx.fillText(text, 0, 0);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 8;
    const plane = new T.Mesh(
      new T.PlaneGeometry(width, width * 0.22),
      new T.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(...pos);
    parent.add(plane);
  };
  const { logoEdge = 1, accent = '#37d6ff', detail = 'full' } = options;
  const W = CARD.width * L,
    D = CARD.depth * L,
    R = CARD.fanRadius * L;
  const slab = (size: Vec3, mat: T.Material, radius = L * 0.004) =>
    new T.Mesh(
      roundedBox(...size, 2, Math.min(radius, Math.min(...size) * 0.45)),
      mat,
    );
  const put = (parent: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    parent.add(obj);
    return obj;
  };

  const dark = finish('anodized', '#101316', 0.7);
  const mid = finish('anodized', '#25292d', 0.65);
  const bright = finish('brushed', '#808589', 0.55);
  dark.envMapIntensity = 0.28;
  mid.envMapIntensity = 0.4;
  bright.envMapIntensity = 0.65;
  const steel = finish('brushed', '#82878a', 0.5);
  const shapeMesh = (shape: T.Shape, thickness: number, mat: T.Material) => {
    const g = new T.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSize: L * 0.001,
      bevelThickness: L * 0.0007,
      bevelSegments: 2,
      curveSegments: detail === 'full' ? 64 : 32,
    });
    g.rotateX(-Math.PI / 2);
    return new T.Mesh(g, mat);
  };
  const outline = (halfX: number, halfZ: number, cut = L * 0.014) => {
    const s = new T.Shape();
    s.moveTo(-halfX + cut, -halfZ);
    s.lineTo(halfX - cut, -halfZ);
    s.lineTo(halfX, -halfZ + cut);
    s.lineTo(halfX, halfZ - cut);
    s.lineTo(halfX - cut, halfZ);
    s.lineTo(-halfX + cut, halfZ);
    s.lineTo(-halfX, halfZ - cut);
    s.lineTo(-halfX, -halfZ + cut);
    s.closePath();
    return s;
  };
  const aperture = R * 1.025;
  const face = outline(L / 2, W * 0.45);
  for (const f of CARD.fans) {
    const hole = new T.Path();
    hole.absarc(f * L, 0, aperture, 0, Math.PI * 2, true);
    face.holes.push(hole);
  }
  const shroud = new T.Group();
  put(shroud, shapeMesh(face, L * 0.006, mid), [0, 0, 0]);
  // Four brushed corner inserts share the circular cut-out of the main frame.
  // Their inner arcs follow the fan rim rather than covering the blades.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const patch = new T.Shape();
      const cx = sx * CARD.fans[2] * L;
      const x0 = sx * L * 0.475,
        x1 = sx * L * 0.375;
      const z0 = sz * W * 0.435;
      const arcZ = (x: number) =>
        sz *
        Math.max(
          W * 0.22,
          Math.sqrt(Math.max(0, aperture * aperture - (x - cx) * (x - cx))),
        );
      patch.moveTo(x0, z0);
      patch.lineTo(x1, z0);
      for (let i = 0; i <= 16; i++) {
        const x = x1 + ((x0 - x1) * i) / 16;
        patch.lineTo(x, arcZ(x));
      }
      patch.closePath();
      put(shroud, shapeMesh(patch, L * 0.001, bright), [0, L * 0.007, 0]);
      const screw = new T.Mesh(
        new T.CylinderGeometry(L * 0.006, L * 0.006, L * 0.002, 20),
        steel,
      );
      put(shroud, screw, [sx * L * 0.451, L * 0.01, sz * W * 0.375]);
      put(shroud, slab([L * 0.006, L * 0.0005, L * 0.001], dark), [
        sx * L * 0.451,
        L * 0.0113,
        sz * W * 0.375,
      ]);
    }
  for (const f of CARD.fans) {
    const rim = new T.Mesh(
      new T.TorusGeometry(aperture, L * 0.003, 8, 80),
      dark,
    );
    rim.rotation.x = Math.PI / 2;
    put(shroud, rim, [f * L, L * 0.008, 0]);
    // Motor support struts are behind the impeller, not across its face.
    for (const angle of [0, 2.1, 4.2]) {
      const arm = slab([R * 1.05, L * 0.002, L * 0.012], dark);
      arm.rotation.y = angle;
      put(shroud, arm, [
        f * L + Math.cos(angle) * R * 0.51,
        -L * 0.043,
        -Math.sin(angle) * R * 0.51,
      ]);
    }
  }
  // Open exhaust rails and small structural pillars preserve visible fins.
  for (const sz of [-1, 1]) {
    const z = sz * (W / 2 - L * 0.009);
    put(shroud, slab([L * 0.96, D * 0.15, L * 0.018], mid), [0, -D * 0.075, z]);
    for (const [a, b] of sz < 0
      ? [
          [-0.48, -0.02],
          [0.15, 0.48],
        ]
      : [[-0.48, 0.48]])
      put(shroud, slab([L * (b - a), L * 0.009, L * 0.014], dark), [
        (L * (a + b)) / 2,
        -D * 0.87,
        z,
      ]);
    for (const x of [-0.475, -0.16, 0.16, 0.475])
      put(shroud, slab([L * 0.016, D * 0.67, L * 0.012], dark), [
        x * L,
        -D * 0.5,
        z,
      ]);
  }
  for (const sx of [-1, 1])
    for (const z of [-W * 0.38, W * 0.38])
      put(shroud, slab([L * 0.012, D * 0.8, W * 0.12], mid), [
        sx * L * 0.493,
        -D * 0.45,
        z,
      ]);
  label(
    shroud,
    'TUF GAMING',
    [L * 0.17, L * 0.0085, -W * 0.38],
    L * 0.13,
    '#b7bbbc',
  );
  label(
    shroud,
    'GET TUF. GAME TOUGH.',
    [-L * 0.16, L * 0.0085, W * 0.39],
    L * 0.13,
    '#8b9193',
  );
  for (let i = 0; i < 6; i++) {
    const slash = slab([L * 0.008, L * 0.001, L * 0.018], bright);
    slash.rotation.y = -0.6;
    put(shroud, slash, [-L * 0.19 + i * L * 0.012, L * 0.008, W * 0.35]);
  }
  const mark = new T.Group();
  label(mark, 'GEFORCE RTX', [0, 0, 0], L * 0.29, '#b6babc');
  mark.rotation.x = (logoEdge * Math.PI) / 2;
  put(shroud, mark, [-L * 0.015, -D * 0.08, logoEdge * (W / 2 + L * 0.001)]);
  // Restrained ARGB indicator confined to the distal TUF badge.
  for (let i = 0; i < 5; i++) {
    const light = new T.Mesh(
      new T.PlaneGeometry(L * 0.004, L * 0.011),
      glowMaterial(accent, 0.75),
    );
    if (logoEdge < 0) light.rotation.y = Math.PI;
    put(shroud, light, [
      L * (0.39 + i * 0.011),
      -D * 0.07,
      logoEdge * (W / 2 + L * 0.0015),
    ]);
  }

  const fins = new T.Group();
  const finMat = material('#4b5053', 0.82, 0.85);
  finMat.envMapIntensity = 0.4;
  const finHeight = D * 0.4;
  const finGeometry = new T.BoxGeometry(L * 0.001, finHeight, W * 0.83);
  // Two brazed banks with a break for the heatpipe bends; one inventory item.
  for (const [start, stop] of [
    [-0.46, -0.07],
    [-0.03, 0.46],
  ]) {
    const count = detail === 'full' ? Math.round((stop - start) * 210) : 30;
    const bank = new T.InstancedMesh(finGeometry, finMat, count),
      helper = new T.Object3D();
    for (let i = 0; i < count; i++) {
      helper.position.set(
        L * (start + ((stop - start) * i) / (count - 1)),
        0,
        0,
      );
      helper.updateMatrix();
      bank.setMatrixAt(i, helper.matrix);
    }
    bank.castShadow = bank.receiveShadow = true;
    fins.add(bank);
  }
  for (const z of [-W * 0.39, W * 0.39])
    put(fins, slab([L * 0.92, L * 0.006, L * 0.013], finMat), [
      0,
      -finHeight * 0.46,
      z,
    ]);

  const backplate = new T.Group();
  const bp = outline(L / 2, W / 2);
  const vent = new T.Path();
  vent.moveTo(L * 0.205, -W * 0.34);
  vent.lineTo(L * 0.465, -W * 0.34);
  vent.lineTo(L * 0.465, W * 0.34);
  vent.lineTo(L * 0.205, W * 0.34);
  vent.closePath();
  bp.holes.push(vent);
  put(backplate, shapeMesh(bp, L * 0.005, dark), [0, 0, 0]);
  for (const z of [-W * 0.37, W * 0.37])
    put(backplate, slab([L * 0.91, L * 0.004, L * 0.006], mid), [
      0,
      -L * 0.004,
      z,
    ]);
  for (const x of [-0.44, -0.2, 0.12, 0.46])
    for (const sz of [-1, 1]) {
      const screw = new T.Mesh(
        new T.CylinderGeometry(L * 0.004, L * 0.004, L * 0.002, 16),
        steel,
      );
      put(backplate, screw, [x * L, -L * 0.002, sz * W * 0.43]);
    }
  const bpMark = new T.Group();
  label(bpMark, 'TUF GAMING', [0, 0, 0], L * 0.24, '#82898c');
  bpMark.rotation.x = Math.PI;
  put(backplate, bpMark, [-L * 0.12, -L * 0.003, 0]);
  for (let i = 0; i < 6; i++) {
    const slash = slab([L * 0.007, L * 0.001, W * 0.36], mid);
    slash.rotation.y = -0.65;
    put(backplate, slash, [-L * 0.39 + i * L * 0.022, -L * 0.0025, 0]);
  }

  // A perforated bracket, shared by the tower and the close-up card.
  const bracket = new T.Group();
  for (const y of [-D * 0.45, -D * 0.24, D * 0.04, D * 0.43])
    put(bracket, slab([L * 0.004, L * 0.012, W * 0.9], steel), [0, y, 0]);
  for (const z of [-W * 0.45, W * 0.45])
    put(bracket, slab([L * 0.004, D * 0.9, L * 0.013], steel), [0, 0, z]);
  for (let i = 0; i < 22; i++)
    put(bracket, slab([L * 0.004, D * 0.36, L * 0.005], steel), [
      0,
      D * 0.235,
      -W * 0.42 + i * W * 0.04,
    ]);
  for (let i = 0; i < 6; i++)
    put(bracket, slab([L * 0.004, D * 0.26, L * 0.012], steel), [
      0,
      -D * 0.1,
      -W * 0.425 + i * W * 0.17,
    ]);
  put(bracket, slab([L * 0.04, D * 0.85, L * 0.008], steel), [
    L * 0.013,
    0,
    W * 0.465,
  ]);
  const blades = bladeGeometry();
  const fans = CARD.fans.map((f, index) => {
    let blade = blades;
    if (index === 1) {
      blade = blades.clone().scale(1, 1, -1);
      const ix = blade.getIndex()!;
      for (let i = 0; i < ix.count; i += 3) {
        const b = ix.getX(i + 1);
        ix.setX(i + 1, ix.getX(i + 2));
        ix.setX(i + 2, b);
      }
    }
    const object = buildAxialFan(finish, R * 0.975, blade, detail);
    object.traverse((o) => {
      if (o.userData.spinRate) o.userData.spinRate = index === 1 ? -3.2 : 3.2;
    });
    const badge = new T.Group();
    label(badge, index === 1 ? 'ASUS' : 'TUF', [0, 0, 0], R * 0.43, '#c6c9c7');
    put(object, badge, [0, R * 0.126, 0]);
    object.traverse((o) => {
      if (
        o instanceof T.Mesh &&
        o.material instanceof T.MeshStandardMaterial &&
        o.material.metalness < 0.1
      )
        o.material.envMapIntensity = 0.25;
    });
    for (const r of [0.235, 0.258]) {
      const ring = new T.Mesh(
        new T.TorusGeometry(R * r, R * 0.003, 4, 64),
        steel,
      );
      ring.rotation.x = Math.PI / 2;
      put(object, ring, [0, R * 0.124, 0]);
    }
    return { object, x: f * L };
  });
  return { shroud, fans, backplate, bracket, fins };
}

/**
 * Where each part of the card sits along the card's own thickness.
 *
 * Both scales stack the card from the same table, so the fans sit the same
 * distance under the shroud face and the board the same distance above the
 * backplate whichever scale you are looking at. Returned in the caller's
 * units, from a card of length `L`.
 */
export function cardStack(L: number) {
  const D = CARD.depth * L;
  return {
    /** The shroud's top face, and therefore the top of the card. */
    shroud: D,
    /** Fans, seated just inside their apertures. */
    fan: D - L * 0.03,
    /** The fin banks, filling the space between the fans and the board. */
    fins: D * 0.57,
    /** The board. */
    pcb: 0,
    /** The backplate, just under the board. */
    backplate: -L * 0.009,
    /** The bracket spans the card's thickness, so it is centred on it. */
    bracket: D * 0.46,
  };
}
