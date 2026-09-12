import type { LevelId } from './levels.ts';
import type { SourceId } from './sources.ts';

/**
 * Systems a component can belong to. These drive the visibility toggles and
 * the colour a piece is tinted, so they are coarse on purpose: a viewer should
 * be able to hide "everything to do with power" in one click.
 */
export const categories = [
  'Chassis',
  'Cooling',
  'Board',
  'Power',
  'Memory',
  'Storage',
  'Compute',
  'Graphics',
] as const;
export type Category = (typeof categories)[number];

export const colors: Record<Category, string> = {
  Chassis: '#a39a91',
  Cooling: '#9caebd',
  Board: '#8faaa0',
  Power: '#dca369',
  Memory: '#64adbf',
  Storage: '#6cbfa4',
  Compute: '#709fcb',
  Graphics: '#b497cf',
};

export interface Concept {
  id: string;
  name: string;
  shortName: string;
  category: Category;
  parent: string | null;
  children: string[];
  description: string;
  purpose: string;
  quantity: string;
  specifications: Record<string, string>;
  representationType: 'physical' | 'logical';
  physicalAccuracy: string;
  sources: SourceId[];
  searchTerms: string[];
  /** The scale this concept is rendered at. */
  level: LevelId;
  /** Set when selecting this component can descend into a scale of its own. */
  open?: LevelId;
}

export const physical =
  'Illustrative geometry. Shape, placement and mechanical quantities are approximate; this is not a board layout or service model.';
export const logical =
  'Documented logical architecture. Block size and placement are illustrative; exact transistor-level placement is not publicly available.';
export const standard =
  'Modelled to published form-factor dimensions. Component selection, population and routing are representative of the category, not of a specific product.';

export type Entry = Omit<
  Concept,
  'children' | 'physicalAccuracy' | 'sources' | 'shortName' | 'searchTerms'
> &
  Partial<
    Pick<
      Concept,
      'children' | 'physicalAccuracy' | 'sources' | 'shortName' | 'searchTerms'
    >
  >;

export function concept(c: Entry): Concept {
  return {
    ...c,
    children: c.children ?? [],
    shortName: c.shortName ?? c.name,
    physicalAccuracy:
      c.physicalAccuracy ??
      (c.representationType === 'physical' ? physical : logical),
    sources: c.sources ?? [
      c.representationType === 'physical' ? 'specs' : 'whitepaper',
    ],
    searchTerms: c.searchTerms ?? [],
  };
}
