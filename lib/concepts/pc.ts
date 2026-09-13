import { concept, standard, type Concept } from '../concept.ts';

/**
 * The machine around the graphics card.
 *
 * Geometry follows the published ATX form factor, so the board, the expansion
 * slots and the rear aperture are in the right places and at the right size.
 * Everything else (which controller, how many capacitors, what capacity) is a
 * representative example of the component family, never a claim about a
 * specific product. Nothing here is a named part.
 */
export const pcConcepts: Concept[] = [
  concept({
    id: 'pc',
    name: 'Desktop computer',
    shortName: 'Desktop PC',
    category: 'Chassis',
    parent: null,
    level: 'pc',
    open: 'pc',
    description:
      'A complete machine: the parts that compute, remember, store and stay cool, held in one frame.',
    purpose:
      'Turns wall power and stored instructions into work: running programs, rendering images and training models.',
    quantity: '1 reference machine',
    specifications: {
      'Form factor': 'ATX mid tower',
      Board: '305 × 244 mm ATX',
      Expansion: 'PCI Express 5.0',
      Storage: 'NVMe · SATA',
    },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['atx'],
    searchTerms: ['computer', 'machine', 'tower', 'build', 'system'],
  }),

  // ── Chassis ──────────────────────────────────────────────────────────────
  concept({
    id: 'chassis',
    name: 'Chassis frame',
    shortName: 'Frame',
    category: 'Chassis',
    parent: 'pc',
    level: 'pc',
    description:
      'The folded steel skeleton every other part is bolted to, including the motherboard tray.',
    purpose:
      'Holds components in fixed relative positions, carries their weight and bonds them to a common ground.',
    quantity: '1 modeled frame',
    specifications: {
      'Board support': 'ATX mounting pattern',
      Material: 'Steel, illustrative gauge',
    },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['atx'],
    searchTerms: ['case', 'tower', 'tray', 'steel', 'skeleton'],
  }),
  concept({
    id: 'sidepanel',
    name: 'Side panels',
    shortName: 'Side panel',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description:
      'The removable window and the solid panel behind the motherboard tray.',
    purpose:
      'Closes the airflow path so fans pull air along an intended route, and keeps dust and fingers out.',
    quantity: '2 modeled panels',
    specifications: { Window: 'Illustrative tempered-glass panel' },
    representationType: 'physical',
    sources: ['atx'],
    searchTerms: ['glass', 'window', 'cover', 'panel'],
  }),
  concept({
    id: 'frontpanel',
    name: 'Front panel',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description:
      'The face of the case, with its intake mesh and front connectors.',
    purpose:
      'Lets intake fans draw cool air in while presenting the power button and front ports.',
    quantity: '1 modeled panel',
    specifications: { Intake: 'Illustrative mesh' },
    representationType: 'physical',
    sources: ['atx'],
    searchTerms: ['bezel', 'mesh', 'intake', 'front'],
  }),
  concept({
    id: 'toppanel',
    name: 'Top panel',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description: 'The vented lid above the board, a common radiator mount.',
    purpose: 'Lets heated air leave the case where it naturally collects.',
    quantity: '1 modeled panel',
    specifications: { Venting: 'Illustrative' },
    representationType: 'physical',
    sources: ['atx'],
    searchTerms: ['lid', 'exhaust', 'roof', 'vent'],
  }),
  concept({
    id: 'psushroud',
    name: 'Power supply shroud',
    shortName: 'PSU shroud',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description: 'The cover over the power supply and its cable run.',
    purpose:
      'Separates the power supply’s own airflow from the rest of the case and hides cabling.',
    quantity: '1 modeled cover',
    specifications: { Geometry: 'Approximate' },
    representationType: 'physical',
    sources: ['atx'],
    searchTerms: ['cover', 'basement', 'shroud'],
  }),
  concept({
    id: 'drivecage',
    name: 'Drive cage',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description: 'The bracket that holds 3.5-inch and 2.5-inch drives.',
    purpose: 'Fixes drives against vibration and aligns their connectors.',
    quantity: '1 modeled cage',
    specifications: { Bays: '2 modeled bays' },
    representationType: 'physical',
    sources: ['atx'],
    searchTerms: ['bay', 'bracket', 'cage', 'hdd'],
  }),
  concept({
    id: 'boardstandoff',
    name: 'Board standoffs',
    shortName: 'Standoff',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description:
      'Threaded pillars that lift the motherboard off the metal tray.',
    purpose:
      'Keeps the board’s solder side from shorting against the case while grounding it at defined points.',
    quantity: '9 modeled standoffs',
    specifications: { Pattern: 'ATX mounting holes' },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['atx'],
    searchTerms: ['screw', 'mount', 'spacer', 'pillar'],
  }),
  concept({
    id: 'ioshield',
    name: 'Rear I/O aperture',
    shortName: 'I/O shield',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description:
      'The opening in the back of the case that the board’s port stack shows through.',
    purpose:
      'Gives external connectors a fixed, shielded exit point at a standardised size.',
    quantity: '1 modeled aperture',
    specifications: { Aperture: '158.75 × 44.45 mm' },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['atx'],
    searchTerms: ['backplate', 'ports', 'rear', 'shield'],
  }),

  // ── Subsystems visible in the assembled machine ──────────────────────────
  concept({
    id: 'motherboard',
    name: 'Motherboard',
    shortName: 'Motherboard',
    category: 'Board',
    parent: 'pc',
    level: 'pc',
    open: 'motherboard',
    description:
      'The board every other part plugs into: processor, memory, expansion cards and storage.',
    purpose:
      'Carries power and high-speed signals between the processor and everything else in the machine.',
    quantity: '1 ATX board',
    specifications: {
      'Form factor': 'ATX · 305 × 244 mm',
      Expansion: 'PCI Express 5.0',
      Memory: '4 DDR5 DIMM slots',
    },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['atx', 'pcie'],
    searchTerms: ['mainboard', 'mobo', 'board', 'logic board'],
  }),
  concept({
    id: 'graphicscard',
    name: 'Graphics card',
    shortName: 'Graphics card',
    category: 'Graphics',
    parent: 'pc',
    level: 'pc',
    open: 'card',
    description:
      'The expansion card in the primary PCI Express slot, and a parallel computer of its own.',
    purpose:
      'Renders images and runs the massively parallel work the processor is poorly suited to.',
    quantity: '1 installed card',
    specifications: {
      Installed: 'Primary PCIe 5.0 ×16 slot',
      Specimen: 'GeForce RTX 5090',
    },
    representationType: 'physical',
    sources: ['specs', 'pcie'],
    searchTerms: ['gpu', 'video card', 'rtx', 'graphics', 'nvidia'],
  }),
  concept({
    id: 'psu',
    name: 'Power supply unit',
    shortName: 'PSU',
    category: 'Power',
    parent: 'pc',
    level: 'pc',
    open: 'psu',
    description:
      'Converts mains alternating current into the steady low-voltage direct current the machine runs on.',
    purpose:
      'Feeds every rail in the system and absorbs the sudden load swings a modern processor and graphics card create.',
    quantity: '1 modeled ATX unit',
    specifications: {
      Standard: 'ATX form factor',
      Rails: '+12 V · +5 V · +3.3 V',
      'GPU connector': '12V-2x6, up to 600 W',
    },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['psu'],
    searchTerms: ['power', 'supply', 'atx', 'watts', 'rail'],
  }),
  concept({
    id: 'psucable',
    name: 'Power cabling',
    shortName: 'Cabling',
    category: 'Power',
    parent: 'psu',
    level: 'pc',
    description:
      'The looms running from the supply to the board, the processor and the graphics card.',
    purpose:
      'Carries current to each load on conductors sized for it, using keyed connectors that only fit one way.',
    quantity: '3 modeled looms',
    specifications: {
      Board: '24-pin',
      Processor: '8-pin EPS',
      Graphics: '12V-2x6',
    },
    representationType: 'physical',
    sources: ['psu'],
    searchTerms: ['cable', 'wire', 'loom', 'connector', '24-pin'],
  }),
  concept({
    id: 'cpucooler',
    name: 'Processor cooler',
    shortName: 'CPU cooler',
    category: 'Cooling',
    parent: 'pc',
    // This is the cooler the machine is built with: a part you can point at
    // inside the case, and the way into its own scale.
    level: 'pc',
    open: 'cooler',
    description:
      'A finned tower on heat pipes, bolted to the socket, with a fan pushing case air through it.',
    purpose:
      'Moves heat off the processor lid fast enough to keep it below its throttling limit.',
    quantity: '1 modeled tower cooler',
    specifications: {
      Type: 'Illustrative tower',
      'Heat pipes': '4 modeled pipes',
    },
    representationType: 'physical',
    sources: ['coolermount'],
    searchTerms: ['heatsink', 'tower', 'fan', 'thermal', 'air cooler'],
  }),
  concept({
    id: 'aio',
    name: 'Liquid cooler',
    shortName: 'Liquid cooler',
    category: 'Cooling',
    parent: 'pc',
    // The other answer to the same problem. Only one cooler bolts to one
    // socket, so the loop is not fitted to this build and has nothing inside
    // the case to click on. `level === open` makes it the root of its own
    // scale, reached from the Cooling menu.
    level: 'liquid',
    open: 'liquid',
    description:
      'A sealed loop: a pump and water block on the processor, flexible tubing, and a three fan radiator mounted in the roof of the case.',
    purpose:
      'Carries heat away from the processor as warm liquid instead of through metal, so the large finned area that sheds it can sit wherever the case has room rather than directly above the socket.',
    quantity: '1 modeled 360 mm unit',
    specifications: {
      Type: 'Illustrative all-in-one',
      Radiator: '360 mm, three fans',
      Loop: 'Sealed, filled at manufacture',
    },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['liquid', 'aio', 'water', 'radiator', 'pump', 'loop', 'cooling'],
  }),
  concept({
    id: 'casefan',
    name: 'Case fans',
    shortName: 'Case fan',
    category: 'Cooling',
    parent: 'pc',
    level: 'pc',
    open: 'fan',
    description:
      'Intake fans behind the front panel and an exhaust fan in the roof set the direction air travels.',
    purpose:
      'Keeps a steady current of cool air moving past every component instead of letting heat pool.',
    quantity: '4 modeled fans',
    specifications: { Layout: '3 front intake · 1 roof exhaust' },
    representationType: 'physical',
    sources: ['bldc'],
    searchTerms: ['fan', 'airflow', 'intake', 'exhaust', 'cooling'],
  }),
  concept({
    id: 'ssd',
    name: '2.5-inch SATA SSD',
    shortName: 'SATA SSD',
    category: 'Storage',
    parent: 'drivecage',
    level: 'pc',
    description:
      'Flash storage in a drive-shaped enclosure on the older SATA interface.',
    purpose:
      'Holds data that must survive power loss, without the seek delay of a spinning disk.',
    quantity: '1 modeled drive',
    specifications: { Interface: 'SATA 6 Gb/s', Format: '2.5-inch' },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['sata'],
    searchTerms: ['ssd', 'sata', 'flash', 'drive', 'storage'],
  }),
  concept({
    id: 'hdd',
    name: '3.5-inch hard disk',
    shortName: 'Hard disk',
    category: 'Storage',
    parent: 'drivecage',
    level: 'pc',
    open: 'disk',
    description:
      'Magnetic platters spinning under a moving read/write head, in a sealed housing.',
    purpose:
      'Stores large amounts of data cheaply, where the delay of physically moving a head is acceptable.',
    quantity: '1 modeled drive',
    specifications: { Interface: 'SATA 6 Gb/s', Format: '3.5-inch' },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['sata'],
    searchTerms: ['hdd', 'hard drive', 'disk', 'platter', 'magnetic'],
  }),
];
