import { concept, type Concept } from '../concept.ts';

/**
 * Two desktop processors, and why they do not look alike.
 *
 * These are the only named parts in the machine besides the graphics card, and
 * they are here because the contrast is the lesson. Both are 2024 flagships on
 * the same class of process, both plug into a socket on the same board, and
 * they are built on opposite answers to the same question: what do you do when
 * one piece of silicon gets too big and too expensive to yield well?
 *
 * AMD splits the processor into several small dies and wires them together
 * across the package. Two identical eight core complex dies, plus one older
 * and cheaper die carrying everything that does not benefit from a leading
 * edge process: the memory controllers, the PCIe lanes, the display outputs.
 * Two of the same part, made in volume, binned and paired.
 *
 * Intel splits it differently. Four tiles of different kinds, each on the
 * process that suits it, stacked face down onto a base tile that carries the
 * wiring between them. Not repeated units but specialised ones, and the cores
 * themselves come in two sizes: eight wide ones for latency, sixteen small
 * ones for throughput, interleaved rather than grouped.
 *
 * Everything below is the published specification. The floorplans in the 3D
 * view are arranged from public die shots and vendor diagrams: block positions
 * are illustrative, not a mask layout.
 */

export const processorConcepts: Concept[] = [
  // ── AMD Ryzen 9 9950X ────────────────────────────────────────────────────
  concept({
    id: 'ryzenpackage',
    name: 'AMD Ryzen 9 9950X',
    shortName: 'Ryzen 9 9950X',
    category: 'Compute',
    parent: 'cpu',
    level: 'ryzen',
    open: 'ryzen',
    description:
      'Sixteen Zen 5 cores across two core complex dies, with a separate I/O die carrying memory and PCIe, all on one AM5 package.',
    purpose:
      'Splitting the processor into small repeated dies keeps yields high and lets the parts that do not need an expensive process stay on a cheaper one.',
    quantity: '1 modeled package',
    specifications: {
      Cores: '16 cores, 32 threads',
      Clocks: '4.3 GHz base, up to 5.7 GHz boost',
      Cache: '64 MB L3, 16 MB L2, 1280 KB L1',
      Process: 'TSMC 4 nm cores, TSMC 6 nm I/O die',
      Socket: 'AM5',
      'Default TDP': '170 W',
    },
    representationType: 'logical',
    physicalAccuracy:
      'Specifications are AMD published figures. The die arrangement follows public package photography; block positions inside each die are illustrative and not a mask layout.',
    sources: ['ryzen', 'zen5'],
    searchTerms: ['ryzen', 'amd', '9950x', 'zen 5', 'am5', 'chiplet'],
  }),
  concept({
    id: 'zenccd',
    name: 'Core complex die',
    shortName: 'CCD',
    category: 'Compute',
    parent: 'ryzenpackage',
    level: 'ryzen',
    description:
      'One small die holding eight Zen 5 cores and the 32 MB of L3 they share. The package carries two of them, identical to each other.',
    purpose:
      'A small die yields far better than a large one, and two of the same part are cheaper to make than one twice the size. The cost is that a thread on one die reaches the other die only across the package.',
    quantity: '2 modeled dies',
    specifications: {
      Count: '2 per package',
      Cores: '8 each',
      'L3 per die': '32 MB',
      Process: 'TSMC 4 nm',
      'Die area': 'About 70.6 mm²',
    },
    representationType: 'logical',
    sources: ['zen5', 'ryzen'],
    searchTerms: ['ccd', 'chiplet', 'core complex', 'die', 'zen'],
  }),
  concept({
    id: 'zencore',
    name: 'Zen 5 core',
    shortName: 'Zen 5 core',
    category: 'Compute',
    parent: 'zenccd',
    level: 'ryzen',
    description:
      'A full out of order core with its own 80 KB of L1 and 1 MB of L2, running two threads.',
    purpose:
      'Every core here is the same size and the same design, so the operating system can treat any of the sixteen as equivalent when it places work.',
    quantity: '16 modeled cores',
    specifications: {
      Count: '16 total, 8 per die',
      'L1 per core': '80 KB, 48 KB data and 32 KB instruction',
      'L2 per core': '1 MB',
      Threads: '2 per core',
    },
    representationType: 'logical',
    sources: ['zen5'],
    searchTerms: ['core', 'zen', 'smt', 'thread', 'out of order'],
  }),
  concept({
    id: 'zenl3',
    name: 'Shared L3 cache',
    shortName: 'L3',
    category: 'Memory',
    parent: 'zenccd',
    level: 'ryzen',
    description:
      'A 32 MB pool on each core complex die, shared by the eight cores on that die and not by the other eight.',
    purpose:
      'Holds what the cores are working on so most accesses never reach memory. Because it is per die, threads that share data run best when the scheduler keeps them on the same die.',
    quantity: '2 modeled pools',
    specifications: { Total: '64 MB', 'Per die': '32 MB' },
    representationType: 'logical',
    sources: ['ryzen'],
    searchTerms: ['l3', 'cache', 'shared', 'victim'],
  }),
  concept({
    id: 'zeniod',
    name: 'I/O die',
    shortName: 'I/O die',
    category: 'Board',
    parent: 'ryzenpackage',
    level: 'ryzen',
    description:
      'A separate, larger die on an older process holding the memory controllers, the PCIe lanes, the display output and the fabric that joins everything.',
    purpose:
      'Memory and PCIe interfaces gain almost nothing from a leading edge process, so putting them on a cheaper one costs no performance and saves a great deal of expensive wafer area.',
    quantity: '1 modeled die',
    specifications: {
      Process: 'TSMC 6 nm',
      Memory: 'Dual channel DDR5, up to 256 GB',
      Role: 'Memory, PCIe, display, fabric',
    },
    representationType: 'logical',
    sources: ['ryzen', 'ddr5'],
    searchTerms: ['iod', 'io die', 'memory controller', 'pcie', 'uncore'],
  }),
  concept({
    id: 'zenfabric',
    name: 'Infinity Fabric',
    shortName: 'Fabric',
    category: 'Board',
    parent: 'ryzenpackage',
    level: 'ryzen',
    description:
      'The links across the package substrate joining each core complex die to the I/O die.',
    purpose:
      'Carries every memory access and every cache transfer between the dies. It is the price of splitting the processor up: a die talking to memory, or to the other die, goes through here first.',
    quantity: '2 modeled links',
    specifications: { Topology: 'Each core die to the I/O die' },
    representationType: 'logical',
    sources: ['zen5'],
    searchTerms: ['infinity fabric', 'interconnect', 'link', 'substrate'],
  }),

  // ── Intel Core Ultra 9 285K ──────────────────────────────────────────────
  concept({
    id: 'corepackage',
    name: 'Intel Core Ultra 9 285K',
    shortName: 'Core Ultra 9 285K',
    category: 'Compute',
    parent: 'cpu',
    level: 'corei9',
    open: 'corei9',
    description:
      'Twenty four cores of two different sizes on a compute tile, stacked with three more tiles onto a base tile that wires them together.',
    purpose:
      'Where AMD repeats one small die, Intel specialises: each tile is made on the process that suits its job, and the base tile underneath carries the connections between them.',
    quantity: '1 modeled package',
    specifications: {
      Cores: '24 cores, 24 threads, 8 performance and 16 efficient',
      Clocks: '3.7 GHz performance base, up to 5.7 GHz turbo',
      Cache: '36 MB shared, 40 MB total L2',
      Process: 'TSMC N3B compute tile',
      Socket: 'LGA 1851',
      Power: '125 W base, 250 W maximum turbo',
    },
    representationType: 'logical',
    physicalAccuracy:
      'Specifications are Intel published figures. Tile sizes follow published die areas; block positions within the compute tile are illustrative and not a mask layout.',
    sources: ['corei9', 'arrowlake'],
    searchTerms: [
      'intel',
      'core ultra',
      '285k',
      'arrow lake',
      'lga1851',
      'tile',
    ],
  }),
  concept({
    id: 'arrowcompute',
    name: 'Compute tile',
    shortName: 'Compute tile',
    category: 'Compute',
    parent: 'corepackage',
    level: 'corei9',
    description:
      'The tile carrying all twenty four cores and the shared cache, on the most advanced process in the package.',
    purpose:
      'Only the cores justify the cost of the leading edge node, so only the cores are built on it. Everything else in the package sits on something cheaper.',
    quantity: '1 modeled tile',
    specifications: { Process: 'TSMC N3B', Area: 'About 117 mm²' },
    representationType: 'logical',
    sources: ['arrowlake'],
    searchTerms: ['compute tile', 'die', 'n3b', 'cores'],
  }),
  concept({
    id: 'arrowpcore',
    name: 'Performance core',
    shortName: 'P-core',
    category: 'Compute',
    parent: 'arrowcompute',
    level: 'corei9',
    description:
      'A large Lion Cove core with 3 MB of L2 to itself, built for the work where one thread finishing sooner is what matters.',
    purpose:
      'Wide, deep and expensive in area. These take the threads you are waiting on, while the small cores take everything running in the background.',
    quantity: '8 modeled cores',
    specifications: {
      Count: '8',
      Architecture: 'Lion Cove',
      'L2 per core': '3 MB',
      Threads: '1 per core',
    },
    representationType: 'logical',
    sources: ['arrowlake', 'corei9'],
    searchTerms: ['p-core', 'performance', 'lion cove', 'big core'],
  }),
  concept({
    id: 'arrowecore',
    name: 'Efficient core',
    shortName: 'E-core',
    category: 'Compute',
    parent: 'arrowcompute',
    level: 'corei9',
    description:
      'A smaller Skymont core, grouped in fours around 4 MB of L2 the cluster shares. Sixteen of them fit in roughly the area of four large cores.',
    purpose:
      'Throughput per square millimetre rather than speed per thread. On this generation the clusters sit between the large cores rather than in one block off to the side.',
    quantity: '16 modeled cores, in 4 clusters',
    specifications: {
      Count: '16, in clusters of 4',
      Architecture: 'Skymont',
      'L2 per cluster': '4 MB',
    },
    representationType: 'logical',
    sources: ['arrowlake', 'corei9'],
    searchTerms: ['e-core', 'efficient', 'skymont', 'cluster', 'atom'],
  }),
  concept({
    id: 'arrowl3',
    name: 'Shared cache',
    shortName: 'Shared cache',
    category: 'Memory',
    parent: 'arrowcompute',
    level: 'corei9',
    description:
      'One 36 MB pool on the ring that joins every core, large and small alike.',
    purpose:
      'Unlike a split pool, any core can use all of it, so the scheduler is free to move a thread between a large core and a small one without leaving its working set behind.',
    quantity: '1 modeled pool',
    specifications: { Size: '36 MB', Shared: 'All 24 cores' },
    representationType: 'logical',
    sources: ['corei9'],
    searchTerms: ['cache', 'smart cache', 'l3', 'ring'],
  }),
  concept({
    id: 'arrowsoc',
    name: 'SoC tile',
    shortName: 'SoC tile',
    category: 'Board',
    parent: 'corepackage',
    level: 'corei9',
    description:
      'The tile holding the memory controllers, the fabric and the low power island that keeps running when the compute tile is idle.',
    purpose:
      'Lets the expensive compute tile switch off entirely for light work while the machine stays responsive.',
    quantity: '1 modeled tile',
    specifications: {
      Process: 'TSMC N6',
      Area: 'About 87 mm²',
      Memory: 'Dual channel DDR5 up to 6400 MT/s',
    },
    representationType: 'logical',
    sources: ['arrowlake', 'ddr5'],
    searchTerms: ['soc tile', 'memory controller', 'fabric', 'low power'],
  }),
  concept({
    id: 'arrowgpu',
    name: 'Graphics tile',
    shortName: 'Graphics tile',
    category: 'Compute',
    parent: 'corepackage',
    level: 'corei9',
    description:
      'A small integrated graphics tile, enough to drive displays and decode video without a card fitted.',
    purpose:
      'Keeps the machine usable with no graphics card in the slot, and handles video encode and decode in fixed function hardware even when a card is fitted.',
    quantity: '1 modeled tile',
    specifications: { Process: 'TSMC N5P', Area: 'About 23 mm²' },
    representationType: 'logical',
    sources: ['arrowlake'],
    searchTerms: ['graphics tile', 'igpu', 'integrated', 'display'],
  }),
  concept({
    id: 'arrowio',
    name: 'I/O extender tile',
    shortName: 'I/O tile',
    category: 'Board',
    parent: 'corepackage',
    level: 'corei9',
    description:
      'A small tile carrying the high speed external links that would not fit on the SoC tile, notably PCIe and Thunderbolt.',
    purpose:
      'Interfaces like these are dominated by analogue circuitry that does not shrink usefully on a newer process, so they are pushed out onto their own inexpensive tile.',
    quantity: '1 modeled tile',
    specifications: { Process: 'TSMC N6', Area: 'About 24 mm²' },
    representationType: 'logical',
    sources: ['arrowlake', 'pcie'],
    searchTerms: ['io tile', 'extender', 'pcie', 'thunderbolt'],
  }),
  concept({
    id: 'arrowbase',
    name: 'Foveros base tile',
    shortName: 'Base tile',
    category: 'Board',
    parent: 'corepackage',
    level: 'corei9',
    description:
      'A large, deliberately simple die underneath the others, carrying power and the wiring between them. The four working tiles are stacked face down onto it.',
    purpose:
      'This is what makes the tiles behave as one processor. Connections between tiles run through silicon here rather than across a substrate, which is shorter, denser and cheaper in power than package level wiring.',
    quantity: '1 modeled base',
    specifications: {
      Process: 'Intel 22FFL',
      Area: 'About 303 mm²',
      Role: 'Die to die wiring and power delivery',
    },
    representationType: 'logical',
    sources: ['arrowlake'],
    searchTerms: ['foveros', 'base tile', 'interposer', 'stacking', '3d'],
  }),
];
