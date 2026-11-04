import { openLevel } from './manifest.ts';
import { levels, type LevelId } from './levels.ts';
import type { SourceId } from './sources.ts';

/**
 * Build your own desktop: the slots, the parts each one can take, and how a
 * build maps onto the tower. Whether the parts work together is
 * `build-checks.ts`.
 *
 * The choices are parts the project already models, so every option opens
 * into the same detailed part the explorer shows, and every one of them is
 * drawn in the tower when it is chosen. The case stays fixed: there is one.
 *
 * No three.js here. The build workspace asks these questions before the
 * engine has loaded, and the tests import this file directly.
 *
 * Every figure below is a vendor's published number or a measurement of the
 * modelled case, and each option names where it comes from.
 */

export type ProcessorChoice = 'ryzen' | 'corei9';
export type CoolerChoice = 'cooler' | 'liquid';
export type BoardChoice = 'motherboard' | 'z890' | 'b650m';
export type MemoryChoice = 'dimm' | 'dimm4' | 'ddr4';
export type GraphicsChoice =
  | 'card'
  | 'rx9070'
  | 'arcb580'
  | 'rtx5060ti'
  | 'rtx5060';
export type StorageChoice = 'nvmesata' | 'nvme';
export type PowerChoice =
  | 'psu650'
  | 'psubronze'
  | 'psu'
  | 'psu1000'
  | 'psu1200';

export interface DesktopBuild {
  processor: ProcessorChoice;
  cooler: CoolerChoice;
  board: BoardChoice;
  memory: MemoryChoice;
  storage: StorageChoice;
  graphics: GraphicsChoice;
  power: PowerChoice;
}
export type BuildSlot = keyof DesktopBuild;

/** The machine as the explorer has always shown it. */
export const defaultBuild: DesktopBuild = {
  processor: 'ryzen',
  cooler: 'cooler',
  board: 'motherboard',
  memory: 'dimm',
  storage: 'nvmesata',
  graphics: 'card',
  power: 'psu',
};

/**
 * The room inside the modelled case, millimetres. The case is illustrative,
 * so these are properties of the model in `machine.ts`, not a product's
 * specification, and `tests/build.test.ts` measures each one in the built
 * tower.
 */
export const caseRoom = {
  /** From the slot bracket at the rear panel to the front intake fans. */
  cardLength: 420,
  /** Off the face of the board to the side glass. */
  coolerHeight: 200,
  /** Between the board's top edge and the roof. */
  roof: 26,
  /** 120 mm fan positions behind the front panel. */
  frontFans: 3,
  /** The board outlines the tray has standoffs for. */
  boards: ['ATX', 'Micro-ATX'] as const,
};

/** Whose silicon a part carries, for the picker's colour and its filter. */
export type Brand = 'amd' | 'intel' | 'nvidia';
export const brandName: Record<Brand, string> = {
  amd: 'AMD',
  intel: 'Intel',
  nvidia: 'NVIDIA',
};

interface Option {
  name: string;
  /** One line under the name in the picker. */
  summary: string;
  sources: SourceId[];
  brand?: Brand;
}
export interface ProcessorOption extends Option {
  socket: 'AM5' | 'LGA 1851';
  /** The power figure the maker publishes, and what it measures. */
  watts: number;
  wattsLabel: string;
  /**
   * The fastest DDR5 the maker supports, by how many single-rank modules are
   * fitted. Absent where the maker publishes no separate figure.
   */
  memorySpeed: { 2: number; 4?: number };
  brand: Brand;
}
/** A radiator's length and thickness, millimetres, and the 120 mm fans it takes. */
export interface Radiator {
  length: number;
  thickness: number;
  fans: number;
}
export interface CoolerOption extends Option {
  /** An air tower's height off the board, millimetres. */
  height?: number;
  radiator?: Radiator;
}
export interface BoardOption extends Option {
  socket: ProcessorOption['socket'];
  chipset: string;
  memory: 'DDR5';
  formFactor: (typeof caseRoom.boards)[number];
  /** Outline: along the rear panel, then front to back, millimetres. */
  size: [height: number, depth: number];
  brand: Brand;
}
export interface MemoryOption extends Option {
  generation: 'DDR5' | 'DDR4';
  /** Modules fitted, each 16 GB single rank. */
  modules: 2 | 4;
  /** The kit's rated data rate, MT/s, with its XMP or EXPO profile. */
  speed: number;
}
export interface GraphicsOption extends Option {
  watts: number;
  /** The supply the card's maker asks for, and whether it is a floor. */
  psu: number;
  psuKind: 'minimum' | 'recommended';
  psuSource: string;
  connector: '12V-2x6' | '8-pin';
  /** An adapter from 8-pin leads, in the box, and how many leads it takes. */
  adapter?: { name: string; leads: number };
  /** Overall length, millimetres. */
  length: number;
  brand: Brand;
}
export interface StorageOption extends Option {
  /** Whether a 2.5-inch SATA drive is fitted beside the M.2 drive. */
  sata: boolean;
}
export interface PowerOption extends Option {
  watts: number;
  modular: boolean;
  /** Whether a native 16-pin 12V-2x6 lead is among its outputs. */
  sixteenPin: boolean;
  /** How many 8-pin (6+2) PCIe leads it has. */
  eightPin: number;
  /** How many SATA power connectors it has. */
  sata: number;
}

export const processorOptions: Record<ProcessorChoice, ProcessorOption> = {
  ryzen: {
    name: 'AMD Ryzen 9 9950X',
    summary: '16 cores · AM5',
    socket: 'AM5',
    // AMD publishes only the 170 W default TDP, a cooling figure. The socket
    // power limit is the like-for-like number to Intel's maximum turbo power,
    // and comes from an independent review.
    watts: 200,
    wattsLabel: 'socket power limit (PPT)',
    memorySpeed: { 2: 5600, 4: 3600 },
    brand: 'amd',
    sources: ['ryzen', 'fpsreview9950x'],
  },
  corei9: {
    name: 'Intel Core Ultra 9 285K',
    summary: '24 cores · LGA 1851',
    socket: 'LGA 1851',
    watts: 250,
    wattsLabel: 'maximum turbo power',
    memorySpeed: { 2: 6400 },
    brand: 'intel',
    sources: ['corei9'],
  },
};

/** The 360 mm radiator, as the liquid scale draws it in `liquid.ts`. */
export const radiator360: Radiator = { length: 394, thickness: 27, fans: 3 };

/**
 * Both coolers are the project's illustrative models, so their sizes are the
 * model's: the tower in `machine.ts`, the loop in `liquid.ts`.
 */
export const coolerOptions: Record<CoolerChoice, CoolerOption> = {
  cooler: {
    name: 'Tower air cooler',
    summary: '4 heat pipes · 120 mm fin stack',
    height: 150,
    sources: ['aircooler'],
  },
  liquid: {
    name: '360 mm liquid cooler',
    summary: 'Pump block · front radiator',
    radiator: radiator360,
    sources: ['aio'],
  },
};

/**
 * Three ASUS TUF boards: the one the machine is built on, the same family's
 * Intel board, and its smaller AM5 sibling. All three take DDR5 only.
 */
export const boardOptions: Record<BoardChoice, BoardOption> = {
  motherboard: {
    name: 'ASUS TUF GAMING X670E-PLUS WIFI',
    summary: 'AM5 · X670E · ATX',
    socket: 'AM5',
    chipset: 'AMD X670E',
    memory: 'DDR5',
    formFactor: 'ATX',
    size: [305, 244],
    brand: 'amd',
    sources: ['mainboardmanual'],
  },
  z890: {
    name: 'ASUS TUF GAMING Z890-PLUS WIFI',
    summary: 'LGA 1851 · Z890 · ATX',
    socket: 'LGA 1851',
    chipset: 'Intel Z890',
    memory: 'DDR5',
    formFactor: 'ATX',
    size: [305, 244],
    brand: 'intel',
    sources: ['tufz890'],
  },
  b650m: {
    name: 'ASUS TUF GAMING B650M-PLUS WIFI',
    summary: 'AM5 · B650 · micro-ATX',
    socket: 'AM5',
    chipset: 'AMD B650',
    memory: 'DDR5',
    formFactor: 'Micro-ATX',
    size: [244, 244],
    brand: 'amd',
    sources: ['tufb650m'],
  },
};

export const memoryOptions: Record<MemoryChoice, MemoryOption> = {
  dimm: {
    name: 'Kingston FURY Beast DDR5-6000',
    summary: '2 × 16 GB · DDR5',
    generation: 'DDR5',
    modules: 2,
    speed: 6000,
    sources: ['kf560', 'ddr5architecture'],
  },
  // The same module, twice over: every slot on the board filled.
  dimm4: {
    name: 'Kingston FURY Beast DDR5-6000 × 4',
    summary: '4 × 16 GB · every slot filled',
    generation: 'DDR5',
    modules: 4,
    speed: 6000,
    sources: ['kf560', 'ddr5architecture'],
  },
  ddr4: {
    name: 'Kingston FURY Beast DDR4-3200',
    summary: '2 × 16 GB · DDR4',
    generation: 'DDR4',
    modules: 2,
    speed: 3200,
    sources: ['kf432', 'jedecmo329'],
  },
};

export const graphicsOptions: Record<GraphicsChoice, GraphicsOption> = {
  card: {
    name: 'GeForce RTX 5090',
    summary: 'ASUS TUF · 575 W · 348 mm',
    watts: 575,
    psu: 1000,
    psuKind: 'recommended',
    psuSource: 'ASUS',
    connector: '12V-2x6',
    length: 348,
    brand: 'nvidia',
    sources: ['specs', 'tuf5090specs'],
  },
  rx9070: {
    name: 'Radeon RX 9070 XT',
    summary: 'Sapphire NITRO+ · 330 W · 331 mm',
    watts: 330,
    psu: 850,
    psuKind: 'minimum',
    psuSource: 'Sapphire',
    connector: '12V-2x6',
    adapter: { name: '3 × 8-pin', leads: 3 },
    length: 330.8,
    brand: 'amd',
    sources: ['nitro9070'],
  },
  arcb580: {
    name: 'Intel Arc B580',
    summary: 'Limited Edition · 190 W · 272 mm',
    watts: 190,
    psu: 600,
    psuKind: 'recommended',
    psuSource: 'Intel',
    connector: '8-pin',
    length: 272,
    brand: 'intel',
    sources: ['arcb580'],
  },
  rtx5060ti: {
    name: 'GeForce RTX 5060 Ti',
    summary: 'ASUS Dual · 180 W · 229 mm',
    // NVIDIA's total graphics power; ASUS's recommendation for its own card.
    watts: 180,
    psu: 550,
    psuKind: 'recommended',
    psuSource: 'ASUS',
    connector: '8-pin',
    length: 229,
    brand: 'nvidia',
    sources: ['dual5060ti', 'rtx5060family'],
  },
  rtx5060: {
    name: 'GeForce RTX 5060',
    summary: 'MSI INSPIRE ITX · 145 W · 145 mm',
    watts: 145,
    psu: 550,
    psuKind: 'recommended',
    psuSource: 'MSI',
    connector: '8-pin',
    length: 145,
    brand: 'nvidia',
    sources: ['inspire5060', 'rtx5060family'],
  },
};

/** The drives are representative models of the two families, not products. */
export const storageOptions: Record<StorageChoice, StorageOption> = {
  nvmesata: {
    name: 'M.2 NVMe + 2.5-inch SATA SSD',
    summary: 'Two drives · one SATA cable',
    sata: true,
    sources: ['samsungnvme', 'samsungsata'],
  },
  nvme: {
    name: 'M.2 NVMe SSD only',
    summary: 'One drive · no cables',
    sata: false,
    sources: ['samsungnvme'],
  },
};

/** Smallest first, as the menu lists them. */
export const powerOptions: Record<PowerChoice, PowerOption> = {
  psu650: {
    name: 'ASUS TUF Gaming 650W Bronze',
    summary: '650 W · fixed cables',
    watts: 650,
    modular: false,
    sixteenPin: false,
    eightPin: 2,
    sata: 4,
    sources: ['tuf650b', 'tuf650cabling'],
  },
  psubronze: {
    name: 'ASUS TUF Gaming 750W Bronze',
    summary: '750 W · fixed cables',
    watts: 750,
    modular: false,
    sixteenPin: false,
    eightPin: 4,
    sata: 4,
    sources: ['tuf750b'],
  },
  psu: {
    name: 'ASUS TUF Gaming 850W Gold',
    summary: '850 W · modular',
    watts: 850,
    modular: true,
    sixteenPin: true,
    eightPin: 3,
    sata: 5,
    sources: ['tuf850g'],
  },
  psu1000: {
    name: 'ASUS TUF Gaming 1000W Gold',
    summary: '1000 W · modular',
    watts: 1000,
    modular: true,
    sixteenPin: true,
    eightPin: 4,
    sata: 5,
    sources: ['tuf1000g', 'tuf1000fan'],
  },
  psu1200: {
    name: 'ASUS TUF Gaming 1200W Gold',
    summary: '1200 W · modular · two 16-pin',
    watts: 1200,
    modular: true,
    sixteenPin: true,
    eightPin: 3,
    sata: 5,
    sources: ['tuf1200g', 'tuf1200fan'],
  },
};

/** The slots, in the order a builder chooses them. */
export const slots: { id: BuildSlot; label: string }[] = [
  { id: 'processor', label: 'Processor' },
  { id: 'cooler', label: 'CPU cooler' },
  { id: 'board', label: 'Motherboard' },
  { id: 'memory', label: 'Memory' },
  { id: 'storage', label: 'Storage' },
  { id: 'graphics', label: 'Graphics card' },
  { id: 'power', label: 'Power supply' },
];

export type AnyOption = Option & { id: string };
const optionTables: { [S in BuildSlot]: Record<DesktopBuild[S], Option> } = {
  processor: processorOptions,
  cooler: coolerOptions,
  board: boardOptions,
  memory: memoryOptions,
  storage: storageOptions,
  graphics: graphicsOptions,
  power: powerOptions,
};

/** The options for one slot, in menu order. */
export function slotOptions<S extends BuildSlot>(slot: S) {
  const table: Record<DesktopBuild[S], Option> = optionTables[slot];
  return (Object.keys(table) as DesktopBuild[S][]).map((id) => ({
    id,
    ...table[id],
  }));
}

/** The part in one slot, by name. */
export function partName<S extends BuildSlot>(build: DesktopBuild, slot: S) {
  const table: Record<DesktopBuild[S], Option> = optionTables[slot];
  return table[build[slot]].name;
}

/** "1 lead", "3 leads". */
export const plural = (n: number, thing: string) =>
  `${n} ${thing}${n === 1 ? '' : 's'}`;

/** Whether a part can physically go into the chosen board. */
export const socketFits = (cpu: ProcessorOption, board: BoardOption) =>
  cpu.socket === board.socket;
export const memoryFits = (ram: MemoryOption, board: BoardOption) =>
  ram.generation === board.memory;

/** How many slots hold something other than the original part. */
export const changedParts = (build: DesktopBuild) =>
  slots.filter(({ id }) => build[id] !== defaultBuild[id]).length;
export const isCustomBuild = (build: DesktopBuild) => changedParts(build) > 0;

/**
 * What is actually on the board. A part that cannot seat stays in its box:
 * the socket keeps its cover, the slots stay empty.
 */
export function fittedParts(build: DesktopBuild) {
  const board = boardOptions[build.board];
  return {
    processor: socketFits(processorOptions[build.processor], board)
      ? build.processor
      : null,
    memory: memoryFits(memoryOptions[build.memory], board)
      ? build.memory
      : null,
  };
}

/**
 * Which tower model a build needs. Every slot changes the geometry: the
 * board's outline and socket, the processor in it or its empty cover, two
 * modules or four or none, and the parts bolted around them.
 */
export function towerKey(build: DesktopBuild) {
  const fitted = fittedParts(build);
  return [
    build.board,
    fitted.processor ?? 'none',
    fitted.memory ?? 'none',
    build.cooler,
    build.graphics,
    build.storage,
    build.power,
  ].join('+');
}

/**
 * The tower pieces whose part the build chooses, and the slot choosing it.
 *
 * The tower keeps these piece ids whatever is installed: the power routes,
 * the hidden list and the selection all hold onto them. What the reader is
 * shown, and where opening the piece leads, follow the part in the slot.
 */
const towerPieces = new Map<
  string,
  'processor' | 'cooler' | 'board' | 'graphics' | 'power'
>([
  ['processor', 'processor'],
  ['cpucooler', 'cooler'],
  ['motherboard', 'board'],
  ['graphicscard', 'graphics'],
  ['psu', 'power'],
]);

/** The concept a tower piece describes under this build. */
export function standIn(id: string, build: DesktopBuild) {
  const slot = towerPieces.get(id);
  return slot && build[slot] !== defaultBuild[slot]
    ? levels[build[slot]].concept
    : id;
}

/** Where opening a piece leads under this build. */
export function opensTo(id: string, build: DesktopBuild): LevelId | null {
  const slot = towerPieces.get(id);
  return slot ? build[slot] : openLevel(id);
}

/**
 * The tower piece that holds each slot's part, so the workspace can point at
 * what just changed. The processor is a piece of its own, unless it cannot
 * seat and the socket is empty; the memory is inside the board assembly, and
 * with no SATA drive the M.2 drive is too.
 */
export function pieceForSlot(slot: BuildSlot, build: DesktopBuild) {
  switch (slot) {
    case 'processor':
      return fittedParts(build).processor ? 'processor' : 'motherboard';
    case 'cooler':
      return 'cpucooler';
    case 'graphics':
      return 'graphicscard';
    case 'power':
      return 'psu';
    case 'storage':
      return storageOptions[build.storage].sata ? 'ssd' : 'motherboard';
    default:
      return 'motherboard';
  }
}

/** The slot a tower piece belongs to, if the build chooses it. */
export function slotForPiece(id: string): BuildSlot | null {
  if (id === 'ssd') return 'storage';
  return towerPieces.get(id) ?? null;
}

/**
 * The auxiliary feed to an installed card other than the original 5090, for
 * the power legend. The original's route keeps its own wording.
 */
export function graphicsFeed(build: DesktopBuild) {
  if (build.graphics === defaultBuild.graphics) return null;
  const gpu = graphicsOptions[build.graphics];
  return {
    label: gpu.connector === '8-pin' ? '8-pin PCIe' : '12V-2x6',
    description: `The installed ${gpu.name} has a direct auxiliary feed from the PSU as well as slot power. Regulators on the card produce lower voltages for the GPU and memory.`,
  };
}
