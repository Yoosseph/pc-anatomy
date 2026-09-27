import { coolerConcepts } from './concepts/cooler.ts';
import { liquidConcepts } from './concepts/liquid.ts';
import { processorConcepts } from './concepts/processors.ts';
import { ssdConcepts } from './concepts/ssd.ts';
import { nvmeConcepts } from './concepts/nvme.ts';
import { fanConcepts } from './concepts/fan.ts';
import { gpuConcepts } from './concepts/gpu.ts';
import { radeonConcepts } from './concepts/radeon.ts';
import { arcConcepts } from './concepts/arc.ts';
import { motherboardConcepts } from './concepts/motherboard.ts';
import { ramConcepts } from './concepts/ram.ts';
import { pcConcepts } from './concepts/pc.ts';
import { psuConcepts, bronzePsuConcepts } from './concepts/psu.ts';
import { categories, colors, type Category, type Concept } from './concept.ts';
import {
  isPhysical,
  levelNames,
  levelPath,
  levels,
  type LevelId,
} from './levels.ts';
import { sources } from './sources.ts';

export {
  categories,
  colors,
  sources,
  levelNames,
  levelPath,
  levels,
  isPhysical,
};
export type { Category, Concept, LevelId };
/** Older name for a scale id, kept so existing call sites keep compiling. */
export type Level = LevelId;

/**
 * One catalogue assembled from per-subsystem files.
 *
 * Order matters only for presentation: the machine comes first, then the board
 * inside it, then the graphics card branch.
 */
export const manifest: Concept[] = [
  ...pcConcepts,
  ...motherboardConcepts,
  ...ramConcepts,
  ...psuConcepts,
  ...bronzePsuConcepts,
  ...fanConcepts,
  ...coolerConcepts,
  ...liquidConcepts,
  ...processorConcepts,
  ...ssdConcepts,
  ...nvmeConcepts,
  ...gpuConcepts,
  ...radeonConcepts,
  ...arcConcepts,
];

export const byId = Object.fromEntries(
  manifest.map((c) => [c.id, c]),
) as Record<string, Concept>;

for (const c of manifest) {
  if (!c.parent) continue;
  const parent = byId[c.parent];
  if (!parent)
    throw new Error(
      `Concept "${c.id}" names a parent that does not exist: ${c.parent}`,
    );
  parent.children.push(c.id);
}

/**
 * A concept that *is* a scale rather than a part rendered inside one: the
 * machine, the card, the die. These have no piece of their own to highlight,
 * so selecting them navigates instead of selecting.
 */
export function isLevelRoot(c: Concept) {
  return c.open === c.level;
}

export function searchConcepts(query: string) {
  const terms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t !== 'all');
  return manifest.filter((c) =>
    terms.every((t) =>
      [c.name, c.shortName, ...c.searchTerms]
        .join(' ')
        .toLowerCase()
        .includes(t),
    ),
  );
}

/**
 * Descending from a component: the scale it opens, if it has one.
 * This is what makes "explode this one further" work on any branch.
 */
export function openLevel(id: string): LevelId | null {
  const c = byId[id];
  return c && c.open && c.open !== c.level ? c.open : null;
}

/** The concept a scale belongs to, used for breadcrumbs and headings. */
export function levelConcept(level: LevelId): Concept | undefined {
  return byId[levels[level].concept];
}
