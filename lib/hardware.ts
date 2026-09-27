import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Piece } from './models.ts';
import { cardAirflow, type FlowStream } from './airflow.ts';
import type { Vec3 } from './layout.ts';
import type { BoardVariant } from './pcb.ts';
import { finishes } from './materials.ts';
import { buildCardCooler, CARD, cardStack } from './graphics-card.ts';
import { buildCapacitor, buildChip, buildHeader, buildScrew } from './parts.ts';

export type ModelTools = {
  /** Reuse a detailed scale as a single installed, selectable assembly. */
  assembly: (level: 'motherboard' | 'card' | 'dimm') => T.Group;
  /**
   * Where this build moves air, drawn as chevrons marching along the path.
   * Scenery rather than a part: never selected, never named, never pointed
   * at, and gone as soon as the machine starts coming apart.
   */
  airflow: (streams: FlowStream[]) => T.Group;
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

/** TUF RTX 5090 exterior with an educational, spatially consistent PCB assembly. */
export function buildHardware(tools: ModelTools) {
  const { pcb, material, label } = tools;
  const placed: Piece[] = [];
  const add: ModelTools['add'] = (...args) => {
    const p = tools.add(...args);
    placed.push(p);
    return p;
  };
  const instances: ModelTools['instances'] = (...args) => {
    const p = tools.instances(...args);
    placed.push(...p);
    return p;
  };
  const L = 8.93,
    m = (n: number) => (n * L) / 348;
  const v = (x: number, y: number, z: number): Vec3 => [m(x), m(y), m(z)];
  const put = (g: T.Group, o: T.Object3D, x = 0, y = 0, z = 0) => {
    o.position.set(...v(x, y, z));
    g.add(o);
    return o;
  };
  const register = (
    id: string,
    o: T.Object3D,
    x: number,
    y: number,
    z: number,
    delta: Vec3 = [0, 1, 0],
  ) => add(id, o, v(x, y, z), delta, 0);
  const black = material('#0c0e11', 0.12, 0.85),
    nickel = material('#8e9395', 0.84, 0.65);
  black.envMapIntensity = 0.35;
  nickel.envMapIntensity = 0.7;
  const gold = material('#b29859', 0.72, 0.6);
  const box = (w: number, h: number, d: number, mat: T.Material = black) =>
    new T.Mesh(new T.BoxGeometry(m(w), m(h), m(d)), mat);
  const chip = (
    id: string,
    text: string,
    x: number,
    z: number,
    w = 7,
    d = w,
  ) => {
    const g = new T.Group();
    put(g, buildChip(material, v(w, 1.5, d), 6, true, '#101215'));
    label(g, text, v(0, 0.9, 0), m(w * 0.78), '#818786');
    register(id, g, x, 1.8, z, [x < -50 ? -0.6 : 0.6, 0.9, z * 0.006]);
  };
  const board = new T.Group();
  put(
    board,
    pcb(v(CARD.pcb.length * 348, 1.6, CARD.pcb.width * 348), 'graphics'),
    CARD.pcb.centerX * 348,
    0,
    0,
  );
  label(board, 'TUF GAMING · GB202', v(-127, 0.9, -52), m(50), '#8c938a');
  for (const x of [-159, 57])
    for (const z of [-54, 54]) {
      const ring = new T.Mesh(
        new T.TorusGeometry(m(2.5), m(0.5), 6, 16),
        nickel,
      );
      ring.rotation.x = Math.PI / 2;
      put(board, ring, x, 0.95, z);
    }
  register('pcb', board, 0, 0, 0, [0, -0.8, 0]);

  const pkg = new T.Group();
  put(pkg, box(54, 1.4, 54, material('#203a2d', 0.15)));
  for (const x of [-23, 23])
    for (let i = 0; i < 12; i++)
      put(pkg, box(1.5, 0.6, 1, nickel), x, 1, -21 + i * 3.8);
  register('package', pkg, -55, 2.2, 0, [0, 1.3, 0]);
  const die = new T.Group();
  put(die, box(28, 1, 32, material('#626b70', 0.9, 0.3)));
  label(die, 'NVIDIA', v(0, 0.56, -5), m(16), '#aeb3b2');
  label(die, 'GB202', v(0, 0.56, 4), m(19), '#aeb3b2');
  register('silicon', die, -55, 4.1, 0, [0, 1.68, 0]);
  const bga = new T.Group();
  const balls = new T.InstancedMesh(
    new T.SphereGeometry(m(0.35), 6, 4),
    nickel,
    24 * 24,
  );
  const matrix = new T.Matrix4();
  for (let i = 0; i < 576; i++) {
    matrix.makeTranslation(
      m(((i % 24) - 11.5) * 2),
      0,
      m((Math.floor(i / 24) - 11.5) * 2),
    );
    balls.setMatrixAt(i, matrix);
  }
  bga.add(balls);
  register('bga', bga, -55, 1.25, 0, [0, 0.98, 0]);
  register(
    'tim',
    box(28, 0.2, 32, material('#696c6b', 0.2, 0.9)),
    -55,
    4.75,
    0,
    [0, 2.1, 0],
  );
  const memory: Vec3[] = [];
  for (let i = 0; i < 4; i++) {
    memory.push(
      v(-82 + i * 18, 2.6, -44),
      v(-82 + i * 18, 2.6, 44),
      v(-96, 2.6, -27 + i * 18),
      v(-14, 2.6, -27 + i * 18),
    );
  }
  instances('gddr7', memory, v(14, 2.6, 12), 0, '#111417').forEach((p) =>
    p.delta.set((p.base.x - m(-55)) * 0.5, 0.9, p.base.z * 0.4),
  );
  instances(
    'thermalpad',
    memory.map((p) => [p[0], m(5.7), p[2]]),
    v(14, 3, 12),
    0,
    '#777d80',
  ).forEach((p) => p.delta.set((p.base.x - m(-55)) * 0.5, 2.1, p.base.z * 0.4));
  const chokes: Vec3[] = [],
    stages: Vec3[] = [],
    caps: Vec3[] = [];
  for (let row = 0; row < 6; row++)
    for (const x of [7, 27]) {
      chokes.push(v(x, 4.5, -45 + row * 18));
      stages.push(v(x - 9, 1.8, -48 + row * 18), v(x + 9, 1.8, -42 + row * 18));
    }
  instances('vrm', chokes, v(9, 7, 10), 0, '#24292d').forEach((p) =>
    p.delta.set(1.3, 0.6, 0),
  );
  instances('powerstage', stages, v(5, 1.5, 5), 0, '#111416').forEach((p) =>
    p.delta.set(1.5, 0.4, 0),
  );
  for (let i = 0; i < 12; i++)
    for (const x of [45, 55]) caps.push(v(x, 3.8, -51 + i * 9.3));
  const capacitor = buildCapacitor(material, m(2.6), m(5.6), '#202426');
  const capParts: T.BufferGeometry[] = [];
  capacitor.updateMatrixWorld(true);
  capacitor.traverse((o) => {
    if (o instanceof T.Mesh) {
      const g = o.geometry.toNonIndexed();
      g.applyMatrix4(o.matrixWorld);
      const c = (o.material as T.MeshStandardMaterial).color;
      const colors = new Float32Array(g.getAttribute('position').count * 3);
      for (let i = 0; i < colors.length; i += 3) c.toArray(colors, i);
      g.setAttribute('color', new T.BufferAttribute(colors, 3));
      capParts.push(g);
    }
  });
  const capGeo = mergeGeometries(capParts)!;
  capParts.forEach((g) => g.dispose());
  capacitor.traverse((o) => {
    if (o instanceof T.Mesh) o.geometry.dispose();
  });
  instances('capacitor', caps, v(5.2, 6, 5.2), 0, '#ffffff', capGeo).forEach(
    (p) => p.delta.set(1.7, 0.4, 0),
  );
  chip('pwm', 'PWM', -119, -41);
  chip('pwm', 'MEM', -118, 45, 5);
  chip('bios', 'VBIOS', -120, 8, 7);
  chip('monitor', 'PWR', 37, -55, 5);
  chip('temperature', 'TEMP', -117, -19, 4);
  chip('temperature', 'TEMP', -5, 55, 4);
  chip('auxreg', 'AUX', -121, 27, 6);
  for (let i = 0; i < 5; i++) chip('esd', 'ESD', -155, -43 + i * 20, 3);
  for (let i = 0; i < 3; i++) {
    const shunt = new T.Group();
    put(shunt, box(6, 1.1, 3));
    for (const x of [-2.3, 2.3]) put(shunt, box(1.4, 1.15, 3, nickel), x, 0, 0);
    label(shunt, 'R005', v(0, 0.65, 0), m(4.5), '#afb1a6');
    register('shunt', shunt, -5 + i * 14, -0.01 + 1.5, -55, [1, 0.5, -0.5]);
  }
  register('crystal', box(6, 1.5, 3, nickel), -117, 1.8, -7, [-0.8, 0.75, 0]);
  for (const x of [-19, 59])
    register(
      'fuse',
      box(5, 1.2, 2.5, material('#a7a190', 0.2)),
      x,
      1.6,
      55,
      [0.8, 0.4, 0.6],
    );
  instances(
    'testpoint',
    Array.from({ length: 20 }, (_, i) => v(-154 + i * 2.5, 0.9, 56)),
    v(0.8, 0.2, 0.8),
    0,
    '#ad9352',
  );

  const retention = new T.Group();
  for (const angle of [-Math.PI / 4, Math.PI / 4]) {
    const arm = box(65, 0.4, 5, nickel);
    arm.rotation.y = angle;
    put(retention, arm);
  }
  register('retention', retention, -55, -1.08, 0, [0, -1.35, 0]);
  for (const x of [-86, -24])
    for (const z of [-31, 31]) {
      const standoff = new T.Mesh(
        new T.CylinderGeometry(m(2.5), m(2.5), m(6), 6),
        nickel,
      );
      register('standoff', standoff, x, 3.9, z, [0, 0.6, z * 0.015]);
    }
  const vapor = new T.Group();
  put(vapor, box(114, 2.4, 108, nickel));
  put(vapor, box(28, 2.5, 32, nickel), 0, -2.45, 0);
  for (const z of [-52, 52]) put(vapor, box(108, 1.5, 2, nickel), 0, 1.3, z);
  register('vapor', vapor, -55, 8.5, 0, [0, 2.5, 0]);
  // Twelve nickel-plated paths, with their bends entering the fin banks.
  for (let i = 0; i < 12; i++) {
    const z = (i - 5.5) * 8.1;
    const points = [
      [-159, 24, z],
      [-137, 23, z],
      [-106, 14, z],
      [-52, 12, z * 0.92],
      [4, 15, z],
      [42, 25, z],
      [159, 25, z],
    ];
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...v(p[0], p[1], p[2]))),
    );
    register(
      'heatpipe',
      new T.Mesh(new T.TubeGeometry(curve, 48, m(2.5), 10, false), nickel),
      0,
      0,
      0,
      [0, 2.85 + i * 0.03, 0],
    );
  }
  const finish = finishes(),
    parts = buildCardCooler(tools, finish, L, {
      logoEdge: -1,
      accent: '#e4bd51',
    }),
    seat = cardStack(L);
  add('heatsink', parts.fins, [0, seat.fins, 0], [0, 3.3, 0]);
  add('shroud', parts.shroud, [0, seat.shroud, 0], [0, 4.7, 0]);
  add('backplate', parts.backplate, [0, seat.backplate, 0], [0, -2.35, 0]);
  add('bracket', parts.bracket, [-L / 2 - m(2), seat.bracket, 0], [-2, 0, 0]);
  for (const fan of parts.fans)
    add('fan', fan.object, [fan.x, seat.fan, 0], [fan.x * 0.16, 5.1, 0]);
  for (const x of [-155, 0, 155])
    for (const z of [-64, 64])
      register('fastener', buildScrew(material, m(2.3)), x, 66, z, [0, 5.7, 0]);
  for (const [i, f] of CARD.fans.entries()) {
    const x = f * 348,
      motor = new T.Group();
    put(
      motor,
      new T.Mesh(
        new T.CylinderGeometry(m(9), m(9), m(1), 28),
        material('#203a2d', 0.15),
      ),
    );
    for (let j = 0; j < 9; j++) {
      const a = (j * Math.PI * 2) / 9,
        coil = new T.Mesh(
          new T.TorusGeometry(m(1.6), m(0.65), 6, 12),
          material('#94613d', 0.8, 0.7),
        );
      coil.rotation.x = Math.PI / 2;
      put(motor, coil, Math.cos(a) * 5.5, 1.7, Math.sin(a) * 5.5);
    }
    put(
      motor,
      new T.Mesh(new T.CylinderGeometry(m(1.8), m(1.8), m(4), 16), nickel),
      0,
      1.5,
      0,
    );
    register('fanmotor', motor, x, 56, 0, [x * 0.004, 4.5, 0]);
    const headerX = -145 + i * 13;
    register(
      'fanheader',
      buildHeader(material, 4, 1, m(1.5), '#34383a', m(4)),
      headerX,
      3,
      48,
      [-0.8, 0.5, 0.6],
    );
    const cable = new T.Group();
    for (let j = 0; j < 4; j++) {
      const curve = new T.CatmullRomCurve3(
        [
          [headerX + j, 4, 48],
          [headerX + j, 13, 64],
          [x, 50, 64],
          [x, 54, 16],
          [x + j * 0.6, 56, 0],
        ].map((p) => new T.Vector3(...v(p[0], p[1], p[2]))),
      );
      cable.add(
        new T.Mesh(new T.TubeGeometry(curve, 32, m(0.45), 5, false), black),
      );
    }
    register('fancable', cable, 0, 0, 0, [0, 3.4, 0.3]);
  }
  // Five physical outputs, as on the TUF; HDMI has a trapezoidal mouth.
  for (let i = 0; i < 5; i++) {
    const port = new T.Group(),
      hdmi = i >= 3;
    for (const y of [-2.4, 2.4])
      put(port, box(15, 0.65, hdmi ? 14 : 16, nickel), 0, y, 0);
    for (const side of [-1, 1]) {
      const wall = box(15, 4.8, 0.65, nickel);
      if (hdmi) wall.rotation.x = side * 0.2;
      put(port, wall, 0, 0, side * (hdmi ? 6.8 : 7.8));
    }
    put(port, box(0.7, 4, 13, black), 6.8, 0, 0);
    put(port, box(12, 0.7, hdmi ? 10 : 12, black), 0, -0.6, 0);
    for (let j = 0; j < (hdmi ? 19 : 20); j++)
      put(port, box(9, 0.12, 0.25, gold), -1, -0.15, -5 + j * 0.52);
    register(
      hdmi ? 'hdmi' : 'displayport',
      port,
      -168,
      seat.bracket / (L / 348) - CARD.depth * 348 * 0.1,
      -49.6 + i * 24.8,
      [-2.25, 0, (i - 2) * 0.15],
    );
  }
  const pcie = new T.Group();
  put(pcie, box(12, 1.5, 10, material('#242d20', 0.1)), -37, 0, 0);
  put(pcie, box(72, 1.5, 10, material('#242d20', 0.1)), 7, 0, 0);
  for (const side of [-1, 1])
    for (let i = 0; i < 82; i++)
      put(
        pcie,
        box(0.6, 0.12, 8, gold),
        -42 + i + (i >= 11 ? 2 : 0),
        side * 0.81,
        0,
      );
  register('pcie', pcie, -78, 0, 66, [0, -1.35, 0.8]);
  const power = new T.Group();
  // Socket faces the cable at the long edge, away from the fan openings.
  put(power, box(24, 10, 11));
  for (let i = 0; i < 12; i++) {
    put(
      power,
      box(2.7, 2.7, 0.25, material('#030405', 0)),
      -9 + (i % 6) * 3.6,
      -2 + Math.floor(i / 6) * 4,
      -5.65,
    );
    put(
      power,
      box(0.8, 0.8, 0.3, nickel),
      -9 + (i % 6) * 3.6,
      -2 + Math.floor(i / 6) * 4,
      -5.8,
    );
  }
  for (let i = 0; i < 4; i++)
    put(power, box(1.2, 1, 1, nickel), -4.5 + i * 3, 5.6, -4.8);
  put(power, box(7, 2, 5), 0, 5.8, 1);
  register('power', power, 32, 8, -63, [0, 0.6, -1.8]);
  // Derive free surface area from placed components instead of scattering
  // resistors through memory packages or controller ICs.
  const boardFamilies = new Set([
    'package',
    'gddr7',
    'vrm',
    'powerstage',
    'capacitor',
    'pwm',
    'bios',
    'monitor',
    'temperature',
    'auxreg',
    'esd',
    'shunt',
    'crystal',
    'fuse',
    'fanheader',
    'standoff',
    'testpoint',
    'power',
    'displayport',
    'hdmi',
  ]);
  const occupied = placed.filter((p) => boardFamilies.has(p.concept));
  const resistors: Vec3[] = [],
    ceramics: Vec3[] = [];
  for (
    let i = 0;
    i < 2920 && (resistors.length < 64 || ceramics.length < 64);
    i++
  ) {
    const k = (i * 1297) % 2920,
      x = m(-157 + (k % 73) * 3),
      z = m(-57 + Math.floor(k / 73) * 3);
    if (
      occupied.some(
        (p) =>
          Math.abs(x - p.base.x - p.center.x) < p.extent.x / 2 + m(1.4) &&
          Math.abs(z - p.base.z - p.center.z) < p.extent.z / 2 + m(1.4),
      )
    )
      continue;
    const bucket = resistors.length <= ceramics.length ? resistors : ceramics;
    bucket.push([x, m(1.3), z]);
  }
  instances('resistor', resistors, v(2, 0.7, 1), 0, '#25282a').forEach((p) =>
    p.delta.set(-1.4, 0.25, p.base.z * 0.3),
  );
  instances('mlcc', ceramics, v(1.8, 0.8, 1), 0, '#8c8068').forEach((p) =>
    p.delta.set(-0.8, 0.45, p.base.z * 0.4),
  );

  // ── Airflow ─────────────────────────────────────────────────────────────
  // A card is three fans pressing air down into fin banks. Where there is
  // board underneath, that air has to turn and leave along the card's free
  // long edge; past the end of the board there is nothing but fin, so it goes
  // straight through and out of the other side. That is what a flow-through
  // cooler is, and it is the one thing about a card's shape you cannot see by
  // looking at it. Installed in the tower the whole picture turns over with
  // the card, and the air rises out of it instead.
  tools.airflow(
    cardAirflow({
      fans: CARD.fans.map((f) => f * L),
      radius: CARD.fanRadius * L,
      width: CARD.width * L,
      fan: seat.fan,
      finsTop: seat.fins,
      finsBottom: m(4),
      backplate: seat.backplate,
      pcbEnd: (CARD.pcb.centerX + CARD.pcb.length / 2) * L,
    }),
  );
}
