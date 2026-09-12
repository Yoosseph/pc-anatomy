/**
 * The exploration tree.
 *
 * Scales used to be a single chain (card → die → GPC → TPC → SM). The machine
 * is a tree, so this is a tree: every level names its parent and the path is
 * walked rather than looked up in a table. Adding a branch means adding an
 * entry here; navigation, breadcrumbs, lighting and the disassembly phases all
 * read from it.
 */
export type LevelId =
  | 'pc'
  | 'motherboard'
  | 'cpu'
  | 'psu'
  | 'fan'
  | 'cooler'
  | 'disk'
  | 'card'
  | 'die'
  | 'gpc'
  | 'tpc'
  | 'sm';

export interface LevelDef {
  id: LevelId;
  /** null only for the root of the machine. */
  parent: LevelId | null;
  /** Breadcrumb and navigation label. */
  name: string;
  /** Stage heading shown above the specimen when nothing is selected. */
  title: string;
  /** Caption under the stage heading. */
  caption: string;
  /** One line describing what this scale contains. */
  summary: string;
  /**
   * `physical` levels are lit like hardware, keep their real size
   * relationships in the inventory, and stage their explosion so cooling
   * leaves first. `logical` levels are diagrams and are lit flat.
   */
  kind: 'physical' | 'logical';
  /** The concept whose `open` leads here — the thing you drilled into. */
  concept: string;
  /** Labels along the disassembly timeline, with their slider positions. */
  phases: readonly (readonly [string, number])[];
  /** Marked false while a branch is still a placeholder. */
  detailed: boolean;
  /**
   * Set on the levels directly under the machine. It names the subsystem menu
   * that this scale and everything beneath it are listed under, so a viewer
   * picks "GPU" and then chooses a scale, rather than tunnelling through the
   * card to reach the die.
   */
  branchLabel?: string;
  /**
   * Multiplies how far pieces travel as they come apart. A tower needs much
   * bigger gaps than a card before its subsystems stop touching.
   */
  spread?: number;
}

const physicalPhases = [
  ['Assembled', 0],
  ['Cooling', 25],
  ['Board', 50],
  ['Package', 75],
  ['Inventory', 100],
] as const;

const logicalPhases = [
  ['Grouped', 0],
  ['Resources', 25],
  ['Partitions', 50],
  ['Separated', 75],
  ['Inventory', 100],
] as const;

export const levels: Record<LevelId, LevelDef> = {
  pc: {
    id: 'pc',
    parent: null,
    name: 'Desktop PC',
    title: 'The complete machine.',
    caption: 'ATX TOWER',
    summary: 'Case, board, power, storage and cooling',
    kind: 'physical',
    concept: 'pc',
    spread: 2.4,
    phases: [
      ['Assembled', 0],
      ['Panels', 25],
      ['Subsystems', 50],
      ['Modules', 75],
      ['Inventory', 100],
    ],
    detailed: true,
  },
  motherboard: {
    id: 'motherboard',
    parent: 'pc',
    name: 'Motherboard',
    title: 'The motherboard.',
    caption: 'ATX MAINBOARD',
    summary: 'Sockets, slots, chipset and rear I/O',
    kind: 'physical',
    branchLabel: 'Motherboard',
    concept: 'motherboard',
    spread: 1.7,
    phases: [
      ['Assembled', 0],
      ['Cooling', 25],
      ['Modules', 50],
      ['Sockets', 75],
      ['Inventory', 100],
    ],
    detailed: true,
  },
  cpu: {
    id: 'cpu',
    parent: 'motherboard',
    name: 'CPU',
    title: 'The processor package.',
    caption: 'DESKTOP CPU · PLACEHOLDER SCALE',
    summary: 'Cores, cache and the memory controller',
    kind: 'logical',
    concept: 'cpu',
    phases: logicalPhases,
    detailed: false,
  },
  psu: {
    id: 'psu',
    parent: 'pc',
    name: 'Power supply',
    title: 'Inside the power supply.',
    caption: 'ATX SWITCHING SUPPLY',
    summary: 'Mains in, twelve volts out',
    kind: 'physical',
    branchLabel: 'Power supply',
    concept: 'psu',
    spread: 1.9,
    phases: [
      ['Assembled', 0],
      ['Housing', 25],
      ['Stages', 50],
      ['Components', 75],
      ['Inventory', 100],
    ],
    detailed: true,
  },
  fan: {
    id: 'fan',
    parent: 'pc',
    name: 'Case fan',
    title: 'Inside a fan.',
    caption: '120 MM AXIAL FAN',
    summary: 'Frame, impeller, motor and bearing',
    kind: 'physical',
    branchLabel: 'Cooling',
    concept: 'casefan',
    spread: 1.6,
    phases: [
      ['Assembled', 0],
      ['Impeller', 25],
      ['Motor', 50],
      ['Parts', 75],
      ['Inventory', 100],
    ],
    detailed: true,
  },
  cooler: {
    id: 'cooler',
    parent: 'pc',
    name: 'CPU cooler',
    title: 'Inside the cooler.',
    caption: 'TOWER AIR COOLER',
    summary: 'Coldplate, heat pipes and fin stack',
    kind: 'physical',
    branchLabel: 'Cooling',
    concept: 'cpucooler',
    spread: 1.7,
    phases: [
      ['Assembled', 0],
      ['Fan', 25],
      ['Fins', 50],
      ['Mount', 75],
      ['Inventory', 100],
    ],
    detailed: true,
  },
  disk: {
    id: 'disk',
    parent: 'pc',
    name: 'Hard disk',
    title: 'Inside the hard disk.',
    caption: '3.5-INCH DRIVE',
    summary: 'Platters, heads and the voice coil',
    kind: 'physical',
    branchLabel: 'Storage',
    concept: 'hdd',
    spread: 1.8,
    phases: [
      ['Assembled', 0],
      ['Cover', 25],
      ['Platters', 50],
      ['Mechanism', 75],
      ['Inventory', 100],
    ],
    detailed: true,
  },
  card: {
    id: 'card',
    parent: 'pc',
    name: 'RTX 5090',
    title: 'The complete assembly.',
    caption: 'RTX 5090',
    summary: 'The whole graphics card',
    kind: 'physical',
    branchLabel: 'GPU',
    concept: 'card',
    phases: physicalPhases,
    detailed: true,
  },
  die: {
    id: 'die',
    parent: 'card',
    name: 'GB202',
    title: 'Inside the processor.',
    caption: 'GB202 · BLACKWELL',
    summary: 'Inside the Blackwell chip',
    kind: 'logical',
    concept: 'silicon',
    phases: logicalPhases,
    detailed: true,
  },
  gpc: {
    id: 'gpc',
    parent: 'die',
    name: 'GPC',
    title: 'A graphics processing cluster.',
    caption: 'REPRESENTATIVE FULL GPC',
    summary: 'One cluster of the compute array',
    kind: 'logical',
    concept: 'gpc',
    phases: logicalPhases,
    detailed: true,
  },
  tpc: {
    id: 'tpc',
    parent: 'gpc',
    name: 'TPC',
    title: 'A texture processing cluster.',
    caption: 'TPC',
    summary: 'A pair of multiprocessors',
    kind: 'logical',
    concept: 'tpc',
    phases: logicalPhases,
    detailed: true,
  },
  sm: {
    id: 'sm',
    parent: 'tpc',
    name: 'SM',
    title: 'A streaming multiprocessor.',
    caption: 'SM · EXECUTION RESOURCES',
    summary: 'Inside a streaming multiprocessor',
    kind: 'logical',
    concept: 'sm',
    phases: logicalPhases,
    detailed: true,
  },
};

export const levelIds = Object.keys(levels) as LevelId[];

export const rootLevel: LevelId = 'pc';

/** Root-first path to a level. Replaces the old hand-written table. */
export function levelPath(id: LevelId): LevelId[] {
  const path: LevelId[] = [];
  // Bounded by the number of levels so a mis-authored cycle cannot hang the UI.
  for (
    let cursor: LevelId | null = id, guard = 0;
    cursor && guard <= levelIds.length;
    cursor = levels[cursor].parent, guard++
  )
    path.unshift(cursor);
  return path;
}

/** Direct children of a level, in declaration order. */
export function levelChildren(id: LevelId): LevelId[] {
  return levelIds.filter((l) => levels[l].parent === id);
}

export function isPhysical(id: LevelId) {
  return levels[id].kind === 'physical';
}

/** Legacy display names, kept so existing call sites keep working. */
export const levelNames = Object.fromEntries(
  levelIds.map((id) => [id, levels[id].name]),
) as Record<LevelId, string>;


/** The scale directly under the machine that this one belongs to. */
export function branchRoot(id: LevelId): LevelId | null {
  const path = levelPath(id);
  return path.length > 1 ? path[1] : null;
}

export interface Branch {
  /** The first scale in the menu, used as its stable key. */
  root: LevelId;
  label: string;
  /** Every scale under this heading, outermost first. */
  levels: LevelId[];
}

/**
 * The subsystem menus, grouped by label rather than one per branch: the case
 * fan and the tower cooler are both cooling, so they share a heading instead
 * of producing two menus of one entry each.
 */
export function branches(): Branch[] {
  const grouped = new Map<string, LevelId[]>();
  for (const root of levelIds.filter((id) => levels[id].parent === rootLevel)) {
    const label = levels[root].branchLabel ?? levels[root].name;
    grouped.set(label, [
      ...(grouped.get(label) ?? []),
      ...levelIds.filter((id) => branchRoot(id) === root),
    ]);
  }
  return [...grouped].map(([label, scales]) => ({
    root: scales[0],
    label,
    levels: scales,
  }));
}
