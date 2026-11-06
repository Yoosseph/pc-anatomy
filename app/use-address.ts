'use client';
import { useEffect, useRef } from 'react';
import type { ExplorerState } from '@/lib/explorer-state';
import {
  placeTitle,
  placeToSearch,
  searchToPlace,
  type Place,
} from '@/lib/deep-link';

/** How long the slider has to rest before its position is written down. */
const SETTLE_MS = 250;

/**
 * Keeps the address bar on the place being shown, and the place on the
 * address bar when the back button moves it.
 *
 * Changing scale is a step you can take back, so it pushes a history entry,
 * and so does opening or leaving the build workspace. Selecting a part,
 * moving the slider or swapping a part in the build refines where you already
 * are, so it replaces the current entry instead; otherwise backing out of a
 * scale would first replay every part you had clicked on it. Part choices
 * are written immediately so Back/Forward keeps the chosen build. Slider
 * updates settle first, because playback changes the position every frame
 * and browsers throttle pages that rewrite history that often.
 *
 * A dive in flight is not a place yet: the address follows once it lands.
 */
export function useAddress(state: ExplorerState, goTo: (place: Place) => void) {
  const writtenLevel = useRef(state.level),
    writtenWorkspace = useRef(state.workspace),
    writtenBuild = useRef(state.build);
  const pending = useRef<{
    url: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const { level, selection, explode, diveInto, build, workspace } = state;

  useEffect(() => {
    if (diveInto) return;
    const buildChanged = build !== writtenBuild.current;
    writtenBuild.current = build;
    const place: Place = {
      level,
      selection,
      explode,
      build,
      ...(workspace === 'build' && { workspace }),
    };
    const search = placeToSearch(place);
    document.title = placeTitle(place);
    const url = location.pathname + search + location.hash;
    setCanonical(location.origin + location.pathname + search);
    if (search === location.search) {
      pending.current = null;
      return;
    }
    if (
      level !== writtenLevel.current ||
      workspace !== writtenWorkspace.current
    ) {
      // Keep the place being left current before creating the next entry.
      // Otherwise a quick part choice followed by navigation is lost on Back.
      if (pending.current) history.replaceState(null, '', pending.current.url);
      pending.current = null;
      writtenLevel.current = level;
      writtenWorkspace.current = workspace;
      history.pushState(null, '', url);
      return;
    }
    if (buildChanged) {
      pending.current = null;
      history.replaceState(null, '', url);
      return;
    }
    const settle = setTimeout(() => {
      history.replaceState(null, '', url);
      pending.current = null;
    }, SETTLE_MS);
    pending.current = { url, timer: settle };
    return () => clearTimeout(settle);
  }, [level, selection, explode, diveInto, build, workspace]);

  useEffect(() => {
    const back = () => {
      // The browser has already switched entries. A pending write belongs
      // to the entry we left, never the one Back or Forward just selected.
      if (pending.current) clearTimeout(pending.current.timer);
      pending.current = null;
      const place = searchToPlace(location.search);
      writtenLevel.current = place.level;
      writtenWorkspace.current = place.workspace ?? 'explorer';
      goTo(place);
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [goTo]);
}

/**
 * Search engines read the canonical link to decide which address a page is.
 * `index.html` names the bare site, which would fold every place back into
 * the home page, so it follows the place too.
 */
function setCanonical(href: string) {
  const link = document.querySelector<HTMLLinkElement>('link[rel=canonical]');
  if (link && link.href !== href) link.href = href;
}
