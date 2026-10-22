import { byId } from './manifest.ts';
import {
  levelIds,
  levelPath,
  levels,
  systemRoot,
  type LevelId,
} from './levels.ts';
import type { Category } from './concept.ts';

const categoryDefinitions = [
  { id: 'systems', label: 'Complete systems' },
  { id: 'boards', label: 'Boards' },
  { id: 'processors', label: 'Processors' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'memory', label: 'Memory' },
  { id: 'storage', label: 'Storage' },
  { id: 'cooling', label: 'Cooling' },
  { id: 'power', label: 'Power & batteries' },
  { id: 'displays', label: 'Displays' },
  { id: 'chassis', label: 'Chassis' },
] as const;

export type ComparisonCategoryId = (typeof categoryDefinitions)[number]['id'];
export type ComparisonSpec = { id: string; label: string; value: string };
export type ComparisonItem = {
  level: LevelId;
  name: string;
  shortName: string;
  note: string;
  category: ComparisonCategoryId;
  system: LevelId;
  kind: 'physical' | 'logical';
  specs: ComparisonSpec[];
  /** Null for diagrams, exaggerated axes or undocumented geometry units. */
  millimetersPerUnit: number | null;
};

const conceptCategories: Record<Category, ComparisonCategoryId> = {
  Chassis: 'chassis',
  Board: 'boards',
  Compute: 'processors',
  Graphics: 'graphics',
  Memory: 'memory',
  Storage: 'storage',
  Cooling: 'cooling',
  Power: 'power',
};

function itemCategory(level: LevelId): ComparisonCategoryId {
  if (levels[level].parent === null) return 'systems';
  // An explicit subsystem category propagates through its deeper scales.
  // New unclassified branches still appear using their concept's category.
  const owner = levelPath(level)
    .reverse()
    .find((id) => levels[id].comparisonCategory);
  return owner
    ? levels[owner].comparisonCategory!
    : conceptCategories[byId[levels[level].concept].category];
}

function specId(label: string) {
  return label
    .toLowerCase()
    .replace('organisation', 'organization')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

function catalogueItem(level: LevelId): ComparisonItem {
  const definition = levels[level];
  const root = byId[definition.concept];
  if (!root || root.open !== level)
    throw new Error(
      `Comparison level "${level}" needs a concept that opens it`,
    );
  return {
    level,
    name: root.name,
    shortName: root.shortName,
    note: definition.summary,
    category: itemCategory(level),
    system: systemRoot(level),
    kind: definition.kind,
    // Never search arbitrary descendants for a missing field: a fan's power,
    // a chip's dimensions or a child's core count do not describe the parent.
    specs: Object.entries(root.specifications)
      .filter(([, value]) => value.trim())
      .map(([label, value]) => ({ id: specId(label), label, value })),
    millimetersPerUnit:
      definition.kind === 'physical'
        ? (definition.millimetersPerUnit ?? null)
        : null,
  };
}

export const comparisonItems = levelIds.map(catalogueItem);
const itemsByLevel = new Map(comparisonItems.map((item) => [item.level, item]));
export const comparisonCategories = categoryDefinitions.filter((category) =>
  comparisonItems.some((item) => item.category === category.id),
);

export function comparisonItem(level: LevelId): ComparisonItem {
  const item = itemsByLevel.get(level);
  if (!item) throw new Error(`Unknown comparison level "${level}"`);
  return item;
}

const searchText = new Map(
  comparisonItems.map((item) => {
    const root = byId[levels[item.level].concept];
    return [
      item.level,
      [
        item.name,
        item.shortName,
        item.note,
        item.kind,
        categoryDefinitions.find((category) => category.id === item.category)!
          .label,
        ...levelPath(item.level).map((level) => levels[level].name),
        ...root.searchTerms,
        ...item.specs.flatMap((spec) => [spec.label, spec.value]),
      ]
        .join(' ')
        .toLowerCase(),
    ];
  }),
);

export function filterComparisonItems({
  category,
  system,
  query = '',
}: {
  category?: ComparisonCategoryId;
  system?: LevelId;
  query?: string;
} = {}) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return comparisonItems.filter(
    (item) =>
      (!category || item.category === category) &&
      (!system || item.system === systemRoot(system)) &&
      terms.every((term) => searchText.get(item.level)!.includes(term)),
  );
}

export type ComparisonRow = {
  id: string;
  label: string;
  left: string | null;
  right: string | null;
};

/** Align matching field names, never row positions or unrelated CPU/GPU fields. */
export function comparisonRows(left: LevelId, right: LevelId): ComparisonRow[] {
  const a = comparisonItem(left),
    b = comparisonItem(right);
  const rows = new Map<string, ComparisonRow>();
  for (const [side, item] of [
    ['left', a],
    ['right', b],
  ] as const)
    for (const spec of item.specs) {
      const id = `${item.category}:${spec.id}`;
      const row = rows.get(id) ?? {
        id,
        label: spec.label,
        left: null,
        right: null,
      };
      row[side] = spec.value;
      rows.set(id, row);
    }
  return [...rows.values()];
}

export function canComparePhysicalScale(left: LevelId, right: LevelId) {
  return [left, right].every((level) => {
    const units = comparisonItem(level).millimetersPerUnit;
    return units !== null && Number.isFinite(units) && units > 0;
  });
}

export function validateComparisonCatalogue() {
  for (const item of comparisonItems) {
    const units = item.millimetersPerUnit;
    if (units !== null && (!Number.isFinite(units) || units <= 0))
      throw new Error(`Invalid physical units for "${item.level}"`);
    if (!categoryDefinitions.some((category) => category.id === item.category))
      throw new Error(`Unknown comparison category for "${item.level}"`);
    if (new Set(item.specs.map((spec) => spec.id)).size !== item.specs.length)
      throw new Error(`Duplicate comparison fields for "${item.level}"`);
  }
}

validateComparisonCatalogue();
