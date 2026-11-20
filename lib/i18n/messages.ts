import type { Category } from '../concept.ts';
import { pack } from './pack.ts';

/**
 * Every interface string, in English.
 *
 * This object is the shape every other language fills in: a translation is
 * typed as `Messages`, so a missing or misspelled key fails to compile.
 * Anything that varies with a number or a name is a function, which lets each
 * language place the value and agree its plurals in its own way.
 */
const en = {
  common: {
    on: 'On',
    off: 'Off',
    show: (what: string) => `Show ${what}`,
    hide: (what: string) => `Hide ${what}`,
  },
  language: {
    label: 'Language',
  },
  /** The component systems, by their identifiers in `concept.ts`. */
  categories: {
    Chassis: 'Chassis',
    Cooling: 'Cooling',
    Board: 'Board',
    Power: 'Power',
    Memory: 'Memory',
    Storage: 'Storage',
    Compute: 'Compute',
    Graphics: 'Graphics',
  } satisfies Record<Category, string> as Record<Category, string>,
  /** Subsystem menu headings, by the `branchLabel` the scales declare. */
  branches: {} as Record<string, string>,
  /** Specification field names, by the English label the catalogue uses. */
  specLabels: {} as Record<string, string>,
  topbar: {
    reset: 'Reset PC Anatomy',
    github: 'PC Anatomy on GitHub',
    createdBy: 'Created by',
    feedback: 'Feedback / Idea / Collaboration',
    /** The label on phones, the only one that fits beside the other controls. */
    feedbackShort: 'Feedback',
    feedbackTitle:
      'Report a mistake, suggest an idea or get in touch about working together',
    guide: 'Guide',
    guideTitle: 'Learn about PC components',
    toggleSystems: 'Toggle systems',
    findComponent: 'Find a component',
    search: 'Search components',
    about: 'About',
    aboutLabel: 'About and sources',
    aboutTitle: 'About and credits',
  },
  systems: {
    heading: 'VISIBLE SYSTEMS',
    hideAll: 'Hide all',
    showAll: 'Show all',
    showParts: (system: string) => `Show ${system} components`,
    hideParts: (system: string) => `Hide ${system} components`,
  },
  about: {
    title: 'From the case down to a compute core.',
    description:
      'PC Anatomy is a free, interactive 3D computer hardware explorer. Learn how a desktop PC works by inspecting and disassembling its components.',
    intro:
      'Start with an assembled ATX tower, take it apart, and keep going: into the motherboard, into the graphics card, and down through the GB202 processor to a single streaming multiprocessor. Every scale is a branch you can descend or step back out of.',
    modelsHeading: 'Two kinds of model.',
    hardware: 'Hardware',
    hardwareText:
      'is original, approximate mechanical geometry. The ATX board outline, the expansion-slot pitch and the rear I/O aperture follow the published form factor. The RTX 5090, Ryzen 9 9950X and Core Ultra 9 285K are named subjects; everything else is a representative example of its component family, not a bill of materials for a particular build.',
    silicon: 'Silicon',
    siliconText:
      'shows documented logical architecture. Exact transistor-level placement is not publicly available. A full GB202 has 192 SMs; the RTX 5090 enables 170. GPC interiors show a representative full cluster, not an invented map of disabled units.',
    creditsHeading: 'Research & credits',
    acceleration: 'Browser hardware acceleration setup',
    guide: 'PC components: an illustrated beginner’s guide',
    inspiration: 'Interaction inspiration · Human Atlas',
    source: 'PC Anatomy source code',
    foot: 'No affiliation with NVIDIA, AMD or Intel. No third-party model assets. Research reviewed September 2026.',
  },
  detail: {
    architecture: 'ARCHITECTURE',
    hardware: 'HARDWARE',
    close: 'Close component details',
    instance: (number: string) => `INSTANCE ${number}`,
    group: 'COMPONENT GROUP',
    purpose: 'What it does',
    partOf: 'Part of',
    takeApart: (what: string) => `Take apart ${what}`,
    showContext: 'Show context',
    isolate: 'Isolate',
    focus: 'Focus',
    hide: 'Hide',
    references: 'References & architecture',
    referencesNote:
      'Manufacturer documents and standards explain this component family. Illustrative geometry is not a product schematic.',
  },
  search: {
    title: 'Find a component',
    description: 'Jump to any hardware or architecture resource.',
    placeholder: 'Try Tensor, GDDR7, L2 or SM…',
    empty: 'No matching components. Try “memory” or “CUDA”.',
    matches: 'Matching structures',
    suggested: 'Explore the specimen',
    logical: 'Logical architecture',
    physical: 'Physical hardware',
    browse: '↑ ↓ to browse',
    inspect: 'Enter to inspect',
  },
  stage: {
    hintTouch: 'Tap a part to see what it is and take it apart, or press Auto.',
    hintPointer:
      'Click a part to open it, right-click to inspect it, or press Auto.',
    inventory: 'Component inventory',
    separated: 'Resources, separated',
    comingApart: 'Coming apart',
    hierarchy: 'Component hierarchy',
    back: 'Back one level',
    dismissHint: 'Dismiss hint',
  },
  nav: {
    close: 'Close systems',
    chooseSystem: 'Choose a system',
    desktop: 'Desktop PC',
    laptops: 'Laptops',
    mac: 'Mac',
    compare: 'Compare components',
    build: 'Build your own PC',
    scale: 'Exploration scale',
    placeholder: 'placeholder',
    scales: (n: number) => `${n} ${n === 1 ? 'scale' : 'scales'}`,
    /** The line under a menu: "5 cards · 17 scales", "3 boards", "1 scale inside". */
    menuNote: (menu: string, scales: number, submenus: number) => {
      const dropdowns: Record<string, string> = {
        GPU: 'cards',
        Memory: 'generations',
        Processor: 'processors',
      };
      const products: Record<string, string> = {
        Motherboard: 'boards',
        'Power supply': 'models',
      };
      if (submenus > 0)
        return `${submenus} ${dropdowns[menu] ?? 'models'} · ${scales} scales`;
      if (products[menu]) return `${scales} ${products[menu]}`;
      return `${scales} ${scales === 1 ? 'scale' : 'scales'} inside`;
    },
  },
  disassembly: {
    section: 'Explosion control',
    slider: 'Disassemble the specimen',
    pauseAuto: 'Pause automatic disassembly',
    startAuto: 'Take it apart automatically',
    pause: 'Pause',
    auto: 'Auto',
    expand: 'Expand',
    disassemble: 'Disassemble',
    dragOrPlay: 'DRAG OR PLAY',
    percent: (n: number) => `${n} percent`,
    resetLabel: 'Reset camera and assembly',
    reset: 'Reset',
  },
  power: {
    all: 'All',
    storage: 'Storage',
    show: 'Show power flow',
    hide: 'Hide power flow',
    toggle: 'Power',
    toggleTitle: 'Trace power from the PSU to each component',
    panel: 'Power flow',
    heading: 'Follow the power',
    fromPsu: 'FROM THE PSU',
    less: 'Less',
    details: 'Details',
    destination: 'Power destination',
    inspect: (destination: string, route: string) =>
      `Inspect ${destination}: ${route}`,
    note: 'Colors identify routes. Arrows show direction, not speed or watts. Dashed line: power through the board.',
  },
  tools: {
    camera: 'Camera controls',
    views: {
      perspective: { short: '3D', name: 'Perspective view' },
      top: { short: 'TOP', name: 'Top view' },
      front: { short: 'FRONT', name: 'Front view' },
      back: { short: 'BACK', name: 'Back view' },
    },
    fullscreenBlocked:
      'Fullscreen is blocked by this browser. Press F11 instead.',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    airflow: 'Airflow',
    airflowShow: 'Show airflow',
    airflowHide: 'Hide airflow',
    airflowHideTitle: 'Hide the path the air takes',
    airflowShowTitle: 'Show the path the air takes through the machine',
    airflowAssembledTitle: 'Show airflow — it draws on the assembled machine',
    hiddenCount: (n: number) => `${n} hidden component${n === 1 ? '' : 's'}`,
    hiddenHeading: 'Hidden on this scale',
    unhide: 'Show',
  },
  page: {
    systemVisibility: 'System visibility',
    findSlot: 'Click to find its slot',
    nothingVisible: 'No structures visible',
    showEverything: 'Show all systems',
  },
  viewer: {
    loadFailed: 'The 3D viewer could not load. Reload to try again.',
    webgl:
      'WebGL could not start. Enable graphics acceleration in your browser, then reload the viewer.',
    model: 'Interactive 3D computer model',
    tray: 'Parts on the tray',
    loadingComponents: 'Loading components for you…',
    loading: 'Loading…',
    reload: 'Reload viewer',
    contextLost:
      'The 3D context was interrupted. Reload the viewer to continue.',
    hoverOpen: 'Left-click to open · right-click to inspect',
    hoverInspect: 'Click to inspect',
  },
  tip: {
    label: '3D performance tip',
    title: 'Smoother 3D exploration',
    text: 'Try enabling browser hardware acceleration for smoother rendering.',
    link: 'How to enable it',
    dismiss: 'Dismiss performance tip',
  },
  feedback: {
    kinds: {
      issue: 'Issue or mistake',
      idea: 'Idea or request',
      other: 'Collaboration or something else',
    },
    invalid:
      'Something in the form could not be accepted. Check the message is between 10 and 5000 characters and the email address is complete.',
    rateLimited:
      'That is a lot of messages in a short time. Please wait a few minutes and try again.',
    failed:
      'The message could not be sent. Check your connection and try again; what you wrote is still here.',
    title: 'Send feedback',
    description:
      'Spotted a mistake, have an idea, or want to work together on PC Anatomy? Tell me here.',
    sent: 'Thank you, your message was sent.',
    willReply: 'I will reply to the address you gave.',
    sendAnother: 'Send another',
    unavailable:
      'The feedback form is not available on this copy of the site. You can open an issue on GitHub instead; what you wrote is kept here so you can copy it across.',
    openIssue: 'Open a GitHub issue',
    back: 'Back to the form',
    about: 'What is it about?',
    name: 'Name',
    optional: 'optional',
    email: 'Email',
    emailHint: 'optional, so I can reply',
    message: 'Message',
    atLeast: (n: number) => `At least ${n} characters`,
    privacy:
      'The address of this page, what you have selected and the interface language are sent along with your message. Your message is emailed to the PC Anatomy maintainer and only used to reply to you.',
    sending: 'Sending…',
    send: 'Send',
  },
  compareCategories: {
    systems: 'Complete systems',
    boards: 'Boards',
    processors: 'Processors',
    graphics: 'Graphics',
    memory: 'Memory',
    storage: 'Storage',
    cooling: 'Cooling',
    power: 'Power & batteries',
    displays: 'Displays',
    chassis: 'Chassis',
  },
  compare: {
    takenBy: (side: string) => `On ${side}`,
    diagram: 'Diagram',
    hardware: 'Hardware',
    selected: 'Selected',
    choosePart: (side: string) => `Choose part ${side}`,
    pickerDescription: 'Browse any system. Your other choice stays in place.',
    closePicker: 'Close part picker',
    searchLabel: 'Search parts',
    searchPlaceholder: 'Search parts, models or architecture…',
    system: 'System',
    allSystems: 'All systems',
    categories: 'Part categories',
    allParts: 'All parts',
    partCount: (n: number) => `${n} ${n === 1 ? 'part' : 'parts'}`,
    noMatches: 'No matching parts',
    noMatchesHint: 'Try another category, system or search.',
    clearFilters: 'Clear filters',
    viewerFailed: 'The comparison viewer could not load. Reload to try again.',
    viewport: (left: string, right: string) =>
      `Synchronized 3D comparison of ${left} and ${right}`,
    leftViewport: (name: string) => `Left viewport: ${name}`,
    rightViewport: (name: string) => `Right viewport: ${name}`,
    loading: 'Loading both models…',
    comparedPart: 'Compared part',
    sameScale: 'Same physical scale in both panes.',
    fitRelative: 'Each model fits its pane. Sizes are not relative.',
    fitNoScale:
      'Each model fits its pane. Diagrams and illustrative parts have no physical scale.',
    exploreBoth: 'Explore both',
    expandBoth: 'Expand both',
    disassembleBoth: 'Disassemble both',
    specs: 'Specs',
    back: 'Back to explorer',
    pair: 'Comparison pair',
    swap: 'Swap comparison sides',
    modelScale: 'Model scale',
    fitEach: 'Fit each',
    trueSize: 'True size',
    visibleSide: 'Visible comparison side',
    left: 'A · Left',
    right: 'B · Right',
    comparing: (left: string, right: string) =>
      `Comparing ${left} with ${right}.`,
    sharedControl: 'Shared disassembly control',
    slider: 'Disassemble or expand both models',
    percentBoth: (n: number) => `${n} percent for both models`,
  },
  specs: {
    notListed: 'Not listed',
    specification: 'Specification',
    noneForModels: 'No specifications listed for these models.',
    noneForModel: 'No specifications listed for this model.',
    diagram: 'Architecture diagram',
    title: 'Specification comparison',
    aligned:
      'Matching fields are aligned. Not listed means the catalogue has no value for that model.',
    independent:
      'Different kinds of parts, with each model’s own specifications.',
    close: 'Close specification comparison',
  },
  build: {
    slotLabels: {
      processor: 'Processor',
      cooler: 'CPU cooler',
      board: 'Motherboard',
      memory: 'Memory',
      storage: 'Storage',
      graphics: 'Graphics card',
      power: 'Power supply',
    },
    title: 'Build your PC',
  },
  /** Part names and summaries in the build workspace's picker. */
  parts: {
    cores: (n: number) => `${n} cores`,
    ppt: 'socket power limit (PPT)',
    maxTurbo: 'maximum turbo power',
    airCooler: 'Tower air cooler',
    airCoolerSummary: '4 heat pipes · 120 mm fin stack',
    liquidCooler: '360 mm liquid cooler',
    liquidCoolerSummary: 'Pump block · front radiator',
    everySlot: 'every slot filled',
    nvmeSata: 'M.2 NVMe + 2.5-inch SATA SSD',
    nvmeSataSummary: 'Two drives · one SATA cable',
    nvmeOnly: 'M.2 NVMe SSD only',
    nvmeOnlySummary: 'One drive · no cables',
    fixedCables: 'fixed cables',
    modular: 'modular',
    two16pin: 'two 16-pin',
  },
  /** The power-flow overlay: where each cable goes and what it carries. */
  powerRoutes: {
    atx: {
      destination: 'Motherboard',
      description:
        'The main cable supplies the motherboard. The board also distributes power to expansion slots and onboard devices.',
    },
    eps: {
      destination: 'CPU regulators',
      description:
        'A separate 12 V feed reaches the motherboard near the CPU. Voltage regulators reduce it to the lower, changing voltages the processor needs.',
    },
    gpu: {
      destination: 'Graphics card',
      description: (card: string) =>
        `The installed ${card} has a direct auxiliary feed from the PSU as well as slot power. Regulators on the card produce lower voltages for the GPU and memory.`,
    },
    sata: {
      label: 'SATA power',
      voltage: '5 V used by this SSD',
      description:
        'The 15-pin power connector is separate from the 7-pin SATA data connector. This representative 2.5-inch SSD uses 5 V supplied directly by the PSU.',
    },
    slot: {
      label: 'PCIe slot',
      destination: 'Graphics card',
      description:
        'The motherboard supplies power through the PCIe slot too. The dashed route shows this relationship, not the layout of copper traces inside the board.',
    },
    noSataDrive:
      'This build has no SATA drive. The M.2 drive takes its power from the board through the slot it sits in, so no cable runs to it.',
    reassemble: 'Reassemble the PC to see the power paths.',
    leaveIsolation: 'Leave isolation to see the power paths.',
    paused: 'Power paths pause while opening a component.',
    showParts:
      'Show the power supply, cables and destination components to see their paths.',
  },
};

export type Messages = typeof en;
export { en };

/** The interface strings in the visitor's language. */
export const t: Messages = pack?.messages ?? en;

/** A specification field's name, as shown. */
export const specLabel = (label: string) => t.specLabels[label] ?? label;
