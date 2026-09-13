import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Piece } from './models.ts';
import type { Vec3 } from './layout.ts';
import { boardTexture } from './surfaces.ts';
import type { BoardVariant } from './pcb.ts';
import { buildBoardDetails } from './board-details.ts';

export type ModelTools = {
  add: (
    concept: string,
    object: T.Object3D,
    pos: Vec3,
    delta?: Vec3,
    reveal?: number,
  ) => Piece;
  instances: (
    concept: string,
    positions: Vec3[],
    size: Vec3,
    reveal?: number,
    color?: string,
    geometry?: T.BufferGeometry,
  ) => Piece[];
  box: (size: Vec3, color: string, metal?: number, r?: number) => T.Mesh;
  /** A printed circuit board: routed faces, bare laminate on the cut edges. */
  pcb: (size: Vec3, variant?: BoardVariant) => T.Mesh;
  material: (
    color: string,
    metal?: number,
    rough?: number,
  ) => T.MeshStandardMaterial;
  label: (
    parent: T.Group,
    text: string,
    pos: Vec3,
    width: number,
    color?: string,
  ) => void;
};

/** Original educational assembly. Counts and routing are illustrative, not an FE BOM. */
export function buildHardware({
  add,
  instances,
  box,
  pcb,
  material,
  label,
}: ModelTools) {
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };
  const helper = new T.Object3D();
  const colored = (
    g: T.BufferGeometry,
    color: string,
    pos: Vec3 = [0, 0, 0],
  ) => {
    g.translate(...pos);
    const data = new Float32Array(g.getAttribute('position').count * 3),
      c = new T.Color(color);
    for (let i = 0; i < data.length; i += 3) c.toArray(data, i);
    g.setAttribute('color', new T.BufferAttribute(data, 3));
    return g;
  };
  const merge = (parts: T.BufferGeometry[]) => {
    const out = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    return out;
  };
  function batch(
    group: T.Group,
    geometry: T.BufferGeometry,
    mat: T.Material,
    positions: Vec3[],
    scales?: Vec3[],
  ) {
    const mesh = new T.InstancedMesh(geometry, mat, positions.length);
    positions.forEach((p, i) => {
      helper.position.set(...p);
      helper.rotation.set(0, 0, 0);
      helper.scale.set(...(scales?.[i] ?? [1, 1, 1]));
      helper.updateMatrix();
      mesh.setMatrixAt(i, helper.matrix);
    });
    group.add(mesh);
    return mesh;
  }
  function panelWithHoles(
    width: number,
    depth: number,
    thickness: number,
    radius: number,
    holeRadius: number,
  ) {
    const s = new T.Shape(),
      x = -width / 2,
      z = -depth / 2;
    s.moveTo(x + radius, z);
    s.lineTo(-x - radius, z);
    s.quadraticCurveTo(-x, z, -x, z + radius);
    s.lineTo(-x, -z - radius);
    s.quadraticCurveTo(-x, -z, -x - radius, -z);
    s.lineTo(x + radius, -z);
    s.quadraticCurveTo(x, -z, x, -z - radius);
    s.lineTo(x, z + radius);
    s.quadraticCurveTo(x, z, x + radius, z);
    for (const cx of [-2.32, 2.32]) {
      const hole = new T.Path();
      hole.absarc(cx, 0, holeRadius, 0, Math.PI * 2, true);
      s.holes.push(hole);
    }
    const g = new T.ExtrudeGeometry(s, {
      depth: thickness,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.035,
      bevelThickness: 0.025,
      curveSegments: 48,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  }
  // Layered board and routed copper. Trace count is ornamental, not an electrical netlist.
  const board = new T.Group();
  const boardSurface = new T.MeshStandardMaterial({
    map: boardTexture(),
    roughness: 0.78,
    metalness: 0.08,
  });
  const boardEdge = material('#393b2b', 0.05, 0.82);
  place(
    board,
    new T.Mesh(new T.BoxGeometry(7.96, 0.095, 3.28), [
      boardEdge,
      boardEdge,
      boardSurface,
      boardSurface,
      boardEdge,
      boardEdge,
    ]),
    [0, 0, 0],
  );
  place(board, box([7.92, 0.024, 3.24], '#24453a', 0.25), [0, -0.06, 0]);
  const traces: Vec3[] = [],
    traceScale: Vec3[] = [];
  for (let side = -1; side <= 1; side += 2)
    for (let i = 0; i < 64; i++) {
      const lane = i % 16;
      traces.push([
        side * (1.1 + Math.floor(i / 16) * 0.64),
        0.051,
        (lane - 7.5) * 0.175,
      ]);
      traceScale.push([0.38 + lane * 0.012, 1, 1]);
    }
  batch(
    board,
    new T.BoxGeometry(1, 0.003, 0.009),
    material('#386b57', 0.6, 0.6),
    traces,
    traceScale,
  );
  const vias: Vec3[] = [];
  for (let i = 0; i < 112; i++)
    vias.push([
      -3.7 + (i % 28) * 0.27,
      0.053,
      Math.floor(i / 28) % 2 ? 1.5 : -1.5,
    ]);
  batch(
    board,
    new T.CylinderGeometry(0.016, 0.016, 0.005, 6),
    material('#ae9c66', 0.8),
    vias,
  );
  label(board, 'GPU ANATOMY / GB202', [-2.4, 0.058, 1.03], 2.4, '#92ac96');
  add('pcb', board, [0, 0, 0], [0, -0.7, 0]);
  // Machined rear plate: cut-out air paths and reinforcing ribs.
  const back = new T.Group();
  place(
    back,
    new T.Mesh(
      panelWithHoles(8.8, 3.66, 0.09, 0.16, 1.23),
      material('#262e34', 0.78, 0.34),
    ),
    [0, 0, 0],
  );
  for (const z of [-1.6, 1.6])
    place(back, box([7.9, 0.08, 0.07], '#68757a', 0.8), [0, 0.1, z]);
  label(back, 'GB202', [-0.05, 0.13, 0], 1.1, '#a2afb4');
  add('backplate', back, [0, -0.26, 0], [0, -2.35, 0]);
  // GPU substrate, silicon cap, perimeter decoupling, and an illustrative BGA field.
  const pkg = new T.Group();
  place(pkg, box([1.61, 0.065, 1.64], '#173e30', 0.2), [0, 0, 0]);
  place(pkg, box([1.54, 0.04, 1.57], '#233f30', 0.3), [0, 0.05, 0]);
  const die = new T.Group();
  place(die, box([1.05, 0.07, 1.08], '#777c81', 0.98, 0.002), [0, 0, 0]);
  label(die, 'GB202-300', [0, 0.038, -0.14], 0.58, '#b7bec0');
  label(die, 'NVIDIA', [0, 0.038, 0.1], 0.43, '#b7bec0');
  add('silicon', die, [-0.24, 0.265, 0], [0, 1.68, 0]);
  const decaps: Vec3[] = [];
  for (let i = 0; i < 12; i++) {
    decaps.push(
      [-0.66 + i * 0.12, 0.09, -0.69],
      [-0.66 + i * 0.12, 0.09, 0.69],
    );
  }
  batch(
    pkg,
    new T.BoxGeometry(0.07, 0.035, 0.035),
    material('#bfab83', 0.7),
    decaps,
  );
  const balls: Vec3[] = [];
  for (let i = 0; i < 196; i++)
    balls.push([
      ((i % 14) - 6.5) * 0.106,
      -0.066,
      (Math.floor(i / 14) - 6.5) * 0.106,
    ]);
  const solder = new T.Group();
  batch(
    solder,
    new T.SphereGeometry(0.025, 6, 4),
    material('#a9b0ac', 0.8),
    balls,
  );
  add('bga', solder, [-0.24, 0.135, 0], [0, 0.98, 0]);
  add('package', pkg, [-0.24, 0.135, 0], [0, 1.3, 0]);
  const mem: Vec3[] = [];
  for (let i = 0; i < 4; i++)
    mem.push(
      [-0.97 + i * 0.5, 0.13, -1.16],
      [-0.97 + i * 0.5, 0.13, 1.16],
      [-1.46, 0.13, -0.78 + i * 0.5],
      [0.97, 0.13, -0.78 + i * 0.5],
    );
  instances('gddr7', mem, [0.41, 0.13, 0.36], 0, '#171d25').forEach((p) =>
    p.delta.set(p.base.x * 0.8, 0.8, p.base.z * 0.9),
  );
  instances(
    'thermalpad',
    mem.map((p) => [p[0], 0.28, p[2]]),
    [0.4, 0.048, 0.35],
    0,
    '#737e86',
  ).forEach((p) => p.delta.set(p.base.x * 0.9, 2.1, p.base.z * 0.9));
  // Power delivery: separate inductors and switching packages.
  const chokes: Vec3[] = [],
    stages: Vec3[] = [];
  for (let i = 0; i < 12; i++) {
    const z = -1.2 + Math.floor(i / 2) * 0.48,
      x = 2.03 + (i % 2) * 0.49;
    chokes.push([x, 0.2, z]);
    stages.push([x - 0.19, 0.1, z - 0.16], [x + 0.18, 0.1, z + 0.15]);
  }
  instances('vrm', chokes, [0.32, 0.32, 0.34], 0, '#535b60').forEach((p) =>
    p.delta.set(2, 0.6, 0),
  );
  instances('powerstage', stages, [0.19, 0.075, 0.17], 0, '#181f27').forEach(
    (p) => p.delta.set(2, 0.4, 0),
  );
  // A bank of cylindrical polymer capacitors, with scored metal lids.
  const capacitorGeometry = merge([
    colored(new T.CylinderGeometry(0.075, 0.075, 0.19, 18), '#182225'),
    colored(
      new T.CylinderGeometry(0.07, 0.07, 0.01, 18),
      '#a2a9a7',
      [0, 0.1, 0],
    ),
    colored(new T.BoxGeometry(0.1, 0.003, 0.01), '#394245', [0, 0.107, 0]),
    colored(new T.BoxGeometry(0.01, 0.003, 0.1), '#394245', [0, 0.107, 0]),
  ]);
  instances(
    'capacitor',
    Array.from(
      { length: 24 },
      (_, i) =>
        [3.08 + (i % 3) * 0.27, 0.16, -1.26 + Math.floor(i / 3) * 0.35] as Vec3,
    ),
    [0.15, 0.21, 0.15],
    0,
    '#ffffff',
    capacitorGeometry,
  ).forEach((p) => p.delta.set(2.5, 0.35, 0));
  const mlcc: Vec3[] = [],
    resistors: Vec3[] = [];
  for (let i = 0; i < 64; i++) {
    const side = i < 32 ? -1 : 1;
    const k = i % 32;
    mlcc.push([
      side * (1.75 + (k % 4) * 0.24),
      0.085,
      -1.43 + Math.floor(k / 4) * 0.39,
    ]);
    resistors.push([
      -3.72 + (i % 8) * 0.19,
      0.081,
      -1.33 + Math.floor(i / 8) * 0.38,
    ]);
  }
  const passiveGeometry = (w: number, h: number, d: number, color: string) =>
    merge([
      colored(new T.BoxGeometry(w * 0.65, h, d), color),
      ...[-1, 1].map((s) =>
        colored(new T.BoxGeometry(w * 0.19, h * 1.06, d * 1.03), '#a8abaa', [
          s * w * 0.405,
          0,
          0,
        ]),
      ),
    ]);
  instances(
    'mlcc',
    mlcc,
    [0.13, 0.047, 0.063],
    0,
    '#ffffff',
    passiveGeometry(0.13, 0.047, 0.063, '#9c8969'),
  ).forEach((p) => p.delta.set(p.base.x * 0.65, 0.4, p.base.z * 0.5));
  instances(
    'resistor',
    resistors,
    [0.095, 0.035, 0.05],
    0,
    '#ffffff',
    passiveGeometry(0.095, 0.035, 0.05, '#292b2c'),
  ).forEach((p) => p.delta.set(-1.8, 0.2, p.base.z * 0.5));
  // Heat pickup, six shaped transport paths, and individually selectable fins.
  const vapor = new T.Group();
  place(vapor, box([3.42, 0.15, 2.9], '#987456', 0.88), [0, 0, 0]);
  place(vapor, box([1.4, 0.08, 1.4], '#b59672', 0.92), [-0.24, -0.08, 0]);
  for (const z of [-1.4, 1.4])
    place(vapor, box([3.3, 0.08, 0.08], '#b49776', 0.85), [0, 0.1, z]);
  add('vapor', vapor, [0, 0.43, 0], [0, 2.5, 0]);
  for (let i = 0; i < 6; i++) {
    const z = (i - 2.5) * 0.43;
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(-3.9, 0.08, z),
      new T.Vector3(-2.5, 0.16, z),
      new T.Vector3(-0.8, 0, z * 0.85),
      new T.Vector3(0.8, 0, z * 0.85),
      new T.Vector3(2.5, 0.16, z),
      new T.Vector3(3.9, 0.08, z),
    ]);
    const pipe = new T.Mesh(
      new T.TubeGeometry(curve, 40, 0.064, 10, false),
      material('#a98461', 0.88, 0.28),
    );
    add('heatpipe', pipe, [0, 0.56, 0], [0, 2.85 + i * 0.065, 0]);
  }
  for (const side of [-1, 1]) {
    const positions: Vec3[] = [];
    for (let i = 0; i < 76; i++)
      positions.push([side * 2.33 + (i - 37.5) * 0.046, 0.98, 0]);
    instances('heatsink', positions, [0.018, 0.76, 3.18], 0, '#56616a').forEach(
      (p) => p.delta.set(side * 0.5, 3.3, 0),
    );
  }
  // A real shell with circular apertures, rather than rectangular rails around flat fans.
  const shroud = new T.Group();
  place(
    shroud,
    new T.Mesh(
      panelWithHoles(8.93, 3.78, 0.13, 0.18, 1.52),
      material('#373c40', 0.86, 0.48),
    ),
    [0, 0, 0],
  );
  for (const z of [-1.88, 1.88]) {
    place(shroud, box([8.67, 0.31, 0.075], '#303539', 0.85), [0, -0.06, z]);
    place(shroud, box([8.67, 0.2, 0.075], '#303539', 0.85), [0, -0.95, z]);
    for (const x of [-4.26, -0.53, 0.53, 4.26])
      place(shroud, box([0.11, 0.76, 0.075], '#32383b', 0.85), [x, -0.51, z]);
    place(shroud, box([8.55, 0.045, 0.036], '#a3afb5', 0.92, 0.009), [
      0,
      0.135,
      z,
    ]);
    place(shroud, box([8.4, 0.05, 0.036], '#778891', 0.86, 0.009), [
      0,
      -1.04,
      z,
    ]);
  }
  for (const x of [-4.4, 4.4])
    place(shroud, box([0.09, 0.68, 3.42], '#3c4851', 0.85), [x, -0.24, 0]);
  const center = place(
    shroud,
    box([1.0, 0.09, 3.61], '#323f49', 0.85),
    [0, 0.115, 0],
  );
  center.rotation.y = 0.11;
  label(shroud, 'GEFORCE', [0, 0.177, -0.25], 0.91, '#d6dde1');
  label(shroud, 'RTX 5090', [0, 0.178, 0.04], 0.92, '#aebdc8');
  const sideLabel = new T.Group();
  label(sideLabel, 'GEFORCE RTX', [0, 0, 0], 2.8, '#dce0e0');
  sideLabel.rotation.x = Math.PI / 2;
  place(shroud, sideLabel, [-0.1, -0.24, 1.923]);
  add('shroud', shroud, [0, 1.39, 0], [0, 4.7, 0]);
  // Swept, twisted blade surfaces, including thickness and closed rims.
  const verts: number[] = [],
    indices: number[] = [];
  const rows = 13,
    cols = 6;
  for (let side = 0; side < 2; side++)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const t = r / (rows - 1),
          u = c / (cols - 1) - 0.5;
        const radius = 0.32 + t * 1.13;
        const angle = 0.35 * Math.pow(t, 1.3) + u * (0.52 - 0.11 * t);
        const height =
          0.12 * Math.sin(t * Math.PI * 0.85) + u * 0.24 * (0.25 + t);
        verts.push(
          Math.cos(angle) * radius,
          height + side * 0.027,
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
  const bladeGeometry = new T.BufferGeometry();
  bladeGeometry.setAttribute(
    'position',
    new T.Float32BufferAttribute(verts, 3),
  );
  bladeGeometry.setIndex(indices);
  bladeGeometry.computeVertexNormals();
  for (const x of [-2.32, 2.32]) {
    const fan = new T.Group();
    for (const [r, y] of [
      [1.51, 0],
      [1.49, 0.08],
    ] as const) {
      const ring = new T.Mesh(
        new T.TorusGeometry(r, 0.026, 10, 96),
        material('#6a767e', 0.9, 0.3),
      );
      ring.rotation.x = Math.PI / 2;
      place(fan, ring, [0, y, 0]);
    }
    const blades = new T.InstancedMesh(
      bladeGeometry,
      material('#1c2023', 0.06, 0.6),
      11,
    );
    for (let i = 0; i < 11; i++) {
      helper.position.set(0, 0, 0);
      helper.scale.set(1, 1, 1);
      helper.rotation.set(0, (i * Math.PI * 2) / 11, 0);
      helper.updateMatrix();
      blades.setMatrixAt(i, helper.matrix);
    }
    fan.add(blades);
    place(
      fan,
      new T.Mesh(
        new T.CylinderGeometry(0.32, 0.4, 0.25, 64),
        material('#242729', 0.08, 0.56),
      ),
      [0, 0.045, 0],
    );
    place(
      fan,
      new T.Mesh(
        new T.CylinderGeometry(0.24, 0.24, 0.014, 64),
        material('#50575a', 0.86, 0.4),
      ),
      [0, 0.18, 0],
    );
    label(fan, 'GA', [0, 0.191, 0], 0.23, '#b2b8b8');
    add('fan', fan, [x, 1.5, 0], [x * 0.16, 5.1, 0]);
  }
  const screwGeometry = merge([
    colored(new T.CylinderGeometry(0.059, 0.059, 0.037, 16), '#9eaaad'),
    colored(
      new T.CylinderGeometry(0.025, 0.025, 0.039, 6),
      '#172028',
      [0, 0.002, 0],
    ),
    colored(
      new T.CylinderGeometry(0.026, 0.026, 0.15, 12),
      '#747f81',
      [0, -0.085, 0],
    ),
  ]);
  instances(
    'fastener',
    Array.from(
      { length: 16 },
      (_, i) =>
        [
          i < 8 ? -4.08 + (i % 4) * 2.72 : -3.48 + (i % 4) * 2.32,
          1.57,
          i < 8 ? (i < 4 ? -1.7 : 1.7) : i < 12 ? -1.06 : 1.06,
        ] as Vec3,
    ),
    [0.118, 0.19, 0.118],
    0,
    '#ffffff',
    screwGeometry,
  ).forEach((p) => p.delta.set(0, 5.7, 0));
  // I/O mounting bracket and the four individually identifiable connectors.
  const bracket = new T.Group();
  // Stamped bracket with actual open ventilation and port apertures.
  for (const y of [-0.82, -0.48, 0.05, 0.35, 0.83])
    place(bracket, box([0.055, 0.095, 3.85], '#858c8e', 0.9), [0, y, 0]);
  for (let i = 0; i < 17; i++)
    place(bracket, box([0.055, 0.5, 0.025], '#858c8e', 0.9), [
      0,
      0.58,
      -1.83 + i * 0.23,
    ]);
  for (let i = 0; i < 5; i++)
    place(bracket, box([0.055, 0.75, 0.13], '#858c8e', 0.9), [
      0,
      -0.3,
      -1.58 + i * 0.79,
    ]);
  for (const z of [-1.88, 1.88])
    place(bracket, box([0.055, 1.8, 0.08], '#858c8e', 0.9), [0, 0, z]);
  place(bracket, box([0.3, 0.07, 3.85], '#849197', 0.85), [-0.1, 0.87, 0]);
  add('bracket', bracket, [-4.57, 0.49, 0], [-2, 0, 0]);
  for (let i = 0; i < 4; i++) {
    const port = new T.Group();
    for (const y of [-0.13, 0.13])
      place(port, box([0.62, 0.035, 0.64], '#959d9e', 0.92), [0, y, 0]);
    for (const z of [-0.3, 0.3])
      place(port, box([0.62, 0.26, 0.035], '#959d9e', 0.92), [0, 0, z]);
    place(port, box([0.03, 0.24, 0.57], '#131516', 0.02), [0.28, 0, 0]);
    place(
      port,
      box([0.42, 0.035, i === 3 ? 0.38 : 0.45], '#24282a', 0.02),
      [0.015, -0.03, 0],
    );
    const pins: Vec3[] = Array.from({ length: i === 3 ? 19 : 20 }, (_, n) => [
      -0.11,
      -0.008,
      -0.21 + n * 0.022,
    ]);
    batch(
      port,
      new T.BoxGeometry(0.22, 0.007, 0.01),
      material('#b4a16c', 0.86),
      pins,
    );
    add(
      i === 3 ? 'hdmi' : 'displayport',
      port,
      [-4.24, 0.29, -1.19 + i * 0.79],
      [-2.25, 0, (i - 1.5) * 0.15],
    );
  }
  const pcie = new T.Group();
  place(pcie, box([3.66, 0.065, 0.38], '#23402f', 0.2), [0, 0, 0]);
  const contacts: Vec3[] = [];
  for (let i = 0; i < 52; i++) contacts.push([-1.74 + i * 0.067, 0.035, 0]);
  batch(
    pcie,
    new T.BoxGeometry(0.047, 0.015, 0.34),
    material('#b8a16e', 0.83, 0.27),
    contacts,
  );
  add('pcie', pcie, [-1.22, -0.035, 1.81], [0, -1.35, 0.8]);
  const power = new T.Group();
  place(power, box([0.9, 0.43, 0.56], '#131d27', 0.22), [0, 0, 0]);
  for (let i = 0; i < 12; i++) {
    place(power, box([0.094, 0.034, 0.086], '#020609', 0.1), [
      -0.34 + (i % 6) * 0.135,
      0.22,
      -0.12 + Math.floor(i / 6) * 0.24,
    ]);
    place(power, box([0.038, 0.038, 0.033], '#a79971', 0.9), [
      -0.34 + (i % 6) * 0.135,
      0.221,
      -0.12 + Math.floor(i / 6) * 0.24,
    ]);
  }
  for (let i = 0; i < 4; i++)
    place(power, box([0.047, 0.04, 0.047], '#af9f73', 0.9), [
      -0.15 + i * 0.1,
      0.25,
      -0.235,
    ]);
  place(power, box([0.26, 0.09, 0.2], '#2e3b43', 0.3), [0, 0.23, 0.3]);
  add('power', power, [1.22, 0.3, -1.63], [0, 0.6, -1.8]);
  buildBoardDetails({ add, instances, box, pcb, material, label });
}
