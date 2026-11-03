import { openLevel } from './manifest.ts';
import { levels, type LevelId } from './levels.ts';
import type { SourceId } from './sources.ts';

/**
 * Build your own desktop: the slots, the parts each one can take, and how a
 * build maps onto the tower. Whether the parts work together is
 * `build-checks.ts`.
 *
 * The choices are parts the project already models, so every option opens
 * into the same detailed part the explorer shows. The board and the case stay
 * fixed: there is one of each.
 *
 * No three.js here. The build workspace asks these questions before the
 * engine has loaded, and the tests import this file directly.
 *
 * Every figure below is a vendor's published number or a measurement of the
 * modelled case, and each option names where it comes from.
 */

export type ProcessorChoice = 'ryzen' | 'corei9';
export type CoolerChoice = 'cooler' | 'liquid';
export type MemoryChoice = 'dimm' | 'ddr4';
export type GraphicsChoice = 'card' | 'rx9070' | 'arcb580';
export type StorageChoice = 'nvmesata' | 'nvme';
export type PowerChoice = 'psu' | 'psubronze';

export interface DesktopBuild {
  processor: ProcessorChoice;
  cooler: CoolerChoice;
  memory: MemoryChoice;
  graphics: GraphicsChoice;
  storage: StorageChoice;
  power: PowerChoice;
}
export type BuildSlot = keyof DesktopBuild;

/** The machine as the explorer has always shown it. */
export const defaultBuild: DesktopBuild = {
  processor: 'ryzen',
  cooler: 'cooler',
  memory: 'dimm',
  graphics: 'card',
  storage: 'nvmesata',
  power: 'psu',
};

/** What the fixed motherboard accepts. */
export const board = {
  socket: 'AM5',
  memory: 'DDR5',
  sources: ['mainboardmanual'] as SourceId[],
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
};

interface Option {
  name: string;
  /** One line under the name in the picker. */
  summary: string;
  sources: SourceId[];
}
export interface ProcessorOption extends Option {
  socket: string;
  /** The power figure the maker publishes, and what it measures. */
  watts: number;
  wattsLabel: string;
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
export interface MemoryOption extends Option {
  generation: 'DDR5' | 'DDR4';
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
    sources: ['ryzen', 'fpsreview9950x'],
  },
  corei9: {
    name: 'Intel Core Ultra 9 285K',
    summary: '24 cores · LGA 1851',
    socket: 'LGA 1851',
    watts: 250,
    wattsLabel: 'maximum turbo power',
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

export const memoryOptions: Record<MemoryChoice, MemoryOption> = {
  dimm: {
    name: 'Kingston FURY Beast DDR5-6000',
    summary: '2 × 16 GB · DDR5',
    generation: 'DDR5',
    sources: ['kf560', 'ddr5architecture'],
  },
  ddr4: {
    name: 'Kingston FURY Beast DDR4-3200',
    summary: '2 × 16 GB · DDR4',
    generation: 'DDR4',
    sources: ['kf432', 'jedecmo329'],
  },
};

export const graphicsOptions: Record<GraphicsChoice, GraphicsOption> = {
  card: {
    name: 'GeForce RTX 5090',
    summary: '575 W · 348 mm',
    watts: 575,
    psu: 1000,
    psuKind: 'recommended',
    psuSource: 'ASUS',
    connector: '12V-2x6',
    length: 348,
    sources: ['specs', 'tuf5090specs'],
  },
  rx9070: {
    name: 'Radeon RX 9070 XT',
    summary: '330 W · 331 mm',
    watts: 330,
    psu: 850,
    psuKind: 'minimum',
    psuSource: 'Sapphire',
    connector: '12V-2x6',
    adapter: { name: '3 × 8-pin', leads: 3 },
    length: 330.8,
    sources: ['nitro9070'],
  },
  arcb580: {
    name: 'Intel Arc B580',
    summary: '190 W · 272 mm',
    watts: 190,
    psu: 600,
    psuKind: 'recommended',
    psuSource: 'Intel',
    connector: '8-pin',
    length: 272,
    sources: ['arcb580'],
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

export const powerOptions: Record<PowerChoice, PowerOption> = {
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
};

/** The slots, in the order a builder fits them. */
export const slots: { id: BuildSlot; label: string }[] = [
  { id: 'processor', label: 'Processor' },
  { id: 'cooler', label: 'CPU cooler' },
  { id: 'memory', label: 'Memory' },
  { id: 'graphics', label: 'Graphics card' },
  { id: 'storage', label: 'Storage' },
  { id: 'power', label: 'Power supply' },
];

const optionTables: { [S in BuildSlot]: Record<DesktopBuild[S], Option> } = {
  processor: processorOptions,
  cooler: coolerOptions,
  memory: memoryOptions,
  graphics: graphicsOptions,
  storage: storageOptions,
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

/** Whether a part can physically go into the fixed board. */
export const socketFits = (cpu: ProcessorOption) => cpu.socket === board.socket;
export const memoryFits = (ram: MemoryOption) =>
  ram.generation === board.memory;

/** Whether any slot holds something other than the original part. */
export const isCustomBuild = (build: DesktopBuild) =>
  slots.some(({ id }) => build[id] !== defaultBuild[id]);

/**
 * The parts that are actually in the tower. A part that cannot seat stays in
 * the box, and the board keeps the one it was built with.
 */
export function installedBuild(build: DesktopBuild): DesktopBuild {
  return {
    ...build,
    processor: socketFits(processorOptions[build.processor])
      ? build.processor
      : defaultBuild.processor,
    memory: memoryFits(memoryOptions[build.memory])
      ? build.memory
      : defaultBuild.memory,
  };
}

/**
 * Which tower model a build needs. The processor and memory sit inside the
 * board assembly, so only the cooler, the card, the drives and the supply
 * change the geometry.
 */
export function towerKey(build: DesktopBuild) {
  return [build.cooler, build.graphics, build.storage, build.power].join('+');
}

/**
 * The tower pieces whose part the build chooses, and the slot choosing it.
 *
 * The tower keeps these piece ids whatever is installed: the power routes,
 * the hidden list and the selection all hold onto them. What the reader is
 * shown, and where opening the piece leads, follow the part in the slot.
 */
const towerPieces = new Map<string, 'cooler' | 'graphics' | 'power'>([
  ['cpucooler', 'cooler'],
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
 * what just changed. The processor and memory are inside the board assembly,
 * and with no SATA drive the M.2 drive is too.
 */
export function pieceForSlot(slot: BuildSlot, build: DesktopBuild) {
  switch (slot) {
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
