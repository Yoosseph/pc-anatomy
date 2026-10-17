import { concept, type Category, type Concept } from '../concept.ts';
import { notebookLevels, type NotebookLevel } from '../notebook-levels.ts';
import type { SourceId } from '../sources.ts';

const physical =
  'Published model specifications identify the subject. Internal outlines, component positions, package populations and fastening details are illustrative educational geometry, not a service drawing or exact PCB reproduction.';
const logical =
  'Explanatory functional diagram. Block placement, area and generic execution / DRAM examples are not semiconductor floorplans, transistor layouts or undocumented vendor specifications.';
export const notebookConcepts: Concept[] = [];

function part(
  level: NotebookLevel,
  suffix: string,
  name: string,
  category: Category,
  description: string,
  purpose: string,
  specifications: Record<string, string> = {},
  sources: SourceId[] = [],
  open?: NotebookLevel,
  quantity = '1 illustrated functional group',
) {
  const id = open ?? `${level}-${suffix}`;
  notebookConcepts.push(
    concept({
      id,
      level,
      parent: level,
      name,
      category,
      description,
      purpose,
      specifications,
      sources,
      representationType: notebookLevels[level].kind,
      physicalAccuracy:
        notebookLevels[level].kind === 'physical' ? physical : logical,
      quantity,
      open,
      searchTerms: [
        level.startsWith('legion')
          ? 'Lenovo Legion laptop notebook'
          : 'Apple MacBook M1 Pro laptop notebook',
        name,
      ],
      ...(suffix === 'cover' || suffix === 'deck' ? { opensFirst: true } : {}),
    }),
  );
}

const legionSpecs = {
  Model: 'Legion 5 15ACH6H (2021)',
  Processor: 'AMD Ryzen 7 5800H · 8 cores / 16 threads',
  Graphics: 'GeForce RTX 3060 Laptop GPU · 6 GB GDDR6',
  Memory: '16 GB DDR4-3200 · two SO-DIMM slots',
  Storage: '512 GB M.2 PCIe NVMe · replaceable',
  Display: '15.6-inch IPS · 1920 × 1080 · 165 Hz option',
  Battery: '80 Wh option',
  Dimensions: '362.56 × 260.61 × 22.5–25.75 mm',
};
const macSpecs = {
  Model: 'MacBook Pro 14-inch (2021)',
  Processor: 'M1 Pro · 10-core CPU (8 performance + 2 efficiency)',
  Graphics: 'M1 Pro · 16-core integrated GPU',
  Memory: '16 GB unified memory · not socketed',
  Storage: '512 GB onboard flash · not an M.2 module',
  Display: '14.2-inch Liquid Retina XDR · 3024 × 1964 · up to 120 Hz',
  Battery: '70 Wh',
  Dimensions: '312.6 × 221.2 × 15.5 mm',
};

for (const [id, specs, source] of [
  ['legion', legionSpecs, 'legionpsref'],
  ['macbook', macSpecs, 'macbookspec'],
] as const) {
  notebookConcepts.push(
    concept({
      id,
      level: id,
      parent: null,
      open: id,
      name: notebookLevels[id].name,
      category: 'Chassis',
      description: notebookLevels[id].summary,
      purpose:
        'Explore a complete notebook, then open its components and their internal architecture.',
      quantity: '1 selected configuration',
      specifications: specs,
      sources: [source],
      representationType: 'physical',
      physicalAccuracy: physical,
      searchTerms: [id, 'laptop', 'notebook', 'portable computer'],
    }),
  );
}

for (const mac of [false, true]) {
  const root = mac ? 'macbook' : 'legion';
  const board = mac ? 'macboard' : 'legionboard';
  const cooling = mac ? 'maccooling' : 'legioncooling';
  const battery = mac ? 'macbattery' : 'legionbattery';
  const display = mac ? 'macdisplay' : 'legiondisplay';
  const storage = mac ? 'macstorage' : 'legionstorage';
  const spec: SourceId = mac ? 'macbookspec' : 'legionpsref';
  const service: SourceId = mac ? 'macbookservice' : 'legionservice';
  part(
    root,
    'cover',
    'Bottom cover',
    'Chassis',
    'The removable underside closes the notebook.',
    'Protects internal assemblies and provides access for servicing.',
    {},
    [service],
  );
  part(
    root,
    'deck',
    'Keyboard and palm rest',
    'Chassis',
    mac
      ? 'Backlit keyboard without a numeric keypad.'
      : 'Backlit keyboard with a numeric keypad.',
    'Supports typing and provides the upper structural surface.',
    {},
    [spec, service],
  );
  part(
    root,
    'trackpad',
    mac ? 'Force Touch trackpad' : 'Touchpad',
    'Board',
    'A touch-sensitive pointing surface below the keyboard.',
    'Converts finger motion into cursor and gesture input.',
    {},
    [spec],
  );
  part(
    root,
    'hinges',
    'Display hinges',
    'Chassis',
    'Two pivots connect the screen to the base.',
    'Hold the display at a usable angle.',
    {},
    [service],
    undefined,
    '2 hinges',
  );
  part(
    root,
    'display',
    notebookLevels[display].name,
    'Graphics',
    'A display assembly with an LCD panel and backlight.',
    'Shows the image produced by the graphics system.',
    { Display: (mac ? macSpecs : legionSpecs).Display },
    [spec, service],
    display,
  );
  part(
    root,
    'board',
    notebookLevels[board].name,
    'Board',
    'The main board carries compute and I/O circuitry.',
    'Connects processors, memory, storage and peripherals.',
    {},
    [service],
    board,
  );
  part(
    root,
    'cooling',
    notebookLevels[cooling].name,
    'Cooling',
    'A shared thermal system links hot chips to forced-air exhausts.',
    'Transfers heat into air leaving the notebook.',
    {},
    [service],
    cooling,
  );
  part(
    root,
    'battery',
    notebookLevels[battery].name,
    'Power',
    'A rechargeable lithium-polymer battery assembly.',
    'Supplies energy while the notebook is unplugged.',
    { Capacity: mac ? '70 Wh' : '80 Wh configuration' },
    [spec, service],
    battery,
  );
  part(
    root,
    'speakers',
    'Speaker assemblies',
    'Board',
    'Enclosures route sound from the notebook speakers.',
    'Convert audio signals into sound.',
    {},
    [spec, service],
    undefined,
    '2 illustrated enclosures; driver detail omitted',
  );
  part(
    root,
    'fasteners',
    'Enclosure fasteners',
    'Chassis',
    'Small screws retain the lower cover.',
    'Secure the enclosure to its supporting structure.',
    { Scope: 'Illustrative positions and count' },
    [service],
  );

  part(
    board,
    'pcb',
    'System PCB',
    'Board',
    'A multilayer circuit board links the installed devices.',
    'Carries power and high-speed signals.',
    {},
    [service],
  );
  part(
    board,
    'power',
    'Voltage regulation',
    'Power',
    'Local conversion circuits supply low-voltage chip rails.',
    'Regulates the power delivered to compute and memory.',
    {},
    ['multiphase'],
  );
  part(
    board,
    'ports',
    'External I/O',
    'Board',
    mac
      ? 'Thunderbolt 4, HDMI, SDXC, audio and MagSafe connect the notebook.'
      : 'USB, HDMI, Ethernet, audio and DC input connect the notebook.',
    'Connects displays, peripherals, networks and charging.',
    {},
    [spec],
  );
  part(
    board,
    'wireless',
    'Wireless networking',
    'Board',
    'Radio circuitry communicates with nearby wireless devices.',
    'Provides Wi-Fi and Bluetooth connectivity.',
    {},
    [spec],
  );
  part(
    board,
    'storage',
    notebookLevels[storage].name,
    'Storage',
    mac
      ? 'Flash packages are mounted on the logic board.'
      : 'A removable M.2 module plugs into the system board.',
    'Keeps programs and files when power is off.',
    { Storage: (mac ? macSpecs : legionSpecs).Storage },
    [spec, service],
    storage,
  );

  part(
    cooling,
    'fans',
    'Centrifugal blowers',
    'Cooling',
    'Two radial fans push air through nearby fin stacks.',
    'Drives airflow through the compact cooling assembly.',
    {},
    [service, 'fanconstruction'],
    undefined,
    '2 blowers',
  );
  part(
    cooling,
    'pipes',
    'Heat-pipe assembly',
    'Cooling',
    'Sealed thermal paths connect cold plates to fin stacks.',
    'Moves heat from chips to the exhaust region.',
    { Scope: 'Illustrative pipe routing' },
    [service, 'aircooler'],
  );
  part(
    cooling,
    'fins',
    'Exhaust fin stacks',
    'Cooling',
    'Thin metal fins expose a large area to moving air.',
    'Transfers heat from the thermal assembly to the air.',
    {},
    ['aircooler'],
  );
  part(
    cooling,
    'plates',
    'Contact plates',
    'Cooling',
    'Flat contact surfaces couple the cooler to the processor packages.',
    'Collects heat through a thermal interface.',
    {},
    [service, 'aircooler'],
  );

  part(
    battery,
    'cells',
    'Pouch cells',
    'Power',
    'Flat rechargeable cells store chemical energy.',
    'Provides the energy reservoir for portable operation.',
    {
      Scope: 'Illustrative pouch arrangement; not an electrical wiring diagram',
    },
    [service],
    undefined,
    'Illustrative cell group',
  );
  part(
    battery,
    'controller',
    'Battery management',
    'Power',
    'A small board monitors and manages the battery pack.',
    'Coordinates protection and charge-state reporting.',
    {},
    [service],
  );
  part(
    battery,
    'connector',
    'Battery connector',
    'Power',
    'A cable connects the battery pack to the system.',
    'Carries battery power and management signals.',
    {},
    [service],
  );

  part(
    display,
    'cover',
    'Display lid',
    'Chassis',
    'The outer shell protects the display stack.',
    'Supports the screen and hinge attachment.',
    {},
    [service],
  );
  part(
    display,
    'panel',
    'LCD panel',
    'Graphics',
    'Liquid-crystal pixels modulate transmitted light.',
    'Forms the visible color image.',
    { Resolution: mac ? '3024 × 1964' : '1920 × 1080 selected option' },
    [spec],
  );
  part(
    display,
    'backlight',
    mac ? 'Mini-LED backlight' : 'LED backlight',
    'Graphics',
    'An illumination layer sits behind the LCD.',
    'Provides the light that the LCD controls.',
    {},
    [spec],
  );
  part(
    display,
    'camera',
    'Camera module',
    'Board',
    'A small camera sits above the display.',
    'Captures video for calls.',
    { Resolution: mac ? '1080p' : '720p' },
    [spec],
  );
  part(
    display,
    'cable',
    'Display cable',
    'Board',
    'A flexible connection crosses the hinge region.',
    'Carries display signals between the board and screen.',
    {},
    [service],
  );

  part(
    storage,
    'substrate',
    mac ? 'Logic-board region' : 'M.2 substrate',
    'Board',
    mac
      ? 'The flash packages are soldered to the logic board.'
      : 'A slim PCB carries controller and flash devices.',
    'Provides electrical connections for storage.',
    {},
    [service],
  );
  part(
    storage,
    'nand',
    'NAND flash',
    'Storage',
    'Nonvolatile flash holds stored data.',
    'Retains programs and files without power.',
    { Scope: 'Package count and die population are illustrative' },
    ['ssdarchitecture', spec],
  );
  if (!mac) {
    part(
      storage,
      'controller',
      'NVMe controller',
      'Compute',
      'An onboard controller manages flash access.',
      'Translates host commands into flash operations and error correction.',
      {},
      ['nvme', 'ssdarchitecture'],
    );
    part(
      storage,
      'contacts',
      'M.2 connector',
      'Storage',
      'Edge contacts connect the replaceable drive to its socket.',
      'Carries PCIe communication and power.',
      {},
      [service, 'nvme'],
    );
  } else {
    part(
      storage,
      'link',
      'Connection to Apple Silicon',
      'Storage',
      'The onboard flash is managed by the system chip.',
      'Connects persistent storage to the integrated storage controller.',
      { Serviceability: 'No removable M.2 drive' },
      [service],
    );
  }
}

part(
  'legionboard',
  'cpu',
  'Ryzen 7 5800H',
  'Compute',
  'A soldered Zen 3 mobile processor.',
  'Runs the operating system and application threads.',
  { Cores: '8 cores / 16 threads', Cache: '4 MB L2 / 16 MB L3' },
  ['legionpsref'],
  'legioncpu',
);
part(
  'legionboard',
  'gpu',
  'RTX 3060 Laptop GPU',
  'Graphics',
  'A separate Ampere GPU is soldered to the board.',
  'Accelerates graphics and parallel workloads.',
  { Memory: '6 GB dedicated GDDR6' },
  ['legionpsref'],
  'legiongpu',
);
part(
  'legionboard',
  'memory',
  'DDR4 SO-DIMM',
  'Memory',
  'Two replaceable notebook memory modules.',
  'Holds active programs and data for the CPU.',
  { Standard: 'DDR4-3200', Capacity: '16 GB selected configuration' },
  ['legionpsref', 'legionservice'],
  'legionmemory',
  '2 SO-DIMMs',
);
part(
  'legionboard',
  'vram',
  'Dedicated GDDR6',
  'Memory',
  'Graphics memory is separate from the system SO-DIMMs.',
  'Provides the discrete GPU with local working storage.',
  { Capacity: '6 GB' },
  ['legionpsref', 'gddr6'],
);
part(
  'legioncpu',
  'cores',
  'Zen 3 CPU cores',
  'Compute',
  'Eight CPU cores support sixteen hardware threads.',
  'Runs general-purpose instruction streams.',
  { Cores: '8', Threads: '16' },
  ['legionpsref'],
  'legioncore',
  '8 cores',
);
part(
  'legioncpu',
  'cache',
  'Shared L3 cache',
  'Memory',
  'A shared cache keeps recently used data close to the cores.',
  'Reduces accesses to external memory.',
  { Capacity: '16 MB' },
  ['legionpsref'],
);
part(
  'legioncpu',
  'igpu',
  'Integrated Radeon graphics',
  'Graphics',
  'The mobile processor also includes integrated graphics.',
  'Provides an alternative graphics path to the discrete GPU.',
  {},
  ['legionpsref'],
);
part(
  'legioncpu',
  'io',
  'Memory and I/O interfaces',
  'Board',
  'Interfaces connect compute resources to external devices.',
  'Moves data to memory and peripherals.',
  {},
  ['legionpsref'],
);
part(
  'legiongpu',
  'sm',
  'Streaming multiprocessors',
  'Graphics',
  'Ampere groups parallel execution resources into SMs.',
  'Schedules and executes GPU work.',
  { Scope: 'Logical groups shown schematically; not a physical die map' },
  ['ampereguide'],
  'legionsm',
);
part(
  'legiongpu',
  'memory',
  'GDDR6 interface',
  'Memory',
  'Memory controllers connect to dedicated external VRAM.',
  'Supplies graphics data to the execution units.',
  { Capacity: '6 GB GDDR6' },
  ['legionpsref', 'gddr6'],
);
part(
  'legiongpu',
  'cache',
  'GPU cache',
  'Memory',
  'On-chip storage retains reusable data.',
  'Reduces repeated external-memory accesses.',
  {},
  ['ampereguide'],
);
part(
  'legiongpu',
  'frontend',
  'Graphics front end',
  'Graphics',
  'Graphics work is prepared before reaching execution units.',
  'Organizes rendering workloads.',
  {},
  ['ampereguide'],
);

part(
  'macboard',
  'soc',
  'Apple M1 Pro',
  'Compute',
  'A system-on-chip combines general computing and specialized engines.',
  'Processes CPU, GPU and accelerator workloads within one integrated design.',
  { CPU: '10 cores selected', GPU: '16 cores selected' },
  ['m1proarchitecture'],
  'm1pro',
);
part(
  'm1pro',
  'cpu',
  'M1 Pro CPU',
  'Compute',
  'The selected chip has eight performance and two efficiency cores.',
  'Runs application threads at different performance and power levels.',
  { Cores: '8 performance + 2 efficiency' },
  ['m1proarchitecture'],
  'maccpu',
);
part(
  'm1pro',
  'gpu',
  'M1 Pro GPU',
  'Graphics',
  'Sixteen graphics cores share the system memory pool.',
  'Executes graphics and parallel computation.',
  { Cores: '16' },
  ['m1proarchitecture'],
  'macgpu',
);
part(
  'm1pro',
  'memory',
  'Unified memory',
  'Memory',
  'CPU, GPU and accelerators use one memory pool.',
  'Shares data without separate CPU and GPU memory copies.',
  { Capacity: '16 GB selected', Bandwidth: '200 GB/s' },
  ['m1proarchitecture'],
  'macmemory',
);
part(
  'm1pro',
  'neural',
  'Neural Engine',
  'Compute',
  'A dedicated neural-network accelerator.',
  'Accelerates supported machine-learning operations.',
  { Cores: '16' },
  ['macbookspec'],
);
part(
  'm1pro',
  'media',
  'Media engine',
  'Graphics',
  'Dedicated hardware supports video processing.',
  'Accelerates H.264, HEVC and ProRes workflows.',
  {},
  ['m1proarchitecture'],
);
part(
  'm1pro',
  'io',
  'I/O and storage',
  'Board',
  'Integrated controllers connect the SoC to the rest of the notebook.',
  'Moves data to storage and external interfaces.',
  {},
  ['macbookservice'],
);
part(
  'maccpu',
  'performance',
  'Performance cores',
  'Compute',
  'Eight cores prioritize high-throughput CPU work.',
  'Executes demanding application threads.',
  { Count: '8' },
  ['m1proarchitecture'],
  'maccore',
  '8 cores',
);
part(
  'maccpu',
  'efficiency',
  'Efficiency cores',
  'Compute',
  'Two cores prioritize energy efficiency.',
  'Handles suitable workloads at lower power.',
  { Count: '2' },
  ['m1proarchitecture'],
  undefined,
  '2 cores',
);
part(
  'maccpu',
  'memory',
  'Shared memory access',
  'Memory',
  'The CPU accesses the system unified memory.',
  'Provides application data to the execution cores.',
  {},
  ['m1proarchitecture'],
);
part(
  'macgpu',
  'cores',
  'GPU cores',
  'Graphics',
  'Sixteen integrated cores provide parallel graphics execution.',
  'Processes graphics and compute workloads.',
  { Count: '16' },
  ['m1proarchitecture'],
  'macgpucore',
  '16 cores',
);
part(
  'macgpu',
  'memory',
  'Unified-memory access',
  'Memory',
  'The GPU uses the same memory pool as the CPU.',
  'Shares graphics resources and compute data.',
  {},
  ['m1proarchitecture'],
);

for (const level of ['legioncore', 'maccore'] as const) {
  for (const [id, name, description, purpose] of [
    [
      'fetch',
      'Instruction fetch',
      'Instructions are retrieved for execution.',
      'Supplies the next operations to the core.',
    ],
    [
      'decode',
      'Instruction decode',
      'Encoded instructions are interpreted.',
      'Determines the operations and operands needed.',
    ],
    [
      'execute',
      'Execution resources',
      'Arithmetic and logic operate on values.',
      'Computes results for the program.',
    ],
    [
      'registers',
      'Registers',
      'Small fast storage holds working values.',
      'Keeps operands and results close to execution.',
    ],
    [
      'loadstore',
      'Memory access',
      'Loads and stores exchange data with memory.',
      'Connects program execution to its data.',
    ],
  ])
    part(
      level,
      id,
      name,
      'Compute',
      description,
      purpose,
      {
        Scope:
          'Generic CPU teaching model; no vendor pipeline widths or stage counts asserted',
      },
      ['cpuprinciples'],
    );
}
for (const level of ['legionsm', 'macgpucore'] as const) {
  for (const [id, name, description, purpose] of [
    [
      'schedule',
      'Thread scheduling',
      'Groups of GPU work are selected for execution.',
      'Keeps execution resources supplied with work.',
    ],
    [
      'arithmetic',
      'Parallel arithmetic',
      'Many lanes apply operations to data.',
      'Executes parallel shader or compute instructions.',
    ],
    [
      'registers',
      'Working registers',
      'Fast local storage holds active values.',
      'Keeps thread state close to execution.',
    ],
    [
      'memory',
      'Memory access',
      'Data moves between execution and memory.',
      'Feeds operands and stores results.',
    ],
    [
      'texture',
      'Texture sampling',
      'Graphics workloads sample image data.',
      'Supports filtered access to texture resources.',
    ],
  ])
    part(
      level,
      id,
      name,
      'Graphics',
      description,
      purpose,
      {
        Scope:
          level === 'macgpucore'
            ? 'Generic GPU concepts; not an Apple microarchitecture disclosure'
            : 'Functional Ampere SM diagram; not a floorplan',
      },
      [level === 'macgpucore' ? 'metalprinciples' : 'ampereguide'],
    );
}
part(
  'legionmemory',
  'board',
  'SO-DIMM PCB',
  'Board',
  'A short memory board fits notebook sockets.',
  'Connects DRAM packages to the system.',
  { Scope: 'Illustrative DDR4 notebook module' },
  ['legionservice'],
);
part(
  'legionmemory',
  'dram',
  'DDR4 DRAM packages',
  'Memory',
  'Volatile memory packages hold working data.',
  'Stores active program data while power is supplied.',
  {},
  ['micron16gbddr4'],
  'legiondram',
);
part(
  'legionmemory',
  'contacts',
  'SO-DIMM contacts',
  'Memory',
  'A keyed contact edge fits the memory socket.',
  'Carries memory signals and power.',
  {},
  ['legionservice'],
);
part(
  'legionmemory',
  'spd',
  'Module identification',
  'Memory',
  'A small serial device describes the memory module.',
  'Provides configuration information during initialization.',
  {},
  ['micronddr4design'],
);
part(
  'macmemory',
  'pool',
  'Shared DRAM pool',
  'Memory',
  'The selected notebook provides 16 GB of unified memory.',
  'Holds data used by multiple on-chip engines.',
  { Capacity: '16 GB' },
  ['m1proarchitecture'],
  'macdram',
);
part(
  'macmemory',
  'cpu',
  'CPU access',
  'Compute',
  'CPU operations read and write shared data.',
  'Supports application working sets.',
  {},
  ['m1proarchitecture'],
);
part(
  'macmemory',
  'gpu',
  'GPU access',
  'Graphics',
  'GPU operations use the same memory pool.',
  'Avoids a separate dedicated VRAM pool.',
  {},
  ['m1proarchitecture'],
);
part(
  'macmemory',
  'fabric',
  'Memory interconnect',
  'Board',
  'The system coordinates access between engines and memory.',
  'Transfers data among the shared resources.',
  {},
  ['m1proarchitecture'],
);
for (const [dram, cell] of [
  ['legiondram', 'legioncell'],
  ['macdram', 'maccell'],
] as const) {
  part(
    dram,
    'cells',
    'Memory-cell array',
    'Memory',
    'An array stores bits as electrical charge.',
    'Holds data in rows and columns.',
    {
      Scope:
        'Conceptual array; capacity and physical bank count are not inferred from the picture',
    },
    ['dramfundamentals'],
    cell,
  );
  part(
    dram,
    'row',
    'Row decoder',
    'Memory',
    'A row address selects a wordline.',
    'Activates a row for access.',
    {},
    ['dramfundamentals'],
  );
  part(
    dram,
    'sense',
    'Sense amplifiers',
    'Memory',
    'Small charge differences are amplified.',
    'Reads and restores stored values.',
    {},
    ['dramfundamentals'],
  );
  part(
    dram,
    'column',
    'Column selection',
    'Memory',
    'A column address chooses data from an active row.',
    'Transfers selected bits to the data interface.',
    {},
    ['dramfundamentals'],
  );
  part(
    cell,
    'transistor',
    'Access transistor',
    'Memory',
    'A transistor gates access to the storage node.',
    'Connects the capacitor to a bitline when selected.',
    {},
    ['dramfundamentals'],
  );
  part(
    cell,
    'capacitor',
    'Storage capacitor',
    'Memory',
    'A capacitor stores charge representing a bit.',
    'Retains information between refresh operations.',
    {},
    ['dramfundamentals'],
  );
  part(
    cell,
    'wordline',
    'Wordline',
    'Memory',
    'A row-control wire drives access transistors.',
    'Selects cells for reading or writing.',
    {},
    ['dramfundamentals'],
  );
  part(
    cell,
    'bitline',
    'Bitline',
    'Memory',
    'A column wire exchanges charge with selected cells.',
    'Carries the signal to the sensing circuit.',
    {},
    ['dramfundamentals'],
  );
  part(
    cell,
    'refresh',
    'Refresh operation',
    'Memory',
    'Stored charge must periodically be restored.',
    'Preserves volatile data as charge leaks away.',
    {},
    ['dramfundamentals'],
  );
}
