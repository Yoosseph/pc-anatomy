import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { cardKit, MM } from './card-kit.ts';
import { cardAirflow } from './airflow.ts';

/**
 * The two small NVIDIA cards: the ASUS Dual GeForce RTX 5060 Ti, two fans
 * over heat pipes, and the MSI GeForce RTX 5060 INSPIRE ITX, one fan over a
 * copper-cored radial heatsink.
 *
 * ── What is followed and what is not ────────────────────────────────────
 * Followed from each maker's specification: the length, height and slot
 * width, the fan count, the single 8-pin socket, three DisplayPort and one
 * HDMI output, and a PCIe ×16 edge with eight lanes wired. From each maker's
 * own description: the Dual's Axial-tech fans with their barrier ring, its
 * heat pipes and vented backplate; the INSPIRE's seven-blade fan, its
 * copper-core "sunflower" heatsink, its vented backplate, DrMOS stages and
 * board fuses.
 *
 * Not followed, because neither maker publishes it: the board's length and
 * layout, the heat pipe count, the fin pitch, the phase count and every
 * component position. Those are drawn to be consistent with each other, and
 * the concepts say so.
 *
 * Both are built here from one description each, because they are the same
 * kind of card: one GPU, four 32-bit memory channels, a single 8-pin feed.
 * Coordinates are millimetres in the card frame from `card-kit.ts`.
 */

interface Envelope {
  backplate: number;
  retention: number;
  coldplate: number;
  finsBottom: number;
  finsTop: number;
  fanMotor: number;
  fan: number;
  shroud: number;
}

export interface CompactCard {
  /** Concept id prefix, so neither card's parts collide with another's. */
  prefix: 'dual' | 'itx';
  length: number;
  height: number;
  pcb: { x0: number; x1: number; halfZ: number };
  gpu: { x: number; z: number };
  memory: [number, number][];
  /** GPU phases in a column beside the package, and the memory phase. */
  phases: { x: number; z: number[]; memory: [number, number] };
  capacitors: { x: number; z: number[] };
  power: number;
  y: Envelope;
  fans: { r: number; xs: number[]; blades: number; badges: string[] };
  cooler: 'pipes' | 'radial';
  colors: { shroud: string; trim: string; backplate: string; ink: string };
  wordmark: string;
  edgeMark: string;
  /** Controllers along the bracket end, millimetres. */
  chips: {
    pwm: [number, number];
    bios: [number, number];
    crystal: [number, number];
  };
  fanHeader: [number, number];
  /** Board fuses beside the power socket, if the maker names them. */
  fuses?: [number, number][];
}

/** ASUS Dual GeForce RTX 5060 Ti 16GB: 229 × 120 × 50 mm, 2.5 slots. */
export const dual5060ti: CompactCard = {
  prefix: 'dual',
  length: 229,
  height: 120,
  pcb: { x0: -112.5, x1: 46, halfZ: 52 },
  gpu: { x: -46, z: -2 },
  memory: [
    [-82, -16],
    [-82, 16],
    [-58, -38],
    [-32, -38],
  ],
  phases: { x: 6, z: [-36, -22, -8, 6, 20, 34], memory: [-62, 34] },
  capacitors: { x: 18, z: [-40, -28, -16, -4, 8, 20, 32] },
  power: 34,
  y: {
    backplate: -3.8,
    retention: -1.8,
    coldplate: 6.6,
    finsBottom: 10.5,
    finsTop: 33.5,
    fanMotor: 34.4,
    fan: 37.5,
    shroud: 41,
  },
  fans: { r: 44, xs: [-56, 56], blades: 11, badges: ['ASUS', 'DUAL'] },
  cooler: 'pipes',
  colors: {
    shroud: '#17191c',
    trim: '#6b737a',
    backplate: '#202327',
    ink: '#9aa2a8',
  },
  wordmark: 'DUAL',
  edgeMark: 'GEFORCE RTX 5060 Ti',
  chips: { pwm: [-100, -40], bios: [-104, 6], crystal: [-98, 22] },
  fanHeader: [-104, 44],
};

/** MSI GeForce RTX 5060 8G INSPIRE ITX: 145 × 120 × 45 mm, two slots. */
export const inspire5060: CompactCard = {
  prefix: 'itx',
  length: 145,
  height: 120,
  pcb: { x0: -70.5, x1: 69.5, halfZ: 52 },
  gpu: { x: -2, z: -4 },
  memory: [
    [-36, -16],
    [-36, 14],
    [-14, -38],
    [12, -38],
  ],
  phases: { x: 34, z: [-32, -18, -4, 10, 24], memory: [-20, 38] },
  capacitors: { x: 46, z: [-30, -18, -6, 6, 18, 30] },
  power: 52,
  y: {
    backplate: -3.8,
    retention: -1.8,
    coldplate: 6.6,
    finsBottom: 9.5,
    finsTop: 29,
    fanMotor: 29.9,
    fan: 33,
    shroud: 36.5,
  },
  fans: { r: 46, xs: [-2], blades: 7, badges: ['msi'] },
  cooler: 'radial',
  colors: {
    shroud: '#9a8869',
    trim: '#c9b993',
    backplate: '#a8987a',
    ink: '#3f382c',
  },
  wordmark: 'INSPIRE',
  edgeMark: 'GEFORCE RTX',
  chips: { pwm: [-46, -42], bios: [-48, 0], crystal: [-46, 34] },
  fanHeader: [-50, 44],
  fuses: [
    [60, -38],
    [66, -38],
  ],
};

/** Where the card meets the slot and its cable, for the tower. */
export function compactMount(card: CompactCard) {
  return {
    length: card.length,
    edge: [-card.length / 2 + 94.5, card.pcb.halfZ + 5] as [number, number],
    socket: [card.power, 7, -card.pcb.halfZ] as Vec3,
    faces: 'edge' as const,
    fan: card.y.fan,
  };
}

export function buildCompactCard(tools: ModelTools, card: CompactCard) {
  const kit = cardKit(tools);
  const {
    m,
    v,
    put,
    register,
    box,
    slab,
    text,
    chamfered,
    circle,
    rect,
    plate,
    chip,
    heatpipe,
    finish,
  } = kit;
  const { nickel, copper } = kit.materials;
  const { material } = tools;
  const id = (name: string) => card.prefix + name;
  const { length: L, height: W, pcb: PCB, gpu: GPU, y: Y, fans: FAN } = card;

  // The Dual's shroud is moulded; the INSPIRE's is a champagne metal finish.
  const shell =
      card.prefix === 'dual'
        ? finish('plastic', card.colors.shroud, 0.7)
        : finish('anodized', card.colors.shroud, 0.55),
    trim = finish('anodized', card.colors.trim, 0.45),
    back = finish('anodized', card.colors.backplate, 0.5);
  shell.envMapIntensity = card.prefix === 'dual' ? 0.35 : 0.6;

  // ── Board ──────────────────────────────────────────────────────────────
  const board = new T.Group();
  put(
    board,
    tools.pcb(v(PCB.x1 - PCB.x0, 1.6, PCB.halfZ * 2), 'graphics'),
    (PCB.x0 + PCB.x1) / 2,
    0,
    0,
  );
  text(
    board,
    card.prefix === 'dual' ? 'DUAL-RTX5060TI-O16G' : 'RTX 5060 INSPIRE ITX',
    PCB.x0 + 34,
    0.9,
    -PCB.halfZ + 6,
    46,
    '#8c938a',
  );
  register(id('pcb'), board, 0, 0, 0, [0, -0.8, 0]);

  const pkg = new T.Group();
  put(pkg, box(35, 1.4, 35, material('#1d3a2a', 0.15)));
  for (const x of [-14, 14])
    for (let i = 0; i < 7; i++)
      put(pkg, box(1.4, 0.6, 1, nickel), x, 1, -11.4 + i * 3.8);
  register(id('package'), pkg, GPU.x, 2.2, GPU.z, [0, 1.3, 0]);
  const die = new T.Group();
  put(die, box(14, 1, 13, material('#636b70', 0.9, 0.3)));
  const dieMark = new T.Group();
  text(dieMark, 'NVIDIA', 0, 0, -2.5, 9, '#aeb3b2');
  put(die, dieMark, 0, 0.56, 0);
  register(id('silicon'), die, GPU.x, 4.1, GPU.z, [0, 1.68, 0]);
  register(id('bga'), kit.ballGrid(16, 2), GPU.x, 1.25, GPU.z, [0, 0.98, 0]);
  register(
    id('tim'),
    box(14, 0.2, 13, material('#8b8f8d', 0.2, 0.9)),
    GPU.x,
    4.75,
    GPU.z,
    [0, 2.1, 0],
  );

  // Four GDDR7 packages, one per 32-bit channel of the 128-bit bus.
  const memory = card.memory.map(([x, z]) => v(x, 2.6, z));
  kit
    .instances(id('gddr7'), memory, v(12, 2.6, 14), 0, '#111417')
    .forEach((p) =>
      p.delta.set((p.base.x - m(GPU.x)) * 0.5, 0.9, p.base.z * 0.4),
    );
  kit
    .instances(
      id('thermalpad'),
      memory.map((p) => [p[0], m(3.6), p[2]]),
      v(12, 1.6, 14),
      0,
      '#777d80',
    )
    .forEach((p) =>
      p.delta.set((p.base.x - m(GPU.x)) * 0.5, 2.1, p.base.z * 0.4),
    );

  // GPU phases in a column beside the package, one memory phase apart.
  const chokes: Vec3[] = [],
    stages: Vec3[] = [];
  for (const z of card.phases.z) {
    chokes.push(v(card.phases.x, 4.5, z));
    stages.push(v(card.phases.x - 10.5, 1.8, z));
  }
  const [mx, mz] = card.phases.memory;
  chokes.push(v(mx, 4.5, mz));
  stages.push(v(mx - 10, 1.8, mz));
  const side = (p: { base: T.Vector3 }) => (p.base.x > m(GPU.x) ? 1 : -1);
  kit
    .instances(id('vrm'), chokes, v(9, 7, 9.5), 0, '#24292d')
    .forEach((p) => p.delta.set(side(p) * 1.2, 0.6, 0));
  kit
    .instances(id('powerstage'), stages, v(5, 1.5, 5), 0, '#111416')
    .forEach((p) => p.delta.set(side(p) * 1.45, 0.4, 0));
  kit
    .instances(
      id('capacitor'),
      card.capacitors.z.map((z) => v(card.capacitors.x, 3.8, z)),
      v(5.2, 6, 5.2),
      0,
      '#ffffff',
      kit.capacitorGeometry(2.6, 5.6),
    )
    .forEach((p) => p.delta.set(1.7, 0.4, 0));

  chip(id('pwm'), 'PWM', ...card.chips.pwm, 6);
  chip(id('bios'), 'VBIOS', ...card.chips.bios, 7);
  for (let i = 0; i < 4; i++)
    chip(id('esd'), 'ESD', PCB.x0 + 19.5, -36 + i * 24, 3, 3, [-0.6, 0.9, 0]);
  const [cx, cz] = card.chips.crystal;
  register(id('crystal'), box(6, 1.5, 3, nickel), cx, 1.8, cz, [-0.8, 0.75, 0]);
  for (const [x, z] of card.fuses ?? []) {
    const fuse = new T.Group();
    put(fuse, box(4, 1.6, 2.2, material('#d8d2c4', 0.05, 0.7)));
    for (const sx of [-1, 1]) put(fuse, box(0.8, 1.7, 2.3, nickel), sx * 1.7);
    register(id('fuse'), fuse, x, 1.6, z, [0.8, 0.8, -0.6]);
  }
  for (const x of [GPU.x - 25, GPU.x + 25])
    for (const z of [-25, 25])
      register(
        id('standoff'),
        new T.Mesh(new T.CylinderGeometry(m(2.4), m(2.4), m(6), 6), nickel),
        x,
        3.9,
        GPU.z + z,
        [0, 0.6, z * 0.015],
      );
  const retention = new T.Group();
  for (const angle of [-Math.PI / 4, Math.PI / 4]) {
    const arm = box(50, 0.8, 5, nickel);
    arm.rotation.y = angle;
    put(retention, arm);
  }
  register(id('retention'), retention, GPU.x, Y.retention, GPU.z, [0, -1.3, 0]);

  // The single 8-pin socket on the top edge, latch outward.
  const power = new T.Group();
  put(power, box(21, 12, 9));
  for (let i = 0; i < 8; i++) {
    const x = -6.3 + (i % 4) * 4.2,
      y = -2.1 + Math.floor(i / 4) * 4.2;
    put(power, box(3.3, 3.3, 0.3, material('#030405', 0)), x, y, -4.6);
    put(power, box(1, 1, 0.3, nickel), x, y, -4.75);
  }
  put(power, box(5, 2.5, 3), 0, 6.8, -3);
  register(
    id('power'),
    power,
    card.power,
    7,
    -PCB.halfZ + 4.5,
    [0.6, 0.7, -1.6],
  );

  // ── Outputs and edge connector ─────────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const hdmi = i === 3;
    register(
      id(hdmi ? 'hdmi' : 'displayport'),
      kit.displaySocket(hdmi ? 'hdmi' : 'dp'),
      -L / 2 + 9,
      6.5,
      -36 + i * 24,
      [-2, 0, (i - 1.5) * 0.15],
    );
  }
  // A full-length ×16 edge with contacts only as far as the eighth lane: 49
  // positions of the 82, which is what an ×8 card's fingers look like.
  const edge = compactMount(card).edge;
  register(
    id('pcie'),
    kit.edgeConnector(89, 49),
    edge[0],
    0,
    edge[1],
    [0, -1.35, 0.8],
  );

  // ── Cooler ─────────────────────────────────────────────────────────────
  const finMat = material(
    card.cooler === 'radial' ? '#8d9296' : '#4a4f53',
    0.82,
    0.8,
  );
  finMat.envMapIntensity = 0.45;
  const finHeight = Y.finsTop - Y.finsBottom;

  if (card.cooler === 'pipes') {
    // A copper contact block on a mounting plate that also presses on the
    // memory and regulator pads, three pipes out of it into one fin stack.
    const cold = new T.Group();
    put(cold, box(92, 2, 84, finish('anodized', '#1d2024', 0.6)), 0, 0.5, 0);
    put(cold, box(28, 3, 28, copper), 0, -1, 0);
    for (let i = 0; i < 3; i++)
      put(cold, box(34, 2.4, 6.5, copper), 0, 2.2, (i - 1) * 9.5);
    register(id('coldplate'), cold, GPU.x + 4, Y.coldplate, GPU.z, [0, 2.4, 0]);
    for (let i = 0; i < 3; i++) {
      const z = (i - 1) * 9.5 + GPU.z;
      heatpipe(
        id('heatpipe'),
        [
          [-L / 2 + 12, 15 + (i % 2) * 5, z * 2.4],
          [-80, 12, z * 1.6],
          [GPU.x, 9.3, z],
          [-6, 12, z * 1.6],
          [40, 16 + (i % 2) * 5, z * 2.3],
          [L / 2 - 12, 19 + (i % 2) * 5, z * 2.3],
        ],
        2.8,
        [0, 2.75 + i * 0.05, 0],
        copper,
      );
    }
    // One fin stack the length of the card, standing on edge.
    const fins = new T.Group();
    const across = W * 0.84,
      pitch = 1.6;
    const start = -L / 2 + 7,
      stop = L / 2 - 7;
    const rows = Math.round((stop - start) / pitch);
    const bank = new T.InstancedMesh(
        new T.BoxGeometry(m(0.3), m(finHeight), m(across)),
        finMat,
        rows,
      ),
      helper = new T.Object3D();
    for (let i = 0; i < rows; i++) {
      helper.position.set(m(start + ((stop - start) * i) / (rows - 1)), 0, 0);
      helper.updateMatrix();
      bank.setMatrixAt(i, helper.matrix);
    }
    bank.castShadow = bank.receiveShadow = true;
    fins.add(bank);
    for (const z of [-across * 0.46, across * 0.46])
      put(fins, box(stop - start, 1.5, 3, finMat), 0, -finHeight * 0.46, z);
    register(
      id('heatsink'),
      fins,
      0,
      (Y.finsTop + Y.finsBottom) / 2,
      0,
      [0, 3.2, 0],
    );
  } else {
    // The sunflower: a solid copper core standing on the GPU, and extruded
    // aluminium fins radiating out of it, each bent part way along so the
    // fan's swirl meets a fin face rather than an edge.
    const core = new T.Group();
    put(core, box(60, 2, 60, finish('anodized', '#2a2620', 0.6)), 0, -3.4, 0);
    put(
      core,
      new T.Mesh(
        new T.CylinderGeometry(m(15), m(16), m(finHeight + 4), 40),
        copper,
      ),
      0,
      finHeight / 2 - 2.4,
      0,
    );
    register(id('core'), core, GPU.x, Y.finsBottom - 0.4, GPU.z, [0, 2.5, 0]);
    const fins = new T.Group();
    const count = 56,
      inner = 16,
      outer = 50,
      bend = 0.32;
    const half = (outer - inner) / 2;
    const finGeometry = new T.BoxGeometry(m(half), m(finHeight), m(0.7));
    const bank = new T.InstancedMesh(finGeometry, finMat, count * 2),
      helper = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      // Inner half straight out from the core.
      const r1 = inner + half / 2;
      helper.position.set(m(Math.cos(a) * r1), 0, m(Math.sin(a) * r1));
      helper.rotation.set(0, -a, 0);
      helper.updateMatrix();
      bank.setMatrixAt(i * 2, helper.matrix);
      // Outer half swept round by the bend.
      const knee = inner + half;
      const b = a + bend;
      helper.position.set(
        m(Math.cos(a) * knee + (Math.cos(b) * half) / 2),
        0,
        m(Math.sin(a) * knee + (Math.sin(b) * half) / 2),
      );
      helper.rotation.set(0, -b, 0);
      helper.updateMatrix();
      bank.setMatrixAt(i * 2 + 1, helper.matrix);
    }
    bank.castShadow = bank.receiveShadow = true;
    fins.add(bank);
    // A ring binding the fin tips, as the extrusion's outer skin.
    const ring = new T.Mesh(
      new T.TorusGeometry(m(outer + 0.6), m(0.7), 6, 72),
      finMat,
    );
    ring.rotation.x = Math.PI / 2;
    put(fins, ring, 0, finHeight / 2 - 0.8, 0);
    register(
      id('heatsink'),
      fins,
      GPU.x,
      (Y.finsTop + Y.finsBottom) / 2,
      GPU.z,
      [0, 3.2, 0],
    );
  }

  // ── Shroud ─────────────────────────────────────────────────────────────
  const shroud = new T.Group();
  const aperture = FAN.r * 1.04;
  const face = chamfered(L / 2, W / 2 - 1, card.prefix === 'dual' ? 10 : 6);
  for (const x of FAN.xs) face.holes.push(circle(x, 0, aperture));
  put(shroud, plate(face, 2.2, shell));
  if (card.prefix === 'dual') {
    // Two parallel slanted grey bars in the gap between the fans, the
    // Dual's one piece of trim.
    for (const sx of [-1, 1]) {
      const bar = slab(2.4, 0.8, W * 0.56, trim);
      bar.rotation.y = 0.32;
      put(shroud, bar, sx * 4, 2.4, 0);
    }
  } else {
    // A bright bezel round the single fan, set into the champagne face.
    const bezel = new T.Mesh(
      new T.TorusGeometry(m(aperture + 2.4), m(1.3), 8, 96),
      trim,
    );
    bezel.rotation.x = Math.PI / 2;
    put(shroud, bezel, FAN.xs[0], 2.4, 0);
  }
  for (const x of FAN.xs) {
    const rim = new T.Mesh(
      new T.TorusGeometry(m(aperture), m(0.9), 8, 80),
      finish('anodized', '#24272b', 0.5),
    );
    rim.rotation.x = Math.PI / 2;
    put(shroud, rim, x, 2.3, 0);
    for (const angle of [0.5, 2.6, 4.7]) {
      const arm = slab(FAN.r * 1.02, 1, 3.4, shell);
      arm.rotation.y = angle;
      put(
        shroud,
        arm,
        x + Math.cos(angle) * FAN.r * 0.5,
        -(Y.shroud - Y.fan) - 1.6,
        -Math.sin(angle) * FAN.r * 0.5,
      );
    }
  }
  const sideHeight = Y.shroud - Y.finsBottom + 2;
  for (const sz of [-1, 1]) {
    // A solid lip on both long edges, the fins showing below it, and posts
    // where the shroud screws to the heatsink frame.
    put(shroud, slab(L - 2, 6, 2, shell), 0, -2, sz * (W / 2 - 1));
    for (const x of [-L / 2 + 5, 0, L / 2 - 5])
      put(
        shroud,
        slab(7, sideHeight, 2, shell),
        x,
        -sideHeight / 2 + 1,
        sz * (W / 2 - 1),
      );
  }
  for (const sx of [-1, 1])
    put(
      shroud,
      slab(2, sideHeight, W - 6, shell),
      sx * (L / 2 - 1),
      -sideHeight / 2 + 1,
      0,
    );
  const mark = new T.Group();
  text(
    mark,
    card.wordmark,
    0,
    0,
    0,
    card.prefix === 'dual' ? 22 : 30,
    card.colors.ink,
  );
  put(
    shroud,
    mark,
    card.prefix === 'dual' ? 0 : FAN.xs[0],
    2.6,
    card.prefix === 'dual' ? 0 : W / 2 - 7,
  );
  if (card.prefix === 'dual') mark.rotation.y = Math.PI / 2;
  // The top edge, printed: the face a window shows once the card is in.
  const edgePrint = new T.Group();
  tools.label(
    edgePrint,
    card.edgeMark,
    [0, 0, 0],
    m(card.prefix === 'dual' ? 70 : 46),
    card.colors.ink,
  );
  edgePrint.rotation.x = -Math.PI / 2;
  put(
    shroud,
    edgePrint,
    card.prefix === 'dual' ? 40 : 18,
    -sideHeight / 2 + 2,
    -W / 2 - 0.2,
  );
  register(id('shroud'), shroud, 0, Y.shroud, 0, [0, 4.2, 0]);

  // ── Fans, motors and wiring ────────────────────────────────────────────
  for (const [i, x] of FAN.xs.entries())
    kit.add(
      id('fan'),
      kit.fan(FAN.r * 0.97, FAN.blades, {
        ring: true,
        badge: FAN.badges[i],
        bladeColor: '#0d0f11',
        reverse: card.prefix === 'dual' && i === 1,
      }),
      v(x, Y.fan, 0),
      [x * MM * 0.18, 4.6, 0],
    );
  for (const x of FAN.xs) kit.fanMotor(id('fanmotor'), x, Y.fanMotor, 8.5);
  const [hx, hz] = card.fanHeader;
  kit.fanHeader(id('fanheader'), hx, hz, [-0.8, 0.5, 0.6]);
  for (const [i, x] of FAN.xs.entries())
    kit.fanCable(
      id('fancable'),
      [
        [hx + i * 2, 4, hz],
        [hx + 4, 10, W / 2 - 6],
        [x, Y.finsTop - 6, W / 2 - 6],
        [x, Y.finsTop - 4, 14],
        [x, Y.fanMotor + 0.6, 0],
      ],
      [0, 3.1, 0.3],
    );
  for (const x of [-L / 2 + 8, 0, L / 2 - 8])
    for (const z of [-W / 2 + 10, W / 2 - 10])
      register(id('fastener'), kit.screw(2), x, Y.shroud + 2.8, z, [0, 5.2, 0]);
  for (const x of [GPU.x - 25, GPU.x + 25])
    register(
      id('fastener'),
      kit.screw(2),
      x,
      Y.backplate - 0.2,
      GPU.z + 25,
      [0, -2.9, 0],
    );

  // ── Bracket and backplate ──────────────────────────────────────────────
  register(
    id('bracket'),
    kit.bracket(W - 4, Y.shroud + 2.5 - Y.backplate),
    -L / 2 - 1.5,
    (Y.shroud + 2.5 + Y.backplate) / 2,
    0,
    [-2, 0, 0],
  );
  const rear = chamfered(L / 2, W / 2, 6);
  if (card.prefix === 'dual')
    // The vent past the end of the board, where the second fan blows through.
    rear.holes.push(rect(PCB.x1 + 8, -40, L / 2 - 10, 40));
  else
    // Slots over the far end of the board.
    for (let i = 0; i < 5; i++)
      rear.holes.push(rect(36 + i * 6, -34, 39.5 + i * 6, 34));
  const backplate = new T.Group();
  put(backplate, plate(rear, 1.4, back));
  const backMark = new T.Group();
  text(
    backMark,
    card.prefix === 'dual' ? 'ASUS DUAL' : 'GEFORCE RTX',
    0,
    0,
    0,
    card.prefix === 'dual' ? 44 : 36,
    card.colors.ink,
  );
  backMark.rotation.x = Math.PI;
  put(backplate, backMark, card.prefix === 'dual' ? -56 : -22, -0.3, 0);
  register(id('backplate'), backplate, 0, Y.backplate, 0, [0, -2.2, 0]);

  kit.passives(
    id('resistor'),
    id('mlcc'),
    [
      'package',
      'gddr7',
      'vrm',
      'powerstage',
      'capacitor',
      'pwm',
      'bios',
      'esd',
      'crystal',
      'fuse',
      'fanheader',
      'standoff',
      'power',
      'displayport',
      'hdmi',
    ].map(id),
    { x0: PCB.x0 + 8, x1: PCB.x1 - 4, z0: -PCB.halfZ + 3, z1: PCB.halfZ - 3 },
    44,
  );

  tools.airflow(
    cardAirflow({
      fans: FAN.xs,
      radius: FAN.r,
      width: W,
      fan: Y.fan,
      finsTop: Y.finsTop,
      finsBottom: Y.finsBottom,
      backplate: Y.backplate,
      pcbEnd: PCB.x1,
      scale: MM,
    }),
  );
}
