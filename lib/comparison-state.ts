import { byId, manifest } from './manifest.ts';
import { levels, type LevelId } from './levels.ts';

export const gpuComparisonLevels = ['card', 'rx9070', 'arcb580'] as const;
export type GpuComparisonLevel = (typeof gpuComparisonLevels)[number];
export type ComparisonSide = 'left' | 'right';

export type ComparisonState = {
  left: GpuComparisonLevel;
  right: GpuComparisonLevel;
  activeSide: ComparisonSide;
  explode: number;
  playing: boolean;
  specsOpen: boolean;
};

export const initialComparisonState: ComparisonState = {
  left: 'card',
  right: 'rx9070',
  activeSide: 'left',
  explode: 0,
  playing: false,
  specsOpen: false,
};

export function selectComparisonGpu(
  state: ComparisonState,
  side: ComparisonSide,
  level: GpuComparisonLevel,
): ComparisonState {
  const other = side === 'left' ? state.right : state.left;
  if (level === other) return state;
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
  return {
    ...state,
    explode: Math.min(100, Math.max(0, explode)),
    playing: false,
  };
}

export function setComparisonPlaying(
  state: ComparisonState,
  playing: boolean,
): ComparisonState {
  return { ...state, playing };
}

export function setComparisonSpecsOpen(
  state: ComparisonState,
  specsOpen: boolean,
): ComparisonState {
  return { ...state, specsOpen };
}

export type ComparisonSpecId =
  | 'architecture'
  | 'gpu'
  | 'memory'
  | 'boardPower'
  | 'interface'
  | 'dimensions'
  | 'exterior';

export type ComparisonSpec = {
  id: ComparisonSpecId;
  label: string;
  value: string;
};

export type ComparisonCard = {
  level: GpuComparisonLevel;
  name: string;
  shortName: string;
  note: string;
  specs: ComparisonSpec[];
};

const rows: readonly {
  id: ComparisonSpecId;
  label: string;
  keys: readonly string[];
}[] = [
  { id: 'architecture', label: 'Architecture', keys: ['Architecture'] },
  { id: 'gpu', label: 'GPU', keys: ['GPU'] },
  { id: 'memory', label: 'Memory', keys: ['Memory'] },
  {
    id: 'boardPower',
    label: 'Board power',
    keys: ['Total board power', 'Graphics power'],
  },
  { id: 'interface', label: 'Interface', keys: ['Interface'] },
  { id: 'dimensions', label: 'Dimensions', keys: ['Dimensions'] },
  {
    id: 'exterior',
    label: 'Exterior / reference design',
    keys: ['Exterior reference'],
  },
];

function specificationValue(
  level: GpuComparisonLevel,
  row: ComparisonSpecId,
  keys: readonly string[],
) {
  const root = byId[levels[level].concept];
  for (const key of keys) {
    const rootValue = root.specifications[key];
    if (rootValue) return rootValue;
    const childValue = manifest.find(
      (concept) =>
        concept.level === level &&
        concept.specifications[key] &&
        (row !== 'interface' ||
          (concept.category === 'Board' && /PCIe/i.test(concept.name))),
    )?.specifications[key];
    if (childValue) return childValue;
  }
  return null;
}

export function comparisonCard(level: GpuComparisonLevel): ComparisonCard {
  const definition = levels[level];
  const root = byId[definition.concept];
  if (
    definition.kind !== 'physical' ||
    definition.branchLabel !== 'GPU' ||
    !root ||
    root.open !== level
  )
    throw new Error(`Comparison level "${level}" is not a physical GPU root`);

  const specs = rows.map(({ id, label, keys }) => {
    const value =
      specificationValue(level, id, keys) ??
      (id === 'exterior' ? root.name : null);
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
    note: definition.submenuNote ?? '',
    specs,
  };
}

export function validateComparisonCatalogue() {
  const physicalGpuRoots = (Object.keys(levels) as LevelId[]).filter(
    (level) =>
      levels[level].kind === 'physical' &&
      levels[level].branchLabel === 'GPU' &&
      byId[levels[level].concept]?.open === level,
  );
  if (
    physicalGpuRoots.length !== gpuComparisonLevels.length ||
    physicalGpuRoots.some(
      (level) => !gpuComparisonLevels.includes(level as GpuComparisonLevel),
    )
  )
    throw new Error(
      'The physical GPU catalogue changed; comparison support needs an explicit update',
    );
  gpuComparisonLevels.forEach(comparisonCard);
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
