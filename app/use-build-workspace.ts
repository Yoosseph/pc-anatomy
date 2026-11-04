'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  pieceForSlot,
  slotForPiece,
  type BuildSlot,
  type DesktopBuild,
} from '@/lib/desktop-build';
import type { Selection } from '@/lib/explorer-state';
import type { Explorer } from './use-explorer';
import { useTowerBuild } from './use-tower-build';

/** How long a newly fitted part stays outlined in the tower. */
const OUTLINE_MS = 1600;

/**
 * What the build workspace adds to the explorer: the tower a frame behind the
 * chosen build, and the link between the parts list and the tower.
 *
 * A part chosen in the list is outlined where it went for a moment; left on,
 * the outline frames half the case for as long as the workspace is open. A
 * piece clicked in the tower stays pointed at, and brings its slot into view.
 */
export function useBuildWorkspace(explorer: Explorer) {
  const { state, point, unpoint, setBuildPart, closeBuild } = explorer;
  // The tower follows the chosen build a frame late, so a choice paints
  // before the rebuild it causes holds the main thread.
  const { tower, fitting } = useTowerBuild(state.build);
  const viewerState = useMemo(
    () => (tower === state.build ? state : { ...state, build: tower }),
    [state, tower],
  );
  // The slot whose piece was last pointed at.
  const [focus, setFocus] = useState<BuildSlot | null>(null);
  const outline = useRef(0);
  useEffect(() => () => clearTimeout(outline.current), []);

  /** Point at a piece clicked in the tower, and at its slot. */
  const pointAt = useCallback(
    (selection: Selection | null) => {
      clearTimeout(outline.current);
      point(selection);
      setFocus(selection ? slotForPiece(selection.concept) : null);
    },
    [point],
  );

  /** Fit a part, and outline it where it went for a moment. */
  const choosePart = useCallback(
    <S extends BuildSlot>(slot: S, part: DesktopBuild[S]) => {
      const piece = pieceForSlot(slot, { ...state.build, [slot]: part });
      clearTimeout(outline.current);
      setFocus(slot);
      setBuildPart(slot, part);
      outline.current = window.setTimeout(() => {
        unpoint(piece);
        setFocus((focused) => (focused === slot ? null : focused));
      }, OUTLINE_MS);
    },
    [setBuildPart, state.build, unpoint],
  );

  /** Back to the explorer, with nothing left pointed at. */
  const leave = useCallback(() => {
    clearTimeout(outline.current);
    setFocus(null);
    closeBuild();
  }, [closeBuild]);

  return { viewerState, fitting, focus, pointAt, choosePart, leave };
}
