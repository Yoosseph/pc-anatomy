import { concept, standard, type Concept } from '../concept.ts';
import type { LevelId } from '../levels.ts';
import type { SourceId } from '../sources.ts';

/**
 * Inside the power supply.
 *
 * A switching supply always has the same spine: filter the mains, rectify it to
 * high-voltage DC, chop that at high frequency through a transformer, then
 * rectify and smooth the low-voltage side. Every block below is one step of
 * that chain, and the layout follows it left to right.
 *
 * Exterior dimensions, fan diameter, output rating and cable architecture follow
 * ASUS product documentation. Internal placement and circuit populations remain
 * illustrative; ASUS does not publish a service-level board layout.
 */
export const psuConcepts: Concept[] = [
  concept({
    id: 'psucase',
    name: 'TUF Gaming 850W Gold housing',
    shortName: '850W housing',
    category: 'Chassis',
    // An alternative to the 1000W the tower carries, so like the other
    // alternatives it stands under the machine, not the tower's PSU.
    parent: 'pc',
    level: 'psu',
    open: 'psu',
    description:
      'The 150 × 150 × 86 mm folded steel shell of the ASUS TUF Gaming 850W Gold.',
    purpose:
      'Contains mains-voltage parts, earths them, and forces intake air along the whole board before it leaves.',
    quantity: '1 modeled enclosure',
    specifications: {
      Format: 'ATX',
      Dimensions: '150 × 150 × 86 mm',
      Output: '850 W',
      Efficiency: '80 PLUS Gold',
      Cabling: 'Fully modular',
    },
    representationType: 'physical',
    physicalAccuracy:
      'Published dimensions and external features of the ASUS TUF Gaming 850W Gold; internal geometry and component placement are illustrative.',
    sources: ['tuf850g', 'psu'],
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
      'A 135 mm axial fan behind the broad top grille, drawing air over the board and out the rear.',
    purpose:
      'Removes the heat the switching devices, transformer and rectifiers produce, at low noise.',
    quantity: '1 modeled fan',
    specifications: {
      Diameter: '135 mm',
      Intake: 'Guarded top face',
      Control: 'Thermally regulated',
    },
    representationType: 'physical',
    sources: ['tuf850fan', 'fanconstruction', 'bldc'],
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
    sources: ['acdc', 'psu'],
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
    specifications: {
      Type: 'C14 appliance inlet',
      Contacts: 'Live · neutral · earth',
    },
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
    sources: ['acdc'],
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
    sources: ['acdc'],
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
    sources: ['acdc'],
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
    sources: ['acdc'],
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
    sources: ['acdc'],
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
    sources: ['acdc'],
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
    sources: ['acdc'],
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
    sources: ['acdc'],
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
    sources: ['multiphase', 'psu'],
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
    sources: ['acdc'],
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
    sources: ['psu', 'acdc'],
    searchTerms: [
      'supervisor',
      'controller',
      'protection',
      'power good',
      'ocp',
    ],
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
    quantity: '8 modeled socket groups',
    specifications: {
      Outputs: '24-pin · EPS · PCIe 16-pin · PCIe 8-pin · SATA',
    },
    representationType: 'physical',
    physicalAccuracy:
      'Socket families follow ASUS documentation; individual socket shape and placement are illustrative.',
    sources: ['tuf850g', 'psu'],
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
    sources: ['psu'],
    searchTerms: ['grille', 'vent', 'exhaust', 'honeycomb', 'mesh'],
  }),
];

/**
 * One of the TUF Gaming supplies, as the builder and the catalogue draw it.
 * Every model in the family is a 150 × 150 × 86 mm box with a 135 mm fan, so
 * they share the 850W Gold's conversion chain and differ in their rating,
 * their efficiency class, and whether the leads plug in or are fixed.
 */
export interface SupplyModel {
  /** The supply's own scale. */
  level: LevelId;
  /** Put in front of every part id; the 850W Gold's parts carry none. */
  prefix: string;
  watts: number;
  efficiency: 'Gold' | 'Bronze';
  modular: boolean;
  /** ASUS's specification page, and the product page for the fan. */
  spec: SourceId;
  fan: SourceId;
  /** The outputs ASUS lists, for the socket panel or the fixed harness. */
  outputs: string;
  /** The ATX revision ASUS states, where it states one. */
  atx?: string;
  /** More for the housing: a claim the maker's pages do not make. */
  housing?: { sources: SourceId[]; note: string };
  /**
   * The supply the tower carries, and the one a build starts on: its housing
   * hangs under the tower's PSU. The others stand under the machine.
   */
  installed?: true;
}

export const supplyModels = {
  psu650: {
    level: 'psu650',
    prefix: 'tuf650',
    watts: 650,
    efficiency: 'Bronze',
    modular: false,
    spec: 'tuf650b',
    fan: 'tuf650fan',
    outputs: '24-pin · 2 × CPU 4+4-pin · 2 × PCIe 6+2-pin · 4 × SATA',
    housing: {
      sources: ['tuf650cabling'],
      note: 'ASUS does not state the cabling; it is drawn with fixed leads, as retail listings describe it.',
    },
  },
  psubronze: {
    level: 'psubronze',
    prefix: 'bronze',
    watts: 750,
    efficiency: 'Bronze',
    modular: false,
    spec: 'tuf750b',
    fan: 'tuf750fan',
    outputs: '24-pin · EPS · PCIe 6+2-pin · SATA',
  },
  psu: {
    level: 'psu',
    prefix: '',
    watts: 850,
    efficiency: 'Gold',
    modular: true,
    spec: 'tuf850g',
    fan: 'tuf850fan',
    outputs: '24-pin · EPS · PCIe 16-pin · PCIe 8-pin · SATA',
  },
  psu1000: {
    level: 'psu1000',
    prefix: 'tuf1000',
    watts: 1000,
    efficiency: 'Gold',
    modular: true,
    spec: 'tuf1000g',
    fan: 'tuf1000fan',
    outputs:
      '24-pin · 2 × CPU 4+4-pin · PCIe 16-pin · 4 × PCIe 8-pin · 5 × SATA',
    atx: 'ATX 3.1',
    installed: true,
  },
  psu1200: {
    level: 'psu1200',
    prefix: 'tuf1200',
    watts: 1200,
    efficiency: 'Gold',
    modular: true,
    spec: 'tuf1200g',
    fan: 'tuf1200fan',
    outputs:
      '24-pin · 2 × CPU 4+4-pin · 2 × PCIe 16-pin · 3 × PCIe 8-pin · 5 × SATA',
    atx: 'ATX 3.1',
  },
} satisfies Record<string, SupplyModel>;

/** A part's id in a model: its prefix, and a harness where sockets would be. */
export const supplyPartId = (model: SupplyModel, id: string) =>
  model.prefix + (!model.modular && id === 'psumodular' ? 'psuharness' : id);

/**
 * Another model's catalogue, from the 850W Gold's: the same conversion chain
 * under its own identities, with its own housing, outputs and fan source, and
 * permanent leads in place of the socket panel on a fixed-cable unit.
 */
export function supplyConcepts(model: SupplyModel): Concept[] {
  const name = `TUF Gaming ${model.watts}W ${model.efficiency}`;
  const fixed = !model.modular;
  // What a model says differently about each kind of part: its housing, its
  // cable face (a socket panel, or a fixed harness in its place) and its fan.
  const housing = (original: Concept): Partial<Concept> => ({
    parent: model.installed ? 'psu' : 'pc',
    open: model.level,
    name: `${name} housing`,
    shortName: `${model.watts}W housing`,
    description: `The 150 × 150 × 86 mm folded steel shell of the ASUS ${name}.`,
    specifications: {
      Format: model.atx ?? 'ATX',
      Dimensions: '150 × 150 × 86 mm',
      Output: `${model.watts} W`,
      Efficiency: `80 PLUS ${model.efficiency}`,
      Cabling: fixed ? 'Non-modular' : 'Fully modular',
    },
    physicalAccuracy:
      `Published dimensions and external features of the ASUS ${name}; internal geometry and component placement are illustrative.` +
      (model.housing ? ' ' + model.housing.note : ''),
    sources: [model.spec, ...(model.housing?.sources ?? []), 'psu'],
    searchTerms: [
      ...original.searchTerms,
      `${model.watts}w`,
      model.efficiency.toLowerCase(),
      fixed ? 'non-modular' : 'modular',
      'asus',
      'tuf',
    ],
  });
  const cables: Partial<Concept> = fixed
    ? {
        name: 'Fixed cable harness',
        shortName: 'Fixed cables',
        description:
          'Permanent sleeved cable looms leave the supply through a protected opening, with no detachable PSU-side sockets.',
        purpose:
          'Delivers power through permanently attached leads to the motherboard, CPU, graphics card and drives.',
        quantity: '4 modeled cable looms',
        specifications: { Outputs: model.outputs },
        physicalAccuracy:
          'Cable families follow ASUS documentation; bundle routing and connector geometry are illustrative.',
        sources: [model.spec, 'psu'],
        searchTerms: ['fixed', 'non-modular', 'cable', 'harness', 'loom'],
      }
    : {
        specifications: { Outputs: model.outputs },
        sources: [model.spec, 'psu'],
      };
  const override = (original: Concept): Partial<Concept> =>
    original.id === 'psucase'
      ? housing(original)
      : original.id === 'psumodular'
        ? cables
        : original.id === 'psuintake'
          ? { sources: [model.fan, 'fanconstruction', 'bldc'] }
          : {};
  return psuConcepts.map((original) =>
    concept({
      ...original,
      id: supplyPartId(model, original.id),
      parent:
        original.parent === 'psucase' || original.parent === 'psuboard'
          ? model.prefix + original.parent
          : original.parent,
      children: [],
      level: model.level,
      open: undefined,
      ...override(original),
    }),
  );
}

export const bronzePsuConcepts = supplyConcepts(supplyModels.psubronze);
export const tuf650Concepts = supplyConcepts(supplyModels.psu650);
export const tuf1000Concepts = supplyConcepts(supplyModels.psu1000);
export const tuf1200Concepts = supplyConcepts(supplyModels.psu1200);
