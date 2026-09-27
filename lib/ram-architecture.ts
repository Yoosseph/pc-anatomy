import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { diagramKit, put, type DiagramPalette } from './diagram-kit.ts';

/**
 * The logical scales inside a DRAM die.
 *
 * - `banks` / `ddr4banks`: the whole 16 Gb x8 die, DDR5 and DDR4. Bank arrays
 *   fill both halves; the periphery runs down the centre stripe, under the
 *   bond pads, which is where a centre-pad DRAM die keeps it.
 * - `bank` / `ddr4array`: one bank opened up — a grid of subarrays (mats), each with
 *   its own local sense amplifiers, driven by a global row decoder and read
 *   out through global bitlines.
 * - `cell` / `ddr4cell`: a corner of one mat — wordlines, bitlines, access transistors,
 *   storage capacitors under a common plate, and the sense amplifiers at the
 *   end of the bitlines.
 *
 * Counts are the data sheets': 32 banks in 8 groups of 4 on 16 Gb x8 DDR5,
 * 16 banks in 4 groups of 4 on 16 Gb x8 DDR4, 64 Ki and 128 Ki rows of 1 KiB.
 * Positions, sizes and the number of mats and cells drawn are illustrative:
 * a real bank holds 64 Ki rows, drawn here as a handful of subarrays.
 */

type Level = 'banks' | 'ddr4banks' | 'bank' | 'ddr4array' | 'cell' | 'ddr4cell';
type Gen = 'ddr5' | 'ddr4';
/** Concept ids on the bank and cell scales are the generation's prefix plus the part. */
const prefix: Record<Gen, string> = { ddr5: 'dram', ddr4: 'ddr4' };

/** Cool blue-greys with the Memory category accent. */
const palette: DiagramPalette = {
  panel: '#15242a',
  rail: '#4a6b76',
  caption: '#8fb8c4',
  text: '#d8e9ee',
};

const color = {
  bank: '#4f98ab',
  bankDdr4: '#5a8fa0',
  group: '#2f5f6d',
  cmd: '#5b6b86',
  mode: '#56607a',
  refresh: '#4d6b62',
  ecc: '#7b6a45',
  prefetch: '#3d6e6a',
  dq: '#48707f',
  zq: '#5f5a6e',
  dll: '#6e5b4a',
  mat: '#3f8ea3',
  localsa: '#3d6e6a',
  swd: '#55677a',
  rowdec: '#4a5a68',
  coldec: '#566479',
  gsa: '#467a74',
  wire: '#8cc9d8',
  ctl: '#5a5f73',
};

/** Die layouts for the two generations, drawn the same way so they compare. */
const dieLayout = {
  banks: {
    caption: 'DDR5 DIE · 16 GBIT X8 · 32 BANKS',
    groups: 8,
    ids: {
      bank: 'drambank',
      group: 'drambankgroup',
    },
    stripe: [
      ['dramcmd', 1.9, color.cmd, 'CA · COMMAND'],
      ['drammoderegs', 1.3, color.mode, 'MODE REGS'],
      ['dramrefresh', 1.4, color.refresh, 'REFRESH'],
      ['dramecc', 1.7, color.ecc, 'ON-DIE ECC'],
      ['dramprefetch', 1.8, color.prefetch, '16N PREFETCH'],
      ['dramdqio', 1.7, color.dq, 'DQ · DFE'],
      ['dramzq', 1.0, color.zq, 'ZQ'],
    ],
  },
  ddr4banks: {
    caption: 'DDR4 DIE · 16 GBIT X8 · 16 BANKS',
    groups: 4,
    ids: {
      bank: 'ddr4bank',
      group: 'ddr4bankgroup',
    },
    stripe: [
      ['ddr4cmd', 2.0, color.cmd, 'CMD · ADDRESS'],
      ['ddr4moderegs', 1.4, color.mode, 'MODE REGS'],
      ['ddr4refresh', 1.5, color.refresh, 'REFRESH'],
      ['ddr4dll', 1.3, color.dll, 'DLL'],
      ['ddr4prefetch', 1.8, color.prefetch, '8N PREFETCH'],
      ['ddr4dqio', 1.9, color.dq, 'DQ · DBI · CRC'],
      ['ddr4zq', 1.0, color.zq, 'ZQ'],
    ],
  },
} as const;

/** The die slab's usable width, and where the centre stripe sits. */
export const DIE = { width: 11.8, depth: 8.6, stripe: 0.7 } as const;

export function buildRamArchitecture(
  level: Level,
  tools: ModelTools,
  root: T.Group,
) {
  if (level === 'banks' || level === 'ddr4banks') buildDie(level, tools, root);
  else if (level === 'bank' || level === 'ddr4array')
    buildBank(level === 'bank' ? 'ddr5' : 'ddr4', tools, root);
  else buildCells(level === 'cell' ? 'ddr5' : 'ddr4', tools, root);
}

function buildDie(
  level: 'banks' | 'ddr4banks',
  tools: ModelTools,
  root: T.Group,
) {
  const { instances, box, label } = tools;
  const { backdrop, block } = diagramKit(tools, palette);
  const layout = dieLayout[level];
  backdrop(root, [DIE.width + 0.8, DIE.depth + 0.8], layout.caption);

  // The centre stripe: bond pads down the middle of the die, drawn as
  // scenery, with the periphery that serves every bank beside them.
  const scenery = new T.Group();
  scenery.userData.contextFrame = true;
  put(
    scenery,
    box([DIE.width, 0.04, DIE.stripe * 2], '#1b2f36', 0.5),
    [0, 0.0, 0],
  );
  for (let i = 0; i < 44; i++)
    put(scenery, box([0.1, 0.05, 0.1], '#c9ad62', 0.8), [
      -DIE.width / 2 + 0.3 + i * ((DIE.width - 0.6) / 43),
      0.03,
      0,
    ]);
  label(
    scenery,
    'CENTRE PADS',
    [DIE.width / 2 - 0.9, 0.06, 0.24],
    1.2,
    '#8fb8c4',
  );
  root.add(scenery);

  const gap = 0.12;
  const total =
    layout.stripe.reduce((sum, [, w]) => sum + w, 0) +
    gap * (layout.stripe.length - 1);
  let x = -total / 2;
  for (const [id, w, c, text] of layout.stripe) {
    block(id, [w, 0.2, 0.5], [x + w / 2, 0.14, 0.42], c, text, [
      (x + w / 2) * 0.08,
      1.0,
      0,
    ]);
    x += w + gap;
  }

  // Bank groups: each has its own I/O gating strip facing the stripe, which
  // is why consecutive accesses to different groups can go back to back.
  const perHalf = layout.groups / 2;
  const groupW = (DIE.width - gap * (perHalf - 1)) / perHalf;
  const bankPositions: Vec3[] = [];
  const bankW = (groupW - 0.16) / 2;
  const halfDepth = DIE.depth / 2 - 0.95 - 0.34;
  const bankD = (halfDepth - 0.1) / 2;
  for (let g = 0; g < layout.groups; g++) {
    const side = g < perHalf ? -1 : 1;
    const gx = -DIE.width / 2 + groupW / 2 + (g % perHalf) * (groupW + gap);
    block(
      layout.ids.group,
      [groupW, 0.16, 0.26],
      [gx, 0.12, side * 1.02],
      color.group,
      `BANK GROUP ${g}`,
      [0, 0.8, side * 0.5],
    );
    for (let b = 0; b < 4; b++)
      bankPositions.push([
        gx + ((b % 2) - 0.5) * (bankW + 0.16),
        0.2,
        side * (1.25 + bankD / 2 + Math.floor(b / 2) * (bankD + 0.1)),
      ]);
  }
  instances(
    layout.ids.bank,
    bankPositions,
    [bankW, 0.3, bankD],
    0,
    level === 'banks' ? color.bank : color.bankDdr4,
  ).forEach((p, i) =>
    p.delta.set(
      (((i >> 2) % perHalf) - (perHalf - 1) / 2) * 0.4,
      1.4,
      (i < bankPositions.length / 2 ? -1 : 1) * 0.5,
    ),
  );
}

/** One bank: a grid of mats, their stripes, and the bank's own decoders. */
export const BANK = {
  subarrays: 6,
  mats: 6,
  matW: 1.3,
  matD: 0.95,
  swd: 0.16,
  sa: 0.22,
} as const;

function buildBank(gen: Gen, tools: ModelTools, root: T.Group) {
  const id = (part: string) => prefix[gen] + part;
  const { instances } = tools;
  const { backdrop, block } = diagramKit(tools, palette);
  backdrop(
    root,
    [13.4, 10.2],
    gen === 'ddr5' ? 'DDR5 BANK · 65,536 ROWS' : 'DDR4 BANK · 131,072 ROWS',
  );

  const { subarrays, mats, matW, matD, swd, sa } = BANK;
  const pitchX = matW + swd;
  const pitchZ = matD + sa;
  const arrayW = mats * pitchX + swd;
  const arrayD = subarrays * pitchZ + sa;
  const x0 = -arrayW / 2 + 0.7;
  const z0 = -arrayD / 2 - 0.6;
  const matPos: Vec3[] = [];
  const swdPos: Vec3[] = [];
  const saPos: Vec3[] = [];
  for (let s = 0; s < subarrays; s++)
    for (let m = 0; m < mats; m++)
      matPos.push([
        x0 + swd + matW / 2 + m * pitchX,
        0.16,
        z0 + sa + matD / 2 + s * pitchZ,
      ]);
  for (let s = 0; s < subarrays; s++)
    for (let m = 0; m <= mats; m++)
      swdPos.push([
        x0 + swd / 2 + m * pitchX,
        0.13,
        z0 + sa + matD / 2 + s * pitchZ,
      ]);
  for (let s = 0; s <= subarrays; s++)
    saPos.push([x0 + arrayW / 2, 0.13, z0 + sa / 2 + s * pitchZ]);

  instances(id('mat'), matPos, [matW, 0.22, matD], 0, color.mat).forEach(
    (p, i) =>
      p.delta.set(
        ((i % mats) - (mats - 1) / 2) * 0.28,
        1.2,
        (Math.floor(i / mats) - (subarrays - 1) / 2) * 0.28,
      ),
  );
  instances(id('swd'), swdPos, [swd * 0.9, 0.16, matD], 0, color.swd).forEach(
    (p) => p.delta.set(0, 0.7, 0),
  );
  instances(
    id('localsa'),
    saPos,
    [arrayW, 0.16, sa * 0.9],
    0,
    color.localsa,
  ).forEach((p) => p.delta.set(0, 0.55, 0));

  // Global wordlines run over the mats to every subarray's local drivers;
  // global bitlines run down them to the global sense amplifiers.
  const gwl: Vec3[] = [];
  for (let s = 0; s < subarrays; s++)
    gwl.push([x0 + arrayW / 2, 0.34, z0 + sa + matD / 2 + s * pitchZ]);
  instances(id('gwl'), gwl, [arrayW, 0.05, 0.06], 0, color.wire).forEach((p) =>
    p.delta.set(0, 2.1, 0),
  );
  const gbl: Vec3[] = [];
  for (let m = 0; m < mats; m++)
    for (const dx of [-0.3, 0.3])
      gbl.push([
        x0 + swd + matW / 2 + m * pitchX + dx,
        0.4,
        z0 + arrayD / 2 + 0.55,
      ]);
  instances(id('gbl'), gbl, [0.05, 0.05, arrayD + 1.1], 0, '#a7d7c4').forEach(
    (p) => p.delta.set(0, 2.6, 0),
  );

  const left = x0 - 0.55;
  block(
    id('rowdec'),
    [0.9, 0.24, arrayD],
    [left, 0.15, z0 + arrayD / 2],
    color.rowdec,
    'ROW DECODER',
    [-0.9, 1.0, 0],
  );
  const below = z0 + arrayD;
  block(
    id('gsa'),
    [arrayW, 0.2, 0.5],
    [x0 + arrayW / 2, 0.13, below + 0.42],
    color.gsa,
    'GLOBAL SENSE AMPS · ROW BUFFER',
    [0, 0.9, 0.7],
  );
  block(
    id('coldec'),
    [arrayW, 0.2, 0.5],
    [x0 + arrayW / 2, 0.13, below + 1.02],
    color.coldec,
    'COLUMN DECODER',
    [0, 0.8, 1.2],
  );
  block(
    id('bankctl'),
    [0.9, 0.2, 1.1],
    [left, 0.13, below + 0.72],
    color.ctl,
    'CONTROL',
    [-0.9, 0.8, 0.9],
  );
}

/** A corner of one mat, cell by cell. */
export const CELLS = { wordlines: 6, bitlines: 8, pitch: 1.0 } as const;

function buildCells(gen: Gen, tools: ModelTools, root: T.Group) {
  const id = (part: string) => prefix[gen] + part;
  const { add, instances, label } = tools;
  const { backdrop, block } = diagramKit(tools, palette);
  backdrop(
    root,
    [12.4, 11.2],
    gen === 'ddr5'
      ? 'DDR5 MAT · 1T1C · VPP 1.8 V'
      : 'DDR4 MAT · 1T1C · VPP 2.5 V',
  );

  const { wordlines, bitlines, pitch } = CELLS;
  const bx = (i: number) => (i - (bitlines - 1) / 2) * pitch + 0.5;
  const wz = (j: number) => (j - (wordlines - 1) / 2) * pitch - 1.4;
  const top = wz(0) - 0.6;
  const end = wz(wordlines - 1) + 0.6;

  // Bitlines run along Z, buried lowest; wordlines cross over them along X.
  instances(
    id('bitline'),
    Array.from(
      { length: bitlines },
      (_, i) => [bx(i) - 0.28, 0.06, (top + end) / 2] as Vec3,
    ),
    [0.1, 0.08, end - top],
    0,
    '#7fc4d4',
  ).forEach((p) => p.delta.set(0, -0.3, 0));
  instances(
    id('wordline'),
    Array.from(
      { length: wordlines },
      (_, j) =>
        [bx(0) - 0.8 + (bitlines * pitch) / 2 - 0.3, 0.2, wz(j)] as Vec3,
    ),
    [bitlines * pitch + 0.2, 0.1, 0.16],
    0,
    '#c49a6c',
  ).forEach((p) => p.delta.set(0, 0.4, 0));

  // One access transistor and one capacitor per crossing. The pattern of
  // charged and empty capacitors is a stored byte per row, for illustration.
  const fets: Vec3[] = [];
  const full: Vec3[] = [];
  const empty: Vec3[] = [];
  const bits = [
    0b10110010, 0b01101101, 0b11100001, 0b00011110, 0b10011011, 0b01010110,
  ];
  for (let j = 0; j < wordlines; j++)
    for (let i = 0; i < bitlines; i++) {
      fets.push([bx(i), 0.36, wz(j)]);
      ((bits[j] >> (bitlines - 1 - i)) & 1 ? full : empty).push([
        bx(i),
        0.95,
        wz(j),
      ]);
    }
  instances(id('access'), fets, [0.34, 0.2, 0.34], 0, '#6f8796').forEach((p) =>
    p.delta.set(0, 0.9, 0),
  );
  // Custom instance geometry carries its colour in the vertices: the scene
  // resets instance colours for highlighting, so a charged capacitor has to
  // be a differently coloured cylinder, not a differently tinted instance.
  const can = (hex: string) => {
    const g = new T.CylinderGeometry(0.15, 0.15, 0.98, 14);
    const c = new T.Color(hex);
    g.setAttribute(
      'color',
      new T.BufferAttribute(
        new Float32Array(
          Array.from({ length: g.getAttribute('position').count }, () =>
            c.toArray(),
          ).flat(),
        ),
        3,
      ),
    );
    return g;
  };
  for (const [set, tint] of [
    [full, '#8fe0f0'],
    [empty, '#2c4f5c'],
  ] as const)
    instances(
      id('capacitor'),
      set,
      [0.3, 0.98, 0.3],
      0,
      tint,
      can(tint),
    ).forEach((p) => p.delta.set(0, 1.8, 0));

  // The common plate over every capacitor, lifted clear first. Drawn as
  // tinted glass so the stored pattern shows through it, and the cursor
  // reaches the capacitors beneath.
  const plate = new T.Group();
  plate.add(
    new T.Mesh(
      new T.BoxGeometry(bitlines * pitch + 0.3, 0.08, wordlines * pitch + 0.2),
      new T.MeshStandardMaterial({
        color: '#6f93a3',
        metalness: 0.3,
        roughness: 0.35,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    ),
  );
  label(
    plate,
    'CELL PLATE',
    [bitlines * pitch * 0.5 - 1.0, 0.05, -wordlines * pitch * 0.5 + 0.3],
    1.4,
    palette.caption,
  );
  add(
    id('plate'),
    plate,
    [bx(0) - 0.5 + (bitlines * pitch) / 2 - 0.15, 1.52, (top + end) / 2],
    [0, 3.4, 0],
  );

  // Wordline drivers at the mat's edge.
  block(
    id('wldriver'),
    [0.8, 0.26, end - top],
    [bx(0) - 1.6, 0.17, (top + end) / 2],
    color.swd,
    'WL DRIVERS',
    [-1.0, 0.8, 0],
  );

  // Below the array: precharge and equalise, then one sense amplifier per
  // bitline, then the column switches onto the local I/O pair.
  const midX = bx(0) - 0.5 + (bitlines * pitch) / 2;
  block(
    id('precharge'),
    [bitlines * pitch, 0.18, 0.34],
    [midX, 0.12, end + 0.35],
    '#4d6b62',
    'PRECHARGE · EQUALISE',
    [0, 0.7, 0.5],
  );
  instances(
    id('cellsa'),
    Array.from(
      { length: bitlines },
      (_, i) => [bx(i) - 0.14, 0.17, end + 1.05] as Vec3,
    ),
    [0.72, 0.26, 0.7],
    0,
    '#3d8a82',
  ).forEach((p) => p.delta.set(0, 1.0, 0.6));
  instances(
    id('colsel'),
    Array.from(
      { length: bitlines },
      (_, i) => [bx(i) - 0.14, 0.13, end + 1.7] as Vec3,
    ),
    [0.3, 0.18, 0.3],
    0,
    '#6e7f99',
  ).forEach((p) => p.delta.set(0, 0.8, 0.9));
  instances(
    id('lio'),
    [0, 1].map((k) => [midX - 0.14, 0.1, end + 2.1 + k * 0.28] as Vec3),
    [bitlines * pitch, 0.08, 0.12],
    0,
    '#a7d7c4',
  ).forEach((p) => p.delta.set(0, 0.6, 1.3));
}
