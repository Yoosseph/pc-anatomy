import { byId, manifest } from './manifest.ts';
import { levels, type LevelId } from './levels.ts';
import type { Category } from './concept.ts';

export const comparisonGroupIds = ['gpu', 'psu', 'cpu'] as const;
export type ComparisonGroupId = (typeof comparisonGroupIds)[number];
export type ComparisonLevel =
  | 'card'
  | 'rx9070'
  | 'arcb580'
  | 'psu'
  | 'psubronze'
  | 'ryzen'
  | 'corei9';
export type ComparisonSide = 'left' | 'right';

export type ComparisonSpecId =
  | 'architecture'
  | 'gpu'
  | 'memory'
  | 'boardPower'
  | 'interface'
  | 'dimensions'
  | 'exterior'
  | 'format'
  | 'output'
  | 'efficiency'
  | 'cabling'
  | 'cores'
  | 'clocks'
  | 'cache'
  | 'process'
  | 'socket'
  | 'power';

type ComparisonRowDefinition = {
  id: ComparisonSpecId;
  label: string;
  keys: readonly string[];
  fallback?: 'name';
  category?: Category;
};

type ComparisonOptionDefinition = {
  level: ComparisonLevel;
  concept: string;
};

export type ComparisonGroupDefinition = {
  label: string;
  shortLabel: string;
  itemLabel: string;
  options: readonly ComparisonOptionDefinition[];
  rows: readonly ComparisonRowDefinition[];
};

export const comparisonGroups: Record<
  ComparisonGroupId,
  ComparisonGroupDefinition
> = {
  gpu: {
    label: 'Graphics cards',
    shortLabel: 'GPU',
    itemLabel: 'graphics card',
    options: [
      { level: 'card', concept: 'card' },
      { level: 'rx9070', concept: 'rxcard' },
      { level: 'arcb580', concept: 'arccard' },
    ],
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
    options: [
      { level: 'psu', concept: 'psucase' },
      { level: 'psubronze', concept: 'bronzepsucase' },
    ],
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
    options: [
      { level: 'ryzen', concept: 'ryzenpackage' },
      { level: 'corei9', concept: 'corepackage' },
    ],
    rows: [
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
};

export type ComparisonState = {
  group: ComparisonGroupId;
  left: ComparisonLevel;
  right: ComparisonLevel;
  activeSide: ComparisonSide;
  explode: number;
  specsOpen: boolean;
};

export type ComparisonViewState = Omit<ComparisonState, 'specsOpen'>;

export const initialComparisonState: ComparisonState = {
  group: 'gpu',
  left: 'card',
  right: 'rx9070',
  activeSide: 'left',
  explode: 0,
  specsOpen: false,
};

export function comparisonLevels(group: ComparisonGroupId) {
  return comparisonGroups[group].options.map(({ level }) => level);
}

function optionFor(group: ComparisonGroupId, level: ComparisonLevel) {
  return comparisonGroups[group].options.find(
    (option) => option.level === level,
  );
}

export function selectComparisonGroup(
  state: ComparisonState,
  group: ComparisonGroupId,
): ComparisonState {
  if (group === state.group) return state;
  const [left, right] = comparisonLevels(group);
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
  if (level === other || !optionFor(state.group, level)) return state;
  return { ...state, [side]: level };
}

export function swapComparisonSides(state: ComparisonState): ComparisonState {
  return { ...state, left: state.right, right: state.left };
}

export function setComparisonActiveSide(
  state: ComparisonState,
  activeSide: ComparisonSide,
): ComparisonState {
  return { ...state, activeSide };
}

export function setComparisonExplode(
  state: ComparisonState,
  explode: number,
): ComparisonState {
  return { ...state, explode: Math.min(100, Math.max(0, explode)) };
}

export function setComparisonSpecsOpen(
  state: ComparisonState,
  specsOpen: boolean,
): ComparisonState {
  return { ...state, specsOpen };
}

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

export function comparisonItem(
  group: ComparisonGroupId,
  level: ComparisonLevel,
): ComparisonItem {
  const option = optionFor(group, level);
  if (!option)
    throw new Error(
      `Comparison level "${level}" does not belong to "${group}"`,
    );
  const definition = levels[level];
  const root = byId[option.concept];
  if (!root || root.level !== level || root.open !== level)
    throw new Error(`Comparison level "${level}" has no valid root concept`);

  const specs = comparisonGroups[group].rows.map(
    ({ id, label, keys, fallback, category }) => {
      const value =
        specificationValue(level, option.concept, keys, category) ??
        (fallback === 'name' ? root.name : null);
      if (!value)
        throw new Error(
          `Comparison level "${level}" has no value for "${label}"`,
        );
      return { id, label, value };
    },
  );

  return {
    level,
    name: root.name,
    shortName: root.shortName,
    note: definition.caption,
    specs,
  };
}

export function validateComparisonCatalogue() {
  const seen = new Set<LevelId>();
  for (const groupId of comparisonGroupIds) {
    const group = comparisonGroups[groupId];
    if (group.options.length < 2)
      throw new Error(
        `Comparison group "${groupId}" needs at least two models`,
      );
    const kinds = new Set(group.options.map(({ level }) => levels[level].kind));
    if (kinds.size !== 1)
      throw new Error(
        `Comparison group "${groupId}" mixes physical and logical models`,
      );
    for (const { level } of group.options) {
      if (seen.has(level))
        throw new Error(`Comparison level "${level}" belongs to two groups`);
      seen.add(level);
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
