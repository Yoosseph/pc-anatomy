import { levels, type LevelId } from './levels.ts';
import {
  canComparePhysicalScale,
  comparisonItem,
  comparisonItems,
} from './comparison-catalogue.ts';
export * from './comparison-catalogue.ts';

export type ComparisonLevel = LevelId;
export type ComparisonSide = 'left' | 'right';
export type ComparisonFraming = 'fit' | 'scale';
export type ComparisonState = {
  left: ComparisonLevel;
  right: ComparisonLevel;
  activeSide: ComparisonSide;
  explode: number;
  specsOpen: boolean;
  framing: ComparisonFraming;
};
export type ComparisonViewState = Omit<ComparisonState, 'specsOpen'>;

export function createComparisonState(level?: LevelId): ComparisonState {
  const left = level ?? 'card';
  const item = comparisonItem(left);
  const candidates = comparisonItems.filter(
    (candidate) => candidate.level !== left,
  );
  const sameKind = candidates.filter(
    (candidate) =>
      candidate.category === item.category && candidate.kind === item.kind,
  );
  const right =
    level === undefined
      ? 'rx9070'
      : (
          sameKind.find((candidate) => candidate.system !== item.system) ??
          sameKind[0] ??
          candidates.find(
            (candidate) => candidate.category === item.category,
          ) ??
          candidates[0]
        ).level;
  return {
    left,
    right,
    activeSide: 'left',
    explode: 0,
    specsOpen: false,
    framing: 'fit',
  };
}

export const initialComparisonState = createComparisonState();

export function selectComparisonItem(
  state: ComparisonState,
  side: ComparisonSide,
  level: ComparisonLevel,
): ComparisonState {
  const other = side === 'left' ? state.right : state.left;
  if (!(level in levels) || level === other || state[side] === level)
    return state;
  return {
    ...state,
    [side]: level,
    framing:
      state.framing === 'scale' && !canComparePhysicalScale(level, other)
        ? 'fit'
        : state.framing,
  };
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
export const setComparisonFraming = (
  state: ComparisonState,
  framing: ComparisonFraming,
): ComparisonState =>
  framing === 'scale' && !canComparePhysicalScale(state.left, state.right)
    ? state
    : { ...state, framing };

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
