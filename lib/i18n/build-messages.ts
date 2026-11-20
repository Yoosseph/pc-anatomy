import type {
  BoardOption,
  GraphicsOption,
  MemoryOption,
  PowerOption,
  ProcessorOption,
  Radiator,
} from '../desktop-build.ts';
import { pack } from './pack.ts';

/**
 * The build workspace's own strings, in English: its panels, the facts on
 * each part and the compatibility report.
 *
 * Kept apart from `messages.ts` because only the build workspace reads it,
 * and the workspace is its own download: these strings stay out of the
 * first one. Other languages fill in the same shape, in their pack.
 */
const en = {
  workspace: {
    status: { ok: 'Works', warn: 'Check', fail: 'Problem' },
    /** Short names for the slot tags on each check. */
    slotTags: {
      processor: 'CPU',
      cooler: 'Cooler',
      board: 'Board',
      memory: 'RAM',
      storage: 'Storage',
      graphics: 'GPU',
      power: 'PSU',
    },
    explorer: 'Explorer',
    panels: 'Build panels',
    parts: 'Parts',
    checks: 'Checks',
    hidePanels: 'Hide the panels',
    showPanels: 'Show the panels',
    hideParts: 'Hide parts',
    showParts: 'Show parts',
    slotCount: (n: number) => `${n} slots`,
    fixedCase:
      'The case stays the same in every build: an ATX tower with standoffs for ATX and micro-ATX boards, room for a 420 mm card and three 120 mm front fans.',
    compatibility: 'Compatibility',
    hideCompatibility: 'Hide compatibility',
    showCompatibility: 'Show compatibility',
    checkCount: (n: number) => `${n} check${n === 1 ? '' : 's'}`,
    figuresNote:
      'Figures are each maker’s published numbers, or measurements of the modelled case. A supply below a recommendation may still run the machine; one below a stated minimum is not supported by the card’s maker.',
    restore: 'Back to the original build',
    fitting: 'Fitting the parts…',
    shareTitle: 'Copy a link to this build',
    copied: 'Copied',
    share: 'Share your build',
    linkCopied: 'Link copied to your clipboard',
    copyLink: 'Copy this link',
    copiedHint:
      'Paste it into a message or a post. Whoever opens it sees this build, part for part.',
    copyBlocked:
      'The browser did not allow copying, so the link is selected for you to copy.',
    filterByMaker: (slot: string) => `Filter ${slot.toLowerCase()} by maker`,
    allOptions: (n: number) => `All ${n}`,
    options: (slot: string) => `${slot} options`,
    conflicts: 'Conflicts',
    slots: 'Slots',
    verdict: (flagged: number) =>
      `Compatibility: ${
        flagged
          ? `${flagged} thing${flagged === 1 ? '' : 's'} to look at`
          : 'everything works'
      }`,
    ratedDraw: 'Rated draw',
    ofWatts: (watts: number) => `of ${watts} W`,
    groups: { fail: 'Problems to fix', warn: 'Worth checking', ok: 'Passing' },
    counts: { fail: 'to fix', warn: 'to check', ok: 'pass' },
    allPass: (n: number) => `All ${n} checks pass`,
    passing: (n: number) => `${n} check${n === 1 ? '' : 's'} passing`,
    allWork: 'Everything works together',
    worksWith: (n: number) =>
      `Works, with ${n} thing${n === 1 ? '' : 's'} to check`,
    toFix: (n: number) => `${n} problem${n === 1 ? '' : 's'} to fix`,
    passCount: (ok: number, total: number) => `${ok} of ${total} checks pass`,
    change: (slot: string) => `Change the ${slot.toLowerCase()}`,
  },
  /** The facts on each option in the picker. */
  facts: {
    radiator: (mm: number) => `${mm} mm radiator`,
    cardRoom: (mm: number) => `Card room ${mm} mm`,
    tall: (mm: number) => `${mm} mm tall`,
    sata25: '2.5-inch SATA',
    lengthOf: (length: number, room: number) => `${length} of ${room} mm`,
    modular: 'Modular',
    fixedCables: 'Fixed cables',
    sixteenPinLead: '12V-2x6 lead',
    drawOf: (draw: number, watts: number) => `${draw} of ${watts} W rated`,
  },
  /** The build workspace's compatibility checks: titles, then what they found. */
  checks: {
    socketFits: 'Processor fits the socket',
    socketFitsDetail: (cpu: ProcessorOption, board: BoardOption) =>
      `The ${cpu.name} is an ${cpu.socket} processor, and the ${board.name} has an ${board.socket} socket.`,
    socketMisfit: 'Processor does not fit the socket',
    socketMisfitDetail: (cpu: ProcessorOption, board: BoardOption) =>
      `The ${cpu.name} needs an ${cpu.socket} socket. The ${board.name} has ${board.socket}, so the processor stays in its box and the socket keeps its cover.`,
    radiatorFits: 'Radiator fits the front of the case',
    radiatorTooLong: 'Radiator is too long for the case',
    radiatorDetail: (
      radiator: Radiator,
      room: { frontFans: number; roof: number },
    ) =>
      `The ${radiator.length} mm radiator takes ${radiator.fans} 120 mm fans. The case has ${room.frontFans} behind the front panel, and ${room.roof} mm between the board and the roof, too little for a radiator and its fans.`,
    towerFits: 'Cooler fits under the side panel',
    towerTooTall: 'Cooler is too tall for the case',
    towerDetail: (height: number, room: number) =>
      `The tower stands ${height} mm off the board, and the case has about ${room} mm to the side glass.`,
    boardFits: 'Board fits the case',
    boardMisfit: 'Board does not fit the case',
    boardDetail: (
      board: Pick<BoardOption, 'name' | 'formFactor' | 'size'>,
      boards: readonly string[],
    ) =>
      `The ${board.name} is ${board.formFactor === 'ATX' ? 'an' : 'a'} ${board.formFactor} board, ${board.size[0]} × ${board.size[1]} mm, and the case has standoffs for ${boards.join(' and ')} boards.`,
    memoryFits: 'Memory fits the slots',
    memoryFitsDetail: (ram: MemoryOption, board: BoardOption) =>
      `${ram.modules} ${ram.generation} modules in the board’s four ${board.memory} slots.`,
    memoryMisfit: 'Memory does not fit the slots',
    memoryMisfitDetail: (ram: MemoryOption, board: BoardOption) =>
      `The key notch of a ${ram.generation} module is in a different place from a ${board.memory} slot’s, so it cannot be pushed in. The slots stay empty.`,
    speedProfile: (speed: number) =>
      `The kit reaches DDR5-${speed} through its XMP or EXPO profile, which runs it past the processor’s rating.`,
    speedRated: 'Memory speed is within the published rating',
    speedUnrated: (maker: string, cpu: ProcessorOption, modules: number) =>
      `${maker} rates the ${cpu.name} for up to DDR5-${cpu.memorySpeed[2]} and publishes no separate figure for ${modules} modules.`,
    speedRating: (maker: string, cpu: ProcessorOption) =>
      `${maker} rates the ${cpu.name} at DDR5-${cpu.memorySpeed[2]} with two single-rank modules${cpu.memorySpeed[4] ? ` and DDR5-${cpu.memorySpeed[4]} with four` : ''}.`,
    speedSlower: 'Four modules run slower',
    speedSlowerDetail: (rated: number) =>
      `With every slot filled that profile is unlikely to hold, so expect the memory to run nearer DDR5-${rated}.`,
    speedWithin: 'Memory speed is within reach',
    lengthRadiator: (length: number, thickness: number) =>
      `With the radiator inside the front fans, that is ${length} mm less its ${thickness} mm.`,
    lengthFits: 'Card fits the case',
    lengthFitsDetail: (length: number, room: number) =>
      `${length} mm long, and the case takes cards up to about ${room} mm.`,
    lengthTooLong: 'Card is too long for the case',
    lengthTooLongDetail: (length: number, room: number) =>
      `${length} mm long, but the case only takes about ${room} mm.`,
    supplyDetail: (gpu: GraphicsOption, psu: PowerOption) =>
      `${gpu.psuSource} gives ${gpu.psu} W as the ${gpu.psuKind} supply for the ${gpu.name}. The ${psu.name} is rated ${psu.watts} W.`,
    supplyMeets: 'Supply meets the card maker’s figure',
    supplyBelowMinimum: 'Supply is below the card’s minimum',
    supplyBelowRecommendation:
      'Supply is below the card maker’s recommendation',
    cableMatches: 'Power cable matches the card',
    eightPinDetail: (psu: PowerOption) =>
      `The card takes one 8-pin PCIe lead, and the ${psu.name} has ${psu.eightPin} 8-pin PCIe lead${psu.eightPin === 1 ? '' : 's'}.`,
    noLead: 'No lead for the card',
    noEightPinDetail: (psu: PowerOption) =>
      `The card takes an 8-pin PCIe lead, and the ${psu.name} has none.`,
    sixteenPinDetail: (psu: PowerOption) =>
      `The card takes a 16-pin 12V-2x6 lead, which the ${psu.name} has.`,
    noSixteenPin: 'No 16-pin lead for the card',
    noSixteenPinDetail: (psu: PowerOption) =>
      `The ${psu.name} has only 8-pin PCIe leads, and the card has a 16-pin 12V-2x6 socket. It needs a 12V-2x6 cable or an adapter.`,
    needsAdapter: 'Card needs its adapter',
    adapterDetail: (
      psu: PowerOption,
      adapter: { name: string; leads: number },
    ) =>
      `The ${psu.name} has no 16-pin 12V-2x6 lead. The card comes with a ${adapter.name} adapter, and the supply has ${psu.eightPin} 8-pin PCIe lead${psu.eightPin === 1 ? '' : 's'} to fill it.`,
    adapterShort: 'Not enough leads for the card’s adapter',
    adapterShortDetail: (
      psu: PowerOption,
      adapter: { name: string; leads: number },
    ) =>
      `The ${psu.name} has no 16-pin 12V-2x6 lead, and the card’s ${adapter.name} adapter needs ${adapter.leads} leads where the supply has ${psu.eightPin}.`,
    m2: 'The M.2 drive sits in the board’s M.2 slot and takes its power through it.',
    driveFits: 'Drive fits the board',
    noCables: 'The build needs no drive cables.',
    drivesConnected: 'Both drives are connected',
    sataDetail: (psu: PowerOption) =>
      `The SATA SSD takes a data cable to one of the board’s SATA ports and a power lead from the ${psu.name}, which has ${psu.sata} SATA power connector${psu.sata === 1 ? '' : 's'}.`,
    noSataLead: 'No power lead for the SATA drive',
    noSataLeadDetail: (psu: PowerOption) =>
      `The SATA SSD needs a SATA power lead, and the ${psu.name} has none.`,
    unseated: (cpu: ProcessorOption) =>
      `The ${cpu.name} is counted as chosen, though it does not fit this board.`,
    budgetDetail: (
      cpu: ProcessorOption,
      gpu: GraphicsOption,
      psu: PowerOption,
    ) =>
      `${cpu.watts} W (${cpu.wattsLabel}) plus ${gpu.watts} W for the card is ${cpu.watts + gpu.watts} W, against ${psu.watts} W. Memory, drives, fans and short peaks add more on top.`,
    budgetWithin: 'Processor and card are within the supply’s rating',
    budgetOver: 'Processor and card add up to more than the supply',
  },
};

export type BuildMessages = typeof en;
export { en as buildEn };

/** The build workspace's strings in the visitor's language. */
export const buildText: BuildMessages = pack?.build ?? en;
