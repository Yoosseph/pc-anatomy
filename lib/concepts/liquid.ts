import { concept, type Concept } from '../concept.ts';

/**
 * Inside an all-in-one liquid cooler.
 *
 * The idea is the same as an air tower: take heat off a small hot lid and give
 * it to a large area of thin metal with air moving through it. The difference
 * is what carries the heat between those two places. A tower uses sealed heat
 * pipes and has to put the fin stack directly above the socket. A liquid loop
 * pumps coolant through flexible tubing, so the radiator can go wherever the
 * case has room for it, which is why these are usually mounted in the roof.
 *
 * Radiator length, fan count and fitting style vary between products; this is a
 * 360 mm three-fan unit as a representative example, not a specific model.
 */
export const liquidConcepts: Concept[] = [
  concept({
    id: 'aioradiator',
    name: 'Radiator',
    shortName: 'Radiator',
    category: 'Cooling',
    parent: 'aio',
    level: 'liquid',
    description:
      'An aluminium core of flat coolant channels threaded through a dense folded fin matrix, closed at each end by a tank.',
    purpose:
      'Hands the heat in the coolant to the air. The channels carry liquid, the folded fins between them multiply the surface that air actually touches, and the tanks turn the flow around so it crosses the core more than once.',
    quantity: '1 modeled 360 mm core',
    specifications: {
      Length: '360 mm, three fan positions',
      Core: 'Aluminium, folded fin',
      Thickness: '27 mm typical',
    },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['radiator', 'rad', 'core', 'fins', '360', 'aluminium'],
  }),
  concept({
    id: 'aiofans',
    name: 'Radiator fans',
    shortName: 'Rad fans',
    category: 'Cooling',
    parent: 'aioradiator',
    level: 'liquid',
    description:
      'Three 120 mm fans clamped to the radiator, usually with a higher static pressure rating than a case fan.',
    purpose:
      'Push air through the fin matrix. A radiator resists airflow far more than an open grille, so these blades are shaped to keep moving air against that resistance rather than to move the most air in free space.',
    quantity: '3 modeled fans',
    specifications: {
      Size: '120 mm each',
      Rating: 'Static pressure optimised',
    },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['fan', 'fans', 'static pressure', '120mm', 'airflow'],
  }),
  concept({
    id: 'aiopump',
    name: 'Pump and water block',
    shortName: 'Pump block',
    category: 'Cooling',
    parent: 'aio',
    level: 'liquid',
    description:
      'One housing holding the pump and the water block, sitting directly on the processor.',
    purpose:
      'Moves the coolant around the loop. Putting the pump on the block rather than in the radiator keeps the whole assembly to two tubes and one power lead.',
    quantity: '1 modeled block',
    specifications: {
      Type: 'Combined pump and cold block',
      Drive: 'Brushless, electronically commutated',
    },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['pump', 'block', 'waterblock', 'head', 'impeller'],
  }),
  concept({
    id: 'aioimpeller',
    name: 'Pump impeller',
    shortName: 'Impeller',
    category: 'Cooling',
    parent: 'aiopump',
    level: 'liquid',
    description:
      'A small vaned rotor spinning in its own chamber above the coldplate, driven through the housing wall.',
    purpose:
      'Throws coolant outward into the outlet by centrifugal action. The motor drives it magnetically through a sealed wall, so the loop has no shaft passing out of it and nothing to leak past.',
    quantity: '1 modeled rotor',
    specifications: { Type: 'Centrifugal, magnetically driven' },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['impeller', 'rotor', 'centrifugal', 'magnetic', 'pump'],
  }),
  concept({
    id: 'aiocoldplate',
    name: 'Coldplate and microfins',
    shortName: 'Coldplate',
    category: 'Cooling',
    parent: 'aiopump',
    level: 'liquid',
    description:
      'A copper plate whose inner face is cut into a dense field of very fine fins, with the flat outer face clamped to the processor lid.',
    purpose:
      'Gets heat into the coolant. The microfins exist to multiply wetted area and to keep the flow turbulent, because liquid moving smoothly along a wall carries heat away far more slowly than liquid tumbling against it.',
    quantity: '1 modeled plate',
    specifications: {
      Material: 'Copper, often nickel-plated',
      Structure: 'Skived or cut microfin field',
    },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['coldplate', 'microfin', 'copper', 'jet', 'contact'],
  }),
  concept({
    id: 'aiotubes',
    name: 'Tubing',
    shortName: 'Tubing',
    category: 'Cooling',
    parent: 'aio',
    level: 'liquid',
    description:
      'Two lengths of flexible reinforced tube, usually rubber with a low permeability liner, sleeved against abrasion.',
    purpose:
      'Carries coolant out to the radiator and back. The liner matters more than the outer sleeve: a bare rubber tube loses water vapour through its wall over years, and a sealed loop cannot be topped up.',
    quantity: '2 modeled tubes',
    specifications: {
      Count: 'Supply and return',
      Wall: 'Low permeability liner, sleeved',
    },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['tube', 'tubing', 'hose', 'sleeve', 'flexible'],
  }),
  concept({
    id: 'aiocoolant',
    name: 'Coolant',
    shortName: 'Coolant',
    category: 'Cooling',
    parent: 'aiotubes',
    level: 'liquid',
    description:
      'Mostly water, with corrosion inhibitors and a biocide, filled at the factory and not intended to be opened.',
    purpose:
      'Water is the working fluid because almost nothing else stores so much heat per unit of mass. The additives are there to stop the two dissimilar metals in the loop corroding each other and to stop anything growing in the dark.',
    quantity: '1 modeled volume',
    specifications: {
      Base: 'Water',
      Additives: 'Corrosion inhibitor, biocide',
    },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['coolant', 'water', 'fluid', 'liquid', 'inhibitor'],
  }),
  concept({
    id: 'aiofittings',
    name: 'Fittings',
    shortName: 'Fittings',
    category: 'Cooling',
    parent: 'aiotubes',
    level: 'liquid',
    description:
      'Crimped or barbed collars where each tube meets the block and the radiator tanks, often on a rotating joint.',
    purpose:
      'Hold the seal for the life of the unit. The rotating joint lets the tubes be turned to face the radiator during installation without twisting the tube itself, which is what would otherwise strain the seal.',
    quantity: '4 modeled fittings',
    specifications: { Joint: 'Rotary, sealed' },
    representationType: 'physical',
    sources: ['aio'],
    searchTerms: ['fitting', 'barb', 'collar', 'rotary', 'seal'],
  }),
];
