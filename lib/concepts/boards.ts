import { concept, type Concept } from '../concept.ts';
import type { LevelId } from '../levels.ts';
import type { SourceId } from '../sources.ts';
import { motherboardConcepts } from './motherboard.ts';
import type { BoardChoice } from '../desktop-build.ts';

/**
 * The other boards the build workspace can fit: ASUS's TUF GAMING Z890-PLUS
 * WIFI (the same family's Intel board) and TUF GAMING B650M-PLUS WIFI (its
 * micro-ATX sibling), and three boards from other makers: MSI's MAG X870
 * TOMAHAWK WIFI, GIGABYTE's Z890 AORUS ELITE WIFI7 and ASRock's B850M Pro RS
 * WiFi.
 *
 * `mainboard.ts` builds every one from one layout, ATX or micro-ATX, so these
 * are the X670E board's parts with each board's own socket, chipset, outline
 * and slot counts written in from its maker's documents. A part a board does
 * not have is left out (`absent`). Each id carries the board's prefix
 * (`z890socket`, `tomahawkchipset`) so nothing collides with the board the
 * machine is built on.
 */

type Variant = Exclude<BoardChoice, 'motherboard'>;
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
  /** Parts of the X670E board this one does not have. */
  absent?: string[];
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
  tomahawk: {
    source: 'msix870',
    accuracy:
      'Built on the same ATX layout as the X670E board, with MSI’s datasheet for the chipset, the three full-length slots and the four M.2 sockets, and its black armour with yellow trim after MSI’s product photograph. Component positions, routing and the rear I/O are representative, not a reproduction of this board.',
    root: {
      id: 'tomahawkboard',
      name: 'MSI MAG X870 TOMAHAWK WIFI',
      shortName: 'X870 Tomahawk',
      category: 'Board',
      parent: 'motherboard',
      level: 'tomahawk',
      open: 'tomahawk',
      description:
        'An ATX AM5 board from MSI on AMD’s X870 chipset, with three full-length expansion slots and four M.2 sockets.',
      purpose:
        'Carries a Ryzen processor, its DDR5 memory and its expansion, as the X670E board does, from a different maker.',
      quantity: '1 ATX board',
      specifications: {
        'Form factor': 'ATX · 305 × 244 mm',
        Socket: 'AMD AM5',
        Chipset: 'AMD X870',
        Memory: '4 DDR5 DIMM slots · up to 256 GB',
        Expansion: '1 × PCIe 5.0 ×16 · 1 × PCIe 4.0 ×16 · 1 × PCIe 3.0 ×16',
        'M.2': '2 × Gen5 ×4 · 1 × Gen4 ×4 · 1 × Gen4 ×2',
        SATA: '4 × 6 Gb/s',
        'Power stages': '14+2+1 × 80 A',
      },
      representationType: 'physical',
      sources: ['msix870', 'kitguru870', 'ryzen'],
      searchTerms: ['msi', 'mag', 'tomahawk', 'x870', 'am5', 'mainboard'],
    },
    // Every slot below the graphics card is full length.
    absent: ['pcie1'],
    patches: {
      moboboard: { specifications: { Outline: '305 × 244 mm (ATX)' } },
      socket: { sources: ['msix870', 'ryzen'] },
      chipset: {
        specifications: {
          Chipset: 'AMD X870',
          Role: 'Platform I/O hub',
          Cooling: 'Passive heatsink',
        },
      },
      pcie16: {
        name: 'PCIe ×16 slots',
        quantity: '3 modeled slots',
        specifications: {
          'From the processor': '1 × PCIe 5.0 ×16',
          'From the chipset': '1 × PCIe 4.0 ×16 at ×4 · 1 × PCIe 3.0 ×16 at ×1',
        },
        sources: ['msix870', 'kitguru870', 'pcie'],
      },
      m2slot: {
        quantity: '2 of 4 modeled',
        specifications: {
          'M.2_1': 'PCIe 5.0 ×4',
          'Board total': '2 × Gen5 ×4 · 1 × Gen4 ×4 · 1 × Gen4 ×2',
        },
      },
      cpuvrm: {
        specifications: {
          Phases: '14+2+1',
          'Power stages': '80 A smart power stages',
        },
        sources: ['kitguru870'],
      },
    },
  },
  aorus: {
    source: 'gbz890elite',
    accuracy:
      'Built on the same ATX layout as the X670E board, with the slots, sockets and connectors in GIGABYTE’s manual, the LGA 1851 socket of the Z890 board, and a gunmetal-and-silver finish in the maker’s style. Component positions, routing and the rear I/O are representative, not a reproduction of this board.',
    root: {
      id: 'aorusboard',
      name: 'GIGABYTE Z890 AORUS ELITE WIFI7',
      shortName: 'Z890 AORUS Elite',
      category: 'Board',
      parent: 'motherboard',
      level: 'aorus',
      open: 'aorus',
      description:
        'An ATX board from GIGABYTE for Intel’s Core Ultra (Series 2) processors, on the LGA 1851 socket and the Z890 chipset, with three full-length slots and four M.2 sockets.',
      purpose:
        'Carries an Intel processor, its memory and its expansion. An AM5 Ryzen does not fit this socket.',
      quantity: '1 ATX board',
      specifications: {
        'Form factor': 'ATX · 305 × 244 mm',
        Socket: 'Intel LGA 1851',
        Chipset: 'Intel Z890',
        Memory: '4 DDR5 DIMM sockets · up to 256 GB',
        Expansion: '1 × PCIe 5.0 ×16 · 2 × PCIe 4.0 ×16 at ×4',
        'M.2': '4 Socket 3 connectors',
        SATA: '4 × 6 Gb/s',
      },
      representationType: 'physical',
      sources: ['gbz890elite', 'corei9'],
      searchTerms: ['gigabyte', 'aorus', 'elite', 'z890', 'intel', 'lga 1851'],
    },
    absent: ['pcie1'],
    patches: {
      moboboard: { specifications: { Outline: '305 × 244 mm (ATX)' } },
      socket: {
        description:
          'An LGA 1851 land-grid array of spring contacts, under a hinged steel load plate that a lever presses down.',
        specifications: {
          Type: 'Intel LGA 1851, illustrative',
          Retention: 'Load plate and lever',
        },
        sources: ['gbz890elite', 'corei9'],
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
          Chipset: 'Intel Z890 Express',
          Role: 'Platform I/O hub',
          Cooling: 'Passive heatsink',
        },
      },
      pcie16: {
        name: 'PCIe ×16 slots',
        quantity: '3 modeled slots',
        specifications: {
          PCIEX16: 'PCIe 5.0 at ×16, from the processor',
          'PCIEX4_1, PCIEX4_2': 'PCIe 4.0 at ×4, from the chipset',
        },
        sources: ['gbz890elite', 'pcie'],
      },
      m2slot: {
        quantity: '2 of 4 modeled',
        specifications: {
          M2A_CPU: 'PCIe 5.0 ×4',
          M2B_CPU: 'PCIe 4.0 ×4',
          'M2Q_SB, M2M_SB': 'PCIe 4.0 ×4, from the chipset',
        },
      },
      eps8: { specifications: { Connectors: '2 × 8-pin ATX 12 V' } },
    },
  },
  b850m: {
    source: 'asrockb850m',
    accuracy:
      'Built on the micro-ATX layout of the B650M board, with ASRock’s manual for the chipset, the ×16 and ×4 slots and the three M.2 sockets, its large square chipset heatsink to the right where the manual draws it, and a silver finish in the maker’s style. ASRock gives the form factor, not the size; it is drawn at micro-ATX’s 244 × 244 mm. Component positions, routing and the rear I/O are representative.',
    root: {
      id: 'b850mboard',
      name: 'ASRock B850M Pro RS WiFi',
      shortName: 'B850M Pro RS',
      category: 'Board',
      parent: 'motherboard',
      level: 'b850m',
      open: 'b850m',
      description:
        'A micro-ATX AM5 board from ASRock on AMD’s B850 chipset: a PCIe 5.0 ×16 slot for the graphics card, one ×4 slot under it, and three M.2 sockets.',
      purpose:
        'Carries Ryzen 9000, 8000 and 7000 processors and DDR5 memory in a small outline, at the cost of expansion slots.',
      quantity: '1 micro-ATX board',
      specifications: {
        'Form factor': 'Micro-ATX',
        Socket: 'AMD AM5',
        Chipset: 'AMD B850',
        Memory: '4 DDR5 DIMM slots · up to 256 GB',
        Expansion: '1 × PCIe 5.0 ×16 · 1 × PCIe 4.0 ×4',
        'M.2': '1 × Gen5 ×4 · 2 × Gen4 ×4',
        SATA: '4 × 6 Gb/s',
      },
      representationType: 'physical',
      sources: ['asrockb850m', 'ryzen'],
      searchTerms: ['asrock', 'pro rs', 'b850m', 'b850', 'micro atx', 'am5'],
    },
    patches: {
      moboboard: {
        specifications: { Outline: 'Micro-ATX, drawn at 244 × 244 mm' },
      },
      socket: { sources: ['asrockb850m', 'ryzen'] },
      chipset: {
        specifications: {
          Chipset: 'AMD B850',
          Role: 'Platform I/O hub',
          Cooling: 'Passive heatsink',
        },
      },
      pcie16: {
        name: 'PCIe ×16 slot',
        quantity: '1 modeled slot',
        specifications: { PCIE1: 'PCIe 5.0 at ×16, from the processor' },
        sources: ['asrockb850m', 'pcie'],
      },
      // The single short slot is a ×4 one.
      pcie1: {
        name: 'PCIe ×4 slot',
        shortName: 'PCIe ×4',
        description:
          'A short four-lane slot under the graphics card, for a second drive on an adapter, a network card or a capture card.',
        quantity: '1 modeled slot',
        specifications: { PCIE2: 'PCIe 4.0 at ×4, from the processor' },
        sources: ['asrockb850m', 'pcie'],
      },
      m2slot: {
        quantity: '2 of 3 modeled',
        specifications: {
          M2_1: 'PCIe 5.0 ×4, from the processor',
          'M2_2, M2_3': 'PCIe 4.0 ×4',
        },
      },
    },
  },
};

/** One board's parts: the X670E board's, renamed and rewritten for it. */
function boardConcepts(variant: Variant): Concept[] {
  const f = facts[variant];
  const id = (name: string) => variant + name;
  return [
    concept({ ...f.root, physicalAccuracy: f.accuracy }),
    ...motherboardConcepts
      .filter((original) => !f.absent?.includes(original.id))
      .map((original) => {
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
            original.sources.map((s) =>
              s === 'mainboardmanual' ? f.source : s,
            ),
        });
      }),
  ];
}

export const z890Concepts = boardConcepts('z890');
export const b650mConcepts = boardConcepts('b650m');
export const tomahawkConcepts = boardConcepts('tomahawk');
export const aorusConcepts = boardConcepts('aorus');
export const b850mConcepts = boardConcepts('b850m');
