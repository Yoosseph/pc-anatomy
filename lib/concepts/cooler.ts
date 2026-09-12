import { concept, type Concept } from '../concept.ts';

/**
 * Inside the processor cooler.
 *
 * A tower cooler is one idea repeated: get heat off a small hot lid, spread it
 * along pipes into a large area of thin metal, and blow air through that metal.
 * Each part below is one step of it.
 *
 * Fin count, pipe count and the mounting hardware vary between coolers; these
 * are representative of the category, not a specific product.
 */
export const coolerConcepts: Concept[] = [
  concept({
    id: 'coolerbase',
    name: 'Coldplate',
    shortName: 'Coldplate',
    category: 'Cooling',
    parent: 'cpucooler',
    level: 'cooler',
    open: 'cooler',
    description:
      'A lapped copper block, usually nickel-plated, clamped flat against the processor lid.',
    purpose:
      'Takes heat out of the small, very hot lid and hands it to the pipes, over as large a contact area as the lid allows.',
    quantity: '1 modeled block',
    specifications: { Material: 'Nickel-plated copper' },
    representationType: 'physical',
    sources: ['coolermount'],
    searchTerms: ['coldplate', 'base', 'copper', 'contact', 'lapped'],
  }),
  concept({
    id: 'coolerpaste',
    name: 'Thermal compound',
    shortName: 'Paste',
    category: 'Cooling',
    parent: 'coolerbase',
    level: 'cooler',
    description:
      'A thin filled layer between the processor lid and the coldplate.',
    purpose:
      'Fills the microscopic air gaps between two surfaces that look flat but are not. Air is the insulator being displaced.',
    quantity: '1 modeled layer',
    specifications: { Thickness: 'As thin as contact allows' },
    representationType: 'physical',
    sources: ['coolermount'],
    searchTerms: ['paste', 'compound', 'tim', 'thermal', 'grease'],
  }),
  concept({
    id: 'coolerpipes',
    name: 'Heat pipes',
    shortName: 'Heat pipes',
    category: 'Cooling',
    parent: 'cpucooler',
    level: 'cooler',
    description:
      'Sealed copper tubes holding a wick and a little working fluid, flattened where they cross the coldplate.',
    purpose:
      'The fluid boils at the hot end, travels as vapour to the cold end, condenses into the fins and wicks back. It moves heat far faster than solid copper of the same weight.',
    quantity: '4 modeled pipes',
    specifications: { Construction: 'Sealed copper, wicked' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['heat pipe', 'copper', 'vapour', 'wick', 'phase change'],
  }),
  concept({
    id: 'coolerfins',
    name: 'Fin stack',
    shortName: 'Fins',
    category: 'Cooling',
    parent: 'cpucooler',
    level: 'cooler',
    description:
      'Dozens of thin aluminium sheets pressed onto the pipes at a fixed spacing.',
    purpose:
      'Turns the heat the pipes carry into a very large surface for air to wash over. Spacing is the compromise: tighter is more area but needs more pressure to push air through.',
    quantity: '48 modeled fins',
    specifications: { Material: 'Aluminium', Pitch: 'Illustrative' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['fins', 'stack', 'aluminium', 'surface area', 'radiator'],
  }),
  concept({
    id: 'coolercap',
    name: 'Top cover',
    shortName: 'Top cover',
    category: 'Cooling',
    parent: 'coolerfins',
    level: 'cooler',
    description: 'A brushed plate capping the stack, often lit.',
    purpose:
      'Closes the top of the fin stack so air is drawn through the fins rather than over them, and carries the branding.',
    quantity: '1 modeled cover',
    specifications: { Finish: 'Brushed, illustrative' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['cover', 'cap', 'top', 'plate', 'lid'],
  }),
  concept({
    id: 'coolerfan',
    name: 'Cooler fan',
    shortName: 'Fan',
    category: 'Cooling',
    parent: 'cpucooler',
    level: 'cooler',
    description:
      'A fan clipped to the face of the stack, pushing air between the fins.',
    purpose:
      'Keeps replacing the air touching the fins. Without moving air the stack simply reaches the same temperature as the processor.',
    quantity: '1 modeled fan',
    specifications: { Format: '120 mm', Control: '4-pin PWM' },
    representationType: 'physical',
    sources: ['bldc'],
    searchTerms: ['fan', 'airflow', 'pwm', '120mm'],
  }),
  concept({
    id: 'coolerclip',
    name: 'Fan clips',
    shortName: 'Clips',
    category: 'Cooling',
    parent: 'coolerfan',
    level: 'cooler',
    description: 'Sprung wire clips hooking the fan onto the fin stack.',
    purpose:
      'Hold the fan tight against the fins while letting it be moved or swapped without tools.',
    quantity: '2 modeled clips',
    specifications: { Material: 'Spring steel' },
    representationType: 'physical',
    sources: [],
    searchTerms: ['clip', 'wire', 'spring', 'bracket', 'mount'],
  }),
  concept({
    id: 'coolermount',
    name: 'Mounting hardware',
    shortName: 'Mount',
    category: 'Cooling',
    parent: 'cpucooler',
    level: 'cooler',
    description:
      'A backplate behind the board, standoffs through it, and a crossbar that pulls the coldplate down.',
    purpose:
      'Applies an even, specified clamping force across the lid, and takes that load into the board rather than into the socket.',
    quantity: '1 modeled set',
    specifications: { Load: 'Spring-limited', Fit: 'Socket-specific bracket' },
    representationType: 'physical',
    sources: ['coolermount'],
    searchTerms: ['backplate', 'bracket', 'screw', 'standoff', 'mount', 'clamp'],
  }),
];
