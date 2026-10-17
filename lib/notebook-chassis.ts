import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import { plateWithHoles } from './chassis.ts';
import {
  notebookKit,
  notebookSpecs,
  type NotebookSystem,
  type Opening,
} from './notebook-kit.ts';

type PortKind =
  | 'usba'
  | 'usbc'
  | 'hdmi'
  | 'ethernet'
  | 'audio'
  | 'power'
  | 'magsafe'
  | 'sd';
export type NotebookPort = {
  kind: PortKind;
  edge: 'left' | 'right' | 'rear';
  at: number;
};
export const notebookPorts: Record<NotebookSystem, readonly NotebookPort[]> = {
  legion: [
    { kind: 'usbc', edge: 'left', at: -28 },
    { kind: 'audio', edge: 'left', at: -8 },
    { kind: 'usba', edge: 'right', at: -27 },
    { kind: 'ethernet', edge: 'rear', at: -91 },
    { kind: 'usbc', edge: 'rear', at: -61 },
    { kind: 'usba', edge: 'rear', at: -34 },
    { kind: 'usba', edge: 'rear', at: -13 },
    { kind: 'hdmi', edge: 'rear', at: 20 },
    { kind: 'usba', edge: 'rear', at: 52 },
    { kind: 'power', edge: 'rear', at: 83 },
  ],
  macbook: [
    { kind: 'magsafe', edge: 'left', at: -72 },
    { kind: 'usbc', edge: 'left', at: -42 },
    { kind: 'usbc', edge: 'left', at: -23 },
    { kind: 'audio', edge: 'left', at: 3 },
    { kind: 'hdmi', edge: 'right', at: -70 },
    { kind: 'usbc', edge: 'right', at: -40 },
    { kind: 'sd', edge: 'right', at: -3 },
  ],
};
export const notebookPortSize: Record<PortKind, [number, number, number]> = {
  usba: [14, 6.5, 12],
  usbc: [9.2, 3.6, 9],
  hdmi: [15.5, 5.2, 12],
  ethernet: [16, 11.5, 17],
  audio: [5, 5, 9],
  power: [13, 6, 11],
  magsafe: [17, 3.2, 8],
  sd: [25, 2.3, 20],
};

/** Physical connector openings and their contents share this one specification. */
export function buildNotebookPorts(system: NotebookSystem, tools: ModelTools) {
  const { put, slab, plate, mm } = notebookKit(tools);
  const spec = notebookSpecs[system],
    group = new T.Group();
  for (const port of notebookPorts[system]) {
    const [w, h, d] = notebookPortSize[port.kind];
    const connector = new T.Group();
    const face = plate(w, h, 0.5, Math.min(h / 2, 1), '#9da6ae', [
      {
        x: 0,
        z: 0,
        w: w - 1.1,
        d: h - 1.1,
        r: port.kind === 'usbc' ? 1.2 : 0.3,
      },
    ]);
    put(connector, face, [0, 0, d / 2], [Math.PI / 2, 0, 0]);
    put(connector, slab([w - 1.1, h - 1.1, 0.6], '#080b10', 0), [
      0,
      0,
      d / 2 - 2.5,
    ]);
    put(connector, slab([w, 0.5, d], '#7e8994', 0.8), [0, -h / 2, 0]);
    for (const side of [-1, 1])
      put(connector, slab([0.5, h, d], '#7e8994', 0.8), [(side * w) / 2, 0, 0]);
    const tongue =
      port.kind === 'usba' ||
      port.kind === 'usbc' ||
      port.kind === 'power' ||
      port.kind === 'magsafe';
    if (tongue) {
      put(
        connector,
        slab(
          [w - 2.6, port.kind === 'usba' ? 1.2 : 0.65, d - 2],
          port.kind === 'power' ? '#d6af4b' : '#26353e',
          0.1,
        ),
        [0, port.kind === 'usba' ? -0.8 : 0, 0],
      );
      const contacts =
        port.kind === 'magsafe' ? 5 : port.kind === 'usba' ? 4 : 8;
      for (let i = 0; i < contacts; i++)
        put(connector, slab([0.35, 0.15, 1.4], '#ccb77a', 0.85), [
          ((i - (contacts - 1) / 2) * (w - 3)) / contacts,
          port.kind === 'usba' ? -0.1 : 0.42,
          d / 2 - 2,
        ]);
    }
    if (port.kind === 'ethernet') {
      for (let i = 0; i < 8; i++)
        put(connector, slab([0.4, 0.4, 4], '#c8b479', 0.9), [
          -4.9 + i * 1.4,
          -3,
          d / 2 - 3,
        ]);
      put(connector, slab([5, 1, 3], '#262c35'), [0, h / 2 - 1, d / 2 - 1]);
    }
    if (port.kind === 'audio') {
      const rim = new T.Mesh(
        new T.TorusGeometry(mm(1.85), mm(0.5), 8, 20),
        tools.material('#9da6ae', 0.85),
      );
      put(connector, rim, [0, 0, d / 2 + 0.3]);
    }
    const yaw =
      port.edge === 'left'
        ? -Math.PI / 2
        : port.edge === 'right'
          ? Math.PI / 2
          : Math.PI;
    const x =
      port.edge === 'rear'
        ? port.at
        : (port.edge === 'left' ? -1 : 1) * (spec.width / 2 - d / 2);
    const z = port.edge === 'rear' ? -spec.depth / 2 + d / 2 : port.at;
    put(group, connector, [x, -0.5, z], [0, yaw, 0]);
    connector.userData.notebookPort = port.kind;
  }
  return group;
}

type Key = {
  text: string;
  width: number;
  x: number;
  z: number;
  depth?: number;
};
const keyRow = (labels: string[], widths: Record<string, number> = {}) =>
  labels.map((text) => ({ text, width: widths[text] ?? 1 }));
const keysFor = (mac: boolean): Key[] => {
  const rows = [
    keyRow([
      'esc',
      ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`),
      mac ? '◉' : 'del',
    ]),
    keyRow(
      [
        '`',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '0',
        '-',
        '=',
        'delete',
      ],
      { delete: 1.9 },
    ),
    keyRow(
      ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
      { tab: 1.45, '\\': 1.45 },
    ),
    keyRow(
      ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'return'],
      { caps: 1.75, return: 2.15 },
    ),
    keyRow(
      ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift '],
      { shift: 2.2, 'shift ': 2.7 },
    ),
    keyRow(
      mac
        ? ['fn', 'ctrl', 'option', 'cmd', 'space', 'cmd ', 'option ']
        : ['ctrl', 'fn', 'win', 'alt', 'space', 'alt ', 'ctrl '],
      { space: 5.65, cmd: 1.2, 'cmd ': 1.2, option: 1.1, 'option ': 1.1 },
    ),
  ];
  const result: Key[] = [];
  rows.forEach((row, r) => {
    let x = 0;
    for (const key of row) {
      result.push({ ...key, x: x + key.width / 2, z: r });
      x += key.width;
    }
  });
  result.push(
    { text: '←', width: 1, x: 12.4, z: 5.2, depth: 0.5 },
    { text: '↑', width: 1, x: 13.4, z: 4.9, depth: 0.5 },
    { text: '↓', width: 1, x: 13.4, z: 5.45, depth: 0.5 },
    { text: '→', width: 1, x: 14.4, z: 5.2, depth: 0.5 },
  );
  return result;
};

/** A single generated legend atlas keeps the whole keyboard to one lettering draw. */
export function buildNotebookKeyboard(
  system: NotebookSystem,
  tools: ModelTools,
) {
  const mac = system === 'macbook',
    { put, slab, mm } = notebookKit(tools),
    group = new T.Group();
  const pitch = mac ? 17.0 : 17.9,
    width = pitch * 15.4,
    depth = 101;
  const keys = keysFor(mac);
  if (!mac) {
    const numpad = [
      ['num', '/', '*', '-'],
      ['7', '8', '9', '+'],
      ['4', '5', '6', '+'],
      ['1', '2', '3', 'enter'],
      ['0', '0', '.', 'enter'],
    ];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 4; c++)
        keys.push({
          text: numpad[r][c],
          width: 0.84,
          x: 15.9 + c * 0.88,
          z: 1 + r,
        });
  }
  const totalWidth = mac ? width : pitch * 19.5;
  put(
    group,
    slab([totalWidth + 3, 0.5, depth + 5], '#10151b', 0.08, 1),
    [0, -0.55, 0],
  );
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const drawW = totalWidth + 3,
    drawD = depth + 5;
  for (const key of keys) {
    const x = (key.x - (mac ? 7.7 : 9.75)) * pitch,
      z = (key.z - 2.5) * 17.1;
    const capW = key.width * pitch - 2,
      capD = (key.depth ?? 1) * 15;
    put(group, slab([capW, 1.1, capD], '#1b2027', 0.12, 1), [x, 0.2, z]);
    ctx.fillStyle = mac ? '#e2e7ed' : '#a8dbe8';
    ctx.font = `${key.text.length > 2 ? 18 : 27}px Arial`;
    if (key.text !== 'space')
      ctx.fillText(
        key.text.trim(),
        (x / drawW + 0.5) * 2048,
        (z / drawD + 0.5) * 768,
      );
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const legends = new T.Mesh(
    new T.PlaneGeometry(mm(drawW), mm(drawD)),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  legends.rotation.x = -Math.PI / 2;
  put(group, legends, [0, 0.81, 0]);
  group.userData.keyCount = keys.length;
  return group;
}

export function buildNotebookDeck(system: NotebookSystem, tools: ModelTools) {
  const spec = notebookSpecs[system],
    mac = system === 'macbook',
    { put, slab, plate, v, mm } = notebookKit(tools);
  const deck = new T.Group(),
    w = spec.width,
    d = spec.depth;
  const keyboardW = mac ? 265 : 351,
    keyboardD = 106,
    keyboardZ = mac ? -34 : -28;
  const padW = mac ? 130 : 104,
    padD = mac ? 81 : 69,
    padX = mac ? 0 : -29,
    padZ = mac ? 63 : 77;
  const holes: Opening[] = [
    { x: 0, z: keyboardZ, w: keyboardW, d: keyboardD, r: 2 },
    { x: padX, z: padZ, w: padW + 0.8, d: padD + 0.8, r: 3 },
  ];
  // Fine speaker perforations are actual openings in the metal, rather than paint.
  if (mac)
    for (const side of [-1, 1])
      for (let row = 0; row < 32; row++)
        holes.push({
          x: side * 143,
          z: -72 + row * 3.0,
          w: 9,
          d: 0.65,
          r: 0.25,
        });
  const upperPlate = plate(w, d, 1.2, mac ? 9 : 5, spec.shell, holes);
  upperPlate.material = tools.material(
    spec.shell,
    mac ? 0.72 : 0.15,
    mac ? 0.34 : 0.66,
  );
  deck.add(upperPlate);
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      put(
        deck,
        slab([8, spec.base - 1.5, 8], spec.shell, mac ? 0.72 : 0.15, 3),
        [x * (w / 2 - 4), -spec.base / 2, z * (d / 2 - 4)],
      );
  put(deck, buildNotebookKeyboard(system, tools), [0, -0.15, keyboardZ]);
  // Segmented walls are cut from the same port definitions as the I/O assembly.
  for (const edge of ['left', 'right', 'rear', 'front'] as const) {
    const span = edge === 'left' || edge === 'right' ? d - 10 : w - 10;
    const openings: [number, number, number, number][] = notebookPorts[system]
      .filter((p) => p.edge === edge)
      .map((p) => [
        notebookPortSize[p.kind][0] + 0.7,
        notebookPortSize[p.kind][1] + 0.6,
        p.at,
        -spec.base / 2 - 0.5,
      ]);
    if (edge !== 'front') {
      if (edge === 'rear')
        for (const x of [-spec.fanX, spec.fanX])
          openings.push([50, mac ? 4 : 8, x, -spec.base / 2]);
      if (!mac && (edge === 'left' || edge === 'right'))
        openings.push([41, 8, -84, -spec.base / 2]);
    }
    for (const [rw, rh, cx, cy] of plateWithHoles(
      span,
      spec.base - 1.5,
      openings.map(([pw, ph, pcx, pcy]) => [pw, ph, pcx, pcy + spec.base / 2]),
    )) {
      const wall = slab(
        edge === 'left' || edge === 'right' ? [1.2, rh, rw] : [rw, rh, 1.2],
        spec.shell,
        mac ? 0.72 : 0.25,
      );
      put(
        deck,
        wall,
        edge === 'left' || edge === 'right'
          ? [(edge === 'left' ? -1 : 1) * (w / 2 - 0.6), cy - spec.base / 2, cx]
          : [
              cx,
              cy - spec.base / 2,
              (edge === 'rear' ? -1 : 1) * (d / 2 - 0.6),
            ],
      );
    }
  }
  if (!mac) {
    const power = new T.Mesh(
      new T.CylinderGeometry(mm(4), mm(4), mm(0.6), 24),
      tools.material('#6c7882', 0.7),
    );
    put(deck, power, [0, 0.9, -92]);
    tools.label(deck, 'LEGION', v(w / 2 - 30, 0.7, 103), mm(29), '#b9c2c9');
  }
  return {
    deck,
    pad: plate(padW, padD, 0.7, 2.5, mac ? '#8d969f' : '#39424f'),
    padAt: [padX, 0.1, padZ] as [number, number, number],
  };
}

export function buildNotebookCover(system: NotebookSystem, tools: ModelTools) {
  const spec = notebookSpecs[system],
    { put, slab, plate, screw } = notebookKit(tools),
    group = new T.Group();
  const holes: Opening[] = [];
  if (system === 'legion')
    for (const x of [-spec.fanX, spec.fanX])
      for (let i = 0; i < 18; i++)
        holes.push({
          x: x - 25 + i * 3,
          z: spec.coolerZ - 13,
          w: 1.5,
          d: 48,
          r: 0.5,
        });
  group.add(
    plate(
      spec.width,
      spec.depth,
      1.1,
      system === 'macbook' ? 9 : 5,
      system === 'macbook' ? spec.shell : '#242b33',
      holes,
    ),
  );
  const feet =
    system === 'macbook'
      ? [
          [-125, -82],
          [125, -82],
          [-125, 82],
          [125, 82],
        ]
      : [
          [-126, -105],
          [126, -105],
          [-126, 106],
          [126, 106],
        ];
  for (const [x, z] of feet)
    put(group, slab([system === 'macbook' ? 21 : 43, 2, 8], '#171b21', 0, 3), [
      x,
      -1.4,
      z,
    ]);
  // Internal screw bosses and clips follow the perimeter; the screws are separately selectable.
  for (const side of [-1, 1])
    for (let i = 0; i < 6; i++)
      put(group, slab([3, 1.5, 2], '#58616b'), [
        side * (spec.width / 2 - 3),
        1.2,
        -spec.depth * 0.4 + i * spec.depth * 0.16,
      ]);
  const fasteners = new T.Group();
  for (const x of [-1, 1])
    for (const z of [-1, 0, 1])
      put(
        fasteners,
        screw(1.5),
        [x * (spec.width / 2 - 10), 0, z * (spec.depth / 2 - 11)],
        [Math.PI, 0, 0],
      );
  return { cover: group, fasteners };
}
