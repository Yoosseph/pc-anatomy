import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { keyCenter, MODULE } from './memory-module.ts';
import {
  boardOptions,
  defaultBuild,
  fittedParts,
  type BoardChoice,
  type DesktopBuild,
} from './desktop-build.ts';
import {
  buildCapacitor,
  buildChip,
  buildChoke,
  buildHeader,
  buildScrew,
  buildSlot,
  glowMaterial,
} from './parts.ts';

// Reference-led ATX layout, in millimetres: X across, Z down, Y above the PCB.
// Routing and the installed CPU / DIMMs remain an educational assembly.
const mm = (n: number) => n / 22;
const vector = (x: number, y: number, z: number): Vec3 => [mm(x), mm(y), mm(z)];

/**
 * Where the micro-ATX board puts what the ATX board has below the second
 * slot. The two share the top edge, the socket, the memory, the primary slot
 * and the top two rows of mounting holes; micro-ATX stops 61 mm sooner, so
 * everything under the primary slot is packed into what is left.
 */
const microAtx = {
  /** The board's far edge, millimetres below its centre line. */
  bottom: 91.5,
  mounts: [
    [-113, -145],
    [43, -145],
    [114, -145],
    [-113, 10],
    [114, 10],
    [-113, 85],
    [24, 85],
    [114, 85],
  ],
  pcie16: [32, 78],
  pcie1: [48],
  m2: [
    [11, -10, 122, 20],
    [55, -19, 100, 20],
  ],
  frontheaders: [
    [-75, 5],
    [-33, 5],
    [9, 4],
    [47, 4],
  ],
  frontZ: 87,
  fanheaders: [
    [68, -141],
    [87, -141],
    [114, -90],
    [88, 87],
  ],
};

/**
 * How one maker dresses a board: the finish of its armour and the trim on
 * it, the fins on its power-delivery heatsinks, the marks printed on the
 * chipset and I/O covers, the chipset heatsink's shape, and the expansion
 * slots it carries. The layout under it, ATX or micro-ATX, is shared.
 *
 * Only the ASUS boards and the slot lists follow published drawings and
 * specifications; the other makers' finishes are in their style, and say so.
 */
interface BoardDesign {
  /** The armour's colour, metalness and roughness, and its reflections. */
  armour: [colour: string, metal: number, rough: number, env: number];
  /** Fin tops, M.2 trim and the frame around the printed marks. */
  trim: [colour: string, metal: number, rough: number];
  /** The colour of the printed marks. */
  ink: string;
  marks: { big: string; small: string; tag: string; io: string };
  /** TUF's printed grid and hazard stripes. */
  tuf: boolean;
  fins: 'blades' | 'slats' | 'block';
  chipset: 'armour' | 'plate' | 'square';
  /**
   * Slots down the board, millimetres from its centre line: the full-length
   * ones (the first is the graphics card's, with its armour) and the short
   * ones, each with its length.
   */
  x16: number[];
  short: { z: number; length: number }[];
}

/**
 * The chipset heatsinks, in millimetres: the outline, where the chip sits
 * under it, the printed marks' size and place, the two screws, and where the
 * heatsink stands on the board.
 */
const chipsetSinks: Record<
  BoardDesign['chipset'] | 'short',
  {
    outline: [number, number][];
    chip: number;
    marks: [w: number, d: number];
    marksAt: number;
    screws: [number, number];
    at: [x: number, z: number];
  }
> = {
  // TUF's broad angular armour, the dominant panel in its reference layout.
  armour: {
    outline: [
      [-90, -19],
      [91, -19],
      [95, -15],
      [95, 11],
      [85, 15],
      [-23, 15],
      [-34, 27],
      [-73, 27],
      [-90, 13],
    ],
    chip: 54,
    marks: [171, 25],
    marksAt: 1,
    screws: [-80, 87],
    at: [6, 65],
  },
  // A broad plate with a straight lower edge, clear of a slot below it.
  plate: {
    outline: [
      [-90, -19],
      [91, -19],
      [95, -15],
      [95, 21],
      [-86, 21],
      [-90, 17],
    ],
    chip: 54,
    marks: [171, 25],
    marksAt: 1,
    screws: [-80, 87],
    at: [6, 65],
  },
  // A micro-ATX board has room only for a short plate beside its second slot.
  short: {
    outline: [
      [-34, -19],
      [34, -19],
      [36, -17],
      [36, 15],
      [28, 19],
      [-26, 19],
      [-34, 11],
    ],
    chip: 0,
    marks: [64, 22],
    marksAt: 0,
    screws: [-28, 30],
    at: [70, 65],
  },
  // ASRock's square heatsink stands to the right, where its manual draws it.
  square: {
    outline: [
      [-22, -23],
      [20, -23],
      [22, -21],
      [22, 23],
      [-20, 23],
      [-22, 21],
    ],
    chip: 0,
    marks: [40, 10],
    marksAt: 0,
    screws: [-16, 16],
    at: [78, 66],
  },
};

const tufMarks = {
  big: 'TUF',
  small: 'GAMING',
  tag: 'GET TUF. GAME TOUGH.',
  io: 'TUF GAMING',
};
const tuf: Omit<BoardDesign, 'x16' | 'short'> = {
  armour: ['#08090b', 0.62, 0.9, 0.22],
  trim: ['#14181c', 0.65, 0.82],
  ink: '#919797',
  marks: tufMarks,
  tuf: true,
  fins: 'blades',
  chipset: 'armour',
};

/** TUF's ATX boards: two ×16 slots, and two ×1 slots between them. */
const tufAtx: BoardDesign = {
  ...tuf,
  x16: [32, 134],
  short: [
    { z: 59, length: 20 },
    { z: 84, length: 20 },
  ],
};

const designs: Record<BoardChoice, BoardDesign> = {
  motherboard: tufAtx,
  z890: tufAtx,
  b650m: {
    ...tuf,
    x16: microAtx.pcie16,
    short: microAtx.pcie1.map((z) => ({ z, length: 20 })),
  },
  // Black armour with yellow trim, after MSI's product photograph, and three
  // full-length slots from its datasheet.
  tomahawk: {
    armour: ['#0b0c0e', 0.6, 0.82, 0.26],
    trim: ['#c9c04a', 0.45, 0.55],
    ink: '#b8b26a',
    marks: { big: 'MAG', small: 'TOMAHAWK', tag: 'MSI', io: 'MAG' },
    tuf: false,
    fins: 'slats',
    chipset: 'plate',
    x16: [32, 93, 134],
    short: [],
  },
  // Gunmetal and silver, in the maker's style; three full-length slots
  // (PCIEX16, PCIEX4_1, PCIEX4_2) from its manual.
  aorus: {
    armour: ['#575e66', 0.9, 0.34, 0.75],
    trim: ['#cdd3d9', 0.95, 0.24],
    ink: '#e6e9ec',
    marks: { big: 'AORUS', small: 'ELITE', tag: 'GIGABYTE', io: 'AORUS' },
    tuf: false,
    fins: 'slats',
    chipset: 'plate',
    x16: [32, 93, 134],
    short: [],
  },
  // Silver with dark trim, in the maker's style; the ×16 slot and the short
  // ×4 slot under it, and the square chipset heatsink, from its manual.
  b850m: {
    armour: ['#8e959c', 0.9, 0.36, 0.8],
    trim: ['#1d2023', 0.4, 0.7],
    ink: '#24282c',
    marks: { big: 'ASRock', small: 'PRO RS', tag: 'B850M', io: 'PRO RS' },
    tuf: false,
    fins: 'block',
    chipset: 'square',
    x16: [32],
    short: [{ z: 78, length: 39 }],
  },
};

/**
 * One of six boards. `motherboard` is the ASUS X670E board the machine is
 * built on; `z890` swaps in Intel's LGA 1851 socket; `b650m` is the AM5
 * board cut to micro-ATX; `tomahawk`, `aorus` and `b850m` are MSI's,
 * GIGABYTE's and ASRock's, each in its maker's design (`designs`). The others
 * prefix their part ids with their own scale, as the other supplies do.
 *
 * The processor and modules it carries come from the build when the tower
 * fits this board, and are left out when they cannot seat: the socket keeps
 * its cover and the slots stay empty. Opened on its own, each board carries
 * the processor it is made for.
 */
export function buildMotherboard(
  tools: ModelTools,
  root: T.Group,
  variant: BoardChoice = 'motherboard',
) {
  const { pcb, material, label } = tools;
  const micro = boardOptions[variant].formFactor === 'Micro-ATX',
    intel = boardOptions[variant].socket === 'LGA 1851';
  const design = designs[variant];
  const name = (id: string) => (variant === 'motherboard' ? id : variant + id);
  const build: DesktopBuild =
    tools.build.board === variant
      ? tools.build
      : {
          ...defaultBuild,
          board: variant,
          processor: intel ? 'corei9' : 'ryzen',
        };
  const fitted = fittedParts(build);
  const occupied: T.Box3[] = [];
  const put = (g: T.Group, o: T.Object3D, x = 0, y = 0, z = 0) => {
    o.position.set(...vector(x, y, z));
    g.add(o);
    return o;
  };
  const add = (
    id: string,
    o: T.Object3D,
    x: number,
    y: number,
    z: number,
    delta: Vec3 = [0, 1.4, 0],
  ) => {
    const p = tools.add(name(id), o, vector(x, y, z), delta, 0);
    if (id !== 'moboboard')
      occupied.push(new T.Box3().setFromObject(o).expandByScalar(mm(1.2)));
    return p;
  };
  // The maker's armour (TUF's is rough black anodised aluminium), distinct
  // from the polished retention hardware, and the trim on it.
  const dark = material(design.armour[0], design.armour[1], design.armour[2]);
  const edge = material(...design.trim);
  dark.envMapIntensity = design.armour[3];
  edge.envMapIntensity = 0.3;
  const metal = material('#939a9e', 0.82, 0.68);
  metal.envMapIntensity = 0.75;
  const block = (w: number, h: number, d: number, mat: T.Material = dark) =>
    new T.Mesh(new T.BoxGeometry(mm(w), mm(h), mm(d)), mat);
  const screw = (g: T.Group, x: number, y: number, z: number, r = 2.3) =>
    put(g, buildScrew(material, mm(r)), x, y, z);
  const plate = (
    points: [number, number][],
    h: number,
    mat: T.Material = dark,
  ) => {
    const shape = new T.Shape();
    points.forEach(([x, z], i) =>
      i ? shape.lineTo(mm(x), -mm(z)) : shape.moveTo(mm(x), -mm(z)),
    );
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, {
      depth: mm(h),
      bevelEnabled: true,
      bevelSize: mm(0.25),
      bevelThickness: mm(0.2),
      bevelSegments: 1,
      steps: 1,
    });
    geo.rotateX(-Math.PI / 2);
    return new T.Mesh(geo, mat);
  };
  // Screen-printed graphics live above the metal, without coplanar flicker.
  const branding = (
    g: T.Group,
    w: number,
    d: number,
    y: number,
    vertical = false,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 384;
    const c = canvas.getContext('2d')!;
    const { marks, ink } = design;
    if (design.tuf) {
      c.strokeStyle = '#34393d';
      c.lineWidth = 2;
      for (let x = 12; x < 1510; x += 38) {
        c.beginPath();
        c.moveTo(x, 20);
        c.lineTo(x, 365);
        c.stroke();
      }
      for (let z = 20; z < 380; z += 38) {
        c.beginPath();
        c.moveTo(12, z);
        c.lineTo(1510, z);
        c.stroke();
      }
      c.fillStyle = '#0b0d10';
      c.fillRect(790, 20, 736, 345);
    } else {
      // A trim line in the maker's colour where TUF prints its grid.
      c.fillStyle = design.trim[0];
      c.fillRect(40, 300, 700, 10);
    }
    c.textAlign = 'left';
    if (vertical) {
      if (design.tuf) {
        c.fillStyle = '#0b0d10';
        c.fillRect(150, 120, 1240, 145);
      }
      c.fillStyle = ink;
      c.font = '900 130px sans-serif';
      c.fillText(marks.io, 190, 242, 1170);
    } else {
      c.fillStyle = ink;
      c.font = '900 290px sans-serif';
      c.fillText(marks.big, 800, 312, design.tuf ? 320 : 330);
      c.font = '900 116px sans-serif';
      c.fillText(marks.small, 1140, 177, 365);
      c.font = '700 33px sans-serif';
      c.fillText(marks.tag, 1140, 263, 365);
    }
    c.strokeStyle = design.tuf ? '#a5a9a4' : design.trim[0];
    c.lineWidth = 5;
    c.strokeRect(14, 15, 1508, 350);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 8;
    const mesh = new T.Mesh(
      new T.PlaneGeometry(mm(w), mm(d)),
      new T.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    if (vertical) mesh.rotation.z = Math.PI / 2;
    put(g, mesh, 0, y, 0);
  };
  const board = new T.Group();
  // Micro-ATX keeps ATX's top edge and loses 61 mm off the bottom, so the
  // laminate moves up rather than shrinking about its centre.
  const bottom = micro ? microAtx.bottom : 152.5;
  put(
    board,
    pcb(vector(244, 1.6, 152.5 + bottom), 'motherboard'),
    0,
    0,
    (bottom - 152.5) / 2,
  );
  const mounts = micro
    ? microAtx.mounts
    : [
        [-113, -145],
        [43, -145],
        [114, -145],
        [-113, 10],
        [114, 10],
        [-113, 141],
        [42, 141],
        [114, 141],
      ];
  for (const [x, z] of mounts) {
    const ring = new T.Mesh(
      new T.TorusGeometry(mm(3.5), mm(0.75), 6, 20),
      metal,
    );
    ring.rotation.x = Math.PI / 2;
    put(board, ring, x, 1, z);
    put(
      board,
      new T.Mesh(new T.CylinderGeometry(mm(2.4), mm(2.4), mm(0.2), 16), dark),
      x,
      1,
      z,
    );
    occupied.push(
      new T.Box3(
        new T.Vector3(mm(x - 5), 0, mm(z - 5)),
        new T.Vector3(mm(x + 5), 1, mm(z + 5)),
      ),
    );
  }
  // TUF's yellow and orange hazard stripes, on its ATX boards.
  for (let i = 0; i < (design.tuf && !micro ? 6 : 0); i++) {
    const mark = block(
      1.8,
      0.25,
      14,
      material(i < 3 ? '#b48c28' : '#bb5423', 0.2),
    );
    mark.rotation.y = -0.45;
    put(board, mark, 119, 1, 81 + i * 4);
  }

  const sx = 8,
    sz = -64;
  const socket = new T.Group();
  put(socket, block(58, 3, 72, material('#25272a', 0.14)));
  const pinGeo = new T.BoxGeometry(mm(0.5), mm(0.35), mm(0.5));
  const pinMat = material('#958667', 0.75, 0.65);
  // The cover a board ships with, left on when the build's processor cannot
  // seat in this socket.
  const cover = (w: number, d: number) => {
    const cap = new T.Group();
    put(cap, block(w, 1.6, d, material('#121416', 0.08, 0.7)), 0, 5.6, 0);
    put(cap, block(w * 0.5, 0.4, 6, material('#22262a', 0.08, 0.7)), 0, 6.5, 0);
    label(cap, 'PnP CAP', vector(0, 6.75, d * 0.28), mm(w * 0.42), '#5c6266');
    put(socket, cap);
  };
  if (!intel) {
    // AM5 load frame, square package, cam lever and cooler mounting rails.
    for (let x = 0; x < 40; x++)
      for (let z = 0; z < 40; z++) {
        if (x > 14 && x < 25 && z > 14 && z < 25) continue;
        put(socket, new T.Mesh(pinGeo, pinMat), x - 19.5, 1.7, z - 19.5);
      }
    for (const side of [-1, 1]) {
      put(socket, block(4, 2.4, 66, metal), side * 26, 4.1, 0);
      put(socket, block(48, 2.4, 8, metal), 0, 4.1, side * 29);
      put(socket, block(62, 5, 8), 0, 1, side * 45);
      for (const x of [-24, 24]) screw(socket, x, 5.5, side * 29, 2.6);
      for (const x of [-27, 27]) screw(socket, x, 4.4, side * 45, 3.2);
    }
    const leverCurve = new T.CatmullRomCurve3(
      [
        [31, 4, -31],
        [34, 4, -24],
        [34, 4, 26],
        [30, 4, 32],
      ].map(([x, y, z]) => new T.Vector3(...vector(x, y, z))),
    );
    socket.add(
      new T.Mesh(new T.TubeGeometry(leverCurve, 28, mm(1), 8, false), metal),
    );
    label(socket, 'AM5', vector(0, 5.5, 29), mm(16), '#53595c');
    if (!fitted.processor) cover(46, 46);
  } else {
    // LGA 1851: a rectangular field of spring contacts with an open centre,
    // under Intel's loading mechanism. A hinged steel plate frames the
    // package's long sides and is held down by a lever along one of them.
    for (let x = 0; x < 36; x++)
      for (let z = 0; z < 43; z++) {
        if (x > 11 && x < 24 && z > 13 && z < 29) continue;
        put(socket, new T.Mesh(pinGeo, pinMat), x - 17.5, 1.7, z - 21);
      }
    // The load plate: two long rails over the package edge, joined by a
    // hinge end and a tongue the lever catches.
    for (const side of [-1, 1])
      put(socket, block(5, 1.4, 54, metal), side * 21.5, 4.4, 0);
    put(socket, block(48, 1.4, 6, metal), 0, 4.4, -27);
    put(socket, block(30, 1.4, 6, metal), 0, 4.4, 27);
    put(socket, block(10, 1.2, 5, metal), 0, 4.4, 31.5);
    // Hinge pins at the far end, and the four screws holding the frame.
    for (const x of [-18, 18]) {
      const hinge = new T.Mesh(
        new T.CylinderGeometry(mm(1.6), mm(1.6), mm(8), 10),
        metal,
      );
      hinge.rotation.z = Math.PI / 2;
      put(socket, hinge, x, 4.6, -32);
    }
    for (const x of [-25, 25])
      for (const z of [-31, 31]) screw(socket, x, 3.6, z, 2.4);
    // The lever, down the right-hand side, its hook over the tongue.
    const leverCurve = new T.CatmullRomCurve3(
      [
        [27.5, 4.2, -30],
        [27.5, 4.2, 26],
        [24, 4.4, 32],
        [5, 4.6, 33],
      ].map(([x, y, z]) => new T.Vector3(...vector(x, y, z))),
    );
    socket.add(
      new T.Mesh(new T.TubeGeometry(leverCurve, 28, mm(1), 8, false), metal),
    );
    label(socket, 'LGA1851', vector(-12, 3.4, 33), mm(14), '#53595c');
    if (!fitted.processor) cover(36, 44);
  }
  add('socket', socket, sx, 2.4, sz);
  if (fitted.processor) {
    const cpu = new T.Group();
    if (!intel) {
      put(cpu, block(40, 1.5, 40, material('#244234', 0.2)));
      const ihs: [number, number][] = [
        [-18, -18],
        [-8, -18],
        [-8, -14],
        [8, -14],
        [8, -18],
        [18, -18],
        [18, -8],
        [14, -8],
        [14, 8],
        [18, 8],
        [18, 18],
        [8, 18],
        [8, 14],
        [-8, 14],
        [-8, 18],
        [-18, 18],
        [-18, 8],
        [-14, 8],
        [-14, -8],
        [-18, -8],
      ];
      put(cpu, plate(ihs, 2.2, metal), 0, 0.9, 0);
      label(cpu, 'AMD RYZEN', vector(0, 3.4, -3), mm(27), '#53585b');
      label(cpu, 'AM5', vector(0, 3.4, 6), mm(10), '#61676a');
    } else {
      // The 37.5 × 45 mm package, its long side down the board, under a
      // heat spreader with the loading plate's notches in its long edges.
      put(cpu, block(37.5, 1.5, 45, material('#244234', 0.2)));
      const ihs: [number, number][] = [
        [-15, -19],
        [15, -19],
        [15, -9],
        [17, -9],
        [17, 9],
        [15, 9],
        [15, 19],
        [-15, 19],
        [-15, 9],
        [-17, 9],
        [-17, -9],
        [-15, -9],
      ];
      put(cpu, plate(ihs, 2.2, metal), 0, 0.9, 0);
      label(cpu, 'intel CORE ULTRA 9', vector(0, 3.4, -4), mm(26), '#53585b');
      label(cpu, '285K', vector(0, 3.4, 6), mm(10), '#61676a');
    }
    // Marked so the tower can lift it off the board's assembly: installed, the
    // processor is a part of its own, in the Compute system.
    cpu.userData.processor = true;
    add('cpu', cpu, sx, 5.2, sz, [0, 2.6, 0]);
  }

  for (const x of [63, 73, 83, 93]) {
    const slot = buildSlot(material, mm(133), '#1d2023', {
      width: mm(6.5),
      height: mm(6),
      // The slot's key rib lines up with the module's key.
      notch: 0.5 - keyCenter('ddr5') / 133,
      latch: true,
      latchColor: '#34383b',
    });
    slot.rotation.y = Math.PI / 2;
    add('dimmslot', slot, x, 4, -58, [0, 1, 0]);
  }
  // The installed modules are the complete DDR5 model, stood on its contact
  // edge: its length runs along the slot, its component face toward +X. Two
  // go in the second slot of each channel, as the manual asks; four fill
  // every slot; modules that cannot seat leave the slots empty.
  const modules =
    fitted.memory === null
      ? []
      : fitted.memory === 'dimm4'
        ? [63, 73, 83, 93]
        : [73, 93];
  for (const x of modules) {
    const ram = new T.Group();
    const dimm = tools.assembly('dimm');
    dimm.scale.setScalar(6 / 22);
    dimm.quaternion.setFromRotationMatrix(
      new T.Matrix4().makeBasis(
        new T.Vector3(0, 0, 1),
        new T.Vector3(1, 0, 0),
        new T.Vector3(0, 1, 0),
      ),
    );
    ram.add(dimm);
    // Contact edge seated at the slot floor, 4 mm above the board.
    add('ram', ram, x, 4 + MODULE.height / 2, -58, [0, 2.2, 0]);
  }

  const vrm = new T.Group();
  for (let i = 0; i < 8; i++) {
    const x = -42 + i * 11;
    put(vrm, buildChoke(material, mm(8), mm(5)), x, 3.6, -117);
    put(vrm, buildChip(material, vector(6, 1.8, 6), 4), x, 2, -129);
    put(vrm, buildCapacitor(material, mm(2.8), mm(6), '#202326'), x, 4, -106);
  }
  for (let i = 0; i < 10; i++) {
    put(vrm, buildChoke(material, mm(7), mm(5)), -54, 3.6, -100 + i * 8.5);
    put(
      vrm,
      buildCapacitor(material, mm(2.6), mm(6), '#202326'),
      -44,
      4,
      -100 + i * 8.5,
    );
  }
  // Reserve individual VRM devices, preserving the empty L-shaped centre.
  for (const child of vrm.children)
    occupied.push(new T.Box3().setFromObject(child).expandByScalar(mm(1)));
  tools.add(name('cpuvrm'), vrm, [0, 0, 0], [0, 1.2, -0.6], 0);
  // Power-delivery heatsinks, in the maker's fin style: TUF's five angled
  // blades, a stack of thin slats, or a solid grooved block. All three stand
  // the same height, so the cooler clears every one.
  const topSink = new T.Group();
  const sideSink = new T.Group();
  if (design.fins === 'blades') {
    put(topSink, block(96, 5, 28), 0, 2.5, 0);
    for (let i = 0; i < 5; i++) {
      put(
        topSink,
        plate(
          [
            [-9, -14],
            [9, -14],
            [9, 10],
            [6, 14],
            [-9, 14],
          ],
          9,
        ),
        -38 + i * 19,
        5,
        0,
      );
      put(topSink, block(16, 0.7, 24, edge), -38 + i * 19, 14.5, 0);
    }
    put(sideSink, block(32, 5, 113), 0, 2.5, 0);
    for (let i = 0; i < 5; i++)
      put(sideSink, block(32, 10, 20), 0, 10, -45 + i * 23);
  } else if (design.fins === 'slats') {
    put(topSink, block(96, 5, 28), 0, 2.5, 0);
    for (let i = 0; i < 15; i++)
      put(topSink, block(2.2, 9.4, 26), -44 + i * 6.3, 9.7, 0);
    put(topSink, block(96, 0.8, 3, edge), 0, 14.6, 12);
    put(sideSink, block(32, 5, 113), 0, 2.5, 0);
    for (let i = 0; i < 14; i++)
      put(sideSink, block(30, 9.4, 2.2), 0, 9.7, -52 + i * 8);
    put(sideSink, block(3, 0.8, 113, edge), 14, 14.6, 0);
  } else {
    put(topSink, block(96, 14, 28), 0, 7, 0);
    for (let i = 0; i < 4; i++)
      put(topSink, block(94, 0.5, 1.2, edge), 0, 14.1, -9 + i * 6);
    put(sideSink, block(32, 14, 113), 0, 7, 0);
    for (let i = 0; i < 4; i++)
      put(sideSink, block(1.2, 0.5, 111, edge), -9 + i * 6, 14.1, 0);
  }
  add('vrmheatsink', topSink, 6, 7.8, -131, [0.4, 2.4, -0.8]);
  add('vrmheatsink', sideSink, -67, 7.8, -69, [-0.7, 2.4, -0.2]);

  const sink =
    chipsetSinks[
      design.chipset === 'square' ? 'square' : micro ? 'short' : design.chipset
    ];
  const chipset = new T.Group();
  put(chipset, block(28, 2, 28, material('#202326', 0.12)), sink.chip, 1, 0);
  put(chipset, plate(sink.outline, 5), 0, 4, 0);
  const graphic = new T.Group();
  branding(graphic, ...sink.marks, 9.35);
  put(chipset, graphic, sink.marksAt, 0, -2);
  screw(chipset, sink.screws[0], 10, -13, 2);
  screw(chipset, sink.screws[1], 10, 9, 2);
  add('chipset', chipset, sink.at[0], 1.2, sink.at[1], [0.6, 1.4, 0.6]);

  const controller = (
    id: string,
    text: string,
    x: number,
    z: number,
    size: number,
  ) => {
    const g = new T.Group();
    put(g, buildChip(material, vector(size, 2, size), 6, true));
    label(g, text, vector(0, 1.2, 0), mm(size * 0.8), '#7e8587');
    add(id, g, x, 2, z, [x < 0 ? -1 : 1, 1.2, 0.4]);
  };
  controller('uefi', 'UEFI', 102, 28, 7);
  controller('lan', 'LAN', -109, 30, 10);
  if (micro) controller('superio', 'IO', 86, 30, 11);
  else controller('superio', 'IO', 92, 135, 11);
  // The codec and its audio capacitors in their own corner; the micro-ATX
  // board fits one row of capacitors under it rather than three.
  const audio = new T.Group();
  const codecZ = micro ? -6 : -10;
  put(audio, buildChip(material, vector(12, 2, 12), 7, true), 0, 1, codecZ);
  for (let row = 0; row < (micro ? 1 : 3); row++)
    for (const x of [-5, 3])
      put(
        audio,
        buildCapacitor(material, mm(2.8), mm(7), '#a78b4c'),
        x,
        4,
        (micro ? 8 : 10) + row * 8,
      );
  label(audio, 'AUDIO', vector(0, 2.3, codecZ), mm(10), '#939991');
  add('audiocodec', audio, -108, 1, micro ? 68 : 119, [-1, 1.2, 0.6]);
  const battery = new T.Group();
  put(
    battery,
    new T.Mesh(new T.CylinderGeometry(mm(11), mm(11), mm(3), 32), dark),
  );
  put(
    battery,
    new T.Mesh(new T.CylinderGeometry(mm(9.8), mm(9.8), mm(2.8), 32), metal),
    0,
    1,
    0,
  );
  put(battery, block(4, 0.8, 4, metal), -8.5, 2.7, 0);
  label(battery, '+  CR2032', vector(0, 2.55, 0), mm(17), '#53595d');
  add('cmos', battery, micro ? -82 : -89, 3, micro ? 52 : 113, [-1.2, 1, 0.6]);

  for (const [i, z] of design.x16.entries()) {
    const primary = i === 0;
    const slot = buildSlot(material, mm(100), '#202326', {
      width: mm(7.5),
      height: mm(8),
      notch: 0.14,
      latch: true,
      armour: primary,
      latchColor: '#3a3e42',
      latchEnds: 'right',
    });
    add('pcie16', slot, -31, 5, z, [0, 1.1, 0]);
  }
  // Short slots: TUF's ×1 slots out by the rear edge, or a ×4 slot lined up
  // with the graphics card's.
  for (const { z, length } of design.short)
    add(
      'pcie1',
      buildSlot(material, mm(length), '#202326', {
        width: mm(6),
        height: mm(7),
        notch: 0.2,
      }),
      length > 20 ? -81 + length / 2 : -108,
      4.5,
      z,
      [0, 1.1, 0],
    );

  for (const [z, x, w, d] of micro
    ? microAtx.m2
    : [
        [11, -10, 122, 20],
        [114, 19, 174, 22],
      ]) {
    const socketM2 = new T.Group();
    // Connector spans the 22 mm width along Z, perpendicular to the drive.
    put(socketM2, block(4, 3, 22), -41, 0, 0);
    put(socketM2, block(1, 0.6, 19, pinMat), -39, 1.5, 0);
    screw(socketM2, 39, 2, 0, 2);
    add('m2slot', socketM2, x, 2.8, z, [0, 0.9, 0]);
    const drive = new T.Group();
    put(drive, pcb(vector(80, 1, 22), 'storage'));
    for (const chipX of [-24, 0, 24])
      put(drive, block(15, 1.4, 15, material('#1d2023', 0.12)), chipX, 1.2, 0);
    add('nvme', drive, x, 4.5, z, [0, 1.8, 0]);
    const cover = new T.Group();
    // Underside 7.2 mm including bevel; flash tops 6.4 mm.
    put(
      cover,
      plate(
        [
          [-w / 2, -d / 2],
          [w / 2 - 4, -d / 2],
          [w / 2, -d / 2 + 4],
          [w / 2, d / 2],
          [-w / 2 + 4, d / 2],
          [-w / 2, d / 2 - 4],
        ],
        4,
      ),
    );
    screw(cover, -w / 2 + 6, 4.8, 0);
    screw(cover, w / 2 - 6, 4.8, 0);
    if (z === 11)
      label(cover, 'M.2 PCIe 5.0', vector(-12, 4.4, -1), mm(48), '#8b9192');
    if (design.tuf)
      for (let j = 0; j < 4; j++) {
        const slash = block(6, 0.2, 1, edge);
        slash.rotation.y = -0.6;
        put(cover, slash, w / 2 - 18 - j * 4, 4.3, 2);
      }
    else put(cover, block(w - 14, 0.2, 1.4, edge), 0, 4.3, d / 2 - 3);
    add('m2heatsink', cover, x, 7.4, z, [0, 2.6, 0]);
  }

  // Female power sockets use recessed contacts rather than header posts.
  const power = (columns: number) => {
    const g = new T.Group();
    const pitch = 4.2;
    put(g, block(columns * pitch + 1, 8, 9.6));
    for (let x = 0; x < columns; x++)
      for (const z of [-2.1, 2.1]) {
        put(
          g,
          block(3.2, 0.2, 3.2, material('#060708', 0.1)),
          (x - (columns - 1) / 2) * pitch,
          4.15,
          z,
        );
        put(
          g,
          block(0.7, 0.22, 0.7, metal),
          (x - (columns - 1) / 2) * pitch,
          4.27,
          z,
        );
      }
    return g;
  };
  const atx = power(12);
  atx.rotation.y = Math.PI / 2;
  add('atx24', atx, 115, 5, -45, [1.4, 1, 0]);
  for (const x of [-73, -52]) add('eps8', power(4), x, 5, -145, [0, 1, -1.2]);
  for (let i = 0; i < 4; i++) {
    const sata = new T.Group();
    put(sata, block(13, 9, 7));
    put(sata, block(0.2, 4, 5, material('#080a0b', 0.1)), 6.6, 0, 0);
    put(sata, block(0.25, 0.6, 4, pinMat), 6.75, -1.2, 0);
    add('sataport', sata, 114, 5.5, 43 + i * 9, [1.4, 0.8, 0]);
  }
  for (const [x, count] of micro
    ? microAtx.frontheaders
    : [
        [-71, 5],
        [-27, 5],
        [19, 4],
        [76, 4],
      ])
    add(
      'frontheader',
      buildHeader(material, count, 2, mm(2.54), '#202326', mm(6)),
      x,
      4,
      micro ? microAtx.frontZ : 147,
      [0.3, 0.8, 1.3],
    );
  for (const [x, z] of micro
    ? microAtx.fanheaders
    : [
        [68, -141],
        [87, -141],
        [114, -90],
        [113, 95],
        [-49, 147],
        [48, 149],
      ])
    add(
      'mobofanheader',
      buildHeader(material, 4, 1, mm(2.54), '#292c2e', mm(6)),
      x,
      4,
      z,
      [0, 0.9, 0],
    );

  // Rear ports face outward (-X), under a roof clear of their metal shells.
  const io = new T.Group();
  put(io, block(1, 2, 151), -17, 1, 0);
  put(
    io,
    plate(
      [
        [-17, -76],
        [7, -76],
        [15, -65],
        [15, 72],
        [-17, 72],
      ],
      3,
    ),
    0,
    33,
    0,
  );
  put(io, block(2, 27, 144), 14, 18, 0);
  const ioArt = new T.Group();
  branding(ioArt, 107, 26, 0, true);
  put(io, ioArt, -1, 36.4, 4);

  /**
   * The connectors, as a board of this class carries them: Wi-Fi antenna
   * sockets, the BIOS flashback and clear-CMOS buttons, display outputs, USB-A
   * and USB-C, 2.5 GbE over two USB ports, and the audio jacks with an
   * optical output. They used to be nine identical USB blocks, which read as
   * nothing in particular from behind the case.
   *
   * Every face is on one plane, `FACE` millimetres out from the stack's back
   * wall and a few past the board edge, as on a real board, so the case's
   * I/O shield can sit flush against all of them. Each connector is built
   * mouth toward -X around its own centre; `z` runs along the stack and `y`
   * up off the board.
   */
  const FACE = -20;
  // The stack sits centred in the ATX aperture rather than hard against one
  // end of it.
  const STACK_SHIFT = 12;
  const steelShell = material('#8d969b', 0.88, 0.27);
  const darkMouth = material('#07090a', 0.1, 0.85);
  const rearPorts: T.Object3D[] = [];
  const connector = (
    z: number,
    y: number,
    depth: number,
    build: (g: T.Group) => void,
  ) => {
    const g = new T.Group();
    build(g);
    rearPorts.push(g);
    put(io, g, FACE + depth / 2, y, z + STACK_SHIFT);
    return g;
  };
  /** A shell with a dark mouth and a tongue, facing -X. */
  const jack = (
    z: number,
    y: number,
    w: number,
    h: number,
    depth: number,
    tongue: string,
  ) =>
    connector(z, y, depth, (g) => {
      put(g, new T.Mesh(new T.BoxGeometry(...vector(depth, h, w)), steelShell));
      put(
        g,
        new T.Mesh(
          new T.BoxGeometry(...vector(depth * 0.4, h * 0.72, w * 0.84)),
          darkMouth,
        ),
        -depth * 0.31,
      );
      put(
        g,
        new T.Mesh(
          new T.BoxGeometry(...vector(depth * 0.36, h * 0.2, w * 0.62)),
          material(tongue, 0.3, 0.6),
        ),
        -depth * 0.33,
        -h * 0.1,
      );
    });
  const usbA = (z: number, y: number) => jack(z, y, 14.5, 7, 14, '#2a4fa0');
  const usbC = (z: number, y: number) => jack(z, y, 9, 3.6, 9, '#1a1d1f');
  // Wi-Fi: two threaded gold posts on a plastic base.
  connector(-68, 17, 9, (g) => {
    put(g, block(4, 26, 8, material('#16191b', 0.1, 0.6)), 2.5);
    for (const y of [-6.5, 6.5]) {
      const post = new T.Mesh(
        new T.CylinderGeometry(mm(3.1), mm(3.1), mm(9), 16),
        material('#c9a456', 0.9, 0.3),
      );
      post.rotation.z = Math.PI / 2;
      put(g, post, -1.5, y);
      const pin = new T.Mesh(
        new T.CylinderGeometry(mm(1.1), mm(1.1), mm(1), 10),
        darkMouth,
      );
      pin.rotation.z = Math.PI / 2;
      put(g, pin, -6.1, y);
    }
  });
  // BIOS flashback and clear CMOS: two small buttons in one housing.
  connector(-55, 12, 8, (g) => {
    put(g, block(8, 17, 9, material('#16191b', 0.1, 0.6)));
    for (const [y, colour] of [
      [4, '#d0d4d6'],
      [-4, '#b8342c'],
    ] as const)
      put(g, block(2, 5, 5, material(colour, 0.1, 0.5)), -4.8, y);
  });
  // Display outputs: DisplayPort over HDMI, each keyed differently.
  jack(-41, 8, 15, 6, 12, '#101213');
  jack(-41, 18, 16, 6.5, 12, '#101213');
  // Two columns of USB-A with a USB-C on top.
  usbA(-24, 6);
  usbA(-24, 15);
  usbC(-24, 23);
  usbA(-6, 6);
  usbA(-6, 15);
  usbC(-6, 23);
  // 2.5 GbE over two USB-A: the jack, and its two link lights.
  usbA(12, 6);
  usbA(12, 15);
  connector(12, 26, 21, (g) => {
    put(g, new T.Mesh(new T.BoxGeometry(...vector(21, 13, 16)), steelShell));
    put(g, block(8, 9, 12, darkMouth), -7);
    for (const [z, colour] of [
      [-5.5, '#3fd46a'],
      [5.5, '#f2a93b'],
    ] as const)
      put(g, block(0.6, 2, 3, glowMaterial(colour, 1.2)), -10.6, 5.2, z);
  });
  // Two more USB-A and a second USB-C.
  usbA(30, 6);
  usbA(30, 15);
  usbC(30, 23);
  // Audio: line out and mic in, colour-coded, over an optical output.
  connector(51, 15, 14, (g) => {
    put(g, block(14, 26, 13, material('#16191b', 0.1, 0.6)));
    for (const [y, colour] of [
      [7, '#6cc04a'],
      [-2, '#e07aa6'],
    ] as const) {
      const ring = new T.Mesh(
        new T.CylinderGeometry(mm(3.4), mm(3.4), mm(1), 20),
        material(colour, 0.1, 0.5),
      );
      ring.rotation.z = Math.PI / 2;
      put(g, ring, -7.2, y);
      const hole = new T.Mesh(
        new T.CylinderGeometry(mm(1.8), mm(1.8), mm(1.2), 16),
        darkMouth,
      );
      hole.rotation.z = Math.PI / 2;
      put(g, hole, -7.4, y);
    }
    put(g, block(1, 5, 7, material('#2a2d30', 0.1, 0.5)), -7.2, -9);
  });
  add('reario', io, -104, 1.2, -76, [-2.2, 1.2, 0]);
  // Where each connector shell is, in the board's own frame. The meshes are
  // merged once the build finishes, so this is the last moment they can be
  // told apart; the case cuts its I/O shield from these.
  io.updateWorldMatrix(true, true);
  root.userData.rearPorts = rearPorts.map((port) =>
    new T.Box3().setFromObject(port),
  );

  // Derive passive keep-outs from actual component bounds, including sockets,
  // connectors and screw holes. This stays correct when large parts move.
  const free = (x: number, z: number, pad = 1) => {
    if (Math.abs(x) > 119 - pad || z < -150 + pad || z > bottom - 2.5 - pad)
      return false;
    return !occupied.some(
      (b) =>
        x + pad > b.min.x * 22 &&
        x - pad < b.max.x * 22 &&
        z + pad > b.min.z * 22 &&
        z - pad < b.max.z * 22,
    );
  };
  for (const [x, z] of [
    [104, -118],
    [104, -108],
    [104, -98],
    [69, 95],
    [87, 95],
    [105, 124],
  ]) {
    if (!free(x, z, 3)) continue;
    const p = add(
      'moboboard',
      buildCapacitor(material, mm(2.8), mm(6), '#25272a'),
      x,
      4,
      z,
      [0.8, 1.4, 0.4],
    );
    occupied.push(new T.Box3().setFromObject(p.object).expandByScalar(mm(1)));
  }
  const passives = new T.Group();
  for (let row = 0; row < 76; row++)
    for (let col = 0; col < 59; col++) {
      const n = (row * 73 + col * 137) % 17;
      if (n > 10) continue;
      const x = -116 + col * 4,
        z = -148 + row * 4;
      if (!free(x, z, 1.6)) continue;
      put(
        passives,
        block(
          1.7,
          0.8,
          0.9,
          material(n % 3 ? '#777368' : '#25272a', 0.15, 0.8),
        ),
        x,
        1.35,
        z,
      );
      for (const side of [-1, 1])
        put(passives, block(0.4, 0.85, 1, metal), x + side, 1.35, z);
    }
  // Soldered passives stay attached to the PCB in the inventory as well.
  board.add(passives);
  add('moboboard', board, 0, 0, 0, [0, -1.6, 0]);
}
