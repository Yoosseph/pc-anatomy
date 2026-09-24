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
    sources: ['chassis'],
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
    sources: ['chassis'],
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
    sources: ['chassis'],
    searchTerms: ['glass', 'window', 'cover', 'panel'],
    opensFirst: true,
  }),
  concept({
    id: 'frontpanel',
    name: 'Front panel',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description:
      'The removable face of the case: a perforated steel mesh in an aluminium frame, directly in front of the intake fans.',
    purpose:
      'Lets the intake fans draw cool air straight in across their whole face while keeping fingers out of the blades.',
    quantity: '1 modeled panel',
    specifications: {
      Intake: 'Perforated steel mesh, illustrative hole pattern',
      Mounting: 'Push-fit ball studs',
    },
    representationType: 'physical',
    sources: ['chassis'],
    searchTerms: ['bezel', 'mesh', 'intake', 'front', 'grille'],
    opensFirst: true,
  }),
  concept({
    id: 'frontio',
    name: 'Front I/O panel',
    shortName: 'Front I/O',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description:
      'The row of buttons and connectors along the top front edge of the case: power, reset, two USB-A ports, one USB-C port and a headset jack.',
    purpose:
      'Puts the controls and the ports used most often within reach, wired by internal cables to the motherboard’s front-panel, USB and audio headers.',
    quantity: '1 modeled panel',
    specifications: {
      Buttons: 'Power with lit ring · reset',
      Ports: '2 × USB-A · 1 × USB-C · 3.5 mm audio combo',
      'Board headers': 'Front panel · USB 3 · USB-C · HD audio',
    },
    representationType: 'physical',
    sources: ['chassis', 'mainboardmanual'],
    searchTerms: [
      'power button',
      'reset',
      'usb',
      'usb-c',
      'headphone',
      'audio jack',
      'front ports',
      'io',
    ],
  }),
  concept({
    id: 'dustfilter',
    name: 'Dust filters',
    shortName: 'Dust filter',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description:
      'Fine nylon mesh over every opening that draws air in: a framed sheet behind the front mesh, a slide-out tray under the power supply and a magnetic sheet in the lid.',
    purpose:
      'Catches dust before the fans pull it onto heatsink fins, where it would insulate them. Each one comes off for cleaning without tools.',
    quantity: '3 modeled filters',
    specifications: {
      Front: 'Framed mesh behind the front panel',
      Bottom: 'Slide-out tray, removed from the front',
      Top: 'Magnetic sheet',
      Mesh: 'Illustrative weave',
    },
    representationType: 'physical',
    sources: ['chassis'],
    searchTerms: ['filter', 'dust', 'mesh', 'magnetic', 'nylon', 'intake'],
    opensFirst: true,
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
    sources: ['chassis'],
    searchTerms: ['lid', 'exhaust', 'roof', 'vent'],
    opensFirst: true,
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
    sources: ['chassis'],
    searchTerms: ['cover', 'basement', 'shroud'],
  }),
  concept({
    id: 'drivecage',
    name: '2.5-inch drive tray',
    category: 'Chassis',
    parent: 'chassis',
    level: 'pc',
    description: 'The compact metal tray that supports the SATA SSD.',
    purpose:
      'Fixes the drive in place and leaves its two keyed connectors accessible.',
    quantity: '1 modeled tray',
    specifications: { Format: '2.5-inch' },
    representationType: 'physical',
    sources: ['chassis'],
    searchTerms: ['bay', 'bracket', 'tray', 'ssd'],
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
    sources: ['chassis'],
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
      'The opening in the back of the case and the stamped shield plate in it, cut to the board’s port stack so each connector sits flush in its own hole.',
    purpose:
      'Gives external connectors a fixed, shielded exit point at a standardised size, and grounds each connector shell to the case.',
    quantity: '1 modeled aperture and shield',
    specifications: {
      Aperture: '158.75 × 44.45 mm',
      Shield: 'Cut-outs follow the modeled port stack',
    },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['chassis'],
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
    sources: ['mainboardmanual'],
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
    sources: ['tuf5090', 'whitepaper'],
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
    sources: ['aircooler'],
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
    searchTerms: [
      'liquid',
      'aio',
      'water',
      'radiator',
      'pump',
      'loop',
      'cooling',
    ],
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
      'Three intake fans behind the front panel and a rear exhaust fan form one front-to-back airflow path.',
    purpose:
      'Keeps a steady current of cool air moving past every component instead of letting heat pool.',
    quantity: '4 modeled fans',
    specifications: { Layout: '3 front intake · 1 rear exhaust' },
    representationType: 'physical',
    sources: ['fanconstruction', 'bldc'],
    searchTerms: ['fan', 'airflow', 'intake', 'exhaust', 'cooling'],
  }),
  concept({
    id: 'ssd',
    name: '2.5-inch SATA SSD',
    shortName: 'SATA SSD',
    category: 'Storage',
    parent: 'drivecage',
    level: 'pc',
    open: 'ssd',
    description:
      'Flash storage in a drive-shaped enclosure on the older SATA interface.',
    purpose:
      'Holds data that must survive power loss, without the seek delay of a spinning disk.',
    quantity: '1 modeled drive',
    specifications: {
      Architecture: 'Enclosed drive · separate data and power connectors',
      Protocol: 'Serial ATA',
      Interface: 'SATA 6 Gb/s',
      Format: '2.5-inch · 7 mm',
      Dimensions: '100 × 69.85 × 7 mm',
    },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['samsungsata', 'ssdarchitecture'],
    searchTerms: ['ssd', 'sata', 'flash', 'drive', 'storage'],
  }),
];
