import { byId, manifest } from './manifest.ts';
import { levelIds, levels, type LevelId } from './levels.ts';
import type { Category } from './concept.ts';

export type ComparisonLevel = LevelId;
export type ComparisonSide = 'left' | 'right';

type ComparisonRowDefinition = {
  id: string;
  label: string;
  keys: readonly string[];
  fallback?: 'name';
  category?: Category;
};

export type ComparisonGroupDefinition = {
  label: string;
  shortLabel: string;
  itemLabel: string;
  rows: readonly ComparisonRowDefinition[];
};

export const comparisonGroups = {
  gpu: {
    label: 'Graphics cards',
    shortLabel: 'GPU',
    itemLabel: 'graphics card',
    rows: [
      { id: 'architecture', label: 'Architecture', keys: ['Architecture'] },
      { id: 'gpu', label: 'GPU', keys: ['GPU'] },
      { id: 'memory', label: 'Memory', keys: ['Memory'] },
      {
        id: 'boardPower',
        label: 'Board power',
        keys: ['Total board power', 'Graphics power'],
      },
      {
        id: 'interface',
        label: 'Interface',
        keys: ['Interface'],
        category: 'Board',
      },
      { id: 'dimensions', label: 'Dimensions', keys: ['Dimensions'] },
      {
        id: 'exterior',
        label: 'Exterior / reference design',
        keys: ['Exterior reference'],
        fallback: 'name',
      },
    ],
  },
  psu: {
    label: 'Power supplies',
    shortLabel: 'PSU',
    itemLabel: 'power supply',
    rows: [
      { id: 'format', label: 'Format', keys: ['Format'] },
      { id: 'output', label: 'Output', keys: ['Output'] },
      { id: 'efficiency', label: 'Efficiency', keys: ['Efficiency'] },
      { id: 'cabling', label: 'Cabling', keys: ['Cabling'] },
      { id: 'dimensions', label: 'Dimensions', keys: ['Dimensions'] },
    ],
  },
  cpu: {
    label: 'Processors',
    shortLabel: 'CPU',
    itemLabel: 'processor',
    rows: [
      { id: 'architecture', label: 'Architecture', keys: ['Architecture'] },
      { id: 'cores', label: 'Cores / threads', keys: ['Cores'] },
      { id: 'clocks', label: 'Clocks', keys: ['Clocks'] },
      { id: 'cache', label: 'Cache', keys: ['Cache'] },
      { id: 'process', label: 'Process', keys: ['Process'] },
      { id: 'socket', label: 'Socket', keys: ['Socket'] },
      {
        id: 'power',
        label: 'Power',
        keys: ['Power', 'Default TDP'],
      },
    ],
  },
  storage: {
    label: 'Storage',
    shortLabel: 'storage',
    itemLabel: 'storage device',
    rows: [
      { id: 'architecture', label: 'Architecture', keys: ['Architecture'] },
      { id: 'protocol', label: 'Protocol', keys: ['Protocol'] },
      { id: 'interface', label: 'Interface', keys: ['Interface'] },
      { id: 'format', label: 'Format', keys: ['Format'] },
      { id: 'dimensions', label: 'Dimensions', keys: ['Dimensions'] },
    ],
  },
} as const satisfies Record<string, ComparisonGroupDefinition>;

export type ComparisonGroupId = keyof typeof comparisonGroups;
export type ComparisonSpecId =
  (typeof comparisonGroups)[ComparisonGroupId]['rows'][number]['id'];
const configuredComparisonGroupIds = Object.keys(
  comparisonGroups,
) as ComparisonGroupId[];

export type ComparisonState = {
  group: ComparisonGroupId;
  left: ComparisonLevel;
  right: ComparisonLevel;
  activeSide: ComparisonSide;
  explode: number;
  specsOpen: boolean;
};

export type ComparisonViewState = Omit<ComparisonState, 'specsOpen'>;

export function comparisonLevels(group: ComparisonGroupId) {
  return levelIds.filter((level) => levels[level].comparisonGroup === group);
}

/** Configured categories become visible as soon as they have a valid pair. */
export const comparisonGroupIds = configuredComparisonGroupIds.filter(
  (group) => comparisonLevels(group).length >= 2,
);

function defaultComparisonPair(
  group: ComparisonGroupId,
): readonly [ComparisonLevel, ComparisonLevel] {
  const [left, right] = comparisonLevels(group);
  if (!left || !right)
    throw new Error(`Comparison group "${group}" needs at least two models`);
  return [left, right];
}

const initialComparisonGroup = comparisonGroupIds[0];
if (!initialComparisonGroup)
  throw new Error('Comparison mode needs at least one eligible category');
const [initialLeft, initialRight] = defaultComparisonPair(
  initialComparisonGroup,
);

export const initialComparisonState: ComparisonState = {
  group: initialComparisonGroup,
  left: initialLeft,
  right: initialRight,
  activeSide: 'left',
  explode: 0,
  specsOpen: false,
};

export function selectComparisonGroup(
  state: ComparisonState,
  group: ComparisonGroupId,
): ComparisonState {
  if (group === state.group) return state;
  const [left, right] = defaultComparisonPair(group);
  return {
    ...state,
    group,
    left,
    right,
    activeSide: 'left',
    explode: 0,
    specsOpen: false,
  };
}

export function selectComparisonItem(
  state: ComparisonState,
  side: ComparisonSide,
  level: ComparisonLevel,
): ComparisonState {
  const other = side === 'left' ? state.right : state.left;
  if (level === other || levels[level].comparisonGroup !== state.group)
    return state;
  return { ...state, [side]: level };
}

export const swapComparisonSides = (
  state: ComparisonState,
): ComparisonState => ({ ...state, left: state.right, right: state.left });

export const setComparisonActiveSide = (
  state: ComparisonState,
  activeSide: ComparisonSide,
): ComparisonState => ({ ...state, activeSide });

export const setComparisonExplode = (
  state: ComparisonState,
  explode: number,
): ComparisonState => ({
  ...state,
  explode: Math.min(100, Math.max(0, explode)),
});

export const setComparisonSpecsOpen = (
  state: ComparisonState,
  specsOpen: boolean,
): ComparisonState => ({ ...state, specsOpen });

export type ComparisonSpec = {
  id: ComparisonSpecId;
  label: string;
  value: string;
};

export type ComparisonItem = {
  level: ComparisonLevel;
  name: string;
  shortName: string;
  note: string;
  specs: ComparisonSpec[];
};

function specificationValue(
  level: ComparisonLevel,
  conceptId: string,
  keys: readonly string[],
  category?: Category,
) {
  const root = byId[conceptId];
  for (const key of keys) {
    const rootValue = root.specifications[key];
    if (rootValue) return rootValue;
    const childValue = manifest.find(
      (concept) =>
        concept.level === level &&
        (!category || concept.category === category) &&
        concept.specifications[key],
    )?.specifications[key];
    if (childValue) return childValue;
  }
  return null;
}

function comparisonRoot(level: ComparisonLevel) {
  const root = byId[levels[level].concept];
  if (!root || root.open !== level)
    throw new Error(
      `Comparison level "${level}" needs a catalogue concept that opens it`,
    );
  return root;
}

export function comparisonItem(
  group: ComparisonGroupId,
  level: ComparisonLevel,
): ComparisonItem {
  if (levels[level].comparisonGroup !== group)
    throw new Error(
      `Comparison level "${level}" does not belong to "${group}"`,
    );
  const definition = levels[level];
  const root = comparisonRoot(level);
  const specs = comparisonGroups[group].rows.map((entry) => {
    const { id, label, keys, fallback, category } = entry as typeof entry &
      ComparisonRowDefinition;
    const value =
      specificationValue(level, root.id, keys, category) ??
      (fallback === 'name' ? root.name : null);
    if (!value)
      throw new Error(
        `Comparison level "${level}" has no value for "${label}"`,
      );
    return { id, label, value };
  });

  return {
    level,
    name: root.name,
    shortName: root.shortName,
    note: definition.caption,
    specs,
  };
}

export function validateComparisonCatalogue() {
  for (const level of levelIds) {
    const group = levels[level].comparisonGroup;
    if (group && !(group in comparisonGroups))
      throw new Error(
        `Comparison level "${level}" names unknown group "${group}"`,
      );
  }
  for (const groupId of configuredComparisonGroupIds) {
    const groupLevels = comparisonLevels(groupId);
    if (groupLevels.length < 2) continue;
    const kinds = new Set(groupLevels.map((level) => levels[level].kind));
    if (kinds.size !== 1)
      throw new Error(
        `Comparison group "${groupId}" mixes physical and logical models`,
      );
    for (const level of groupLevels) {
      comparisonItem(groupId, level);
    }
  }
}

export type PanePoint = {
  side: ComparisonSide;
  x: number;
  y: number;
};

/** Convert a CSS-pixel pointer into normalized coordinates for its pane. */
export function comparisonPanePoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  split: boolean,
  activeSide: ComparisonSide,
): PanePoint {
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const side = split
    ? localX < rect.width / 2
      ? 'left'
      : 'right'
    : activeSide;
  const paneWidth = split ? rect.width / 2 : rect.width;
  const paneX = split && side === 'right' ? localX - paneWidth : localX;
  return {
    side,
    x: (paneX / paneWidth) * 2 - 1,
    y: -(localY / rect.height) * 2 + 1,
  };
}

validateComparisonCatalogue();
