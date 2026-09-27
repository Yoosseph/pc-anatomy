import { concept, type Category, type Concept } from '../concept.ts';
import type { LevelId } from '../levels.ts';
import type { SourceId } from '../sources.ts';

/**
 * Inside the memory modules.
 *
 * Two retail modules from one line, chosen so the only difference between
 * them is the generation: the Kingston FURY Beast DDR5-6000 16 GB
 * (KF560C36BBE-16) that is installed in the machine, and the FURY Beast
 * DDR4-3200 16 GB (KF432C16BB/16) beside it for comparison. Both are single
 * rank, built from eight 16 Gb x8 packages.
 *
 * The DDR5 branch dives five scales: module, package, die, bank and cell.
 * The DDR4 branch dives to the die, where the two generations differ; below
 * that a bank and a cell work the same way, and the DDR5 branch shows them.
 *
 * Kingston builds the modules; it buys the DRAM from the chip makers and does
 * not name them, so the package and die scales follow Micron's data sheets
 * for the same organisation and stay otherwise vendor-neutral.
 */

type Entry = Parameters<typeof concept>[0];
const make = (c: Entry) => concept(c);

// ── Accuracy statements ───────────────────────────────────────────────────

const moduleAccuracy = (product: string) =>
  `${product}: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative.`;
const ddr5Module = moduleAccuracy('Kingston FURY Beast DDR5 KF560C36BBE-16');
const ddr4Module = moduleAccuracy('Kingston FURY Beast DDR4 KF432C16BB/16');
const packageAccuracy =
  'Ball count, 0.8 mm pitch, the 13 × (3 + 3) matrix with its empty centre columns and the 7.5 × 11 mm body follow the DRAM maker’s FBGA drawing. Thickness is drawn 2.5 × true; die size, pad and wire counts and layer thicknesses are illustrative.';
const dieAccuracy =
  'Counts and features are the data sheet’s. Block sizes and positions are illustrative: a real die is laid out by the vendor and is not published.';
const bankAccuracy =
  'The hierarchy follows published DRAM architecture research. A real 16 Gb bank holds 65,536 rows in roughly a hundred subarrays; six subarrays of six mats are drawn.';
const cellAccuracy =
  'Schematic, not a layout: modern cells are packed in a staggered pattern with buried wordlines and tall cylindrical capacitors. Forty-eight cells of a mat holding hundreds of thousands are drawn.';

// ── Shared module parts, per generation ───────────────────────────────────

type Gen = 'ddr5' | 'ddr4';
const moduleIds = {
  ddr5: {
    level: 'dimm',
    parent: 'ram',
    board: 'dimmboard',
    chip: 'dramchip',
    spd: 'dimmspd',
    decap: 'dimmdecap',
    contacts: 'dimmcontacts',
    pad: 'dimmpad',
    spreader: 'dimmspreader',
    spreaderBack: 'dimmspreaderback',
    open: 'dram',
  },
  ddr4: {
    level: 'ddr4',
    parent: 'ddr4module',
    board: 'ddr4board',
    chip: 'ddr4chip',
    spd: 'ddr4spd',
    decap: 'ddr4decap',
    contacts: 'ddr4contacts',
    pad: 'ddr4pad',
    spreader: 'ddr4spreader',
    spreaderBack: 'ddr4spreaderback',
    open: 'ddr4dram',
  },
} as const;

function moduleParts(gen: Gen): Concept[] {
  const id = moduleIds[gen];
  const five = gen === 'ddr5';
  const level = id.level as LevelId;
  const parent = id.parent;
  const accuracy = five ? ddr5Module : ddr4Module;
  const product: SourceId = five ? 'kf560' : 'kf432';
  const family: SourceId = five ? 'kingstonfury' : 'kingstonddr4';
  return [
    make({
      id: id.board,
      name: 'Module circuit board',
      shortName: 'Module board',
      category: 'Board',
      parent,
      level,
      description: five
        ? 'A multi-layer board 133.35 mm long and 31.25 mm tall, cut with the DDR5 key, a latch notch at each end and a straight contact edge.'
        : 'A multi-layer board 133.35 mm long and 31.25 mm tall, cut with the DDR4 key, a latch notch at each end and a contact edge that bows downward in the middle.',
      purpose: five
        ? 'Routes two independent 32-bit subchannels from the contacts to the packages, and carries the 5 V input to the regulator in its centre.'
        : 'Routes one 64-bit channel from the contacts to the packages, and the command bus past all eight of them in a single fly-by chain.',
      quantity: '1 board',
      specifications: {
        Outline: '133.35 × 31.25 mm (JEDEC)',
        Thickness: 'About 1.27 mm',
        Population: 'Eight packages on the primary face; secondary face bare',
        Marking: five ? 'PC5-48000 · 1Rx8' : 'PC4-25600 · 1Rx8',
      },
      representationType: 'physical',
      physicalAccuracy: accuracy,
      sources: five
        ? ['jedecmo329', 'micronudimm', product]
        : ['kingstonddr4', product],
      searchTerms: ['dimm', 'udimm', 'module', 'pcb', 'board', gen],
    }),
    make({
      id: id.chip,
      name: five ? 'DDR5 DRAM packages' : 'DDR4 DRAM packages',
      shortName: 'DRAM package',
      category: 'Memory',
      parent,
      level,
      open: id.open as LevelId,
      description: five
        ? 'Eight 16 Gb x8 packages in one rank. The four on the left answer subchannel A and the four on the right subchannel B; each subchannel has its own chip select and command bus.'
        : 'Eight 16 Gb x8 packages in one rank, all on one 64-bit channel: each package supplies 8 of the 64 data bits on every transfer.',
      purpose: five
        ? 'Stores the bits. A read on one subchannel takes 16 transfers of 32 bits from its four packages: 64 bytes, one processor cache line.'
        : 'Stores the bits. A read takes 8 transfers of 64 bits from all eight packages: 64 bytes, one processor cache line.',
      quantity: '8 packages',
      specifications: {
        Organisation: '2G × 8 per package · 16 Gb',
        Package: '78-ball FBGA · 7.5 × 11 mm',
        Rank: 'Single rank (1Rx8)',
        Width: five ? '2 × 32-bit subchannels' : '1 × 64-bit channel',
      },
      representationType: 'physical',
      physicalAccuracy: accuracy,
      sources: five
        ? [product, 'micronudimm', 'micron16gbddr5', 'ddr5architecture']
        : [product, 'micron16gbddr4'],
      searchTerms: ['dram', 'chip', 'package', 'fbga', 'x8', 'rank', gen],
    }),
    make({
      id: id.spd,
      name: five ? 'SPD hub' : 'SPD EEPROM',
      shortName: five ? 'SPD hub' : 'SPD',
      category: 'Board',
      parent,
      level,
      description: five
        ? 'A small controller holding the module’s 1,024-byte profile, with a temperature sensor built in, on the module’s sideband bus.'
        : 'A serial EEPROM holding the module’s profile on its own 2.2–3.6 V supply.',
      purpose:
        'Tells the firmware at boot what the module is — capacity, organisation, the JEDEC timings and the faster XMP and EXPO profiles — so memory training can start from the right settings.',
      quantity: '1 IC',
      specifications: five
        ? {
            Capacity: '1,024 bytes',
            Sensor: 'Integrated temperature sensor',
            Bus: 'I3C Basic / I²C sideband',
          }
        : {
            Supply: 'VDDSPD 2.2–3.6 V',
            Profiles: 'JEDEC 2400 · XMP 3200 / 3000',
          },
      representationType: 'physical',
      physicalAccuracy: accuracy,
      sources: five ? ['micronudimm', 'ddr5architecture'] : [product],
      searchTerms: ['spd', 'eeprom', 'profile', 'xmp', 'expo', 'training'],
    }),
    make({
      id: id.decap,
      name: 'Decoupling capacitors',
      shortName: 'Decoupling',
      category: 'Power',
      parent,
      level,
      description: five
        ? 'Rows of small ceramic capacitors under each package, with larger ones around the regulator.'
        : 'Rows of small ceramic capacitors under each package and beside the termination networks.',
      purpose:
        'Holds charge right next to each package, so the sudden current of a burst is supplied locally instead of dragging the rail down.',
      quantity: five ? '30 modeled parts' : '26 modeled parts',
      specifications: { Type: 'Multilayer ceramic, surface mount' },
      representationType: 'physical',
      physicalAccuracy: `${accuracy} Capacitor count and positions are representative.`,
      sources: ['micronddr4design'],
      searchTerms: ['capacitor', 'mlcc', 'decoupling', 'bypass'],
    }),
    make({
      id: id.contacts,
      name: 'Edge contacts',
      shortName: 'Contacts',
      category: 'Memory',
      parent,
      level,
      description: five
        ? '288 gold contacts, 144 per face at 0.85 mm pitch, on a straight edge. The key sits at a DDR5-only position.'
        : '288 gold contacts, 144 per face at 0.85 mm pitch. The edge is curved, so the middle contacts touch first and the module rocks in instead of meeting all 288 at once.',
      purpose: five
        ? 'Carries both subchannels, their command buses, 5 V bulk power and the sideband bus through the slot. The key stops a DDR4 module going into a DDR5 slot.'
        : 'Carries the channel, the command bus, the 1.2 V and 2.5 V supplies and the SPD bus through the slot. The key stops a DDR5 module going into a DDR4 slot.',
      quantity: '288 contacts',
      specifications: {
        Count: '288 · 144 per face',
        Pitch: '0.85 mm',
        Edge: five ? 'Straight' : 'Curved, for lower insertion force',
        Key: five ? 'DDR5 position' : 'DDR4 position',
      },
      representationType: 'physical',
      physicalAccuracy: `${accuracy} The key offset is illustrative; it differs between the generations as drawn.`,
      sources: five
        ? ['jedecmo329', 'ddr5architecture']
        : ['kingstonddr4', 'micron16gbddr4'],
      searchTerms: ['contacts', 'pins', 'gold', 'edge', 'key', 'notch', '288'],
    }),
    make({
      id: id.pad,
      name: 'Thermal pads',
      shortName: 'Thermal pad',
      category: 'Cooling',
      parent,
      level,
      description: five
        ? 'Soft pads over the package tops and a separate blue pad over the regulator on the primary face, and an adhesive strip on the bare secondary face.'
        : 'A soft pad over the package tops on the primary face, and an adhesive strip on the bare secondary face.',
      purpose:
        'Fills the gap between the packages and the spreader so heat crosses it, and holds both plates to the board.',
      quantity: five ? '3 pads and 1 tape' : '2 pads and 1 tape',
      specifications: { Material: 'Thermal interface pad and adhesive tape' },
      representationType: 'physical',
      physicalAccuracy: `${accuracy} Pad outline and thickness are illustrative.`,
      sources: five ? ['kingstonfuryreview', 'aphnetworks'] : [product],
      searchTerms: ['pad', 'thermal', 'tape', 'adhesive'],
    }),
    make({
      id: id.spreader,
      name: 'Heat spreader, front',
      shortName: 'Spreader',
      category: 'Cooling',
      parent,
      level,
      opensFirst: true,
      description: five
        ? 'A black aluminium plate over the packages, low enough to clear tall air coolers, folded over the top edge to meet its twin.'
        : 'A black aluminium plate over the packages with a stepped crown along its top edge.',
      purpose:
        'Spreads the heat of eight packages over a larger surface for the case air to carry away.',
      quantity: '1 plate',
      specifications: {
        Height: five ? '34.9 mm with the module' : '34 mm with the module',
        Thickness: five
          ? '6.62 mm across both plates'
          : '7.2 mm across both plates',
        Finish: 'Black',
      },
      representationType: 'physical',
      physicalAccuracy: `${accuracy} The facets follow the product line’s look without reproducing its artwork or logo.`,
      sources: five ? [product, family, 'aphnetworks'] : [product],
      searchTerms: [
        'heat spreader',
        'heatsink',
        'spreader',
        'fury',
        'beast',
        'kingston',
      ],
    }),
    make({
      id: id.spreaderBack,
      name: 'Heat spreader, back',
      shortName: 'Back plate',
      category: 'Cooling',
      parent,
      level,
      opensFirst: true,
      description:
        'The matching plate on the secondary face, carrying the specification label.',
      purpose:
        'Closes the module and carries the part number, speed and voltage a builder checks against the motherboard’s support list.',
      quantity: '1 plate',
      specifications: {
        Label: five
          ? 'KF560C36BBE-16 · DDR5-6000 CL36 1.35 V'
          : 'KF432C16BB/16 · DDR4-3200 CL16 1.35 V',
      },
      representationType: 'physical',
      physicalAccuracy: accuracy,
      sources: [product],
      searchTerms: ['back plate', 'label', 'sticker', 'part number'],
    }),
  ];
}

// ── Shared package parts, per generation ──────────────────────────────────

const packageIds = {
  ddr5: {
    level: 'dram',
    parent: 'dramchip',
    mold: 'drammold',
    die: 'dramdie',
    pads: 'drampads',
    adhesive: 'dramadhesive',
    substrate: 'dramsubstrate',
    wire: 'drambondwire',
    encap: 'dramencap',
    ball: 'dramball',
    open: 'banks',
  },
  ddr4: {
    level: 'ddr4dram',
    parent: 'ddr4chip',
    mold: 'ddr4mold',
    die: 'ddr4die',
    pads: 'ddr4pads',
    adhesive: 'ddr4adhesive',
    substrate: 'ddr4substrate',
    wire: 'ddr4bondwire',
    encap: 'ddr4encap',
    ball: 'ddr4ball',
    open: 'ddr4banks',
  },
} as const;

function packageParts(gen: Gen): Concept[] {
  const id = packageIds[gen];
  const five = gen === 'ddr5';
  const level = id.level as LevelId;
  const parent = id.parent;
  const sheet: SourceId = five ? 'micron16gbddr5' : 'micron16gbddr4';
  const part = (
    key: keyof typeof id,
    name: string,
    shortName: string,
    category: Category,
    description: string,
    purpose: string,
    quantity: string,
    specifications: Record<string, string>,
    sources: SourceId[],
    searchTerms: string[],
    open?: LevelId,
  ) =>
    make({
      id: id[key],
      name,
      shortName,
      category,
      parent,
      level,
      open,
      description,
      purpose,
      quantity,
      specifications,
      representationType: 'physical',
      physicalAccuracy: packageAccuracy,
      sources,
      searchTerms: [...searchTerms, gen],
    });
  return [
    part(
      'mold',
      'Mold compound',
      'Mold cap',
      'Chassis',
      'Black epoxy moulded over the back of the die, laser-marked on top with a dot at ball A1.',
      'Seals the die against moisture and handling, and gives the package a flat top for the pick-and-place nozzle and the heat spreader pad.',
      '1 cap',
      { Material: 'Filled epoxy', Marking: 'Laser, with pin-1 dot' },
      ['bocpackage', 'packaging'],
      ['mold', 'epoxy', 'marking', 'package'],
    ),
    part(
      'die',
      five ? 'DDR5 SDRAM die' : 'DDR4 SDRAM die',
      'Die',
      'Memory',
      'One 16 Gb silicon die, mounted upside down: its circuitry faces the substrate and its bare back faces the mold. The bond pads run down the middle of its face.',
      five
        ? 'Holds 32 banks of storage cells and the logic that runs them.'
        : 'Holds 16 banks of storage cells and the logic that runs them.',
      '1 die',
      {
        Density: '16 Gb',
        Organisation: five ? '2G × 8 · 32 banks' : '2G × 8 · 16 banks',
        Mounting: 'Face down, centre pads',
      },
      [sheet, 'bocpackage'],
      ['die', 'silicon', 'dram', 'chip'],
      id.open as LevelId,
    ),
    part(
      'pads',
      'Centre bond pads',
      'Bond pads',
      'Memory',
      'Two rows of metal pads down the centre line of the die face: every signal and supply the die has leaves through them.',
      'The die’s only connection to the outside. Putting them in the middle keeps every wire short and lets one slot in the substrate reach them all.',
      '2 rows',
      { Position: 'Centre stripe of the die face' },
      ['bocpackage'],
      ['pad', 'bond pad', 'centre pad'],
    ),
    part(
      'adhesive',
      'Die attach',
      'Die attach',
      'Chassis',
      'Two strips of adhesive film holding the face of the die to the substrate, one either side of the slot.',
      'Fixes the die in place before wire bonding and cushions it against the substrate.',
      '2 strips',
      { Material: 'Adhesive film, illustrative' },
      ['bocpackage'],
      ['adhesive', 'die attach', 'tape'],
    ),
    part(
      'substrate',
      'Package substrate',
      'Substrate',
      'Board',
      'A thin laminate circuit board with a slot cut down its middle, under the die’s pad stripe. Bond fingers line both edges of the slot on the underside; ball lands cover the rest.',
      'Fans the die’s centre pads out to 78 balls on a pitch a module board can be built to.',
      '1 substrate',
      {
        Slot: 'Under the die’s centre pads',
        Routing: 'Bond fingers to ball lands',
      },
      ['bocpackage', sheet],
      ['substrate', 'laminate', 'slot', 'window', 'board on chip'],
    ),
    part(
      'wire',
      'Bond wires',
      'Bond wires',
      'Memory',
      'Fine gold wires that drop from each pad on the die, through the slot, and land on a finger on the underside of the substrate.',
      'Join the die to the package. Because the die faces down, the wires never have to reach around its edge.',
      'One per pad',
      { Material: 'Gold wire, illustrative gauge' },
      ['bocpackage'],
      ['wire', 'bond wire', 'wire bond', 'gold'],
    ),
    part(
      'encap',
      'Slot encapsulant',
      'Encapsulant',
      'Chassis',
      'A bead of resin filling the slot and covering the wires on the underside, drawn translucent here so the wires show.',
      'Protects the wires. It is also why the ball grid has three empty columns down its middle: the bead is there.',
      '1 bead',
      { Location: 'Down the centre of the underside' },
      ['bocpackage'],
      ['encapsulant', 'resin', 'glob top'],
    ),
    part(
      'ball',
      'Solder balls',
      'Balls',
      'Memory',
      '78 solder balls on a 0.8 mm grid: 13 rows of three either side of the encapsulant bead.',
      'Solder the package to the module board and carry every signal and supply into it.',
      '78 balls',
      {
        Count: '78',
        Pitch: '0.8 × 0.8 mm',
        Matrix: '13 rows × 6 columns, 3 centre columns depopulated',
        Body: '7.5 × 11 mm',
      },
      [sheet],
      ['ball', 'bga', 'fbga', 'solder'],
    ),
  ];
}

// ── The die, per generation ───────────────────────────────────────────────

const dieSources = (five: boolean): SourceId[] =>
  five ? ['micron16gbddr5', 'jedecddr5', 'micronddr5'] : ['micron16gbddr4'];

function dieParts(gen: Gen): Concept[] {
  const five = gen === 'ddr5';
  const level = (five ? 'banks' : 'ddr4banks') as LevelId;
  const parent = five ? 'dramdie' : 'ddr4die';
  const p = (
    c: Omit<
      Entry,
      'parent' | 'level' | 'representationType' | 'physicalAccuracy'
    >,
  ) =>
    make({
      ...c,
      parent,
      level,
      representationType: 'logical',
      physicalAccuracy: dieAccuracy,
      searchTerms: [...(c.searchTerms ?? []), gen],
    });
  const x = <V>(ddr5: V, ddr4: V): V => (five ? ddr5 : ddr4);
  type Specs = Record<string, string>;
  return [
    p({
      id: x('drambank', 'ddr4bank'),
      name: 'Banks',
      shortName: 'Bank',
      category: 'Memory',
      open: five ? 'bank' : undefined,
      description: x(
        '32 independent arrays of cells. Each can have one row open at a time, so up to 32 rows can be open across the die at once.',
        '16 independent arrays of cells, each able to hold one row open.',
      ),
      purpose:
        'Lets the die work on several requests at once: while one bank opens a row, another can be read from.',
      quantity: x('32 banks', '16 banks'),
      specifications: x<Specs>(
        {
          Banks: '32 on a 16 Gb x8 die',
          Groups: '8 bank groups × 4 banks',
          Rows: '65,536 per bank (R0–R15)',
          Page: '1 KiB (1,024 columns × 8 bits)',
        },
        {
          Banks: '16 on a 16 Gb x8 die',
          Groups: '4 bank groups × 4 banks',
          Rows: '131,072 per bank (A0–A16)',
          Page: '1 KiB (1,024 columns × 8 bits)',
        },
      ),
      sources: dieSources(five),
      searchTerms: ['bank', 'array', 'row', 'page'],
    }),
    p({
      id: x('drambankgroup', 'ddr4bankgroup'),
      name: 'Bank group I/O',
      shortName: 'Bank group',
      category: 'Memory',
      description: x(
        'Each group of four banks shares its own local data path to the centre of the die. DDR5 doubles the groups to eight.',
        'Each group of four banks shares its own local data path to the centre of the die. DDR4 introduced them, four per die.',
      ),
      purpose:
        'Two reads in different groups can follow each other at the short spacing (tCCD_S); two in the same group must wait the longer tCCD_L while its data path recovers.',
      quantity: x('8 groups', '4 groups'),
      specifications: { Timing: 'tCCD_S between groups · tCCD_L within one' },
      sources: dieSources(five),
      searchTerms: ['bank group', 'tccd', 'group'],
    }),
    p({
      id: x('dramcmd', 'ddr4cmd'),
      name: x('Command and address input', 'Command and address input'),
      shortName: 'Command',
      category: 'Compute',
      description: x(
        'Fourteen shared CA pins, sampled on both clock edges, carry every command and address in one or two cycles.',
        'Dedicated command pins — ACT_n, and RAS_n, CAS_n, WE_n that double as address bits — plus bank group, bank and address lines, with optional parity.',
      ),
      purpose:
        'Decodes activate, read, write, precharge and refresh commands and steers the address to the right bank, row and column.',
      quantity: '1 block',
      specifications: x<Specs>(
        {
          Pins: 'CA[13:0], CS_n, CK_t/CK_c',
          Termination: 'On-die, command-controlled',
        },
        { Pins: 'ACT_n, A[16:0], BG[1:0], BA[1:0]', Checking: 'CA parity' },
      ),
      sources: five ? dieSources(five) : ['micron16gbddr4', 'micronddr4design'],
      searchTerms: ['command', 'address', 'ca', 'decoder'],
    }),
    p({
      id: x('drammoderegs', 'ddr4moderegs'),
      name: 'Mode registers',
      shortName: 'Mode regs',
      category: 'Compute',
      description: x(
        'Registers the controller writes to set latency, burst length, termination, internal reference voltages and the training modes.',
        'Registers MR0–MR6 that set latency, burst length, termination and reference voltages.',
      ),
      purpose:
        'Holds the settings that memory training arrives at during boot.',
      quantity: '1 register file',
      specifications: x<Specs>(
        {
          Training:
            'Internal VREF for DQ, CA and CS · loopback · duty-cycle adjust',
        },
        { Registers: 'MR0–MR6', Training: 'Internal VREF for DQ' },
      ),
      sources: dieSources(five),
      searchTerms: ['mode register', 'mr', 'training', 'vref'],
    }),
    p({
      id: x('dramrefresh', 'ddr4refresh'),
      name: 'Refresh control',
      shortName: 'Refresh',
      category: 'Power',
      description: x(
        'Counts through the rows so that every cell is rewritten within 32 ms. Same-bank refresh can refresh one bank in every group while the others keep working.',
        'Counts through the rows so that every cell is rewritten within 64 ms. Every refresh command takes all banks at once, or a finer-grained fraction of them.',
      ),
      purpose:
        'Cells leak. Without refresh a stored one would fade into a zero in a fraction of a second.',
      quantity: '1 block',
      specifications: x<Specs>(
        {
          Window: '32 ms, 8,192 commands (≤ 85 °C)',
          Interval: 'tREFI 3.9 µs',
          Modes: 'All-bank · same-bank',
        },
        {
          Window: '64 ms, 8,192 commands (≤ 85 °C)',
          Interval: 'tREFI 7.8 µs',
          Modes: 'All-bank · fine granularity',
        },
      ),
      sources: dieSources(five),
      searchTerms: ['refresh', 'retention', 'trefi'],
    }),
    ...(five
      ? [
          p({
            id: 'dramecc',
            name: 'On-die ECC',
            shortName: 'ECC',
            category: 'Compute',
            description:
              'Every 128 bits written gets 8 check bits stored beside it; every read is checked and a single flipped bit corrected before it leaves the die.',
            purpose:
              'Covers the weak cells that shrinking them brings. It protects the array only: errors on the wires to the processor need ECC modules, which these are not.',
            quantity: '1 engine',
            specifications: {
              Code: '128 data + 8 check bits',
              Corrects: 'Single-bit errors in the array',
              'Not the same as': 'Module ECC (x72/x80 ECC DIMMs)',
            },
            sources: ['micron16gbddr5', 'micronddr5', 'ddr5architecture'],
            searchTerms: ['ecc', 'error correction', 'on-die ecc'],
          }),
        ]
      : [
          p({
            id: 'ddr4dll',
            name: 'Delay-locked loop',
            shortName: 'DLL',
            category: 'Compute',
            description:
              'A loop that lines the output timing of the data up with the incoming clock.',
            purpose:
              'Keeps read data aligned to the clock edge the controller expects, across temperature and voltage.',
            quantity: '1 loop',
            specifications: { Modes: 'DLL on / DLL off' },
            sources: ['micron16gbddr4'],
            searchTerms: ['dll', 'clock', 'delay locked loop'],
          }),
        ]),
    p({
      id: x('dramprefetch', 'ddr4prefetch'),
      name: 'Prefetch and data path',
      shortName: 'Prefetch',
      category: 'Memory',
      description: x(
        'One column access pulls 128 bits from the open row at once, which are then sent over the 8 data pins in 16 transfers.',
        'One column access pulls 64 bits from the open row at once, which are then sent over the 8 data pins in 8 transfers.',
      ),
      purpose:
        'Lets a slow array keep up with a fast interface: the array works on wide words at a fraction of the pin rate.',
      quantity: '1 path',
      specifications: x<Specs>(
        { Prefetch: '16n', Burst: 'BL16 · 128 bits per x8 access' },
        { Prefetch: '8n', Burst: 'BL8 · 64 bits per x8 access' },
      ),
      sources: dieSources(five),
      searchTerms: ['prefetch', 'burst', 'serialiser', 'data path'],
    }),
    p({
      id: x('dramdqio', 'ddr4dqio'),
      name: 'Data I/O',
      shortName: 'DQ I/O',
      category: 'Memory',
      description: x(
        'Eight data pins and a strobe pair, with decision-feedback equalisation on the receivers and CRC on reads and writes.',
        'Eight data pins and a strobe pair, with data bus inversion and write CRC.',
      ),
      purpose: x(
        'Moves data at 6000 MT/s per pin on this module; the equaliser cleans up the signal that such speeds leave at the end of a module trace.',
        'Moves data at up to 3200 MT/s per pin; bus inversion cuts the number of pins switching at once.',
      ),
      quantity: '8 DQ + strobe',
      specifications: x<Specs>(
        {
          Pins: 'DQ[7:0], DQS_t/DQS_c, DM_n',
          Receivers: 'DFE',
          Checking: 'Read and write CRC',
        },
        {
          Pins: 'DQ[7:0], DQS_t/DQS_c, DM_n/DBI_n',
          Features: 'DBI · write CRC',
        },
      ),
      sources: dieSources(five),
      searchTerms: ['dq', 'data', 'io', 'strobe', 'dqs'],
    }),
    p({
      id: x('dramzq', 'ddr4zq'),
      name: 'ZQ calibration and termination',
      shortName: 'ZQ',
      category: 'Power',
      description:
        'Measures the driver and termination resistors against one precision resistor on the ZQ pin and trims them.',
      purpose:
        'Keeps output drive strength and on-die termination correct as the die heats up, so signals stay clean.',
      quantity: '1 block',
      specifications: { Reference: 'External precision resistor on ZQ' },
      sources: dieSources(five),
      searchTerms: ['zq', 'calibration', 'odt', 'termination'],
    }),
  ];
}

// ── The catalogue ─────────────────────────────────────────────────────────

const bankSources: SourceId[] = ['salp', 'dramfundamentals', 'micron16gbddr5'];
const bankPart = (
  c: Omit<
    Entry,
    'parent' | 'level' | 'representationType' | 'physicalAccuracy'
  >,
) =>
  make({
    ...c,
    parent: 'drambank',
    level: 'bank',
    representationType: 'logical',
    physicalAccuracy: bankAccuracy,
  });
const cellSources: SourceId[] = ['dramfundamentals', 'salp'];
const cellPart = (
  c: Omit<
    Entry,
    'parent' | 'level' | 'representationType' | 'physicalAccuracy'
  >,
) =>
  make({
    ...c,
    parent: 'drammat',
    level: 'cell',
    representationType: 'logical',
    physicalAccuracy: cellAccuracy,
  });

export const ramConcepts: Concept[] = [
  // ── DDR5 module (physical) ──────────────────────────────────────────────
  ...moduleParts('ddr5'),
  make({
    id: 'dimmpmic',
    name: 'Power management IC',
    shortName: 'PMIC',
    category: 'Power',
    parent: 'ram',
    level: 'dimm',
    description:
      'A switching regulator in the middle of the module. DDR5 moved this onto the module; on DDR4 the motherboard does the job.',
    purpose:
      'Turns the 5 V the slot supplies into the DRAM’s rails, right beside the packages that draw them, so the supply is steadier than one sent down from the board.',
    quantity: '1 IC',
    specifications: {
      Input: 'VIN_BULK 5 V',
      Outputs: 'VDD 1.1 V · VDDQ 1.1 V · VPP 1.8 V (JEDEC)',
      Overclock: 'Raised to 1.35 V for the XMP / EXPO profile',
    },
    representationType: 'physical',
    physicalAccuracy: ddr5Module,
    sources: ['micronudimm', 'ddr5architecture', 'kf560'],
    searchTerms: ['pmic', 'power', 'regulator', 'voltage', 'vin_bulk'],
  }),
  make({
    id: 'dimminductor',
    name: 'Regulator inductors',
    shortName: 'Inductors',
    category: 'Power',
    parent: 'ram',
    level: 'dimm',
    description:
      'Three small power inductors beside the PMIC, one per switching output.',
    purpose:
      'Store energy between switching pulses, smoothing the regulator’s chopped output into steady DC for the DRAM.',
    quantity: '3 inductors',
    specifications: { Role: 'Buck converter output filter' },
    representationType: 'physical',
    physicalAccuracy: `${ddr5Module} Inductor count and placement are representative.`,
    sources: ['micronudimm'],
    searchTerms: ['inductor', 'coil', 'choke', 'buck'],
  }),

  // ── DDR5 package (physical) ─────────────────────────────────────────────
  ...packageParts('ddr5'),

  // ── DDR5 die (logical) ──────────────────────────────────────────────────
  ...dieParts('ddr5'),

  // ── One bank (logical) ──────────────────────────────────────────────────
  bankPart({
    id: 'drammat',
    name: 'Mats',
    shortName: 'Mat',
    category: 'Memory',
    open: 'cell',
    description:
      'The tiles a bank is built from, each roughly 512 rows by 512 columns of cells. A row of mats across the bank is a subarray.',
    purpose:
      'Keeps every wordline and bitline short. A line spanning a whole bank would be too slow and too heavily loaded to sense a single cell’s charge.',
    quantity: '36 drawn',
    specifications: {
      Size: 'About 512 × 512 cells',
      Row: 'Opens across every mat of one subarray',
    },
    sources: bankSources,
    searchTerms: ['mat', 'subarray', 'tile', 'array'],
  }),
  bankPart({
    id: 'dramlocalsa',
    name: 'Local sense amplifiers',
    shortName: 'Local SA',
    category: 'Memory',
    description:
      'A stripe of sense amplifiers between each pair of subarrays: the local row buffer.',
    purpose:
      'When a row opens, these amplify every bitline in it at once and hold the whole row, which is why reading the rest of an open row is fast.',
    quantity: '7 stripes drawn',
    specifications: { Holds: 'One open row of the subarray' },
    sources: bankSources,
    searchTerms: ['sense amplifier', 'row buffer', 'local'],
  }),
  bankPart({
    id: 'dramswd',
    name: 'Sub-wordline drivers',
    shortName: 'SWD',
    category: 'Power',
    description: 'Narrow stripes of drivers between the mats.',
    purpose:
      'Take a global wordline and drive the short local wordline in each mat up to the boosted VPP level that fully turns the access transistors on.',
    quantity: '42 stripes drawn',
    specifications: { Drives: 'Local wordlines at VPP' },
    sources: bankSources,
    searchTerms: ['wordline driver', 'swd', 'vpp'],
  }),
  bankPart({
    id: 'dramgwl',
    name: 'Global wordlines',
    shortName: 'Global WL',
    category: 'Memory',
    description:
      'Lines from the row decoder running over the mats of each subarray.',
    purpose:
      'Carry the selected row to the sub-wordline drivers of every mat it crosses.',
    quantity: '6 drawn',
    specifications: { Driven: 'By the global row decoder' },
    sources: bankSources,
    searchTerms: ['global wordline', 'wordline'],
  }),
  bankPart({
    id: 'dramgbl',
    name: 'Global bitlines',
    shortName: 'Global BL',
    category: 'Memory',
    description:
      'Lines running down the bank past every subarray, connecting the local row buffers to the global sense amplifiers.',
    purpose:
      'Carry the columns selected from the open row out of the array, a few bits at a time.',
    quantity: '12 drawn',
    specifications: { Connect: 'Local row buffer → global row buffer' },
    sources: bankSources,
    searchTerms: ['global bitline', 'bitline', 'data line'],
  }),
  bankPart({
    id: 'dramrowdec',
    name: 'Global row decoder',
    shortName: 'Row decoder',
    category: 'Compute',
    description:
      'Turns the 16-bit row address of an ACTIVATE into one global wordline.',
    purpose: 'Chooses which of the 65,536 rows opens.',
    quantity: '1 decoder',
    specifications: { Address: 'R0–R15', Rows: '65,536' },
    sources: ['salp', 'micron16gbddr5'],
    searchTerms: ['row decoder', 'decoder', 'activate'],
  }),
  bankPart({
    id: 'dramgsa',
    name: 'Global sense amplifiers',
    shortName: 'Global SA',
    category: 'Memory',
    description: 'The global row buffer at the foot of the bank.',
    purpose:
      'Amplify the small signals arriving on the global bitlines and hand the selected bits to the bank group’s data path.',
    quantity: '1 stripe',
    specifications: { Also: 'Global row buffer' },
    sources: bankSources,
    searchTerms: ['global sense amplifier', 'row buffer'],
  }),
  bankPart({
    id: 'dramcoldec',
    name: 'Column decoder',
    shortName: 'Column decoder',
    category: 'Compute',
    description:
      'Turns the 10-bit column address of a READ or WRITE into column-select lines.',
    purpose:
      'Chooses which bits of the open 1 KiB row go out — 128 of them per access on a x8 die.',
    quantity: '1 decoder',
    specifications: { Address: 'C0–C9', Columns: '1,024' },
    sources: ['salp', 'micron16gbddr5'],
    searchTerms: ['column decoder', 'column select', 'csl'],
  }),
  bankPart({
    id: 'drambankctl',
    name: 'Bank control',
    shortName: 'Bank control',
    category: 'Compute',
    description:
      'Latches the row address and times the bank’s ACTIVATE, READ, WRITE and PRECHARGE sequence.',
    purpose:
      'Enforces the bank’s timings: a row must be open tRCD before it is read and closed tRP before another opens.',
    quantity: '1 block',
    specifications: { Sequence: 'ACTIVATE → READ / WRITE → PRECHARGE' },
    sources: ['salp', 'micron16gbddr5'],
    searchTerms: ['bank control', 'trcd', 'trp', 'activate', 'precharge'],
  }),

  // ── The cell (logical) ──────────────────────────────────────────────────
  cellPart({
    id: 'dramcapacitor',
    name: 'Storage capacitors',
    shortName: 'Capacitor',
    category: 'Memory',
    description:
      'One tiny capacitor per bit. Charged is a one, empty a zero; the bright ones here hold a pattern.',
    purpose:
      'Holds the bit as a charge measured in femtocoulombs. The charge leaks away, which is why DRAM must be refreshed and why it is “dynamic”.',
    quantity: '48 drawn',
    specifications: {
      Cell: '1T1C: one transistor, one capacitor',
      Shape: 'Tall cylinder',
    },
    sources: cellSources,
    searchTerms: ['capacitor', 'cell', 'charge', 'bit', '1t1c'],
  }),
  cellPart({
    id: 'dramaccess',
    name: 'Access transistors',
    shortName: 'Access FET',
    category: 'Memory',
    description:
      'One transistor per cell between its capacitor and its bitline, gated by the wordline.',
    purpose:
      'Isolates the capacitor so its charge stays put, and connects it to the bitline when the row opens.',
    quantity: '48 drawn',
    specifications: { Gate: 'The wordline', Channel: 'Capacitor ↔ bitline' },
    sources: cellSources,
    searchTerms: ['transistor', 'access', 'fet'],
  }),
  cellPart({
    id: 'dramwordline',
    name: 'Wordlines',
    shortName: 'Wordline',
    category: 'Memory',
    description: 'Gate lines running along the row, one per row of cells.',
    purpose:
      'Raising one to VPP opens every cell in that row onto its bitline at once — which is why DRAM always opens a whole row.',
    quantity: '6 drawn',
    specifications: { Level: 'Boosted to VPP when selected' },
    sources: cellSources,
    searchTerms: ['wordline', 'row', 'gate'],
  }),
  cellPart({
    id: 'drambitline',
    name: 'Bitlines',
    shortName: 'Bitline',
    category: 'Memory',
    description:
      'Lines running along the column, one per column of cells, down to a sense amplifier.',
    purpose:
      'Precharged halfway, then nudged slightly up or down when a cell shares its charge — a swing of well under a tenth of a volt for the amplifier to read.',
    quantity: '8 drawn',
    specifications: { Idle: 'Precharged to the midpoint' },
    sources: cellSources,
    searchTerms: ['bitline', 'column'],
  }),
  cellPart({
    id: 'dramplate',
    name: 'Cell plate',
    shortName: 'Plate',
    category: 'Power',
    description:
      'The common top electrode shared by every capacitor in the array.',
    purpose: 'Is the other side of every capacitor, held at a fixed voltage.',
    quantity: '1 plate',
    specifications: { Shared: 'By all capacitors in the array' },
    sources: ['dramfundamentals'],
    searchTerms: ['plate', 'electrode'],
  }),
  cellPart({
    id: 'dramwldriver',
    name: 'Wordline drivers',
    shortName: 'WL drivers',
    category: 'Power',
    description: 'The sub-wordline drivers at the edge of the mat.',
    purpose: 'Pull the chosen wordline to VPP, and every other one firmly off.',
    quantity: '1 stripe',
    specifications: { Supply: 'VPP' },
    sources: cellSources,
    searchTerms: ['wordline driver', 'driver'],
  }),
  cellPart({
    id: 'dramprecharge',
    name: 'Precharge and equalise',
    shortName: 'Precharge',
    category: 'Power',
    description:
      'Switches that short each bitline pair together and to the midpoint voltage.',
    purpose:
      'Resets the bitlines after a row closes, so the next row starts from a known level. PRECHARGE is this step.',
    quantity: '1 stripe',
    specifications: { Command: 'PRECHARGE · tRP' },
    sources: cellSources,
    searchTerms: ['precharge', 'equalise', 'equalize'],
  }),
  cellPart({
    id: 'dramcellsa',
    name: 'Sense amplifiers',
    shortName: 'Sense amp',
    category: 'Memory',
    description:
      'A cross-coupled latch per bitline, comparing it with a reference bitline from the neighbouring mat.',
    purpose:
      'Detects the tiny swing, drives the bitline fully high or low, and so writes the value straight back into the cell whose charge the read just used up.',
    quantity: '8 drawn',
    specifications: {
      Read: 'Destructive, restored by the amplifier',
      Array: 'Open bitline',
    },
    sources: cellSources,
    searchTerms: ['sense amplifier', 'latch', 'sense amp'],
  }),
  cellPart({
    id: 'dramcolsel',
    name: 'Column select switches',
    shortName: 'Column select',
    category: 'Compute',
    description:
      'Transistors between each sense amplifier and the local I/O lines.',
    purpose:
      'Open for the columns a READ or WRITE addresses, and only those, to connect them to the data path.',
    quantity: '8 drawn',
    specifications: { Driven: 'By column-select lines' },
    sources: cellSources,
    searchTerms: ['column select', 'switch'],
  }),
  cellPart({
    id: 'dramlio',
    name: 'Local I/O lines',
    shortName: 'Local I/O',
    category: 'Memory',
    description:
      'A complementary pair of lines along the sense-amplifier stripe.',
    purpose:
      'Carry the selected bit out to the global bitlines, or a write in from them.',
    quantity: '1 pair',
    specifications: { Signal: 'Differential pair' },
    sources: cellSources,
    searchTerms: ['local io', 'lio', 'data line'],
  }),

  // ── DDR4 module (physical, alternative) ─────────────────────────────────
  make({
    id: 'ddr4module',
    name: 'Kingston FURY Beast DDR4',
    shortName: 'DDR4 RAM',
    category: 'Memory',
    parent: 'dimmslot',
    level: 'ddr4',
    open: 'ddr4',
    description:
      'A 16 GB DDR4-3200 UDIMM from the same line as the installed DDR5 module, for comparison. It will not fit the DDR5 slots on this board.',
    purpose:
      'Holds working memory for the previous generation of desktop platforms.',
    quantity: '1 reference specimen',
    specifications: {
      Standard: 'DDR4 SDRAM · UDIMM',
      'Data rate': 'DDR4-3200 with XMP · DDR4-2400 JEDEC default',
      Timings: 'CL16-20-20 at 1.35 V',
      Capacity: '16 GB · single rank · 8 × 16 Gb x8',
      Channels: '1 × 64-bit channel',
      'Banks per die': '16 · 4 groups of 4',
      Burst: 'BL8 · 8n prefetch',
      'Power delivery': 'Regulated on the motherboard',
      Voltage: 'VDD/VDDQ 1.2 V · VPP 2.5 V (JEDEC)',
      'On-die ECC': 'None',
      Dimensions: '133.35 × 34 × 7.2 mm',
      Contacts: '288-pin',
    },
    representationType: 'physical',
    physicalAccuracy: ddr4Module,
    sources: ['kf432', 'kingstonddr4', 'micron16gbddr4'],
    searchTerms: [
      'ddr4',
      'ram',
      'memory',
      'dimm',
      'kingston',
      'fury',
      'beast',
      '3200',
    ],
  }),
  ...moduleParts('ddr4'),
  make({
    id: 'ddr4term',
    name: 'Command bus termination',
    shortName: 'Termination',
    category: 'Power',
    parent: 'ddr4module',
    level: 'ddr4',
    description:
      'Resistor networks at the far end of the fly-by command bus, past the last package.',
    purpose:
      'The command, address and clock lines run past all eight packages in turn; the resistors to VTT at the end absorb the signal so it does not reflect back along the chain. DDR5 moved this termination onto the die.',
    quantity: '5 networks',
    specifications: {
      Topology: 'Fly-by, terminated to VTT',
      Values: '30–47 Ω class',
    },
    representationType: 'physical',
    physicalAccuracy: `${ddr4Module} Network count and placement are representative.`,
    sources: ['micronddr4design'],
    searchTerms: ['termination', 'resistor', 'vtt', 'fly-by'],
  }),
  ...packageParts('ddr4'),
  ...dieParts('ddr4'),
];
