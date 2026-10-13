import { isLevelRoot, manifest } from '../lib/manifest.ts';
import { levelIds } from '../lib/levels.ts';
import { placeToSearch } from '../lib/deep-link.ts';

export const SITE = 'https://pc-anatomy.com/';

/**
 * Every address worth a search result: the site, the guide, each scale, and
 * each part on the scale where it is described. Built from the same catalogue
 * and the same link format the explorer uses, so a listed address always
 * opens on what it names.
 */
export function sitemapUrls(): string[] {
  const places = [
    ...levelIds.map((level) => ({ level, selection: null, explode: 0 })),
    ...manifest
      .filter((c) => !isLevelRoot(c))
      .map((c) => ({
        level: c.level,
        selection: { concept: c.id },
        explode: 0,
      })),
  ];
  return [
    ...new Set([
      SITE,
      SITE + 'guide/',
      ...places.map((place) => SITE + placeToSearch(place)),
    ]),
  ];
}
