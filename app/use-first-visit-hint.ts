'use client';
import { useEffect, useRef, useState } from 'react';
import type { ExplorerState } from '@/lib/explorer-state';

const seenKey = 'pc-anatomy-first-visit-hint-v1';

type Spot = Pick<ExplorerState, 'level' | 'selection' | 'explode'>;

/**
 * One line telling a first-time visitor what the machine does when touched.
 *
 * The only place that said so was the hover label, which nobody sees until
 * they have already found out, and on a phone never. It shows once per
 * browser, shortly after the first frame, and goes away for good the moment
 * the visitor does any of the things it describes: picks a part, moves the
 * slider, changes scale, or closes it. Storage is a convenience; without it
 * the hint simply shows again next visit.
 */
export function useFirstVisitHint(state: ExplorerState, ready: boolean) {
  // Where the visitor was when the hint appeared; `null` while it is not up.
  const [shownAt, setShownAt] = useState<Spot | null>(null);
  const latest = useRef<Spot>(state);
  useEffect(() => {
    latest.current = state;
  });

  useEffect(() => {
    if (!ready) return;
    try {
      if (localStorage.getItem(seenKey)) return;
    } catch {
      /* Storage blocked: show it anyway. */
    }
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(seenKey, '1');
      } catch {
        /* Optional persistence. */
      }
      const { level, selection, explode } = latest.current;
      setShownAt({ level, selection, explode });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [ready]);

  const moved =
    !!shownAt &&
    (state.level !== shownAt.level ||
      state.selection !== shownAt.selection ||
      state.explode !== shownAt.explode);

  // Once gone it stays gone, even if the visitor wanders back to where they
  // started. Adjusting state while rendering, as React documents for state
  // derived from props, rather than a frame later in an effect.
  if (moved) setShownAt(null);

  return {
    hint: !!shownAt && !moved,
    dismissHint: () => setShownAt(null),
  };
}
