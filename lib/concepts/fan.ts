import { concept, type Concept } from '../concept.ts';

/**
 * Inside a case fan.
 *
 * A fan is a brushless motor turned inside out: the magnet spins with the
 * impeller around a stator that stays still. Everything below is one of the
 * eight or so parts that makes that work.
 *
 * Blade count, bearing type and winding arrangement vary between fans; these
 * are representative of the category rather than a specific product.
 */
export const fanConcepts: Concept[] = [
  concept({
    id: 'fanframe',
    name: 'Fan frame',
    shortName: 'Frame',
    category: 'Cooling',
    parent: 'casefan',
    level: 'fan',
    open: 'fan',
    description:
      'The moulded square surround, with a circular bore, four mounting holes and the struts that carry the motor.',
    purpose:
      'Holds the motor concentric in the airflow and gives the fan a standard bolt pattern to mount by.',
    quantity: '1 modeled frame',
    specifications: { Format: '120 mm', Depth: '25 mm' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['frame', 'housing', 'body', 'mount'],
  }),
  concept({
    id: 'fanpads',
    name: 'Anti-vibration pads',
    shortName: 'Pads',
    category: 'Cooling',
    parent: 'fanframe',
    level: 'fan',
    description: 'Soft rubber blocks let into each corner of the frame.',
    purpose:
      'Stops the fan’s own imbalance reaching the case panel and turning it into a soundboard.',
    quantity: '4 modeled pads',
    specifications: { Material: 'Elastomer, illustrative' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['rubber', 'pad', 'vibration', 'noise', 'damping'],
  }),
  concept({
    id: 'fanimpeller',
    name: 'Impeller',
    shortName: 'Impeller',
    category: 'Cooling',
    parent: 'casefan',
    level: 'fan',
    description:
      'The hub shell and its ring of swept, twisted blades, moulded as one piece.',
    purpose:
      'Each blade acts as a small wing: turning it drives air along the axis rather than flinging it outward.',
    quantity: '9 modeled blades',
    specifications: { Blades: '9', Form: 'Swept and cambered' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['impeller', 'blade', 'rotor', 'propeller', 'airflow'],
  }),
  concept({
    id: 'fanmagnet',
    name: 'Rotor magnet',
    shortName: 'Magnet',
    category: 'Cooling',
    parent: 'fanimpeller',
    level: 'fan',
    description:
      'A magnetised ring bonded inside the hub shell, poles alternating around it.',
    purpose:
      'This is the moving half of the motor: the stator pulls on these poles to turn the impeller.',
    quantity: '1 modeled ring',
    specifications: { Arrangement: 'Alternating poles around the ring' },
    representationType: 'physical',
    sources: ['bldc'],
    searchTerms: ['magnet', 'rotor', 'poles', 'motor', 'ring'],
  }),
  concept({
    id: 'fanstator',
    name: 'Stator and windings',
    shortName: 'Stator',
    category: 'Cooling',
    parent: 'casefan',
    level: 'fan',
    description:
      'A stack of steel laminations on the centre post, with copper wound around each arm.',
    purpose:
      'Energising the coils in turn makes a magnetic field that rotates, dragging the rotor magnet around with it.',
    quantity: '4 modeled poles',
    specifications: { Core: 'Laminated steel', Winding: 'Copper' },
    representationType: 'physical',
    sources: ['bldc'],
    searchTerms: ['stator', 'coil', 'winding', 'copper', 'motor', 'lamination'],
  }),
  concept({
    id: 'fanbearing',
    name: 'Bearing and shaft',
    shortName: 'Bearing',
    category: 'Cooling',
    parent: 'fanstator',
    level: 'fan',
    description:
      'The shaft down the centre of the post, running in a sleeve with a retaining clip beneath it.',
    purpose:
      'Carries the impeller with as little friction as possible, and decides how long the fan lasts and how it sounds as it ages.',
    quantity: '1 modeled bearing',
    specifications: { Type: 'Sleeve, illustrative' },
    representationType: 'physical',
    sources: ['bldc'],
    searchTerms: ['bearing', 'shaft', 'sleeve', 'friction', 'clip'],
  }),
  concept({
    id: 'fanboard',
    name: 'Driver board',
    shortName: 'Driver',
    category: 'Board',
    parent: 'fanstator',
    level: 'fan',
    description:
      'A small ring board under the stator, carrying the driver and a sensor that watches the rotor go past.',
    purpose:
      'Switches the coils at the right moment, obeys the speed command and reports the actual speed back.',
    quantity: '1 modeled board',
    specifications: { Sensing: 'Rotor position', Output: 'Tachometer' },
    representationType: 'physical',
    sources: ['bldc'],
    searchTerms: ['driver', 'hall', 'sensor', 'pcb', 'tacho', 'commutation'],
  }),
  concept({
    id: 'fanlead',
    name: 'Fan lead',
    shortName: 'Lead',
    category: 'Cooling',
    parent: 'fanboard',
    level: 'fan',
    description:
      'A sleeved four-wire lead leaving one corner, ending in a keyed connector.',
    purpose:
      'Carries twelve volts and ground in, the speed command down, and the tachometer signal back.',
    quantity: '1 modeled lead',
    specifications: { Contacts: '4-pin PWM' },
    representationType: 'physical',
    sources: ['bldc'],
    searchTerms: ['cable', 'lead', 'wire', 'connector', 'pwm', '4-pin'],
  }),
];
