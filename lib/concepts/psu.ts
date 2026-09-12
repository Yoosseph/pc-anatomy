import { concept, standard, type Concept } from '../concept.ts';

/**
 * Inside the power supply.
 *
 * A switching supply always has the same spine: filter the mains, rectify it to
 * high-voltage DC, chop that at high frequency through a transformer, then
 * rectify and smooth the low-voltage side. Every block below is one step of
 * that chain, and the layout follows it left to right.
 *
 * Component values, part counts and topology details are representative of the
 * category. No wattage, efficiency rating or vendor is claimed.
 */
export const psuConcepts: Concept[] = [
  concept({
    id: 'psucase',
    name: 'Supply housing',
    shortName: 'Housing',
    category: 'Chassis',
    parent: 'psu',
    level: 'psu',
    open: 'psu',
    description:
      'The folded steel shell, with the intake on one face and the exhaust grille on the other.',
    purpose:
      'Contains mains-voltage parts, earths them, and forces intake air along the whole board before it leaves.',
    quantity: '1 modeled enclosure',
    specifications: { Format: 'ATX', Enclosure: 'Folded steel' },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['psu'],
    searchTerms: ['psu', 'case', 'shell', 'housing', 'enclosure'],
  }),
  concept({
    id: 'psuintake',
    name: 'Supply fan',
    shortName: 'Supply fan',
    category: 'Cooling',
    parent: 'psucase',
    level: 'psu',
    description:
      'A large slow fan in the base, drawing air up through the board and out of the back.',
    purpose:
      'Removes the heat the switching devices, transformer and rectifiers produce, at low noise.',
    quantity: '1 modeled fan',
    specifications: { Intake: 'Underside', Control: 'Thermally regulated' },
    representationType: 'physical',
    sources: ['bldc'],
    searchTerms: ['fan', 'intake', 'cooling', 'airflow'],
  }),
  concept({
    id: 'psuboard',
    name: 'Supply board',
    shortName: 'Board',
    category: 'Board',
    parent: 'psucase',
    level: 'psu',
    description:
      'One board carrying the whole conversion chain, with a wide isolation gap across the middle.',
    purpose:
      'Keeps the mains-voltage side physically and electrically separated from the low-voltage side feeding the machine.',
    quantity: '1 modeled board',
    specifications: { Isolation: 'Primary / secondary barrier' },
    representationType: 'physical',
    sources: ['psu'],
    searchTerms: ['pcb', 'board', 'isolation', 'primary', 'secondary'],
  }),
  concept({
    id: 'psuinlet',
    name: 'Mains inlet and switch',
    shortName: 'Mains inlet',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'The three-pin socket and rocker switch where wall power enters, earth included.',
    purpose:
      'Brings alternating current in on a keyed, earthed connector that cannot be inserted the wrong way.',
    quantity: '1 modeled inlet',
    specifications: { Type: 'C14 appliance inlet', Contacts: 'Live · neutral · earth' },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['psu'],
    searchTerms: ['iec', 'c14', 'mains', 'inlet', 'switch', 'ac'],
  }),
  concept({
    id: 'psufilter',
    name: 'Mains filter',
    shortName: 'EMI filter',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'Common-mode chokes and a set of safety capacitors immediately behind the inlet.',
    purpose:
      'Stops the supply’s own switching noise travelling back out onto the mains, and blunts incoming spikes.',
    quantity: '2 modeled chokes',
    specifications: { Parts: 'Common-mode chokes · X and Y capacitors' },
    representationType: 'physical',
    sources: ['powerdesign'],
    searchTerms: ['emi', 'filter', 'choke', 'noise', 'x capacitor'],
  }),
  concept({
    id: 'psubridge',
    name: 'Bridge rectifier',
    shortName: 'Rectifier',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'A four-diode block bolted to a heatsink, turning alternating current into pulsing DC.',
    purpose:
      'Converts the incoming mains waveform into one-directional current the rest of the supply can work with.',
    quantity: '1 modeled bridge',
    specifications: { Devices: '4 diodes in one package' },
    representationType: 'physical',
    sources: ['powerdesign'],
    searchTerms: ['bridge', 'rectifier', 'diode', 'ac to dc'],
  }),
  concept({
    id: 'psupfc',
    name: 'Power factor correction',
    shortName: 'PFC stage',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'A large wound inductor with its switching device and diode, boosting the rectified mains to a high DC rail.',
    purpose:
      'Makes the supply draw current in step with the mains waveform instead of in sharp spikes, and feeds a steady high-voltage rail.',
    quantity: '1 modeled boost stage',
    specifications: { Topology: 'Boost converter, illustrative' },
    representationType: 'physical',
    sources: ['powerdesign'],
    searchTerms: ['pfc', 'power factor', 'boost', 'inductor', 'choke'],
  }),
  concept({
    id: 'psubulk',
    name: 'Bulk capacitor',
    shortName: 'Bulk cap',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'The large canister on the high-voltage side, the biggest single component on the board.',
    purpose:
      'Stores enough energy to carry the machine through the gaps between mains peaks, and through brief dropouts.',
    quantity: '1 modeled capacitor',
    specifications: { Role: 'High-voltage energy store' },
    representationType: 'physical',
    sources: ['powerdesign'],
    searchTerms: ['capacitor', 'bulk', 'hold-up', 'electrolytic', 'can'],
  }),
  concept({
    id: 'psuswitch',
    name: 'Primary switching devices',
    shortName: 'Switches',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'Transistors on the tall primary heatsink, chopping the high-voltage rail tens of thousands of times a second.',
    purpose:
      'Turns steady DC back into high-frequency AC, which is the only way to put it through a transformer this small.',
    quantity: '4 modeled devices',
    specifications: { Role: 'High-side / low-side switching' },
    representationType: 'physical',
    sources: ['powerdesign'],
    searchTerms: ['mosfet', 'switch', 'transistor', 'primary', 'inverter'],
  }),
  concept({
    id: 'psutransformer',
    name: 'Main transformer',
    shortName: 'Transformer',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'A taped ferrite core straddling the isolation gap, windings on both sides of it.',
    purpose:
      'Steps the chopped high voltage down to about twelve volts, and is the barrier that keeps mains away from the machine.',
    quantity: '1 modeled transformer',
    specifications: { Core: 'Ferrite', Role: 'Step-down and isolation' },
    representationType: 'physical',
    sources: ['powerdesign'],
    searchTerms: ['transformer', 'ferrite', 'isolation', 'winding', 'core'],
  }),
  concept({
    id: 'psusinks',
    name: 'Switching heatsinks',
    shortName: 'Heatsinks',
    category: 'Cooling',
    parent: 'psuboard',
    level: 'psu',
    description:
      'Tall finned aluminium walls either side of the transformer, one per voltage side.',
    purpose:
      'Carries heat away from the switching devices and rectifiers into the air the fan is moving.',
    quantity: '2 modeled heatsinks',
    specifications: { Placement: 'Primary and secondary side' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['heatsink', 'fins', 'cooling', 'aluminium'],
  }),
  concept({
    id: 'psusecondary',
    name: 'Secondary rectification',
    shortName: 'Secondary',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'Low-voltage transistors switched in time with the transformer, on the machine side of the barrier.',
    purpose:
      'Rectifies the transformer output with far less waste than diodes would, producing the +12 V rail.',
    quantity: '6 modeled devices',
    specifications: { Method: 'Synchronous rectification' },
    representationType: 'physical',
    sources: ['powerdesign'],
    searchTerms: ['synchronous', 'rectifier', 'secondary', '12v', 'mosfet'],
  }),
  concept({
    id: 'psudcdc',
    name: 'Minor rail converters',
    shortName: 'DC-DC',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'Small daughter boards standing off the main board, fed from the twelve-volt rail.',
    purpose:
      'Derives the +5 V and +3.3 V rails locally, which regulates them better than taking extra transformer windings.',
    quantity: '2 modeled converters',
    specifications: { Rails: '+5 V · +3.3 V' },
    representationType: 'physical',
    sources: ['psu'],
    searchTerms: ['dc-dc', 'buck', '5v', '3.3v', 'rail', 'daughterboard'],
  }),
  concept({
    id: 'psuoutput',
    name: 'Output capacitors',
    shortName: 'Output caps',
    category: 'Power',
    parent: 'psuboard',
    level: 'psu',
    description:
      'A bank of low-resistance capacitors and small chokes at the output end of the board.',
    purpose:
      'Smooths what is left of the switching ripple and supplies the instant current a sudden load demands.',
    quantity: '8 modeled capacitors',
    specifications: { Type: 'Low-ESR electrolytic and polymer' },
    representationType: 'physical',
    sources: ['powerdesign'],
    searchTerms: ['capacitor', 'output', 'ripple', 'filter', 'esr'],
  }),
  concept({
    id: 'psusupervisor',
    name: 'Supervisor and control',
    shortName: 'Supervisor',
    category: 'Board',
    parent: 'psuboard',
    level: 'psu',
    description:
      'The controller that runs the switching, plus the watchdog that measures every rail.',
    purpose:
      'Holds the rails in regulation, asserts the ready signal when they are good, and shuts the supply down on over-current, over-voltage or over-temperature.',
    quantity: '2 modeled controllers',
    specifications: { Signals: 'Power-on · power-good' },
    representationType: 'physical',
    sources: ['psu', 'monitor'],
    searchTerms: ['supervisor', 'controller', 'protection', 'power good', 'ocp'],
  }),
  concept({
    id: 'psumodular',
    name: 'Modular output panel',
    shortName: 'Output panel',
    category: 'Power',
    parent: 'psucase',
    level: 'psu',
    description:
      'Keyed sockets on the face that points into the case, each labelled for what may plug into it.',
    purpose:
      'Lets only the cables a build actually needs be fitted, so the rest never enter the case.',
    quantity: '7 modeled sockets',
    specifications: { Outputs: '24-pin · EPS · PCIe · SATA' },
    representationType: 'physical',
    physicalAccuracy: standard,
    sources: ['psu'],
    searchTerms: ['modular', 'connector', 'socket', 'cable', 'output'],
  }),
  concept({
    id: 'psugrille',
    name: 'Exhaust grille',
    shortName: 'Grille',
    category: 'Cooling',
    parent: 'psucase',
    level: 'psu',
    description: 'The punched honeycomb across the rear face.',
    purpose:
      'Lets heated air out with as little restriction as a panel that still keeps fingers away from mains parts can manage.',
    quantity: '1 modeled grille',
    specifications: { Pattern: 'Hexagonal perforation' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['grille', 'vent', 'exhaust', 'honeycomb', 'mesh'],
  }),
];
