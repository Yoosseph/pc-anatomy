import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { NotebookLevel } from './notebook-levels.ts';
import {
  notebookKit,
  notebookSpecs,
  type NotebookSystem,
} from './notebook-kit.ts';
import { buildNotebookPorts } from './notebook-chassis.ts';
import { buildNvme } from './nvme.ts';

export function buildNotebookBoard(system: NotebookSystem, tools: ModelTools) {
  const mac = system === 'macbook',
    level = mac ? 'macboard' : 'legionboard';
  const spec = notebookSpecs[system],
    { put, slab, board, chip, screw, ribbon, cylinder, v } = notebookKit(tools);
  const add = (
    suffix: string,
    object: T.Object3D,
    at: [number, number, number],
    delta: [number, number, number],
  ) => tools.add(`${level}-${suffix}`, object, v(...at), v(...delta));
  // Mac's two fan wells are cut through the PCB. Legion's narrow central board
  // leaves room for its separate thermal blowers and cable-connected I/O.
  const outline: [number, number][] = mac
    ? [
        [-149, -58],
        [149, -58],
        [149, 56],
        [76, 56],
        [76, 64],
        [-71, 64],
        [-71, 56],
        [-149, 56],
      ]
    : [
        [-102, -66],
        [102, -66],
        [102, -38],
        [145, -38],
        [145, 65],
        [65, 65],
        [65, 85],
        [-72, 85],
        [-72, 64],
        [-144, 64],
        [-144, -31],
        [-102, -31],
      ];
  const pcb = new T.Group();
  pcb.add(
    board(
      outline,
      mac
        ? [-spec.fanX, spec.fanX].map((x) => ({
            x,
            z: -38,
            w: 64,
            d: 64,
            r: 31.5,
          }))
        : [],
    ),
  );
  const mounting = mac
    ? [
        [-144, -51],
        [144, -51],
        [-144, 48],
        [144, 48],
        [-63, 59],
        [65, 59],
      ]
    : [
        [-95, -58],
        [95, -58],
        [-138, 57],
        [138, 57],
        [-66, 65],
        [62, 65],
      ];
  for (const [x, z] of mounting) {
    put(pcb, cylinder(2.8, 0.35, '#d4b46b'), [x, 0.8, z]);
    put(pcb, cylinder(1.2, 0.4, '#152027'), [x, 1.02, z]);
  }
  add('pcb', pcb, [0, 0, 0], [0, -35, 0]);
  if (mac) {
    const soc = new T.Group();
    put(soc, slab([47, 0.9, 39], '#33413c', 0.15), [0, 0, 0]);
    put(soc, slab([23, 0.8, 28], '#9babb8', 0.82), [0, 0.85, 0]);
    for (const x of [-17, 17])
      put(soc, chip('DRAM', [10, 1.15, 30]), [x, 0.95, 0]);
    tools.label(soc, 'M1 PRO', v(0, 1.32, 0), 0.75, '#24333d');
    for (let i = 0; i < 12; i++)
      put(soc, slab([0.8, 0.5, 1.1], '#9e967f'), [-21 + i * 3.8, 0.7, 17.5]);
    tools.add('m1pro', soc, v(0, 1.4, -3), v(0, 55, -15));
  } else {
    for (const [id, name, x] of [
      ['legioncpu', 'RYZEN 7', -36],
      ['legiongpu', 'RTX 3060', 32],
    ] as const) {
      const packageGroup = new T.Group();
      put(packageGroup, slab([35, 0.8, 32], '#24443c', 0.16), [0, 0, 0]);
      put(
        packageGroup,
        slab([id === 'legioncpu' ? 19 : 16, 0.9, 19], '#8b9aa9', 0.85),
        [0, 0.9, 0],
      );
      tools.label(packageGroup, name, v(0, 1.4, 0), 0.74, '#263641');
      for (let i = 0; i < 10; i++)
        put(packageGroup, slab([0.75, 0.4, 1.2], '#c2bca6'), [
          -15 + i * 3.3,
          0.5,
          14,
        ]);
      tools.add(id, packageGroup, v(x, 1.4, -1), v(x * 0.45, 55, -20));
    }
    for (let i = 0; i < 2; i++)
      tools.add(
        'legionmemory',
        tools.assembly('legionmemory'),
        v(-13, 3, 31.5 + i * 33),
        v(-45, 65 + i * 25, 40),
      );
    const sockets = new T.Group();
    for (const z of [31.5, 64.5]) {
      put(sockets, slab([72, 2.1, 3], '#d4cbbc', 0.1), [-13, 0, z + 15.3]);
      put(sockets, slab([70, 0.35, 0.7], '#423d35'), [-13, 0.8, z + 14.6]);
      for (const x of [-50, 24]) {
        put(sockets, slab([2.2, 2.2, 14], '#a5afb6', 0.8), [x, 0, z + 4]);
        put(sockets, screw(1.4), [x, 1.4, z + 8]);
      }
    }
    add('sockets', sockets, [0, 2.5, 0], [0, 25, 20]);
    for (const x of [7, 57])
      for (let i = 0; i < 3; i++)
        add(
          'vram',
          chip('G6', [10, 1.2, 8]),
          [x, 1.7, -14 + i * 13],
          [55, 40, -10],
        );
  }
  if (mac)
    tools.add(
      'macstorage',
      tools.assembly('macstorage'),
      v(0, 1.2, 37),
      v(30, 45, 40),
    );
  else {
    const drive = new T.Group(),
      storageModule = tools.assembly('legionstorage');
    storageModule.rotation.y = Math.PI / 2;
    drive.add(storageModule);
    tools.add('legionstorage', drive, v(123, 2.2, 27), v(55, 60, 35));
  }
  const power = new T.Group();
  const phases = mac ? 8 : 10;
  for (let i = 0; i < phases; i++) {
    const x = (i - (phases - 1) / 2) * 10;
    put(power, slab([6, 2.4, 5], '#6d7783', 0.5), [x, 0, 0]);
    put(power, slab([4.8, 1.0, 3.2], '#151e28', 0.1), [x, 0, 6]);
    for (const dx of [-2, 2])
      put(power, slab([1.6, 1, 2.5], '#b0a991', 0.15), [x + dx, 0, 10]);
  }
  add('power', power, [mac ? 0 : -20, 2, -49], [0, 35, -40]);
  const ports = buildNotebookPorts(system, tools);
  ports.position.z = v(0, 0, -spec.boardZ)[2];
  const portsWrapper = new T.Group();
  portsWrapper.add(ports);
  add('ports', portsWrapper, [0, mac ? 3.5 : 4, 0], [0, 35, 0]);
  const io = new T.Group();
  for (const x of [-1, 1]) {
    put(
      io,
      board([
        [-8, -50],
        [8, -50],
        [8, 48],
        [-8, 48],
      ]),
      [x * (spec.width / 2 - 13), 0, -spec.boardZ - 42],
    );
    put(
      io,
      ribbon(10, 23),
      [x * (spec.width / 2 - 29), 1, -spec.boardZ - 19],
      [0, Math.PI / 2, 0],
    );
  }
  add('io', io, [0, 0.3, 0], [30, 20, 0]);
  const wireless = new T.Group();
  put(
    wireless,
    slab([mac ? 15 : 22, 0.7, mac ? 15 : 30], '#2f4f46', 0.1),
    [0, 0, 0],
  );
  put(
    wireless,
    chip(
      mac ? 'RADIO' : 'Wi-Fi 6',
      [mac ? 14 : 20, 1.0, mac ? 14 : 23],
      '#939c9e',
    ),
    [0, 0.9, 0],
  );
  for (const x of [-5, 5]) {
    put(wireless, cylinder(1.1, 0.5, '#d3b56c'), [x, 1.5, -10]);
  }
  add(
    'wireless',
    wireless,
    [mac ? -94 : -113, 1.4, mac ? 30 : -8],
    [-50, 45, 30],
  );
  // Representative surface-mount population; deterministic and kept outside
  // the measured package / socket regions instead of scattering through them.
  const passives = new T.Group();
  const sites = mac
    ? [
        [-59, -12],
        [61, -10],
        [-60, 12],
        [60, 13],
        [-35, 52],
        [35, 52],
      ]
    : [
        [-78, 5],
        [-75, -24],
        [80, 24],
        [83, 50],
        [-76, 44],
        [-25, -27],
        [15, -26],
      ];
  for (const [cx, cz] of sites)
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4; c++) {
        const x = cx + (c - 1.5) * 3.1,
          z = cz + (r - 1) * 3.2;
        put(passives, slab([1.7, 0.8, 1.1], '#b4aa8a', 0.12), [x, 0, z]);
        for (const dx of [-0.8, 0.8])
          put(passives, slab([0.4, 0.82, 1.13], '#b6c0c3', 0.85), [
            x + dx,
            0,
            z,
          ]);
      }
  add('passives', passives, [0, 1.05, 0], [0, 35, 0]);
  const fasteners = new T.Group();
  for (const [x, z] of mounting) put(fasteners, screw(1.6), [x, 0, z]);
  add('fasteners', fasteners, [0, 1.6, 0], [0, 80, 0]);
}

export function buildNotebookCooling(
  system: NotebookSystem,
  tools: ModelTools,
) {
  const spec = notebookSpecs[system],
    mac = system === 'macbook',
    level = mac ? 'maccooling' : 'legioncooling';
  const { put, slab, plate, cylinder, tube, screw, v, mm } = notebookKit(tools);
  const fans = new T.Group(),
    housing = new T.Group(),
    fixings = new T.Group();
  for (const side of [-1, 1]) {
    const x = side * spec.fanX,
      z = -13,
      radius = mac ? 27 : 29;
    const rotor = new T.Group();
    rotor.add(cylinder(radius - 1, 0.7, '#1d252e'));
    put(rotor, cylinder(8, 3, '#85939c'), [0, 1.4, 0]);
    const bladeGeometry = new T.BoxGeometry(mm(0.5), mm(3.6), mm(15));
    const blades: T.BufferGeometry[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = (i * Math.PI * 2) / 50;
      const matrix = new T.Matrix4().compose(
        new T.Vector3(...v(Math.sin(angle) * 18, 1.6, Math.cos(angle) * 18)),
        new T.Quaternion().setFromEuler(
          new T.Euler(0, -angle + side * 0.35, 0),
        ),
        new T.Vector3(1, 1, 1),
      );
      blades.push(bladeGeometry.clone().applyMatrix4(matrix));
    }
    const impeller = new T.Mesh(
      mergeGeometries(blades)!,
      tools.material('#49545f', 0.45),
    );
    blades.forEach((geometry) => geometry.dispose());
    bladeGeometry.dispose();
    impeller.userData.spinRate = side * 6;
    rotor.add(impeller);
    put(fans, rotor, [x, 0, z]);
    const shell = new T.Group();
    // A real annular inlet leaves the impeller visible. The rectangular duct
    // continues to the rear exhaust, with a lateral outlet on the Legion.
    put(
      shell,
      plate(radius * 2 + 8, radius * 2 + 8, 0.6, 8, '#242c35', [
        { x: 0, z: 0, w: radius * 1.58, d: radius * 1.58, r: radius * 0.79 },
      ]),
      [0, 4.2, 0],
    );
    const wall = new T.Mesh(
      new T.CylinderGeometry(
        mm(radius + 2),
        mm(radius + 2),
        mm(4),
        56,
        1,
        true,
      ),
      tools.material('#303a45', 0.25),
    );
    put(shell, wall, [0, 1.9, 0]);
    put(shell, slab([radius * 2, 0.6, 17], '#222b34'), [0, 2, -radius - 5]);
    put(housing, shell, [x, 0, z]);
    for (const dx of [-radius + 2, radius - 2])
      put(fixings, screw(1.5), [x + dx, 5.2, z + radius - 1]);
  }
  tools.add(`${level}-fans`, fans, v(0, 0, 0), v(0, 55, 0));
  tools.add(`${level}-housing`, housing, v(0, 0, 0), v(0, 80, 0));
  const pipes = new T.Group();
  const routes = mac
    ? [
        [
          [-105, 0, -34],
          [-64, 0, -32],
          [-38, 0, 17],
          [0, 0, 29],
          [38, 0, 17],
          [64, 0, -32],
          [105, 0, -34],
        ],
      ]
    : [
        [
          [-128, 0, -35],
          [-84, 0, -36],
          [-36, 0, 18],
          [32, 0, 18],
          [84, 0, -36],
          [128, 0, -35],
        ],
        [
          [-128, 0, -28],
          [-82, 0, -25],
          [-36, 0, 26],
          [32, 0, 26],
          [88, 0, -26],
          [128, 0, -28],
        ],
        [
          [-157, 0, -9],
          [-118, 0, 10],
          [-36, 0, 9],
          [32, 0, 9],
          [118, 0, 10],
          [157, 0, -9],
        ],
      ];
  for (const route of routes)
    pipes.add(
      tube(
        route as [number, number, number][],
        mac ? 3.2 : 2.3,
        mac ? '#414c58' : '#8b6745',
        0.48,
      ),
    );
  tools.add(`${level}-pipes`, pipes, v(0, mac ? 0.4 : 0.8, 0), v(0, 65, 0));
  const fins = new T.Group();
  for (const x of [-spec.fanX, spec.fanX])
    for (let i = 0; i < 48; i++)
      put(fins, slab([0.28, mac ? 4.8 : 8, 14], '#828d98', 0.78, 0), [
        x - 25 + i * 1.06,
        1,
        -47,
      ]);
  if (!mac)
    for (const x of [-165, 165])
      for (let i = 0; i < 27; i++)
        put(fins, slab([13, 7, 0.3], '#687682', 0.78, 0), [
          x,
          1,
          -29 + i * 1.4,
        ]);
  tools.add(`${level}-fins`, fins, v(0, 0, 0), v(0, 15, -50));
  const plates = new T.Group(),
    pads = new T.Group();
  for (const [x, z] of mac
    ? [[0, 22]]
    : [
        [-36, 18],
        [32, 18],
      ]) {
    put(
      plates,
      plate(mac ? 49 : 35, mac ? 40 : 32, 1.0, 2, mac ? '#505a65' : '#a47e56'),
      [x, 0, z],
    );
    put(pads, slab([mac ? 24 : 20, 0.35, 20], '#a6b7bf', 0.1), [x, -0.8, z]);
    for (const dx of [-1, 1])
      for (const dz of [-1, 1])
        put(fixings, screw(1.3), [
          x + dx * (mac ? 21 : 15),
          1,
          z + dz * (mac ? 17 : 13),
        ]);
  }
  tools.add(`${level}-plates`, plates, v(0, -0.3, 0), v(0, 35, 0));
  tools.add(`${level}-pads`, pads, v(0, -0.3, 0), v(0, 20, 15));
  tools.add(`${level}-fasteners`, fixings, v(0, 0, 0), v(0, 100, 0));
  tools.airflow(
    [-spec.fanX, spec.fanX].map((x) => ({
      path: [v(x, -12, -5), v(x, 2, -13), v(x, 2, -45), v(x, 2, -59)],
      kind: 'through' as const,
      size: mm(3.2),
      count: 8,
    })),
  );
}

export function buildNotebookBattery(
  system: NotebookSystem,
  tools: ModelTools,
) {
  const mac = system === 'macbook',
    level = mac ? 'macbattery' : 'legionbattery',
    { put, slab, plate, chip, ribbon, v } = notebookKit(tools);
  const cells = new T.Group();
  const positions = mac
    ? [-76, 0, 76].flatMap((x) =>
        [-15, 15].map((z) => ({ x, z, w: 70, d: 27 })),
      )
    : [-90, -30, 30, 90].map((x) => ({ x, z: 0, w: 58, d: 67 }));
  for (const p of positions) {
    put(cells, plate(p.w, p.d, 5.2, mac ? 4 : 2, '#252c34'), [p.x, 0, p.z]);
    put(cells, slab([p.w - 3, 0.1, p.d - 3], '#373f49', 0.06, 2), [
      p.x,
      2.72,
      p.z,
    ]);
    for (const side of [-1, 1])
      put(cells, slab([p.w - 4, 0.16, 1.1], '#71777b', 0.5), [
        p.x,
        2.82,
        p.z + side * (p.d / 2 - 1.5),
      ]);
    tools.label(
      cells,
      'Li-ion',
      v(p.x, 2.85, p.z),
      (p.w / 20) * 0.42,
      '#8a969f',
    );
  }
  tools.add(`${level}-cells`, cells, v(0, 0, 0), v(0, 35, 0));
  const carrier = new T.Group();
  carrier.add(plate(mac ? 230 : 250, mac ? 64 : 73, 0.8, 3, '#192128'));
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      put(carrier, slab([12, 1.0, 7], '#4b5761'), [
        x * (mac ? 109 : 119),
        0,
        z * (mac ? 30 : 35),
      ]);
  tools.add(`${level}-carrier`, carrier, v(0, -3.25, 0), v(0, -20, 0));
  const controller = new T.Group();
  controller.add(tools.pcb(v(mac ? 54 : 140, 1, 8)));
  for (let i = 0; i < (mac ? 3 : 7); i++)
    put(controller, chip('', [6, 1, 4]), [-(mac ? 20 : 60) + i * 10, 1, 0]);
  tools.add(
    `${level}-controller`,
    controller,
    v(0, 0, mac ? -38 : -43),
    v(0, 25, -25),
  );
  const connector = new T.Group();
  put(
    connector,
    ribbon(mac ? 11 : 9, 23, mac ? '#35333a' : '#a47552'),
    [0, 0, 0],
  );
  put(connector, slab([13, 3, 5], '#b7b5a4', 0.1), [0, 0, -12]);
  tools.add(
    `${level}-connector`,
    connector,
    v(0, 1, mac ? -49 : -55),
    v(0, 30, -45),
  );
}

export const SODIMM = {
  width: 69.6,
  depth: 30,
  thickness: 1.2,
  contacts: 260,
  pitch: 0.5,
  keyX: 3.5,
  keyWidth: 1,
} as const;

/** Representative wire-bond FBGA, all dimensions in the common notebook frame. */
export function buildNotebookPackage(tools: ModelTools) {
  const { put, slab, plate, tube, v, mm } = notebookKit(tools);
  tools.add(
    'legionpackage-substrate',
    plate(7.5, 11, 0.25, 0.18, '#324d41'),
    v(0, 0, 0),
    v(0, -7, 0),
  );
  const balls = new T.Group();
  for (let row = 0; row < 13; row++)
    for (const col of [-3, -2, -1, 1, 2, 3]) {
      const ball = new T.Mesh(
        new T.SphereGeometry(mm(0.14), 6, 4),
        tools.material('#a9b2bc', 0.8, 0.25),
      );
      put(balls, ball, [col * 0.8, -0.25, (row - 6) * 0.8]);
    }
  tools.add('legionpackage-balls', balls, v(0, 0, 0), v(0, -12, 0));
  tools.add(
    'legiondram',
    slab([4.6, 0.12, 6.6], '#7194aa', 0.75, 0.03),
    v(0, 0.24, 0),
    v(0, 9, 0),
  );
  const wires = new T.Group();
  for (const side of [-1, 1])
    for (let i = 0; i < 14; i++)
      wires.add(
        tube(
          [
            [side * 2.1, 0.3, -2.9 + i * 0.45],
            [side * 2.8, 0.5, -3.0 + i * 0.47],
            [side * 3.3, 0.15, -3.1 + i * 0.48],
          ],
          0.025,
          '#bfa56d',
        ),
      );
  tools.add('legionpackage-wires', wires, v(0, 0, 0), v(0, 13, 0));
  // The cap is a cover in the package view; it exists at zero, then lifts clear.
  tools.add(
    'legionpackage-mold',
    plate(7.4, 10.8, 0.42, 0.2, '#171e27'),
    v(0, 0.48, 0),
    v(0, 18, 0),
  );
}
export function buildNotebookMemory(tools: ModelTools) {
  const { put, slab, board, chip, v } = notebookKit(tools);
  const pcb = board([
    [-34.8, -15],
    [34.8, -15],
    [34.8, 15],
    [4, 15],
    [4, 12.1],
    [3, 12.1],
    [3, 15],
    [-34.8, 15],
  ]);
  tools.add('legionmemory-board', pcb, v(0, 0, 0), v(0, -22, 0));
  for (const face of [-1, 1])
    for (const x of [-26, -9, 9, 26]) {
      const group = tools.assembly('legionpackage');
      if (face < 0) group.rotation.z = Math.PI;
      tools.add(
        'legionpackage',
        group,
        v(x, face * 1.1, -1.5),
        v(x * 0.5, face * 30, -5),
      );
    }
  const contacts = new T.Group();
  for (const face of [-1, 1])
    for (let i = 0; i < 130; i++) {
      const x = i < 72 ? -33.1 + i * 0.5 : 4.65 + (i - 72) * 0.5;
      put(contacts, slab([0.32, 0.055, 2.7], '#c6a967', 0.9, 0), [
        x,
        face * 0.635,
        13.55,
      ]);
    }
  contacts.userData.contactCount = 260;
  tools.add('legionmemory-contacts', contacts, v(0, 0, 0), v(0, 5, 18));
  tools.add(
    'legionmemory-spd',
    chip('SPD', [4.5, 0.9, 4]),
    v(0, 1.1, -8),
    v(0, 25, -20),
  );
  const decoupling = new T.Group();
  for (const face of [-1, 1])
    for (let i = 0; i < 18; i++)
      put(decoupling, slab([0.7, 0.5, 1.2], '#b6a98a', 0.15), [
        -30 + i * 3.5,
        face * 0.9,
        -12,
      ]);
  tools.add('legionmemory-passives', decoupling, v(0, 0, 0), v(0, 18, -14));
}

/** Reuse the desktop's detailed M.2 construction at one uniform unit conversion. */
export function buildNotebookStorage(level: NotebookLevel, tools: ModelTools) {
  const { put, slab, chip, v } = notebookKit(tools);
  if (level === 'legionstorage') {
    const mapping: Record<string, string> = {
      nvmeboard: 'legionstorage-substrate',
      nvmecontroller: 'legionstorage-controller',
      nvmenand: 'legionstorage-nand',
      nvmedram: 'legionstorage-cache',
      nvmecontacts: 'legionstorage-contacts',
      nvmefastener: 'legionstorage-fastener',
    };
    // buildNvme uses 8 mm/unit. Bake the uniform conversion into each piece's
    // geometry wrapper so add() retains truthful bounds and inventory sizing.
    buildNvme(
      {
        ...tools,
        add: (id, object, pos, delta, reveal) => {
          const scaled = new T.Group();
          object.scale.multiplyScalar(0.4);
          scaled.add(object);
          return tools.add(
            mapping[id],
            scaled,
            pos.map((n) => n * 0.4) as [number, number, number],
            delta,
            reveal,
          );
        },
      },
      new T.Group(),
    );
    return;
  }
  // A shared local origin keeps the NAND packages on the actual Mac board.
  // There is no synthetic removable PCB underneath these soldered packages.
  const substrate = new T.Group();
  for (const x of [-62, 62])
    put(substrate, slab([20, 0.15, 25], '#243b35', 0.12), [x, 0, 0]);
  tools.add('macstorage-substrate', substrate, v(0, 0, 0), v(0, -12, 0));
  const nand = new T.Group();
  for (const x of [-62, 62]) put(nand, chip('NAND', [17, 1.15, 22]), [x, 0, 0]);
  tools.add('macstorage-nand', nand, v(0, 0.7, 0), v(0, 35, 0));
  const link = new T.Group();
  for (const side of [-1, 1])
    for (let i = 0; i < 8; i++)
      put(link, slab([28, 0.05, 0.15], '#648d7b', 0.3), [
        side * 36,
        -0.02,
        -5 + i * 1.3,
      ]);
  tools.add('macstorage-link', link, v(0, 0.1, 0), v(0, 15, 0));
}
