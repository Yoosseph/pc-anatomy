import { byId, isLevelRoot } from './manifest.ts';
import { isPhysical, levels, rootLevel, type LevelId } from './levels.ts';
import type { Selection } from './explorer-state.ts';

/**
 * Where you are, written into the address bar.
 *
 * Navigation lives in explorer state, so until this the address was always
 * the bare site: a link to the RTX 5090's streaming multiprocessor arrived on
 * the assembled tower, and the back button left the site rather than climbing
 * a scale. A place is the three things that decide what is on screen and are
 * worth sharing: the scale, the part described, and how far apart the
 * hardware is. Camera angle, hidden parts and the airflow preference are
 * deliberately left out; they are how one person is looking, not where.
 *
 * Query parameters rather than paths, so every place is served by the same
 * `index.html` with no rewrite rules, and rather than a hash, so search
 * engines treat each place as its own page:
 *
 *   /?scale=sm                      the SM diagram
 *   /?scale=motherboard&part=vrm    the board with its VRM described
 *   /?scale=pc&open=48              the tower half taken apart
 *   /?scale=pc&part=fan&n=3         the third of several identical fans
 *
 * Anything unknown or contradictory is dropped rather than guessed at: a link
 * that names a part on the wrong scale opens the scale without it, and a link
 * to a scale that no longer exists opens the machine.
 */

export type Place = {
  level: LevelId;
  selection: Selection | null;
  explode: number;
};

export const homePlace: Place = {
  level: rootLevel,
  selection: null,
  explode: 0,
};

/** Whether a part can be described while this scale is on screen. */
function belongsTo(concept: string, level: LevelId) {
  const c = byId[concept];
  if (!c) return false;
  // Arriving on a scale describes the thing you opened, which lives one scale
  // up; that is the one concept from elsewhere a place may name.
  if (concept === levels[level].concept) return true;
  return c.level === level && !isLevelRoot(c);
}

export function placeToSearch(place: Place): string {
  const params = new URLSearchParams();
  const atHome =
    place.level === rootLevel && !place.selection && place.explode === 0;
  if (atHome) return '';
  params.set('scale', place.level);
  if (place.selection && belongsTo(place.selection.concept, place.level)) {
    params.set('part', place.selection.concept);
    // Instances count from one in a link, the way the hover label numbers them.
    if (place.selection.instance)
      params.set('n', String(place.selection.instance + 1));
  }
  const explode = Math.round(place.explode);
  if (explode > 0 && isPhysical(place.level))
    params.set('open', String(Math.min(100, explode)));
  return '?' + params.toString();
}

export function searchToPlace(search: string): Place {
  const params = new URLSearchParams(search);
  const scale = params.get('scale');
  if (!scale || !Object.prototype.hasOwnProperty.call(levels, scale))
    return homePlace;
  const level = scale as LevelId;

  const part = params.get('part');
  const n = Number(params.get('n') ?? '1');
  const instance = Number.isInteger(n) && n >= 1 && n <= 999 ? n - 1 : 0;
  const selection =
    part && belongsTo(part, level)
      ? instance
        ? { concept: part, instance }
        : { concept: part }
      : null;

  const open = Number(params.get('open') ?? '0');
  const explode =
    isPhysical(level) && Number.isFinite(open)
      ? Math.max(0, Math.min(100, Math.round(open)))
      : 0;

  return { level, selection, explode };
}

/** The page title for a place: the part when one is described, else the scale. */
export function placeTitle(place: Place): string {
  if (place.level === rootLevel && !place.selection) return 'PC Anatomy';
  const name = place.selection
    ? byId[place.selection.concept]?.name
    : levels[place.level].name;
  return name ? `${name} · PC Anatomy` : 'PC Anatomy';
}

/** Same place, ignoring how a selection reached it. */
export function samePlace(a: Place, b: Place) {
  return placeToSearch(a) === placeToSearch(b);
}
