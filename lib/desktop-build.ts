import { openLevel } from './manifest.ts';
import { levels, type LevelId } from './levels.ts';
import type { SourceId } from './sources.ts';

/**
 * Build your own desktop: which part goes in each slot, and whether the
 * parts work together.
 *
 * The choices are the desktop scales the project already models, so every
 * option opens into the same detailed part the explorer shows. The board, the
 * case, the cooler and the storage stay fixed: there is one of each.
 *
 * No three.js here. The build panel asks these questions before the engine
 * has loaded, and the tests import this file directly.
 *
 * Every figure below is a vendor's published number, and each option names
 * where it comes from. The checks compare those numbers and say which kind of
 * claim each one is: a part that cannot physically fit is a failure, a supply
 * under the maker's recommendation is a warning, not a prediction that the
 * machine will fail.
 */

export type ProcessorChoice = 'ryzen' | 'corei9';
export type MemoryChoice = 'dimm' | 'ddr4';
export type GraphicsChoice = 'card' | 'rx9070' | 'arcb580';
export type PowerChoice = 'psu' | 'psubronze';

export interface DesktopBuild {
  processor: ProcessorChoice;
  memory: MemoryChoice;
  graphics: GraphicsChoice;
  power: PowerChoice;
}
export type BuildSlot = keyof DesktopBuild;

/** The machine as the explorer has always shown it. */
export const defaultBuild: DesktopBuild = {
  processor: 'ryzen',
  memory: 'dimm',
  graphics: 'card',
  power: 'psu',
};

/** What the fixed motherboard accepts. */
export const board = {
  socket: 'AM5',
  memory: 'DDR5',
  sources: ['mainboardmanual'] as SourceId[],
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
  /** An adapter from 8-pin leads, in the box. */
  adapter?: string;
  /** Overall length, millimetres. */
  length: number;
}
export interface PowerOption extends Option {
  watts: number;
  modular: boolean;
  /** Whether a native 16-pin 12V-2x6 lead is among its outputs. */
  sixteenPin: boolean;
}

export const processorOptions: Record<ProcessorChoice, ProcessorOption> = {
  ryzen: {
    name: 'AMD Ryzen 9 9950X',
    summary: '16 cores · AM5',
    socket: 'AM5',
    watts: 170,
    wattsLabel: 'default TDP',
    sources: ['ryzen'],
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

export const memoryOptions: Record<MemoryChoice, MemoryOption> = {
  dimm: {
    name: 'Kingston FURY Beast DDR5-6000',
    summary: '2 × 16 GB · DDR5',
    generation: 'DDR5',
    sources: ['kf560', 'ddr5architecture'],
  },
  ddr4: {
    name: 'Kingston FURY Beast DDR4-3200',
    summary: '16 GB · DDR4',
    generation: 'DDR4',
    sources: ['jedecmo329'],
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
    adapter: '3 × 8-pin',
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

export const powerOptions: Record<PowerChoice, PowerOption> = {
  psu: {
    name: 'ASUS TUF Gaming 850W Gold',
    summary: '850 W · modular',
    watts: 850,
    modular: true,
    sixteenPin: true,
    sources: ['tuf850g'],
  },
  psubronze: {
    name: 'ASUS TUF Gaming 750W Bronze',
    summary: '750 W · fixed cables',
    watts: 750,
    modular: false,
    sixteenPin: false,
    sources: ['tuf750b'],
  },
};

export const slots: { id: BuildSlot; label: string }[] = [
  { id: 'processor', label: 'Processor' },
  { id: 'memory', label: 'Memory' },
  { id: 'graphics', label: 'Graphics card' },
  { id: 'power', label: 'Power supply' },
];

/** The options for one slot, in menu order. */
export function slotOptions(slot: BuildSlot) {
  const table = {
    processor: processorOptions,
    memory: memoryOptions,
    graphics: graphicsOptions,
    power: powerOptions,
  }[slot] as Record<string, Option>;
  return Object.entries(table).map(([id, option]) => ({
    id: id as LevelId,
    ...option,
  }));
}

/**
 * The longest card the modelled case takes, millimetres: from the slot
 * bracket at the rear panel to the inner face of the front intake fans in
 * `machine.ts`. The case is illustrative, so this is a property of the model,
 * and `tests/build.test.ts` measures every card against the built tower.
 */
export const caseCardClearance = 420;

export type CheckStatus = 'ok' | 'warn' | 'fail';
export interface BuildCheck {
  id: 'socket' | 'memory' | 'supply' | 'connector' | 'length' | 'budget';
  status: CheckStatus;
  title: string;
  detail: string;
  sources: SourceId[];
}

/** Rated draw: the processor's and the card's published power figures. */
export function ratedDraw(build: DesktopBuild) {
  return (
    processorOptions[build.processor].watts +
    graphicsOptions[build.graphics].watts
  );
}

/** Every check, in the order a builder would meet them. */
export function checkBuild(build: DesktopBuild): BuildCheck[] {
  const cpu = processorOptions[build.processor],
    ram = memoryOptions[build.memory],
    gpu = graphicsOptions[build.graphics],
    psu = powerOptions[build.power];
  const checks: BuildCheck[] = [];

  checks.push(
    cpu.socket === board.socket
      ? {
          id: 'socket',
          status: 'ok',
          title: 'Processor fits the socket',
          detail: `The ${cpu.name} is an ${cpu.socket} processor, and the board has an ${board.socket} socket.`,
          sources: [...cpu.sources, ...board.sources],
        }
      : {
          id: 'socket',
          status: 'fail',
          title: 'Processor does not fit the socket',
          detail: `The ${cpu.name} needs an ${cpu.socket} socket. This board has ${board.socket}, so the processor is not installed.`,
          sources: [...cpu.sources, ...board.sources],
        },
  );

  checks.push(
    ram.generation === board.memory
      ? {
          id: 'memory',
          status: 'ok',
          title: 'Memory fits the slots',
          detail: `${ram.generation} modules in ${board.memory} slots.`,
          sources: [...ram.sources, ...board.sources],
        }
      : {
          id: 'memory',
          status: 'fail',
          title: 'Memory does not fit the slots',
          detail: `The key notch of a ${ram.generation} module is in a different place from a ${board.memory} slot's, so it cannot be pushed in. The modules are not installed.`,
          sources: ['jedecmo329', 'ddr5architecture', ...board.sources],
        },
  );

  const short = psu.watts < gpu.psu;
  checks.push({
    id: 'supply',
    status: !short ? 'ok' : gpu.psuKind === 'minimum' ? 'fail' : 'warn',
    title: !short
      ? 'Supply meets the card maker’s figure'
      : gpu.psuKind === 'minimum'
        ? 'Supply is below the card’s minimum'
        : 'Supply is below the card maker’s recommendation',
    detail: `${gpu.psuSource} gives ${gpu.psu} W as the ${gpu.psuKind} supply for the ${gpu.name}. The ${psu.name} is rated ${psu.watts} W.`,
    sources: [...gpu.sources, ...psu.sources],
  });

  checks.push(
    gpu.connector === '8-pin' || psu.sixteenPin
      ? {
          id: 'connector',
          status: 'ok',
          title: 'Power cable matches the card',
          detail:
            gpu.connector === '8-pin'
              ? `The card takes one 8-pin PCIe lead, which the ${psu.name} has.`
              : `The card takes a 16-pin 12V-2x6 lead, which the ${psu.name} has.`,
          sources: [...gpu.sources, ...psu.sources],
        }
      : {
          id: 'connector',
          status: 'warn',
          title: gpu.adapter
            ? 'Card needs its adapter'
            : 'No 16-pin lead for the card',
          detail: gpu.adapter
            ? `The ${psu.name} has no 16-pin 12V-2x6 lead. The card comes with a ${gpu.adapter} adapter for 8-pin leads.`
            : `The ${psu.name} has only 8-pin PCIe leads, and the card has a 16-pin 12V-2x6 socket. It needs a 12V-2x6 cable or an adapter.`,
          sources: [...gpu.sources, ...psu.sources],
        },
  );

  checks.push(
    gpu.length <= caseCardClearance
      ? {
          id: 'length',
          status: 'ok',
          title: 'Card fits the case',
          detail: `${gpu.length} mm long, and the case takes cards up to about ${caseCardClearance} mm.`,
          sources: gpu.sources,
        }
      : {
          id: 'length',
          status: 'fail',
          title: 'Card is too long for the case',
          detail: `${gpu.length} mm long, but the case only takes about ${caseCardClearance} mm.`,
          sources: gpu.sources,
        },
  );

  const draw = ratedDraw(build);
  checks.push({
    id: 'budget',
    status: draw <= psu.watts ? 'ok' : 'fail',
    title:
      draw <= psu.watts
        ? 'Processor and card are within the supply’s rating'
        : 'Processor and card add up to more than the supply',
    detail: `${cpu.watts} W (${cpu.wattsLabel}) plus ${gpu.watts} W for the card is ${draw} W, against ${psu.watts} W. Memory, drives, fans and short peaks add more on top.`,
    sources: [...cpu.sources, ...gpu.sources, ...psu.sources],
  });

  return checks;
}

/** The checks each slot's part takes part in. */
const slotChecks: Record<BuildSlot, BuildCheck['id'][]> = {
  processor: ['socket', 'budget'],
  memory: ['memory'],
  graphics: ['supply', 'connector', 'length', 'budget'],
  power: ['supply', 'connector', 'budget'],
};

/**
 * Whether putting this part in the slot, with the rest of the build as it is,
 * fails a check the part is involved in. A problem elsewhere in the build
 * does not mark every option in every slot.
 */
export function conflicts(
  build: DesktopBuild,
  slot: BuildSlot,
  part: DesktopBuild[BuildSlot],
) {
  return checkBuild({ ...build, [slot]: part }).some(
    (c) => c.status === 'fail' && slotChecks[slot].includes(c.id),
  );
}

/** The worst result across every check. */
export function buildStatus(checks: BuildCheck[]): CheckStatus {
  return checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'ok';
}

/**
 * The parts that are actually in the tower. A part that cannot seat stays in
 * the box, and the board keeps the one it was built with.
 */
export function installedBuild(build: DesktopBuild): DesktopBuild {
  return {
    ...build,
    processor:
      processorOptions[build.processor].socket === board.socket
        ? build.processor
        : defaultBuild.processor,
    memory:
      memoryOptions[build.memory].generation === board.memory
        ? build.memory
        : defaultBuild.memory,
  };
}

/**
 * Which tower model a build needs. Only the card and the supply change the
 * geometry; the processor and memory sit inside the board assembly.
 */
export function towerKey(build: DesktopBuild) {
  return build.graphics + '+' + build.power;
}

/**
 * The concept a tower piece describes under this build.
 *
 * The tower keeps its piece ids, `graphicscard` and `psu`, whatever is
 * installed: the power routes, the hidden list and the selection all hold
 * onto them. What the reader is shown, and where opening the piece leads,
 * follow the part that is actually in the slot.
 */
export function standIn(id: string, build: DesktopBuild) {
  if (id === 'graphicscard' && build.graphics !== defaultBuild.graphics)
    return levels[build.graphics].concept;
  if (id === 'psu' && build.power !== defaultBuild.power)
    return levels[build.power].concept;
  return id;
}

/** Where opening a piece leads under this build. */
export function opensTo(id: string, build: DesktopBuild): LevelId | null {
  if (id === 'graphicscard') return build.graphics;
  if (id === 'psu') return build.power;
  return openLevel(id);
}

/** The auxiliary feed to the installed card, for the power legend. */
export function graphicsFeed(build: DesktopBuild) {
  const gpu = graphicsOptions[build.graphics];
  return {
    label: gpu.connector === '8-pin' ? '8-pin PCIe' : '12V-2x6',
    description: `The installed ${gpu.name} has a direct auxiliary feed from the PSU as well as slot power. Regulators on the card produce lower voltages for the GPU and memory.`,
  };
}
