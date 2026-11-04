import { concept, type Concept } from '../concept.ts';
import type { LevelId } from '../levels.ts';
import type { SourceId } from '../sources.ts';
import { motherboardConcepts } from './motherboard.ts';

/**
 * The two other boards the build workspace can fit: the TUF GAMING
 * Z890-PLUS WIFI, the same family's Intel board, and the TUF GAMING
 * B650M-PLUS WIFI, its micro-ATX AM5 sibling.
 *
 * `mainboard.ts` builds all three from one layout, so these are the X670E
 * board's parts with each board's own socket, chipset, outline and slot
 * counts written in from ASUS's specification. Each id carries the board's
 * prefix (`z890socket`, `b650mchipset`) so nothing collides with the board
 * the machine is built on.
 */

type Variant = 'z890' | 'b650m';
type Patch = Partial<
  Pick<
    Concept,
    | 'name'
    | 'shortName'
    | 'description'
    | 'quantity'
    | 'specifications'
    | 'open'
  >
> & { sources?: SourceId[] };

interface BoardFacts {
  root: Parameters<typeof concept>[0];
  source: SourceId;
  accuracy: string;
  patches: Record<string, Patch>;
}

const facts: Record<Variant, BoardFacts> = {
  z890: {
    source: 'tufz890',
    accuracy:
      'Built on the same layout as the X670E board, with ASUS’s Z890 specification for the socket, chipset and slot counts. The LGA 1851 socket and its loading mechanism are illustrative; component positions, routing and the rear I/O are representative, not a reproduction of this board.',
    root: {
      id: 'z890board',
      name: 'ASUS TUF GAMING Z890-PLUS WIFI',
      shortName: 'Z890 board',
      category: 'Board',
      parent: 'motherboard',
      level: 'z890',
      open: 'z890',
      description:
        'An ATX board for Intel’s Core Ultra (Series 2) processors, on the LGA 1851 socket and the Z890 chipset.',
      purpose:
        'Carries an Intel processor, its memory and its expansion. The board decides which processors a build can use: an AM5 Ryzen does not fit this socket.',
      quantity: '1 ATX board',
      specifications: {
        'Form factor': 'ATX · 305 × 244 mm',
        Socket: 'Intel LGA 1851',
        Chipset: 'Intel Z890',
        Memory: '4 DDR5 DIMM slots · up to 256 GB',
        Expansion: '1 × PCIe 5.0 ×16 · 1 × PCIe 4.0 ×16 at ×4',
        'M.2': '4 slots',
        SATA: '4 × 6 Gb/s',
      },
      representationType: 'physical',
      sources: ['tufz890', 'corei9'],
      searchTerms: ['z890', 'intel', 'lga 1851', 'tuf', 'asus', 'mainboard'],
    },
    patches: {
      moboboard: { specifications: { Outline: '305 × 244 mm (ATX)' } },
      socket: {
        description:
          'An LGA 1851 land-grid array of spring contacts, under a hinged steel load plate that a lever presses down.',
        specifications: {
          Type: 'Intel LGA 1851, illustrative',
          Retention: 'Load plate and lever',
        },
        sources: ['tufz890', 'corei9'],
      },
      cpu: {
        open: 'corei9',
        description:
          'An Intel Core Ultra 9 285K in its rectangular LGA 1851 package, under a heat spreader.',
        specifications: {
          Package: 'Intel LGA 1851',
          Lid: 'Integrated heat spreader',
        },
        sources: ['corei9', 'arrowlake'],
      },
      chipset: {
        specifications: {
          Chipset: 'Intel Z890',
          Role: 'Platform I/O hub',
          Cooling: 'Passive heatsink',
        },
      },
      pcie16: {
        specifications: {
          'From the processor': '1 × PCIe 5.0 ×16',
          'From the chipset': '1 × PCIe 4.0 ×16, running at ×4',
        },
      },
      pcie1: {
        specifications: {
          Slots: '2 × PCIe 4.0 ×1',
          'Not modeled': 'The PCIe 4.0 ×4 slot',
        },
      },
      m2slot: {
        quantity: '2 of 4 modeled',
        specifications: {
          'M.2_1': 'PCIe 5.0 ×4 from the processor',
          'Board total': '4 M.2 slots',
        },
      },
    },
  },
  b650m: {
    source: 'tufb650m',
    accuracy:
      'Built on the same layout as the X670E board, cut to the 244 × 244 mm micro-ATX outline with its lower slots, drive socket and headers moved up, and ASUS’s B650M specification for the chipset and slot counts. Component positions, routing and the rear I/O are representative, not a reproduction of this board.',
    root: {
      id: 'b650mboard',
      name: 'ASUS TUF GAMING B650M-PLUS WIFI',
      shortName: 'B650M board',
      category: 'Board',
      parent: 'motherboard',
      level: 'b650m',
      open: 'b650m',
      description:
        'A micro-ATX AM5 board: 61 mm shorter than ATX, with the same top mounting holes and fewer slots below the graphics card.',
      purpose:
        'Carries the same Ryzen processors and DDR5 memory as an ATX AM5 board in a smaller outline, at the cost of expansion slots.',
      quantity: '1 micro-ATX board',
      specifications: {
        'Form factor': 'Micro-ATX · 244 × 244 mm',
        Socket: 'AMD AM5',
        Chipset: 'AMD B650',
        Memory: '4 DDR5 DIMM slots · up to 256 GB',
        Expansion:
          '1 × PCIe 4.0 ×16 · 1 × PCIe 4.0 ×16 at ×4 · 1 × PCIe 4.0 ×1',
        'M.2': '2 slots',
        SATA: '4 × 6 Gb/s',
      },
      representationType: 'physical',
      sources: ['tufb650m', 'ryzen'],
      searchTerms: ['b650m', 'b650', 'micro atx', 'matx', 'am5', 'tuf', 'asus'],
    },
    patches: {
      moboboard: { specifications: { Outline: '244 × 244 mm (micro-ATX)' } },
      socket: { sources: ['tufb650m', 'ryzen'] },
      chipset: {
        specifications: {
          Chipset: 'AMD B650',
          Role: 'Platform I/O hub',
          Cooling: 'Passive heatsink',
        },
      },
      pcie16: {
        specifications: {
          'From the processor': '1 × PCIe 4.0 ×16',
          'From the chipset': '1 × PCIe 4.0 ×16, running at ×4',
        },
      },
      pcie1: {
        quantity: '1 modeled slot',
        specifications: { Slots: '1 × PCIe 4.0 ×1' },
      },
      m2slot: {
        specifications: {
          'M.2_1': 'PCIe 5.0 ×4 with a Ryzen 9000',
          'M.2_2': 'PCIe 4.0 ×4',
        },
      },
      mobofanheader: { quantity: '4 modeled headers' },
    },
  },
};

/** One board's parts: the X670E board's, renamed and rewritten for it. */
function boardConcepts(variant: Variant): Concept[] {
  const f = facts[variant];
  const id = (name: string) => variant + name;
  return [
    concept({ ...f.root, physicalAccuracy: f.accuracy }),
    ...motherboardConcepts.map((original) => {
      const patch = f.patches[original.id] ?? {};
      return concept({
        ...original,
        ...patch,
        id: id(original.id),
        parent:
          original.parent === 'motherboard'
            ? f.root.id
            : id(original.parent ?? ''),
        children: [],
        level: variant as LevelId,
        open: patch.open ?? original.open,
        physicalAccuracy: f.accuracy,
        // The X670E board's manual stands in for this board's own page.
        sources:
          patch.sources ??
          original.sources.map((s) => (s === 'mainboardmanual' ? f.source : s)),
      });
    }),
  ];
}

export const z890Concepts = boardConcepts('z890');
export const b650mConcepts = boardConcepts('b650m');
