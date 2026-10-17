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
  sub?: string;
  align?: 'center' | 'left' | 'right';
  width: number;
  x: number;
  z: number;
  depth?: number;
};

type KeySpec = {
  text: string;
  sub?: string;
  width?: number;
  depth?: number;
  align?: 'center' | 'left' | 'right';
  gapBefore?: number;
};

const keysFor = (mac: boolean): Key[] => {
  const fnIcons = [
    '☀-',
    '☀+',
    '▢▢',
    '⌕',
    '🎤',
    '☾',
    '⏮',
    '⏯',
    '⏭',
    '🔇',
    '🔉',
    '🔊',
  ];
  const rows: { z: number; depth?: number; items: KeySpec[] }[] = [
    {
      z: 0,
      depth: mac ? 0.96 : 0.74,
      items: mac
        ? [
            { text: 'esc', width: 1.5, align: 'left' },
            ...Array.from({ length: 12 }, (_, i) => ({
              text: `F${i + 1}`,
              sub: fnIcons[i],
              width: 1,
            })),
            { text: 'touchid', width: 1 },
          ]
        : [
            { text: 'Esc', width: 1.1, align: 'left' },
            { text: 'F1', sub: '🔇', width: 0.92, gapBefore: 0.14 },
            { text: 'F2', sub: '🔉', width: 0.92 },
            { text: 'F3', sub: '🔊', width: 0.92 },
            { text: 'F4', sub: '🎤', width: 0.92 },
            { text: 'F5', sub: '☀-', width: 0.92, gapBefore: 0.14 },
            { text: 'F6', sub: '☀+', width: 0.92 },
            { text: 'F7', sub: '▢', width: 0.92 },
            { text: 'F8', sub: '✈', width: 0.92 },
            { text: 'F9', sub: '⚙', width: 0.92, gapBefore: 0.14 },
            { text: 'F10', sub: '🔒', width: 0.92 },
            { text: 'F11', sub: '⧉', width: 0.92 },
            { text: 'F12', sub: '🖩', width: 0.92 },
            { text: 'Ins', width: 0.86, gapBefore: 0.14 },
            { text: 'PrtSc', width: 0.88 },
            { text: 'Del', width: 0.96 },
          ],
    },
    {
      z: 1,
      items: [
        { text: '`', sub: '~' },
        { text: '1', sub: '!' },
        { text: '2', sub: '@' },
        { text: '3', sub: '#' },
        { text: '4', sub: '$' },
        { text: '5', sub: '%' },
        { text: '6', sub: '^' },
        { text: '7', sub: '&' },
        { text: '8', sub: '*' },
        { text: '9', sub: '(' },
        { text: '0', sub: ')' },
        { text: '-', sub: '_' },
        { text: '=', sub: '+' },
        {
          text: mac ? 'delete' : 'Backspace',
          width: mac ? 1.5 : 2.0,
          align: 'right',
        },
      ],
    },
    {
      z: 2,
      items: [
        { text: mac ? 'tab' : 'Tab', width: 1.5, align: 'left' },
        { text: 'Q' },
        { text: 'W' },
        { text: 'E' },
        { text: 'R' },
        { text: 'T' },
        { text: 'Y' },
        { text: 'U' },
        { text: 'I' },
        { text: 'O' },
        { text: 'P' },
        { text: '[', sub: '{' },
        { text: ']', sub: '}' },
        { text: '\\', sub: '|', width: mac ? 1.0 : 1.5 },
      ],
    },
    {
      z: 3,
      items: [
        {
          text: mac ? 'caps lock' : 'CapsLk',
          width: mac ? 1.75 : 1.8,
          align: 'left',
        },
        { text: 'A' },
        { text: 'S' },
        { text: 'D' },
        { text: 'F' },
        { text: 'G' },
        { text: 'H' },
        { text: 'J' },
        { text: 'K' },
        { text: 'L' },
        { text: ';', sub: ':' },
        { text: "'", sub: '"' },
        {
          text: mac ? 'return' : 'Enter',
          width: mac ? 1.75 : 2.2,
          align: 'right',
        },
      ],
    },
    {
      z: 4,
      items: [
        {
          text: mac ? 'shift' : 'Shift',
          width: 2.25,
          align: 'left',
        },
        { text: 'Z' },
        { text: 'X' },
        { text: 'C' },
        { text: 'V' },
        { text: 'B' },
        { text: 'N' },
        { text: 'M' },
        { text: ',', sub: '<' },
        { text: '.', sub: '>' },
        { text: '/', sub: '?' },
        {
          text: mac ? 'shift ' : 'Shift ',
          width: mac ? 2.25 : 2.75,
          align: 'right',
        },
      ],
    },
    {
      z: 5,
      items: mac
        ? [
            { text: 'fn', sub: '🌐', width: 1.0, align: 'left' },
            { text: 'control', sub: '⌃', width: 1.0 },
            { text: 'option', sub: '⌥', width: 1.25 },
            { text: 'command', sub: '⌘', width: 1.5 },
            { text: 'space', width: 4.75 },
            { text: 'command ', sub: '⌘', width: 1.25 },
            { text: 'option ', sub: '⌥', width: 1.0 },
          ]
        : [
            { text: 'Ctrl', width: 1.3, align: 'left' },
            { text: 'Fn', width: 1.05 },
            { text: '❖', width: 1.05 },
            { text: 'Alt', width: 1.2 },
            { text: 'space', sub: '☀', width: 5.4 },
            { text: 'Alt ', width: 1.05 },
            { text: 'Ctrl ', width: 1.05 },
          ],
    },
  ];
  const result: Key[] = [];
  for (const row of rows) {
    let x = 0;
    for (const item of row.items) {
      x += item.gapBefore ?? 0;
      const w = item.width ?? 1;
      result.push({
        text: item.text,
        sub: item.sub,
        align: item.align,
        width: w,
        x: x + w / 2,
        z: row.z,
        depth: item.depth ?? row.depth,
      });
      x += w;
    }
  }
  if (mac) {
    // Inverted-T half-height arrow cluster flush with the 14.5u right edge.
    result.push(
      { text: '←', width: 0.9, x: 12.2, z: 5.26, depth: 0.46 },
      { text: '↑', width: 0.9, x: 13.125, z: 4.74, depth: 0.46 },
      { text: '↓', width: 0.9, x: 13.125, z: 5.26, depth: 0.46 },
      { text: '→', width: 0.9, x: 14.05, z: 5.26, depth: 0.46 },
    );
  } else {
    // Legion TrueStrike arrow cluster aligned with the bottom edge of the keyboard well.
    result.push(
      { text: '↑', width: 0.94, x: 13.55, z: 4.74, depth: 0.48 },
      { text: '←', width: 0.94, x: 12.57, z: 5.26, depth: 0.48 },
      { text: '↓', width: 0.94, x: 13.55, z: 5.26, depth: 0.48 },
      { text: '→', width: 0.94, x: 14.53, z: 5.26, depth: 0.48 },
    );
  }
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
  const pitch = mac ? 18.0 : 18.1,
    rowPitch = mac ? 16.8 : 16.5,
    unitsW = mac ? 14.5 : 18.95,
    totalWidth = pitch * unitsW,
    depth = 104;
  const keys = keysFor(mac);
  if (!mac) {
    const x0 = 15.35,
      col = 0.9;
    const navTop = ['Home', 'End', 'PgUp', 'PgDn'];
    navTop.forEach((text, c) =>
      keys.push({
        text,
        width: 0.86,
        x: x0 + c * col + 0.45,
        z: 0,
        depth: 0.74,
      }),
    );
    const row1 = ['Num', '/', '*', '-'];
    row1.forEach((text, c) =>
      keys.push({ text, width: 0.86, x: x0 + c * col + 0.45, z: 1 }),
    );
    ['7', '8', '9'].forEach((text, c) =>
      keys.push({
        text,
        sub: text === '7' ? 'Home' : text === '9' ? 'PgUp' : '↑',
        width: 0.86,
        x: x0 + c * col + 0.45,
        z: 2,
      }),
    );
    ['4', '5', '6'].forEach((text, c) =>
      keys.push({
        text,
        sub: text === '4' ? '←' : text === '6' ? '→' : '',
        width: 0.86,
        x: x0 + c * col + 0.45,
        z: 3,
      }),
    );
    // Single 2-row tall '+' key on the right of 9/6.
    keys.push({
      text: '+',
      width: 0.86,
      x: x0 + 3 * col + 0.45,
      z: 2.5,
      depth: 2.02,
    });
    ['1', '2', '3'].forEach((text, c) =>
      keys.push({
        text,
        sub: text === '1' ? 'End' : text === '3' ? 'PgDn' : '↓',
        width: 0.86,
        x: x0 + c * col + 0.45,
        z: 4,
      }),
    );
    // Wide 2u '0' key, '.' key, and single 2-row tall 'Enter' key.
    keys.push(
      { text: '0', sub: 'Ins', width: 1.76, x: x0 + 0.9, z: 5 },
      { text: '.', sub: 'Del', width: 0.86, x: x0 + 2 * col + 0.45, z: 5 },
      {
        text: 'Enter',
        width: 0.86,
        x: x0 + 3 * col + 0.45,
        z: 4.5,
        depth: 2.02,
      },
    );
  }
  // Matte-black anodized well on MacBook; dark backlit well plate on Legion.
  put(
    group,
    slab(
      [totalWidth + 4, 0.55, depth + 6],
      mac ? '#0a0c0f' : '#11161d',
      mac ? 0.25 : 0.12,
      1.5,
    ),
    [0, -0.52, 0],
  );
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const drawW = totalWidth + 6,
    drawD = depth + 16,
    pxX = (mmX: number) => (mmX / drawW + 0.5) * canvas.width,
    pxZ = (mmZ: number) => (mmZ / drawD + 0.5) * canvas.height,
    scaleX = canvas.width / drawW,
    scaleZ = canvas.height / drawD;

  for (const key of keys) {
    const x = (key.x - unitsW / 2) * pitch,
      z = (key.z - 2.5) * rowPitch;
    const capW = key.width * pitch - (mac ? 1.7 : 1.85),
      capD = (key.depth ?? 1) * (mac ? 15.1 : 14.7);
    // Subtle translucent key switch skirt / backlight collar beneath each cap.
    if (!mac)
      put(group, slab([capW + 0.5, 0.45, capD + 0.5], '#316275', 0.1, 0.9), [
        x,
        -0.05,
        z,
      ]);
    put(
      group,
      slab(
        [capW, mac ? 0.95 : 1.15, capD],
        mac ? '#14171c' : '#1b2129',
        mac ? 0.08 : 0.14,
        mac ? 0.9 : 1.1,
      ),
      [x, 0.22, z],
    );

    const cx = pxX(x),
      cz = pxZ(z),
      kw = capW * scaleX,
      kd = capD * scaleZ;
    // Keycap top bevel rim so every individual key silhouette stays razor-sharp.
    ctx.strokeStyle = mac ? '#38404c' : '#63b8d1aa';
    ctx.lineWidth = mac ? 3.2 : 3.8;
    ctx.strokeRect(cx - kw / 2 + 4, cz - kd / 2 + 4, kw - 8, kd - 8);

    if (key.text === 'touchid') {
      // MacBook Pro Touch ID circular sapphire ring.
      ctx.beginPath();
      ctx.arc(cx, cz, Math.min(kw, kd) * 0.31, 0, Math.PI * 2);
      ctx.fillStyle = '#0d0f13';
      ctx.fill();
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = '#9aa4b0';
      ctx.stroke();
      continue;
    }

    const label = key.text.trim();
    // Caps Lock indicator LED dot in top-left corner of keycap.
    if (label === 'caps lock' || label === 'CapsLk') {
      ctx.beginPath();
      ctx.arc(cx - kw * 0.34, cz - kd * 0.26, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = mac ? '#52e06b' : '#84ecff';
      ctx.fill();
    }

    // Tactile homing bars on F, J, and Numpad 5.
    if (label === 'F' || label === 'J' || label === '5') {
      ctx.fillStyle = mac ? '#b4beca' : '#a8e4f2';
      ctx.fillRect(cx - kw * 0.17, cz + kd * 0.31, kw * 0.34, 5);
    }

    if (label === 'space') {
      if (!mac && key.sub) {
        ctx.fillStyle = '#b4ecfa';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '700 36px "Segoe UI", Arial, sans-serif';
        ctx.fillText(key.sub, cx - kw * 0.42, cz);
      }
      continue;
    }

    ctx.fillStyle = mac ? '#ffffff' : '#ecfbff';
    const isWord = label.length > 1;
    if (key.sub && label.length === 1) {
      // Dual-legend number/symbol key: shifted symbol on top, primary on bottom.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = mac ? '#d5dde6' : '#b2e4f2';
      ctx.font = '600 34px "Segoe UI", Arial, sans-serif';
      ctx.fillText(key.sub, cx, cz - kd * 0.21);
      ctx.fillStyle = mac ? '#ffffff' : '#f0fcff';
      ctx.font = '700 44px "Segoe UI", Arial, sans-serif';
      ctx.fillText(label, cx, cz + kd * 0.18);
    } else if (key.sub && label.startsWith('F') && label.length <= 3) {
      // Function key: media glyph on top, F1..F12 on bottom.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = mac ? '#e2e8f0' : '#bae8f5';
      ctx.font = '600 30px "Segoe UI", Arial, sans-serif';
      ctx.fillText(key.sub, cx, cz - kd * 0.18);
      ctx.fillStyle = mac ? '#ffffff' : '#ecfbff';
      ctx.font = '700 27px "Segoe UI", Arial, sans-serif';
      ctx.fillText(label, cx, cz + kd * 0.22);
    } else if (mac && key.sub && isWord) {
      // Mac modifier key: symbol at top corner, word at bottom.
      ctx.textBaseline = 'middle';
      ctx.textAlign = key.align === 'left' ? 'left' : 'right';
      const edgeX = key.align === 'left' ? cx - kw * 0.36 : cx + kw * 0.36;
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 32px "Segoe UI", Arial, sans-serif';
      ctx.fillText(key.sub, edgeX, cz - kd * 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 27px "Segoe UI", Arial, sans-serif';
      ctx.fillText(label, edgeX, cz + kd * 0.22);
    } else {
      ctx.textBaseline = 'middle';
      if (key.align === 'left') {
        ctx.textAlign = 'left';
        ctx.font = '600 29px "Segoe UI", Arial, sans-serif';
        ctx.fillText(label, cx - kw * 0.37, cz + (mac ? kd * 0.16 : 0));
      } else if (key.align === 'right') {
        ctx.textAlign = 'right';
        ctx.font = '600 29px "Segoe UI", Arial, sans-serif';
        ctx.fillText(label, cx + kw * 0.37, cz + (mac ? kd * 0.16 : 0));
      } else {
        ctx.textAlign = 'center';
        ctx.font = `${isWord ? '600 30px' : '700 50px'} "Segoe UI", Arial, sans-serif`;
        ctx.fillText(label, cx, cz - (key.sub ? kd * 0.08 : 0));
        if (key.sub) {
          ctx.fillStyle = '#a8dfee';
          ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
          ctx.fillText(key.sub, cx, cz + kd * 0.24);
        }
      }
    }
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  const legends = new T.Mesh(
    new T.PlaneGeometry(mm(drawW), mm(drawD)),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  legends.rotation.x = -Math.PI / 2;
  put(group, legends, [0, mac ? 0.72 : 0.82, 0]);
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
  const keyboardW = mac ? 265 : 347,
    keyboardD = 105,
    keyboardZ = mac ? -33 : -27;
  const padW = mac ? 130 : 105,
    padD = mac ? 81 : 70,
    padX = mac ? 0 : -29,
    padZ = mac ? 63 : 77;
  const holes: Opening[] = [
    { x: 0, z: keyboardZ, w: keyboardW, d: keyboardD, r: mac ? 3.5 : 2.5 },
    { x: padX, z: padZ, w: padW + 0.8, d: padD + 0.8, r: mac ? 4.2 : 2.5 },
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
    mac ? 0.74 : 0.22,
    mac ? 0.31 : 0.58,
  );
  deck.add(upperPlate);
  // Acoustic dark backing under MacBook speaker grilles so the perforations read as real micro-drilled metal.
  if (mac)
    for (const side of [-1, 1])
      put(deck, slab([12, 0.3, 98], '#111418', 0.1, 1), [
        side * 143,
        -0.55,
        -24,
      ]);
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      put(
        deck,
        slab([8, spec.base - 1.5, 8], spec.shell, mac ? 0.74 : 0.22, 3),
        [x * (w / 2 - 4), -spec.base / 2, z * (d / 2 - 4)],
      );
  put(deck, buildNotebookKeyboard(system, tools), [0, -0.15, keyboardZ]);
  // Front-lip one-finger lid-lift thumb scoop recess.
  put(deck, slab([mac ? 56 : 64, 1.6, 2.6], '#13171d', 0.3, 0.8), [
    0,
    -0.45,
    d / 2 - 0.9,
  ]);
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
        mac ? 0.74 : 0.25,
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
    // Legion sculpted circular power button with center LED status dot.
    const powerRing = new T.Mesh(
      new T.CylinderGeometry(mm(5.2), mm(5.2), mm(0.45), 28),
      tools.material('#222831', 0.45, 0.45),
    );
    put(deck, powerRing, [0, 0.75, -93]);
    const powerBtn = new T.Mesh(
      new T.CylinderGeometry(mm(4.1), mm(4.1), mm(0.55), 28),
      tools.material('#37404c', 0.55, 0.38),
    );
    put(deck, powerBtn, [0, 0.85, -93]);
    const powerLed = new T.Mesh(
      new T.CylinderGeometry(mm(0.85), mm(0.85), mm(0.62), 16),
      new T.MeshBasicMaterial({ color: '#9beeff' }),
    );
    put(deck, powerLed, [0, 0.9, -93]);
    // Signature Legion rear I/O ledge behind the display hinges with top port legends.
    put(deck, slab([w - 24, 0.5, 5.5], '#272e37', 0.3, 1.0), [
      0,
      0.25,
      -d / 2 + 3.8,
    ]);
    for (const portX of [-91, -61, -34, -13, 20, 52, 83])
      put(deck, slab([3.2, 0.15, 1.4], '#92c8d8', 0.2, 0.3), [
        portX,
        0.58,
        -d / 2 + 3.8,
      ]);
    tools.label(deck, 'LEGION', v(w / 2 - 30, 0.7, 103), mm(29), '#b9c2c9');
  } else {
    // MacBook Pro recessed black hinge exhaust clutch channel along the rear center.
    put(deck, slab([172, 0.9, 6.5], '#14171c', 0.2, 1.2), [
      0,
      0.25,
      -d / 2 + 11,
    ]);
  }
  const padGroup = new T.Group();
  padGroup.add(
    plate(
      padW + 0.5,
      padD + 0.5,
      0.55,
      mac ? 4.0 : 2.4,
      mac ? '#565d65' : '#252c35',
    ),
  );
  const padSurface = plate(
    padW - 0.6,
    padD - 0.6,
    0.72,
    mac ? 3.6 : 2.1,
    mac ? '#838b94' : '#353e4a',
  );
  padSurface.material = tools.material(
    mac ? '#838b94' : '#353e4a',
    mac ? 0.45 : 0.2,
    mac ? 0.28 : 0.48,
  );
  put(padGroup, padSurface, [0, 0.08, 0]);
  return {
    deck,
    pad: padGroup,
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
