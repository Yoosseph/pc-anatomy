import { byId } from './manifest.ts';
import {
  levelIds,
  levelPath,
  levels,
  systemRoot,
  type LevelId,
} from './levels.ts';
import type { Category } from './concept.ts';

/** Picker headings, in display order. Empty categories are not shown. */
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

/** Fallback for branches whose levels name no `comparisonCategory`. */
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
  // The nearest explicit category on the path wins, so a GPU's die and SM
  // stay in Graphics and a module's DRAM cell stays in Memory.
  const owner = levelPath(level)
    .reverse()
    .find((id) => levels[id].comparisonCategory);
  return owner
    ? levels[owner].comparisonCategory!
    : conceptCategories[byId[levels[level].concept].category];
}

function specId(label: string) {
  return (
    label
      .toLowerCase()
      // The DDR5 catalogue spells it the British way; both rows must align.
      .replace('organisation', 'organization')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '')
  );
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

export function comparisonCategoryLabel(id: ComparisonCategoryId) {
  return categoryDefinitions.find((category) => category.id === id)!.label;
}

/** Where an item lives, e.g. "Desktop PC / Motherboard / Ryzen 9 9950X". */
export function comparisonItemPath(item: ComparisonItem) {
  const ancestors = levelPath(item.level).slice(0, -1);
  return (
    ancestors.map((level) => levels[level].name).join(' / ') ||
    levels[item.system].name
  );
}

// ---------------------------------------------------------------------------
// Search and filtering

function searchableText(item: ComparisonItem) {
  return [
    item.name,
    item.shortName,
    item.note,
    item.kind,
    comparisonCategoryLabel(item.category),
    ...levelPath(item.level).map((level) => levels[level].name),
    ...byId[levels[item.level].concept].searchTerms,
    ...item.specs.flatMap((spec) => [spec.label, spec.value]),
  ]
    .join(' ')
    .toLowerCase();
}

const searchText = new Map(
  comparisonItems.map((item) => [item.level, searchableText(item)]),
);

export type ComparisonFilter = {
  category?: ComparisonCategoryId;
  system?: LevelId;
  query?: string;
};

/** Every filter narrows the result, and every search word must match. */
export function filterComparisonItems({
  category,
  system,
  query = '',
}: ComparisonFilter = {}) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return comparisonItems.filter(
    (item) =>
      (!category || item.category === category) &&
      (!system || item.system === systemRoot(system)) &&
      terms.every((term) => searchText.get(item.level)!.includes(term)),
  );
}

// ---------------------------------------------------------------------------
// Pair questions

/** Like parts share one specification table; unlike parts get one card each. */
export function sharesSpecTable(left: LevelId, right: LevelId) {
  const a = comparisonItem(left),
    b = comparisonItem(right);
  return a.category === b.category && a.kind === b.kind;
}

export type ComparisonRow = {
  id: string;
  label: string;
  left: string | null;
  right: string | null;
};

/** Align matching field names, never row positions or unrelated CPU/GPU fields. */
export function comparisonRows(left: LevelId, right: LevelId): ComparisonRow[] {
  const rows = new Map<string, ComparisonRow>();
  const addSide = (side: 'left' | 'right', item: ComparisonItem) => {
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
  };
  addSide('left', comparisonItem(left));
  addSide('right', comparisonItem(right));
  return [...rows.values()];
}

/** True size needs an authored millimetre scale on both sides. */
export function canComparePhysicalScale(left: LevelId, right: LevelId) {
  // Validation below guarantees any declared scale is finite and positive.
  return (
    comparisonItem(left).millimetersPerUnit !== null &&
    comparisonItem(right).millimetersPerUnit !== null
  );
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
