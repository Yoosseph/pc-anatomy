export const categories = [
  'Cooling',
  'Board',
  'Power',
  'Memory',
  'Compute',
  'Graphics',
] as const;
export type Category = (typeof categories)[number];
export type Level = 'card' | 'die' | 'gpc' | 'tpc' | 'sm';
export const colors: Record<Category, string> = {
  Cooling: '#9caebd',
  Board: '#8faaa0',
  Power: '#dca369',
  Memory: '#64adbf',
  Compute: '#709fcb',
  Graphics: '#b497cf',
};
export const sources = {
  whitepaper: {
    name: 'NVIDIA · RTX Blackwell architecture',
    url: 'https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf',
  },
  specs: {
    name: 'NVIDIA · RTX 5090 specifications',
    url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/',
  },
  cuda: {
    name: 'NVIDIA · CUDA programming guide',
    url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/',
  },
};
export interface Concept {
  id: string;
  name: string;
  shortName: string;
  category: Category;
  parent: string | null;
  children: string[];
  description: string;
  purpose: string;
  quantity: string;
  specifications: Record<string, string>;
  representationType: 'physical' | 'logical';
  physicalAccuracy: string;
  sources: (keyof typeof sources)[];
  searchTerms: string[];
  level: Level;
  open?: Level;
}
const physical =
  'Illustrative geometry. Shape, placement and mechanical quantities are approximate; this is not a board layout or service model.';
const logical =
  'Documented logical architecture. Block size and placement are illustrative; exact transistor-level placement is not publicly available.';
type Entry = Omit<
  Concept,
  'children' | 'physicalAccuracy' | 'sources' | 'shortName' | 'searchTerms'
> &
  Partial<
    Pick<
      Concept,
      'children' | 'physicalAccuracy' | 'sources' | 'shortName' | 'searchTerms'
    >
  >;
function concept(c: Entry): Concept {
  return {
    ...c,
    children: c.children ?? [],
    shortName: c.shortName ?? c.name,
    physicalAccuracy:
      c.physicalAccuracy ??
      (c.representationType === 'physical' ? physical : logical),
    sources: c.sources ?? [
      c.representationType === 'physical' ? 'specs' : 'whitepaper',
    ],
    searchTerms: c.searchTerms ?? [],
  };
}
export const manifest: Concept[] = [
  concept({
    id: 'card',
    name: 'GeForce RTX 5090',
    shortName: 'RTX 5090',
    category: 'Board',
    parent: null,
    level: 'card',
    open: 'card',
    description: 'An entire parallel computer on one graphics card.',
    purpose:
      'Turns electrical power and data into images, simulations and AI computation.',
    quantity: '1 reference specimen',
    specifications: {
      Architecture: 'Blackwell',
      GPU: 'GB202',
      'Graphics power': '575 W',
      Memory: '32 GB GDDR7',
    },
    representationType: 'physical',
  }),
  concept({
    id: 'shroud',
    name: 'Structural frame',
    category: 'Cooling',
    parent: 'card',
    level: 'card',
    description: 'The rigid surround that holds the cooler together.',
    purpose: 'Supports the fans and protects the fin array.',
    quantity: 'Illustrative frame',
    specifications: { Material: 'Metal / composite, illustrative' },
    representationType: 'physical',
    searchTerms: ['shroud', 'exterior'],
  }),
  concept({
    id: 'fan',
    name: 'Axial fans',
    shortName: 'Fan',
    category: 'Cooling',
    parent: 'card',
    level: 'card',
    description: 'Rotating blades move air across the cooler.',
    purpose: 'Carries heat from the fins into the surrounding air.',
    quantity: '2 modeled fans',
    specifications: { Design: 'Illustrative dual fan' },
    representationType: 'physical',
    searchTerms: ['cooling', 'airflow'],
  }),
  concept({
    id: 'heatsink',
    name: 'Heatsink arrays',
    shortName: 'Heatsink',
    category: 'Cooling',
    parent: 'card',
    level: 'card',
    description:
      'Closely spaced metal fins expose a large surface to moving air.',
    purpose: 'Releases the heat collected from the processor and memory.',
    quantity: '2 modeled sections',
    specifications: { 'Fin spacing': 'Illustrative' },
    representationType: 'physical',
  }),
  concept({
    id: 'vapor',
    name: 'Vapor chamber',
    category: 'Cooling',
    parent: 'card',
    level: 'card',
    description:
      'A sealed heat spreader links the hot package to a larger cooling surface.',
    purpose: 'Spreads concentrated heat across the cooler.',
    quantity: '1 modeled assembly',
    specifications: { Geometry: 'Simplified heat transport' },
    representationType: 'physical',
    searchTerms: ['heatpipe', 'heat spreader'],
  }),
  concept({
    id: 'backplate',
    name: 'Backplate',
    category: 'Cooling',
    parent: 'card',
    level: 'card',
    description: 'The rear cover supports and protects the assembly.',
    purpose: 'Provides structure behind the circuit board.',
    quantity: '1 modeled plate',
    specifications: { Geometry: 'Approximate' },
    representationType: 'physical',
  }),
  concept({
    id: 'pcb',
    name: 'Printed circuit board',
    shortName: 'PCB',
    category: 'Board',
    parent: 'card',
    level: 'card',
    description: 'The electrical foundation connecting the card’s components.',
    purpose: 'Routes power and high-speed signals through copper layers.',
    quantity: '1 illustrative board',
    specifications: { 'Board outline': 'Educational approximation' },
    representationType: 'physical',
    searchTerms: ['board', 'traces'],
  }),
  concept({
    id: 'package',
    name: 'GB202 GPU package',
    shortName: 'GB202 package',
    category: 'Board',
    parent: 'pcb',
    level: 'card',
    open: 'die',
    description: 'The package connects the silicon processor to the board.',
    purpose:
      'Bridges microscopic chip connections to board-scale power and signals.',
    quantity: '1 GPU package',
    specifications: {
      GPU: 'GB202',
      'Die area': '750 mm²',
      Transistors: '92.2 billion',
    },
    representationType: 'physical',
    sources: ['whitepaper'],
    searchTerms: ['GPU', 'processor', 'silicon'],
  }),
  concept({
    id: 'gddr7',
    name: 'GDDR7 memory',
    shortName: 'GDDR7',
    category: 'Memory',
    parent: 'pcb',
    level: 'card',
    description: 'External memory holds the data that the GPU is working on.',
    purpose:
      'Stores textures, model weights, geometry and intermediate results.',
    quantity: '32 GB on the card',
    specifications: {
      Capacity: '32 GB',
      Interface: '512-bit',
      Bandwidth: '1,792 GB/s',
      'Data rate': '28 Gbps',
    },
    representationType: 'physical',
    searchTerms: ['VRAM', 'RAM', 'framebuffer'],
  }),
  concept({
    id: 'vrm',
    name: 'Voltage regulation',
    shortName: 'VRM',
    category: 'Power',
    parent: 'pcb',
    level: 'card',
    description:
      'Power stages convert the supply voltage for the processor and memory.',
    purpose: 'Provides stable low-voltage power as workloads change.',
    quantity: 'Illustrative power stages',
    specifications: { 'Stage count': 'Not specified by this model' },
    representationType: 'physical',
    searchTerms: ['VRM', 'power delivery', 'inductor'],
  }),
  concept({
    id: 'capacitor',
    name: 'Capacitors',
    category: 'Power',
    parent: 'pcb',
    level: 'card',
    description:
      'Small energy reservoirs sit close to power-hungry components.',
    purpose: 'Helps smooth rapid changes in voltage and current.',
    quantity: 'Illustrative passive components',
    specifications: { Placement: 'Approximate' },
    representationType: 'physical',
  }),
  concept({
    id: 'pcie',
    name: 'PCIe edge connector',
    shortName: 'PCIe',
    category: 'Board',
    parent: 'pcb',
    level: 'card',
    description: 'The card’s data connection to the host computer.',
    purpose:
      'Transfers commands and data between the GPU and the rest of the system.',
    quantity: '1 interface',
    specifications: { Interface: 'PCI Express 5.0' },
    representationType: 'physical',
    searchTerms: ['bus', 'connector'],
  }),
  concept({
    id: 'power',
    name: 'Power connector',
    category: 'Power',
    parent: 'pcb',
    level: 'card',
    description: 'The dedicated connection from the power supply.',
    purpose: 'Supplies power beyond what the motherboard slot can deliver.',
    quantity: '1 modeled connector',
    specifications: { 'Graphics power': '575 W total card rating' },
    representationType: 'physical',
    searchTerms: ['12V', '16 pin'],
  }),
  concept({
    id: 'io',
    name: 'Display outputs',
    shortName: 'Display I/O',
    category: 'Board',
    parent: 'pcb',
    level: 'card',
    description: 'The card’s external display connections.',
    purpose: 'Sends the finished image to monitors and televisions.',
    quantity: '4 modeled outputs',
    specifications: { DisplayPort: '3 × 2.1b', HDMI: '1 × 2.1b' },
    representationType: 'physical',
    searchTerms: ['HDMI', 'DisplayPort', 'ports'],
  }),
  concept({
    id: 'die',
    name: 'GB202 architecture',
    shortName: 'GB202',
    category: 'Compute',
    parent: 'package',
    level: 'die',
    open: 'die',
    description: 'A hierarchy of parallel processing and memory resources.',
    purpose:
      'Coordinates thousands of execution resources on a single silicon die.',
    quantity: 'RTX 5090 enabled configuration',
    specifications: {
      GPCs: '11',
      TPCs: '85',
      SMs: '170',
      'CUDA cores': '21,760',
    },
    representationType: 'logical',
    searchTerms: ['chip', 'silicon', 'Blackwell'],
  }),
  concept({
    id: 'gpc',
    name: 'Graphics Processing Cluster',
    shortName: 'GPC',
    category: 'Compute',
    parent: 'die',
    level: 'die',
    open: 'gpc',
    description: 'A major cluster of graphics and compute resources.',
    purpose:
      'Groups processing clusters with raster and pixel-output hardware.',
    quantity: '11 enabled GPCs on RTX 5090',
    specifications: {
      'Full GPC': '8 TPCs / 16 SMs',
      'RTX 5090 total': '85 TPCs across 11 GPCs',
    },
    representationType: 'logical',
    searchTerms: ['all GPCs', 'cluster'],
  }),
  concept({
    id: 'l2',
    name: 'L2 cache',
    category: 'Memory',
    parent: 'die',
    level: 'die',
    description:
      'A shared pool of cached data between the chip and external memory.',
    purpose: 'Reduces repeated trips to GDDR7.',
    quantity: '96 MB on RTX 5090',
    specifications: { Capacity: '96 MB' },
    representationType: 'logical',
    searchTerms: ['cache', 'L2 memory'],
  }),
  concept({
    id: 'controller',
    name: 'Memory controllers',
    category: 'Memory',
    parent: 'die',
    level: 'die',
    description: 'The interfaces that manage communication with GDDR7.',
    purpose: 'Moves data between the processor and external memory.',
    quantity: '16 × 32-bit controllers',
    specifications: { 'Total interface': '512-bit' },
    representationType: 'logical',
    searchTerms: ['memory bus', 'interface'],
  }),
  concept({
    id: 'tpc',
    name: 'Texture Processing Cluster',
    shortName: 'TPC',
    category: 'Compute',
    parent: 'gpc',
    level: 'gpc',
    open: 'tpc',
    description:
      'A pair of streaming multiprocessors with geometry processing support.',
    purpose: 'Organizes programmable work into smaller processing clusters.',
    quantity: '85 enabled TPCs on RTX 5090',
    specifications: { 'SMs per TPC': '2', 'Full GPC': '8 TPCs' },
    representationType: 'logical',
    searchTerms: ['all TPCs'],
  }),
  concept({
    id: 'raster',
    name: 'Raster engine',
    category: 'Graphics',
    parent: 'gpc',
    level: 'gpc',
    description:
      'Converts projected triangles into fragments for pixel shading.',
    purpose: 'Connects geometric shapes to their coverage on the screen.',
    quantity: 'Per GPC',
    specifications: { Scope: 'Representative full GPC' },
    representationType: 'logical',
  }),
  concept({
    id: 'rop',
    name: 'Raster operations',
    shortName: 'ROPs',
    category: 'Graphics',
    parent: 'gpc',
    level: 'gpc',
    description:
      'The final pixel-processing resources in the graphics pipeline.',
    purpose: 'Performs operations such as blending and depth testing.',
    quantity: '176 ROPs on RTX 5090',
    specifications: { 'Full GPC': '2 partitions × 8 ROPs' },
    representationType: 'logical',
    searchTerms: ['pixel', 'blending'],
  }),
  concept({
    id: 'polymorph',
    name: 'PolyMorph engine',
    category: 'Graphics',
    parent: 'tpc',
    level: 'tpc',
    description: 'Geometry processing hardware associated with each TPC.',
    purpose: 'Supports fixed-function stages of geometric processing.',
    quantity: '1 per TPC',
    specifications: { Scope: 'TPC' },
    representationType: 'logical',
    searchTerms: ['geometry'],
  }),
  concept({
    id: 'sm',
    name: 'Streaming Multiprocessor',
    shortName: 'SM',
    category: 'Compute',
    parent: 'tpc',
    level: 'tpc',
    open: 'sm',
    description: 'The programmable workhorse of the GPU.',
    purpose:
      'Schedules groups of threads and supplies their execution and local memory resources.',
    quantity: '170 enabled SMs on RTX 5090',
    specifications: {
      'CUDA cores': '128 per SM',
      'Tensor cores': '4 per SM',
      'RT cores': '1 per SM',
    },
    representationType: 'logical',
    searchTerms: ['all SMs', 'multiprocessors'],
  }),
  concept({
    id: 'cuda',
    name: 'CUDA execution resources',
    shortName: 'CUDA core',
    category: 'Compute',
    parent: 'sm',
    level: 'sm',
    description:
      'Arithmetic execution resources used by programmable GPU threads.',
    purpose:
      'Performs the scalar arithmetic behind shaders and general-purpose GPU programs.',
    quantity: '128 per SM · 21,760 per card',
    specifications: { 'Per SM': '128', Arithmetic: 'Unified FP32 / INT32' },
    representationType: 'logical',
    searchTerms: ['all CUDA cores', 'FP32', 'INT32', 'ALU'],
  }),
  concept({
    id: 'tensor',
    name: 'Tensor cores',
    shortName: 'Tensor core',
    category: 'Compute',
    parent: 'sm',
    level: 'sm',
    description: 'Specialized execution resources for matrix operations.',
    purpose:
      'Accelerates the multiply-and-accumulate calculations used heavily in neural networks.',
    quantity: '4 per SM · 680 per card',
    specifications: {
      Generation: 'Fifth',
      'Per SM': '4',
      'Low precision': 'FP4 support',
    },
    representationType: 'logical',
    searchTerms: ['all Tensor Cores', 'AI', 'matrix', 'multiply'],
  }),
  concept({
    id: 'rt',
    name: 'Ray tracing core',
    shortName: 'RT core',
    category: 'Graphics',
    parent: 'sm',
    level: 'sm',
    description: 'Dedicated hardware for ray traversal and intersection work.',
    purpose: 'Accelerates finding where rays meet scene geometry.',
    quantity: '1 per SM · 170 per card',
    specifications: { Generation: 'Fourth', 'Per SM': '1' },
    representationType: 'logical',
    searchTerms: ['all RT cores', 'ray tracing', 'BVH'],
  }),
  concept({
    id: 'texture',
    name: 'Texture units',
    category: 'Graphics',
    parent: 'sm',
    level: 'sm',
    description: 'Hardware for reading and filtering texture data.',
    purpose: 'Provides sampled surface data to shaders.',
    quantity: '4 per SM · 680 per card',
    specifications: { 'Per SM': '4' },
    representationType: 'logical',
    searchTerms: ['TMU', 'sampling'],
  }),
  concept({
    id: 'scheduler',
    name: 'Warp schedulers',
    category: 'Compute',
    parent: 'sm',
    level: 'sm',
    description: 'Chooses eligible groups of threads to issue work.',
    purpose: 'Keeps execution resources supplied with ready instructions.',
    quantity: '4 processing partitions per SM',
    specifications: { 'Warp size': '32 threads' },
    representationType: 'logical',
    searchTerms: ['dispatch', 'scheduling', 'warp'],
  }),
  concept({
    id: 'register',
    name: 'Register files',
    category: 'Memory',
    parent: 'sm',
    level: 'sm',
    description: 'Very fast storage for the values each thread is using.',
    purpose: 'Keeps intermediate calculations close to execution resources.',
    quantity: '256 KB per SM',
    specifications: { 'Total per SM': '256 KB', Partitions: '4 × 64 KB' },
    representationType: 'logical',
    searchTerms: ['registers'],
  }),
  concept({
    id: 'l1',
    name: 'L1 cache / shared memory',
    shortName: 'L1 / shared',
    category: 'Memory',
    parent: 'sm',
    level: 'sm',
    description: 'Local storage shared by the work running on an SM.',
    purpose:
      'Reuses nearby data and lets cooperating threads exchange results.',
    quantity: '128 KB combined per SM',
    specifications: {
      'Combined capacity': '128 KB',
      'Shared / cache split': 'Configurable',
    },
    representationType: 'logical',
    searchTerms: ['L1', 'shared memory', 'cache'],
  }),
  concept({
    id: 'loadstore',
    name: 'Load / store units',
    shortName: 'Load / store',
    category: 'Memory',
    parent: 'sm',
    level: 'sm',
    description:
      'The pathway for moving thread data into and out of registers.',
    purpose: 'Executes memory accesses requested by instructions.',
    quantity: 'Grouped by processing partition',
    specifications: { View: 'Functional groups' },
    representationType: 'logical',
    searchTerms: ['LSU', 'memory access'],
  }),
  concept({
    id: 'sfu',
    name: 'Special function units',
    shortName: 'SFU',
    category: 'Compute',
    parent: 'sm',
    level: 'sm',
    description: 'Resources for specialized mathematical operations.',
    purpose: 'Supports functions such as transcendental approximations.',
    quantity: 'Grouped by processing partition',
    specifications: { View: 'Functional groups' },
    representationType: 'logical',
    searchTerms: ['math', 'special function'],
  }),
];
manifest.push(
  concept({
    id: 'thermalpad',
    name: 'Thermal interface pads',
    shortName: 'Thermal pad',
    category: 'Cooling',
    parent: 'card',
    level: 'card',
    description:
      'Compliant thermal material bridges small gaps between packages and the cooling assembly.',
    purpose:
      'Conducts heat while accommodating differences in component height.',
    quantity: '16 illustrative pads',
    specifications: { Placement: 'Educational approximation' },
    representationType: 'physical',
  }),
  concept({
    id: 'heatpipe',
    name: 'Heat transport pipes',
    shortName: 'Heat pipe',
    category: 'Cooling',
    parent: 'card',
    level: 'card',
    description:
      'Sealed thermal transport paths distribute heat across the fin arrays.',
    purpose: 'Carries heat away from the central heat pickup area.',
    quantity: '6 illustrative paths',
    specifications: { Routing: 'Original approximate geometry' },
    representationType: 'physical',
  }),
  concept({
    id: 'powerstage',
    name: 'Switching power stages',
    shortName: 'Power stage',
    category: 'Power',
    parent: 'pcb',
    level: 'card',
    description:
      'Switching devices form part of the board’s voltage conversion circuitry.',
    purpose:
      'Regulates energy delivery together with inductors and capacitors.',
    quantity: '24 illustrative packages',
    specifications: { 'Electrical topology': 'Not asserted' },
    representationType: 'physical',
    searchTerms: ['MOSFET', 'driver', 'VRM'],
  }),
  concept({
    id: 'mlcc',
    name: 'Ceramic decoupling capacitors',
    shortName: 'Ceramic capacitor',
    category: 'Power',
    parent: 'pcb',
    level: 'card',
    description:
      'Small ceramic capacitors are placed near circuits that demand rapidly changing current.',
    purpose: 'Helps suppress local power-supply noise.',
    quantity: '64 illustrative components',
    specifications: { 'Values and placement': 'Not asserted' },
    representationType: 'physical',
    searchTerms: ['MLCC', 'decoupling'],
  }),
  concept({
    id: 'resistor',
    name: 'Surface-mount resistors',
    shortName: 'Resistor',
    category: 'Board',
    parent: 'pcb',
    level: 'card',
    description:
      'Small passive components support the board’s signal and control circuits.',
    purpose: 'Provides controlled resistance in supporting circuitry.',
    quantity: '64 illustrative components',
    specifications: { 'Values and placement': 'Not asserted' },
    representationType: 'physical',
  }),
  concept({
    id: 'fastener',
    name: 'Assembly fasteners',
    shortName: 'Fastener',
    category: 'Cooling',
    parent: 'card',
    level: 'card',
    description:
      'Mechanical fasteners secure the enclosure and cooling assemblies.',
    purpose: 'Maintains alignment and mechanical contact between components.',
    quantity: '16 modeled fasteners',
    specifications: { 'Count and placement': 'Illustrative' },
    representationType: 'physical',
    searchTerms: ['screw', 'mounting'],
  }),
  concept({
    id: 'bracket',
    name: 'Display mounting bracket',
    shortName: 'I/O bracket',
    category: 'Board',
    parent: 'card',
    level: 'card',
    description:
      'A rigid bracket supports the external ports and the card’s case mounting.',
    purpose: 'Locates display connections and anchors the card to the chassis.',
    quantity: '1 illustrative bracket',
    specifications: { Geometry: 'Approximate' },
    representationType: 'physical',
  }),
);
const fins = manifest.find((c) => c.id === 'heatsink')!;
fins.name = 'Heatsink fins';
fins.shortName = 'Cooling fin';
fins.quantity = '152 individually modeled fins';
fins.specifications = {
  'Array layout': '2 illustrative banks',
  'Physical fin count': 'Not claimed for the reference card',
};
export const byId = Object.fromEntries(
  manifest.map((c) => [c.id, c]),
) as Record<string, Concept>;
for (const c of manifest) if (c.parent) byId[c.parent].children.push(c.id);
export const levelNames: Record<Level, string> = {
  card: 'RTX 5090',
  die: 'GB202',
  gpc: 'GPC',
  tpc: 'TPC',
  sm: 'SM',
};
export const levelPath: Record<Level, Level[]> = {
  card: ['card'],
  die: ['card', 'die'],
  gpc: ['card', 'die', 'gpc'],
  tpc: ['card', 'die', 'gpc', 'tpc'],
  sm: ['card', 'die', 'gpc', 'tpc', 'sm'],
};
export function searchConcepts(query: string) {
  const terms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t !== 'all');
  return manifest.filter((c) =>
    terms.every((t) =>
      [c.name, c.shortName, ...c.searchTerms]
        .join(' ')
        .toLowerCase()
        .includes(t),
    ),
  );
}
export type Selection = { concept: string; instance?: number };
export type ExplorerState = {
  level: Level;
  explode: number;
  visible: Category[];
  hidden: string[];
  selection: Selection | null;
  isolated: boolean;
  view: 'perspective' | 'top' | 'front' | 'back';
  cameraRevision: number;
  focusRevision: number;
};
export const initialState: ExplorerState = {
  level: 'card',
  explode: 0,
  visible: [...categories],
  hidden: [],
  selection: null,
  isolated: false,
  view: 'perspective',
  cameraRevision: 0,
  focusRevision: 0,
};
export function selectSearch(state: ExplorerState, id: string): ExplorerState {
  const c = byId[id];
  if (id === 'card' || id === 'die')
    return {
      ...state,
      level: c.level,
      explode: 0,
      selection: null,
      visible: [...categories],
      hidden: [],
      isolated: false,
      view: 'perspective',
      focusRevision: 0,
      cameraRevision: state.cameraRevision + 1,
    };
  return {
    ...state,
    level: c.level,
    explode: c.level === 'card' ? 48 : 0,
    selection: { concept: id },
    visible: state.visible.includes(c.category)
      ? state.visible
      : [...state.visible, c.category],
    hidden: state.hidden.filter((x) => x !== id),
    isolated: false,
    focusRevision: state.focusRevision + 1,
    cameraRevision: state.cameraRevision + 1,
  };
}
