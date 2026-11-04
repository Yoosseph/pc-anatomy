import {
  concept,
  type Category,
  type Concept,
  type Entry,
} from '../concept.ts';
import type { LevelId } from '../levels.ts';
import type { SourceId } from '../sources.ts';

/**
 * The two small NVIDIA cards: the ASUS Dual GeForce RTX 5060 Ti and the MSI
 * GeForce RTX 5060 INSPIRE ITX, built by `compact-card.ts`.
 *
 * They are written from one list because they are the same kind of card, and
 * each entry takes what differs from that card's own sources: the size, the
 * fans, the heatsink, the backplate. What neither maker publishes (the board
 * layout, heat pipe count, phase count) is drawn and labelled as such.
 *
 * Every id carries a `dual` or `itx` prefix so nothing collides with the
 * other cards. Neither card has chip scales: the GPU package is the deepest
 * part either opens to.
 */

interface CardFacts {
  prefix: 'dual' | 'itx';
  level: LevelId;
  name: string;
  shortName: string;
  maker: SourceId[];
  /** The maker's own description of the cooler, and NVIDIA's chip figures. */
  design: SourceId[];
  card: Record<string, string>;
  description: string;
  envelope: string;
  memory: { capacity: string; note: string };
  fans: Pick<Entry, 'description' | 'quantity' | 'specifications'>;
  heatsink: Pick<Entry, 'name' | 'description' | 'specifications'>;
  backplate: string;
  phases: string;
  searchTerms: string[];
}

const dual: CardFacts = {
  prefix: 'dual',
  level: 'rtx5060ti',
  name: 'ASUS Dual GeForce RTX 5060 Ti 16GB',
  shortName: 'RTX 5060 Ti',
  maker: ['dual5060ti'],
  design: ['dual5060tidesign'],
  card: {
    Architecture: 'NVIDIA Blackwell',
    'CUDA cores': '4,608',
    Memory: '16 GB GDDR7 · 128-bit · 28 Gbps',
    'Total graphics power': '180 W NVIDIA specification',
    'Recommended PSU': '550 W (ASUS)',
    Power: '1 × 8-pin',
    Interface: 'PCI Express 5.0',
    Outputs: '3 × DisplayPort 2.1b · 1 × HDMI 2.1b',
    Dimensions: '229 × 120 × 50 mm · 2.5 slots',
  },
  description:
    'A compact two-fan card on NVIDIA’s Blackwell architecture, with 16 GB of GDDR7 on a 128-bit bus.',
  envelope:
    'The 229 × 120 × 50 mm 2.5-slot envelope, two Axial-tech fans, single 8-pin socket and four outputs follow ASUS’s specification.',
  memory: {
    capacity: '16 GB',
    note: 'Four packages are drawn on the face of the board, one per 32-bit channel. The 16 GB card carries twice what four 2 GB packages hold; how ASUS splits it between the two faces of the board is not modelled.',
  },
  fans: {
    description:
      'Two Axial-tech fans: a small hub for longer blades, and a barrier ring round the tips.',
    quantity: '2 modeled fans',
    specifications: {
      Type: 'Axial-tech, barrier ring',
      Bearings: 'Dual ball bearings',
      'Stop mode': 'Below 50 °C at low load',
      'Blade count': 'Illustrative',
    },
  },
  heatsink: {
    name: 'Fin stack',
    description:
      'One aluminium fin stack the length of the card, threaded onto heat pipes from the GPU’s contact plate.',
    specifications: {
      'Heat pipes': 'Present per ASUS; 3 drawn, count not published',
      'Physical fin count': 'Not claimed',
    },
  },
  backplate:
    'A vented rear plate that stiffens the board; the vent past the end of the board lets the second fan’s air through.',
  phases:
    'Six GPU phases and one memory phase are drawn; ASUS does not publish the count.',
  searchTerms: ['asus', 'dual', '5060 ti', 'blackwell', 'geforce', 'compact'],
};

const itx: CardFacts = {
  prefix: 'itx',
  level: 'rtx5060',
  name: 'MSI GeForce RTX 5060 8G INSPIRE ITX',
  shortName: 'RTX 5060',
  maker: ['inspire5060'],
  design: ['inspirecooler'],
  card: {
    Architecture: 'NVIDIA Blackwell',
    'CUDA cores': '3,840',
    Memory: '8 GB GDDR7 · 128-bit · 28 Gbps',
    'Power consumption': '145 W (MSI)',
    'Recommended PSU': '550 W (MSI)',
    Power: '1 × 8-pin',
    Interface: 'PCI Express 5.0 ×16, using ×8',
    Outputs: '3 × DisplayPort 2.1b · 1 × HDMI 2.1b',
    Dimensions: '145 × 120 × 45 mm',
    Weight: '581 g',
  },
  description:
    'One of the smallest RTX 5060 cards: a single fan over a copper-cored heatsink, short enough for an ITX case.',
  envelope:
    'The 145 × 120 × 45 mm envelope, single seven-blade fan, copper-core radial heatsink, vented backplate, single 8-pin socket and four outputs follow MSI’s data sheet and its published description.',
  memory: {
    capacity: '8 GB',
    note: 'Four 2 GB packages, one per 32-bit channel of the 128-bit bus.',
  },
  fans: {
    description:
      'One STORMFORCE fan: seven claw-textured blades whose tips are tied by a circular arc.',
    quantity: '1 modeled fan',
    specifications: {
      Blades: '7',
      'Stop mode': 'Zero Frozr, stops when cool',
    },
  },
  heatsink: {
    name: 'Sunflower heatsink',
    description:
      'Extruded aluminium fins radiating from a copper core, like the petals of a sunflower, in place of heat pipes.',
    specifications: {
      Core: 'Copper',
      Fins: 'Extruded aluminium, radial',
      'Physical fin count': 'Not claimed',
    },
  },
  backplate:
    'A reinforcing rear plate with a vent, so warm air can leave from the back of the card in a cramped case.',
  phases:
    'Five GPU phases and one memory phase on DrMOS power stages are drawn; MSI does not publish the count.',
  searchTerms: [
    'msi',
    'inspire',
    'itx',
    '5060',
    'blackwell',
    'geforce',
    'small form factor',
  ],
};

const board = (f: CardFacts) =>
  `Representative placement on an illustrative board. ${f.prefix === 'dual' ? 'ASUS' : 'MSI'} does not publish the board layout; positions, values and routing are drawn to be consistent with each other, not copied.`;

function cardConcepts(f: CardFacts): Concept[] {
  const exterior = `Illustrative geometry after the ${f.name}. ${f.envelope} Exact shapes, fin counts and routing are approximate.`;
  const id = (name: string) => f.prefix + name;
  const part = (
    name: string,
    e: Omit<Entry, 'id' | 'level' | 'representationType' | 'parent'> & {
      parent?: string;
      sources: SourceId[];
      accuracy?: 'board';
    },
  ) =>
    concept({
      ...e,
      id: id(name),
      parent: e.parent ? id(e.parent) : id('card'),
      level: f.level,
      representationType: 'physical',
      physicalAccuracy: e.accuracy === 'board' ? board(f) : exterior,
    });
  const onBoard = (
    name: string,
    category: Category,
    e: Omit<
      Entry,
      'id' | 'level' | 'representationType' | 'parent' | 'category'
    > & {
      sources: SourceId[];
      parent?: string;
    },
  ) =>
    part(name, {
      ...e,
      category,
      parent: e.parent ?? 'pcb',
      accuracy: 'board',
    });

  return [
    concept({
      id: id('card'),
      name: f.name,
      shortName: f.shortName,
      category: 'Graphics',
      parent: 'graphicscard',
      level: f.level,
      open: f.level,
      description: f.description,
      purpose:
        'Renders games and runs parallel compute and AI work, with RT cores for ray tracing and Tensor cores for matrix math.',
      quantity: '1 reference specimen',
      specifications: f.card,
      representationType: 'physical',
      physicalAccuracy: exterior,
      sources: [...f.maker, ...f.design, 'rtx5060family'],
      searchTerms: f.searchTerms,
    }),
    part('shroud', {
      name: 'Shroud',
      category: 'Cooling',
      description:
        f.prefix === 'dual'
          ? 'A dark cover with two round fan openings and a pair of grey trim bars between them.'
          : 'A champagne cover with one round opening and a bright bezel round the fan.',
      purpose: 'Holds the fans and guides their air down into the heatsink.',
      quantity: '1 modeled shroud',
      specifications: { Fans: f.prefix === 'dual' ? '2' : '1' },
      sources: [...f.maker, ...f.design],
      searchTerms: ['cover', 'exterior'],
    }),
    part('fan', {
      name: f.prefix === 'dual' ? 'Axial-tech fans' : 'STORMFORCE fan',
      shortName: 'Fan',
      category: 'Cooling',
      ...f.fans,
      purpose: 'Press air down through the fins and out of the card.',
      sources: [...f.design, 'fanconstruction'],
      searchTerms: ['cooling', 'airflow', 'blades'],
    }),
    part('fanmotor', {
      name: 'Brushless fan motor',
      shortName: 'Fan motor',
      category: 'Cooling',
      parent: 'fan',
      description: 'A wound stator and bearing under each fan hub.',
      purpose: 'Spins the impeller at the speed the board asks for.',
      quantity: f.prefix === 'dual' ? '2 modeled motors' : '1 modeled motor',
      specifications: { Drive: 'Brushless DC' },
      sources: ['bldc', 'bearing'],
      searchTerms: ['motor', 'stator', 'bearing'],
    }),
    part('heatsink', {
      ...f.heatsink,
      shortName: 'Heatsink',
      category: 'Cooling',
      purpose:
        'Spreads the GPU’s heat over enough metal for the fan air to carry it off.',
      quantity: '1 complete assembly',
      sources: f.design,
      searchTerms: ['fins', 'radiator', 'heat sink'],
    }),
    ...(f.prefix === 'dual'
      ? [
          part('coldplate', {
            name: 'Contact plate',
            shortName: 'Cold plate',
            category: 'Cooling',
            description:
              'A copper block on the GPU, on a frame that also presses on the memory and regulator pads.',
            purpose: 'Takes heat out of the GPU die into the heat pipes.',
            quantity: '1 modeled plate',
            specifications: { Contact: 'Copper' },
            sources: f.design,
            searchTerms: ['base', 'copper', 'contact'],
          }),
          part('heatpipe', {
            name: 'Heat pipes',
            shortName: 'Heat pipe',
            category: 'Cooling',
            description:
              'Sealed copper pipes from the contact plate out along the fin stack.',
            purpose:
              'Carry heat from the GPU to the far ends of the fins by evaporating and condensing a fluid inside.',
            quantity: '3 modeled pipes',
            specifications: { Count: 'Not published; 3 drawn' },
            sources: f.design,
            searchTerms: ['heatpipe', 'copper', 'vapor'],
          }),
        ]
      : [
          part('core', {
            name: 'Copper core',
            shortName: 'Copper core',
            category: 'Cooling',
            parent: 'heatsink',
            description:
              'A solid copper cylinder standing on the GPU, the spine the radial fins grow out of.',
            purpose:
              'Conducts the GPU’s heat straight up and out into every fin at once, without heat pipes.',
            quantity: '1 modeled core',
            specifications: { Material: 'High-conductivity copper' },
            sources: f.design,
            searchTerms: ['copper', 'core', 'base'],
          }),
        ]),
    part('backplate', {
      name: 'Vented backplate',
      shortName: 'Backplate',
      category: 'Cooling',
      description: f.backplate,
      purpose:
        'Stiffens the card against sag and lets warm air leave from its back.',
      quantity: '1 modeled plate',
      specifications: {
        Vent:
          f.prefix === 'dual'
            ? 'Past the end of the board'
            : 'Slots over the board',
      },
      sources: [...f.maker, ...f.design],
      searchTerms: ['back plate', 'vent'],
    }),
    part('bracket', {
      name: 'I/O bracket',
      shortName: 'Bracket',
      category: 'Chassis',
      description:
        'The steel plate that screws to the case and carries the outputs.',
      purpose: 'Holds the card to the case and exposes its display outputs.',
      quantity: '1 modeled bracket',
      specifications: { Width: f.prefix === 'dual' ? '2.5 slots' : '2 slots' },
      sources: f.maker,
      searchTerms: ['bracket', 'pci bracket', 'slot cover'],
    }),
    part('fastener', {
      name: 'Screws',
      shortName: 'Screw',
      category: 'Chassis',
      description:
        'Screws holding the shroud to the heatsink and the backplate to the board.',
      purpose:
        'Keep the assembly together and the cooler pressed onto the GPU.',
      quantity: '8 modeled screws',
      specifications: { Placement: 'Illustrative' },
      sources: [...f.maker, ...f.design],
      searchTerms: ['screw', 'fastener'],
    }),
    part('thermalpad', {
      name: 'Thermal pads',
      shortName: 'Thermal pad',
      category: 'Cooling',
      description:
        'Soft pads between each memory package and the cooler above it.',
      purpose: 'Fill the gap so memory heat reaches the metal.',
      quantity: '4 modeled pads',
      specifications: { Placement: 'One per memory package' },
      sources: f.design,
      searchTerms: ['pad', 'thermal'],
    }),
    part('tim', {
      name: 'Thermal paste',
      shortName: 'TIM',
      category: 'Cooling',
      description: 'A thin layer of compound on the bare GPU die.',
      purpose: 'Fills the microscopic gaps between the die and the cooler.',
      quantity: '1 modeled layer',
      specifications: { Location: 'GPU die' },
      sources: [...f.maker, ...f.design],
      searchTerms: ['paste', 'thermal interface'],
    }),
    part('retention', {
      name: 'Retention bracket',
      shortName: 'X-bracket',
      category: 'Chassis',
      description: 'A sprung cross on the back of the board behind the GPU.',
      purpose: 'Pulls the cooler down onto the die with even pressure.',
      quantity: '1 modeled bracket',
      specifications: { Shape: 'Cross' },
      sources: [...f.maker, ...f.design],
      searchTerms: ['x bracket', 'mounting pressure'],
    }),
    part('standoff', {
      name: 'Cooler standoffs',
      shortName: 'Standoff',
      category: 'Chassis',
      parent: 'pcb',
      description:
        'Threaded posts round the GPU that the cooler screws down onto.',
      purpose: 'Set the cooler’s height over the die.',
      quantity: '4 modeled standoffs',
      specifications: { Placement: 'Illustrative' },
      sources: [...f.maker, ...f.design],
      searchTerms: ['standoff', 'mount'],
    }),
    part('pcb', {
      name: 'Card circuit board',
      shortName: 'PCB',
      category: 'Board',
      description:
        f.prefix === 'dual'
          ? 'A short board under the first fan and the GPU; past its end the second fan blows through the vented backplate.'
          : 'A board nearly the length of the card, carrying the GPU, memory, power stages and outputs.',
      purpose: 'Connects the GPU to its memory, power and the PCIe slot.',
      quantity: '1 modeled board',
      specifications: { Length: 'Illustrative' },
      accuracy: 'board',
      sources: f.maker,
      searchTerms: ['pcb', 'circuit board'],
    }),
    onBoard('package', 'Board', {
      name: 'GPU package',
      shortName: 'GPU package',
      description:
        'The substrate carrying the Blackwell GPU die and fanning its connections out to the board.',
      purpose:
        'Bridges the die’s bumps to board-scale power and signal traces.',
      quantity: '1 GPU package',
      specifications: {
        Architecture: 'Blackwell',
        'CUDA cores': f.card['CUDA cores'],
        'Package size': 'Illustrative',
      },
      sources: ['rtx5060family', 'whitepaper'],
      searchTerms: ['gpu', 'processor', 'chip'],
    }),
    onBoard('silicon', 'Compute', {
      name: 'GPU die',
      shortName: 'GPU die',
      parent: 'package',
      description:
        'The Blackwell graphics processor, in the middle of the package.',
      purpose:
        'Holds the shader cores, RT and Tensor cores, caches and memory controllers.',
      quantity: '1 die',
      specifications: { Architecture: 'Blackwell', 'Die size': 'Illustrative' },
      sources: ['rtx5060family', 'whitepaper'],
      searchTerms: ['silicon', 'die', 'chip'],
    }),
    onBoard('bga', 'Board', {
      name: 'BGA solder connections',
      shortName: 'BGA',
      parent: 'package',
      description: 'A grid of solder balls under the package.',
      purpose: 'Carry power and signals and fix the package to the board.',
      quantity: '1 modeled ball grid',
      specifications: { Count: 'Illustrative' },
      sources: ['packaging'],
      searchTerms: ['solder', 'balls'],
    }),
    onBoard('gddr7', 'Memory', {
      name: 'GDDR7 memory',
      shortName: 'GDDR7',
      description: f.memory.note,
      purpose: 'Holds textures, geometry and frame data close to the GPU.',
      quantity: '4 modeled packages',
      specifications: {
        Capacity: f.memory.capacity,
        Interface: '128-bit · 4 × 32-bit channels',
        'Data rate': '28 Gbps',
        Bandwidth: '448 GB/s',
      },
      sources: [...f.maker, 'rtx5060family', 'whitepaper'],
      searchTerms: ['vram', 'memory', 'framebuffer'],
    }),
    onBoard('vrm', 'Power', {
      name: 'VRM chokes',
      shortName: 'Choke',
      description: 'Inductors that smooth each power phase’s output.',
      purpose: 'Store and release energy so the GPU sees a steady low voltage.',
      quantity: 'Representative set',
      specifications: { Phases: f.phases },
      sources: ['multiphase'],
      searchTerms: ['inductor', 'choke', 'vrm'],
    }),
    onBoard('powerstage', 'Power', {
      name: f.prefix === 'itx' ? 'DrMOS power stages' : 'Power stages',
      shortName: 'Power stage',
      description:
        'Driver and switching transistors in one package, one under each choke.',
      purpose:
        'Switch 12 V on and off fast enough for the chokes to turn it into the GPU’s core voltage.',
      quantity: 'Representative set',
      specifications: {
        Type: f.prefix === 'itx' ? 'DrMOS (MSI)' : 'Integrated stage',
      },
      sources: f.prefix === 'itx' ? [...f.maker, 'mpsphase'] : ['mpsphase'],
      searchTerms: ['mosfet', 'drmos', 'vrm'],
    }),
    onBoard('pwm', 'Power', {
      name: 'Phase controller',
      shortName: 'PWM',
      description: 'The controller that times every power phase.',
      purpose: 'Interleaves the phases and holds the voltage the GPU asks for.',
      quantity: '1 modeled controller',
      specifications: { Placement: 'Illustrative' },
      sources: ['mpscontroller'],
      searchTerms: ['controller', 'pwm'],
    }),
    onBoard('capacitor', 'Power', {
      name: 'Polymer capacitors',
      shortName: 'Capacitor',
      description: 'A row of solid capacitors on the regulator output.',
      purpose: 'Catch fast load swings before the regulator can react.',
      quantity: 'Representative set',
      specifications: { Type: 'Solid polymer' },
      sources: ['multiphase'],
      searchTerms: ['capacitor', 'cap'],
    }),
    onBoard('mlcc', 'Power', {
      name: 'Ceramic capacitors',
      shortName: 'MLCC',
      description: 'Tiny multilayer capacitors scattered over the board.',
      purpose: 'Decouple supplies right at the pins that need them.',
      quantity: 'Representative scatter',
      specifications: { Placement: 'Representative' },
      sources: ['multiphase'],
      searchTerms: ['mlcc', 'ceramic', 'decoupling'],
    }),
    onBoard('resistor', 'Board', {
      name: 'Resistors',
      shortName: 'Resistor',
      description: 'Surface-mount resistors among the other passives.',
      purpose: 'Set bias points, pull-ups and current-sense levels.',
      quantity: 'Representative scatter',
      specifications: { Placement: 'Representative' },
      sources: ['multiphase'],
      searchTerms: ['resistor', 'passive'],
    }),
    onBoard('pcie', 'Board', {
      name: 'PCIe edge connector',
      shortName: 'PCIe',
      description:
        'A full-length ×16 edge whose gold contacts stop after the eighth lane.',
      purpose:
        'Carries data to the processor over eight lanes, and up to 75 W of slot power.',
      quantity: '1 interface',
      specifications: {
        Link:
          f.prefix === 'itx'
            ? 'PCI Express 5.0 ×8 in a ×16 edge'
            : 'PCI Express 5.0',
      },
      sources: ['pcie', ...f.maker],
      searchTerms: ['bus', 'slot', 'connector', 'x8'],
    }),
    onBoard('power', 'Power', {
      name: '8-pin power connector',
      shortName: 'Power connector',
      description: 'A single 8-pin PCIe power socket on the top edge.',
      purpose: 'Supplies power beyond what the slot delivers.',
      quantity: '1 socket',
      specifications: { Connector: '1 × 8-pin', 'Recommended PSU': '550 W' },
      sources: [...f.maker, 'rtx5060family', 'psu'],
      searchTerms: ['8 pin', 'pcie power'],
    }),
    onBoard('bios', 'Board', {
      name: 'VBIOS flash memory',
      shortName: 'VBIOS',
      description: 'Serial flash holding the card’s firmware.',
      purpose: 'Stores start-up code and board configuration.',
      quantity: '1 modeled chip',
      specifications: { Placement: 'Illustrative' },
      sources: ['flash'],
      searchTerms: ['firmware', 'bios'],
    }),
    onBoard('displayport', 'Board', {
      name: 'DisplayPort outputs',
      shortName: 'DisplayPort',
      description: 'Three DisplayPort 2.1b sockets through the bracket.',
      purpose: 'Drive monitors at high refresh rates and resolutions.',
      quantity: '3 sockets',
      specifications: { Version: 'DisplayPort 2.1b' },
      sources: f.maker,
      searchTerms: ['dp', 'display', 'monitor'],
    }),
    onBoard('hdmi', 'Board', {
      name: 'HDMI output',
      shortName: 'HDMI',
      description: 'One HDMI 2.1b socket beside the DisplayPorts.',
      purpose: 'Drives a television or monitor over HDMI.',
      quantity: '1 socket',
      specifications: { Version: 'HDMI 2.1b' },
      sources: f.maker,
      searchTerms: ['hdmi', 'tv'],
    }),
    onBoard('fanheader', 'Cooling', {
      name: 'Fan header',
      shortName: 'Fan header',
      description: 'The connector the fan lead plugs into.',
      purpose: 'Powers the fans and reads their speed.',
      quantity: '1 modeled header',
      specifications: { Pins: '4' },
      sources: ['bldc'],
      searchTerms: ['fan connector', 'pwm'],
    }),
    part('fancable', {
      name: 'Fan leads',
      shortName: 'Fan lead',
      category: 'Cooling',
      parent: 'fanheader',
      description: 'Four-wire leads from the header up to the fan motors.',
      purpose: 'Carry fan power, the speed signal and the tachometer back.',
      quantity: f.prefix === 'dual' ? '2 modeled leads' : '1 modeled lead',
      specifications: { Wires: '4' },
      accuracy: 'board',
      sources: ['bldc'],
      searchTerms: ['cable', 'wire'],
    }),
    onBoard('esd', 'Board', {
      name: 'ESD protection',
      shortName: 'ESD',
      description: 'Small protection devices behind the display outputs.',
      purpose:
        'Absorb static discharge from a plugged-in cable before it reaches the GPU.',
      quantity: '4 modeled devices',
      specifications: { Placement: 'Behind the outputs' },
      sources: ['esd'],
      searchTerms: ['esd', 'protection', 'tvs'],
    }),
    onBoard('crystal', 'Board', {
      name: 'Crystal oscillator',
      shortName: 'Crystal',
      description: 'A quartz reference clock in a metal can.',
      purpose:
        'Gives the GPU the stable frequency every other clock is made from.',
      quantity: '1 modeled crystal',
      specifications: { Placement: 'Illustrative' },
      sources: ['crystal'],
      searchTerms: ['clock', 'quartz'],
    }),
    ...(f.prefix === 'itx'
      ? [
          onBoard('fuse', 'Power', {
            name: 'Board fuses',
            shortName: 'Fuse',
            description:
              'Surface-mount fuses beside the 8-pin socket, which MSI builds into the board.',
            purpose:
              'Open before a fault on the power input can damage the rest of the card.',
            quantity: '2 modeled fuses',
            specifications: { Placement: 'Illustrative' },
            sources: [...f.maker, 'fuse'],
            searchTerms: ['fuse', 'protection'],
          }),
        ]
      : []),
  ];
}

export const dualCardConcepts = cardConcepts(dual);
export const itxCardConcepts = cardConcepts(itx);
