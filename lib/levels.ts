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
  | 'dimm'
  | 'dram'
  | 'banks'
  | 'bank'
  | 'ryzen'
  | 'ryzenio'
  | 'corei9'
  | 'coreio'
  | 'psu'
  | 'psubronze'
  | 'fan'
  | 'cooler'
  | 'liquid'
  | 'ssd'
  | 'nvme'
  | 'card'
  | 'die'
  | 'gpc'
  | 'tpc'
  | 'sm'
  | 'rx9070'
  | 'navi48'
  | 'rxse'
  | 'rxwgp'
  | 'rxcu'
  | 'arcb580'
  | 'bmg'
  | 'xeslice'
  | 'xecore'
  | 'xve';

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
  /** The concept whose `open` leads here: the thing you drilled into. */
  concept: string;
  /** Labels along the disassembly timeline, with their slider positions. */
  phases: readonly (readonly [string, number])[];
  /** Marked false while a branch is still a placeholder. */
  detailed: boolean;
  /**
   * Set on a subsystem root, including nested roots such as an M.2 drive. It names the subsystem menu
   * that this scale and everything beneath it are listed under, so a viewer
   * picks "GPU" and then chooses a scale, rather than tunnelling through the
   * card to reach the die.
   */
  branchLabel?: string;
  /**
   * A nested dropdown inside the subsystem menu. The GPU menu holds three
   * different cards, and each card's scales belong together: an RDNA 4 shader
   * engine is not a step inside the RTX 5090. Set on the card that starts a
   * sub-menu; every scale beneath it is listed under the same heading.
   */
  submenu?: string;
  /** One line under the sub-menu heading: who makes it and on what architecture. */
  submenuNote?: string;
  /**
   * Multiplies how far pieces travel as they come apart. A tower needs much
   * bigger gaps than a card before its subsystems stop touching.
   */
  spread?: number;
  /**
   * An alternative that is not fitted to the machine as modelled.
   *
   * Only one processor cooler can be bolted to one socket, and only one
   * processor sits in it, so the parts you can point at inside the case are
   * whichever ones this build happens to use. The others are real scales with
   * real content and they stay listed in their subsystem menu; they simply
   * have nothing to click on at the scale above. Marking that here keeps the
   * "every scale is reachable" check honest instead of forcing the machine to
   * carry two coolers and two processors at once.
   */
  alternative?: boolean;
}

const dissectionPhases = [
  ['Assembled', 0],
  ['Dissection', 50],
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
    phases: dissectionPhases,
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
    phases: dissectionPhases,
    detailed: true,
  },
  dimm: {
    id: 'dimm',
    parent: 'motherboard',
    name: 'DDR5 module',
    title: 'Inside the memory module.',
    caption: 'DDR5 UDIMM',
    summary: 'Board, memory chips, power management and contacts',
    kind: 'physical',
    branchLabel: 'Memory',
    concept: 'ram',
    spread: 1.4,
    phases: dissectionPhases,
    detailed: true,
  },
  dram: {
    id: 'dram',
    parent: 'dimm',
    name: 'DRAM package',
    title: 'Inside a memory chip.',
    caption: 'DDR5 DRAM · 16 GBIT X8',
    summary: 'Substrate, die and solder balls',
    kind: 'physical',
    concept: 'dramchip',
    spread: 1.2,
    phases: dissectionPhases,
    detailed: true,
  },
  banks: {
    id: 'banks',
    parent: 'dram',
    name: 'DRAM banks',
    title: 'The bank array.',
    caption: 'DDR5 DIE · BANK GROUPS',
    summary: 'Bank groups, banks and I/O periphery',
    kind: 'logical',
    concept: 'dramdie',
    phases: dissectionPhases,
    detailed: true,
  },
  bank: {
    id: 'bank',
    parent: 'banks',
    name: 'Bank',
    title: 'Rows, columns and cells.',
    caption: 'MEMORY ARRAY · ROW × COLUMN',
    summary: 'Wordlines, bitlines, cells and sense amplifiers',
    kind: 'logical',
    concept: 'drambank',
    phases: dissectionPhases,
    detailed: true,
  },
  ryzen: {
    id: 'ryzen',
    parent: 'motherboard',
    name: 'Ryzen 9 9950X',
    title: 'Sixteen cores, on three dies.',
    caption: 'AMD RYZEN 9 9950X · ZEN 5',
    summary: 'Two core complex dies and an I/O die',
    kind: 'logical',
    concept: 'ryzenpackage',
    phases: dissectionPhases,
    detailed: true,
  },
  ryzenio: {
    id: 'ryzenio',
    parent: 'ryzen',
    name: 'Ryzen I/O die',
    title: 'Inside the Ryzen I/O die.',
    caption: 'ZEN 5 I/O DIE · TSMC 6 NM',
    summary: 'Memory, PCIe, display and chiplet fabric',
    kind: 'logical',
    concept: 'zeniod',
    phases: dissectionPhases,
    detailed: true,
  },
  corei9: {
    id: 'corei9',
    parent: 'motherboard',
    // The board is modelled with the AMD part seated, so the Intel package is
    // the alternative: same socket position, different processor entirely.
    alternative: true,
    name: 'Core Ultra 9 285K',
    title: 'Twenty four cores, on stacked tiles.',
    caption: 'INTEL CORE ULTRA 9 285K · ARROW LAKE',
    summary: 'Compute, SoC, graphics and I/O tiles on a base',
    kind: 'logical',
    concept: 'corepackage',
    phases: dissectionPhases,
    detailed: true,
  },
  coreio: {
    id: 'coreio',
    parent: 'corei9',
    name: 'Core Ultra I/O tile',
    title: 'Inside the I/O extender tile.',
    caption: 'ARROW LAKE I/O EXTENDER · TSMC N6',
    summary: 'PCIe, Thunderbolt and die-to-die links',
    kind: 'logical',
    concept: 'arrowio',
    phases: dissectionPhases,
    detailed: true,
  },
  psu: {
    id: 'psu',
    parent: 'pc',
    name: 'Modular · TUF Gaming 850W Gold',
    title: 'Inside a modular power supply.',
    caption: 'ASUS TUF GAMING 850W GOLD',
    summary: 'ASUS · 850 W · 80 PLUS Gold',
    kind: 'physical',
    branchLabel: 'Power supply',
    concept: 'psu',
    spread: 1.9,
    phases: dissectionPhases,
    detailed: true,
  },
  psubronze: {
    id: 'psubronze',
    parent: 'pc',
    alternative: true,
    name: 'Non-modular · TUF Gaming 750W Bronze',
    title: 'Inside a fixed-cable power supply.',
    caption: 'ASUS TUF GAMING 750W BRONZE',
    summary: 'ASUS · 750 W · 80 PLUS Bronze',
    kind: 'physical',
    branchLabel: 'Power supply',
    concept: 'bronzepsucase',
    spread: 1.9,
    phases: dissectionPhases,
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
    phases: dissectionPhases,
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
    phases: dissectionPhases,
    detailed: true,
  },
  liquid: {
    id: 'liquid',
    parent: 'pc',
    // The machine is built with the air tower bolted to the socket, so the
    // liquid loop is the alternative: same job, same socket, different answer.
    alternative: true,
    name: 'Liquid cooling',
    title: 'Inside the liquid loop.',
    caption: '360 MM ALL-IN-ONE',
    summary: 'Radiator, pump, coldplate and tubing',
    kind: 'physical',
    branchLabel: 'Cooling',
    concept: 'aio',
    spread: 1.9,
    phases: dissectionPhases,
    detailed: true,
  },
  ssd: {
    id: 'ssd',
    parent: 'pc',
    name: 'SATA SSD',
    title: 'Inside the solid-state drive.',
    caption: '2.5-INCH SATA SSD',
    summary: 'NAND flash, controller and separate SATA connectors',
    kind: 'physical',
    branchLabel: 'Storage',
    concept: 'ssd',
    spread: 1.7,
    phases: dissectionPhases,
    detailed: true,
  },
  nvme: {
    id: 'nvme',
    parent: 'motherboard',
    name: 'M.2 NVMe SSD',
    title: 'Inside an M.2 SSD.',
    caption: 'M.2 2280 · NVMe OVER PCIe',
    summary: 'Controller, NAND flash, DRAM and keyed edge contacts',
    kind: 'physical',
    branchLabel: 'Storage',
    concept: 'nvme',
    spread: 1.5,
    phases: dissectionPhases,
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
    submenu: 'RTX 5090',
    submenuNote: 'NVIDIA · Blackwell',
    concept: 'card',
    phases: dissectionPhases,
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
    phases: dissectionPhases,
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
    phases: dissectionPhases,
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
    phases: dissectionPhases,
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
    phases: dissectionPhases,
    detailed: true,
  },
  rx9070: {
    id: 'rx9070',
    parent: 'pc',
    // The tower is built around the RTX 5090, and one primary slot holds one
    // card. The Radeon is a second, complete card you can take apart from the
    // GPU menu, not something the machine carries at the same time.
    alternative: true,
    name: 'RX 9070 XT',
    title: 'A Radeon, fully assembled.',
    caption: 'SAPPHIRE NITRO+ · RX 9070 XT',
    summary: 'The whole graphics card',
    kind: 'physical',
    branchLabel: 'GPU',
    submenu: 'RX 9070 XT',
    submenuNote: 'AMD · RDNA 4',
    concept: 'rxcard',
    phases: dissectionPhases,
    detailed: true,
  },
  navi48: {
    id: 'navi48',
    parent: 'rx9070',
    name: 'Navi 48',
    title: 'Inside the Navi 48 processor.',
    caption: 'NAVI 48 · RDNA 4',
    summary: 'Inside the RDNA 4 chip',
    kind: 'logical',
    concept: 'rxgpu',
    phases: dissectionPhases,
    detailed: true,
  },
  rxse: {
    id: 'rxse',
    parent: 'navi48',
    name: 'Shader engine',
    title: 'A shader engine.',
    caption: 'SE · ONE OF FOUR',
    summary: 'Eight workgroup processors and a raster pipeline',
    kind: 'logical',
    concept: 'rxse',
    phases: dissectionPhases,
    detailed: true,
  },
  rxwgp: {
    id: 'rxwgp',
    parent: 'rxse',
    name: 'Workgroup processor',
    title: 'A workgroup processor.',
    caption: 'WGP · DUAL COMPUTE UNIT',
    summary: 'A pair of compute units',
    kind: 'logical',
    concept: 'rxwgp',
    phases: dissectionPhases,
    detailed: true,
  },
  rxcu: {
    id: 'rxcu',
    parent: 'rxwgp',
    name: 'Compute unit',
    title: 'A compute unit.',
    caption: 'CU · EXECUTION RESOURCES',
    summary: 'Inside an RDNA 4 compute unit',
    kind: 'logical',
    concept: 'rxcu',
    phases: dissectionPhases,
    detailed: true,
  },
  arcb580: {
    id: 'arcb580',
    parent: 'pc',
    // Like the Radeon, a complete second card listed under GPU rather than a
    // part fitted to the tower.
    alternative: true,
    name: 'Arc B580',
    title: 'An Arc card, fully assembled.',
    caption: 'INTEL ARC B580 · LIMITED EDITION',
    summary: 'The whole graphics card',
    kind: 'physical',
    branchLabel: 'GPU',
    submenu: 'Arc B580',
    submenuNote: 'Intel · Xe2',
    concept: 'arccard',
    phases: dissectionPhases,
    detailed: true,
  },
  bmg: {
    id: 'bmg',
    parent: 'arcb580',
    name: 'BMG-G21',
    title: 'Inside the Battlemage processor.',
    caption: 'BMG-G21 · XE2-HPG',
    summary: 'Inside the Xe2 chip',
    kind: 'logical',
    concept: 'arcgpu',
    phases: dissectionPhases,
    detailed: true,
  },
  xeslice: {
    id: 'xeslice',
    parent: 'bmg',
    name: 'Render slice',
    title: 'A render slice.',
    caption: 'RENDER SLICE · ONE OF FIVE',
    summary: 'Four Xe-cores with texture and pixel hardware',
    kind: 'logical',
    concept: 'xeslice',
    phases: dissectionPhases,
    detailed: true,
  },
  xecore: {
    id: 'xecore',
    parent: 'xeslice',
    name: 'Xe-core',
    title: 'An Xe-core.',
    caption: 'XE2 CORE',
    summary: 'Eight vector engines, a ray tracing unit and cache',
    kind: 'logical',
    concept: 'xecore',
    phases: dissectionPhases,
    detailed: true,
  },
  xve: {
    id: 'xve',
    parent: 'xecore',
    name: 'Vector engine',
    title: 'A vector engine.',
    caption: 'XVE · EXECUTION RESOURCES',
    summary: 'Inside an Xe2 vector engine',
    kind: 'logical',
    concept: 'xve',
    phases: dissectionPhases,
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

/** The nearest ancestor (or this level) declaring a subsystem menu. */
export function branchRoot(id: LevelId): LevelId | null {
  const path = levelPath(id);
  return path.reverse().find((level) => levels[level].branchLabel) ?? null;
}

export interface Submenu {
  /** The scale that starts the sub-menu, used as its stable key. */
  root: LevelId;
  label: string;
  /** Maker and architecture, shown under the heading. */
  note: string;
  /** Every scale in the sub-menu, outermost first. */
  levels: LevelId[];
}

export interface Branch {
  /** The first scale in the menu, used as its stable key. */
  root: LevelId;
  label: string;
  /** Every scale under this heading, outermost first. */
  levels: LevelId[];
  /**
   * Nested dropdowns, when the menu holds several distinct products. Empty for
   * an ordinary menu; otherwise every scale in `levels` sits in exactly one.
   */
  submenus: Submenu[];
}

/** The nearest ancestor (or this level) that starts a nested dropdown. */
export function submenuRoot(id: LevelId): LevelId | null {
  const path = levelPath(id);
  return path.reverse().find((level) => levels[level].submenu) ?? null;
}

/**
 * The subsystem menus, grouped by label rather than one per branch: the case
 * fan and the tower cooler are both cooling, so they share a heading instead
 * of producing two menus of one entry each.
 */
export function branches(): Branch[] {
  const grouped = new Map<string, LevelId[]>();
  for (const root of levelIds.filter((id) => levels[id].branchLabel)) {
    const label = levels[root].branchLabel ?? levels[root].name;
    grouped.set(label, [
      ...(grouped.get(label) ?? []),
      ...levelIds.filter((id) => branchRoot(id) === root),
    ]);
  }
  return [...grouped].map(([label, scales]) => {
    const submenus: Submenu[] = [];
    for (const root of scales.filter((id) => levels[id].submenu))
      submenus.push({
        root,
        label: levels[root].submenu!,
        note: levels[root].submenuNote ?? '',
        levels: scales.filter((id) => submenuRoot(id) === root),
      });
    return { root: scales[0], label, levels: scales, submenus };
  });
}

/**
 * The menu a scale is listed under, which is not always its own branch root:
 * menus are grouped by label, so the case fan and the tower cooler share one
 * Cooling heading, keyed by whichever of them comes first.
 */
export function menuRoot(id: LevelId): LevelId | null {
  return branches().find((branch) => branch.levels.includes(id))?.root ?? null;
}
