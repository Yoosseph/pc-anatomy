import { concept, type Concept } from '../concept.ts';

/**
 * Inside the hard disk.
 *
 * The only part of a modern machine with moving parts that matter. Magnetised
 * platters spin at a constant rate while an arm swings a head across them on a
 * cushion of air a few nanometres thick.
 *
 * The interface is SATA and is cited. The mechanism below is drawn from the
 * general construction every drive shares: platter count, head count, ramp
 * design and magnet shape vary between products, and none is claimed here.
 */
const mechanism =
  'Illustrative mechanism. Drawn from the construction common to hard disks in general; platter count, head arrangement and component shapes vary between products and none is claimed.';

export const diskConcepts: Concept[] = [
  concept({
    id: 'diskcover',
    name: 'Cover plate',
    shortName: 'Cover',
    category: 'Storage',
    parent: 'hdd',
    level: 'disk',
    open: 'disk',
    description:
      'A stamped aluminium lid screwed down onto a gasket, with a small filtered breather hole.',
    purpose:
      'Seals the mechanism against dust. The breather equalises pressure with the outside air without letting particles in, so the drive is filtered rather than airtight.',
    quantity: '1 modeled cover',
    specifications: { Seal: 'Gasket and filtered breather' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: ['sata'],
    searchTerms: ['cover', 'lid', 'breather', 'seal', 'gasket'],
  }),
  concept({
    id: 'diskbase',
    name: 'Base casting',
    shortName: 'Base',
    category: 'Storage',
    parent: 'hdd',
    level: 'disk',
    description:
      'The cast alloy body everything else is located to, with the mounting holes down its sides.',
    purpose:
      'Holds the spindle and the actuator pivot in fixed relation to each other. Any flex between them is a read error.',
    quantity: '1 modeled casting',
    specifications: { Format: '3.5-inch', Material: 'Cast alloy' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: [],
    searchTerms: ['base', 'casting', 'chassis', 'body', 'frame'],
  }),
  concept({
    id: 'diskplatter',
    name: 'Platters',
    shortName: 'Platter',
    category: 'Storage',
    parent: 'diskbase',
    level: 'disk',
    description:
      'Rigid discs coated with a thin magnetic film, polished to a mirror and separated by spacers.',
    purpose:
      'The data itself: microscopic regions of the coating are magnetised one way or the other, in concentric tracks.',
    quantity: '3 modeled platters',
    specifications: { Surfaces: '2 per platter', Coating: 'Thin-film magnetic' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: [],
    searchTerms: ['platter', 'disc', 'magnetic', 'surface', 'track'],
  }),
  concept({
    id: 'diskspindle',
    name: 'Spindle motor',
    shortName: 'Spindle',
    category: 'Storage',
    parent: 'diskbase',
    level: 'disk',
    description:
      'A brushless motor in the hub the platters are clamped to, running in fluid bearings.',
    purpose:
      'Turns the stack at a constant rate. Speed stability matters as much as speed: the heads read by timing.',
    quantity: '1 modeled motor',
    specifications: { Type: 'Brushless, fluid bearing' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: ['bldc'],
    searchTerms: ['spindle', 'motor', 'hub', 'bearing', 'rpm', 'clamp'],
  }),
  concept({
    id: 'diskactuator',
    name: 'Actuator arm',
    shortName: 'Actuator',
    category: 'Storage',
    parent: 'diskbase',
    level: 'disk',
    description:
      'A stack of arms on one pivot, each carrying a sprung suspension with a read/write head at its tip.',
    purpose:
      'Swings the heads to the right track. All the arms move together, so the heads always sit above the same track on every surface.',
    quantity: '6 modeled arms',
    specifications: { Heads: 'One per surface' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: [],
    searchTerms: ['actuator', 'arm', 'head', 'slider', 'suspension', 'pivot'],
  }),
  concept({
    id: 'diskvoicecoil',
    name: 'Voice coil motor',
    shortName: 'Voice coil',
    category: 'Storage',
    parent: 'diskactuator',
    level: 'disk',
    description:
      'A flat coil at the tail of the arm stack, sandwiched between two very strong magnets.',
    purpose:
      'Current through the coil swings the arm. It has no detents and no steps, so the head is positioned by continuous feedback from the track it is reading.',
    quantity: '2 modeled magnets',
    specifications: { Drive: 'Coil between permanent magnets' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: [],
    searchTerms: ['voice coil', 'magnet', 'vcm', 'seek', 'neodymium'],
  }),
  concept({
    id: 'diskramp',
    name: 'Parking ramp',
    shortName: 'Ramp',
    category: 'Storage',
    parent: 'diskbase',
    level: 'disk',
    description:
      'A moulded ramp at the outer edge of the platters that the head suspensions ride up onto.',
    purpose:
      'Lifts the heads clear of the surface before the platters stop, so they never rest on the data.',
    quantity: '1 modeled ramp',
    specifications: { Role: 'Load and unload' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: [],
    searchTerms: ['ramp', 'park', 'unload', 'head', 'landing'],
  }),
  concept({
    id: 'diskfilter',
    name: 'Recirculation filter',
    shortName: 'Filter',
    category: 'Storage',
    parent: 'diskbase',
    level: 'disk',
    description: 'A pad tucked in the airflow the spinning platters create.',
    purpose:
      'Catches any particle shed inside the sealed volume. At the height the heads fly, a speck of dust is a boulder.',
    quantity: '1 modeled filter',
    specifications: { Placement: 'In the platter airflow' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: [],
    searchTerms: ['filter', 'dust', 'particle', 'recirculation', 'clean'],
  }),
  concept({
    id: 'diskboard',
    name: 'Controller board',
    shortName: 'Controller',
    category: 'Board',
    parent: 'hdd',
    level: 'disk',
    description:
      'The board on the underside, carrying the controller, cache memory and the motor driver.',
    purpose:
      'Runs the servo loop that keeps the head on track, drives the spindle and the coil, and translates SATA commands into head movements.',
    quantity: '1 modeled board',
    specifications: { Interface: 'SATA 6 Gb/s' },
    representationType: 'physical',
    physicalAccuracy: mechanism,
    sources: ['sata', 'bldc'],
    searchTerms: ['controller', 'pcb', 'board', 'cache', 'servo', 'driver'],
  }),
  concept({
    id: 'diskport',
    name: 'Data and power connectors',
    shortName: 'Connectors',
    category: 'Storage',
    parent: 'diskboard',
    level: 'disk',
    description: 'The two L-keyed edge connectors on the back of the drive.',
    purpose:
      'Carries the SATA link on the narrow connector and the supply rails on the wide one, keyed so neither can go in upside down.',
    quantity: '2 modeled connectors',
    specifications: { Data: '7-pin SATA', Power: '15-pin SATA' },
    representationType: 'physical',
    sources: ['sata'],
    searchTerms: ['sata', 'connector', 'power', 'data', 'port', 'keyed'],
  }),
];
