import { coolerConcepts } from './concepts/cooler.ts';
import { liquidConcepts } from './concepts/liquid.ts';
import { processorConcepts } from './concepts/processors.ts';
import { diskConcepts } from './concepts/disk.ts';
import { fanConcepts } from './concepts/fan.ts';
import { gpuConcepts } from './concepts/gpu.ts';
import { motherboardConcepts } from './concepts/motherboard.ts';
import { pcConcepts } from './concepts/pc.ts';
import { psuConcepts } from './concepts/psu.ts';
import {
  categories,
  colors,
  type Category,
  type Concept,
} from './concept.ts';
import {
  isPhysical,
  levelNames,
  levelPath,
  levels,
  rootLevel,
  type LevelId,
} from './levels.ts';
import { sources } from './sources.ts';

export { categories, colors, sources, levelNames, levelPath, levels, isPhysical };
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
  ...psuConcepts,
  ...fanConcepts,
  ...coolerConcepts,
  ...liquidConcepts,
  ...processorConcepts,
  ...diskConcepts,
  ...gpuConcepts,
];

export const byId = Object.fromEntries(
  manifest.map((c) => [c.id, c]),
) as Record<string, Concept>;

for (const c of manifest) {
  if (!c.parent) continue;
  const parent = byId[c.parent];
  if (!parent)
    throw new Error(`Concept "${c.id}" names a parent that does not exist: ${c.parent}`);
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

export type Selection = { concept: string; instance?: number };
export type ExplorerState = {
  level: LevelId;
  explode: number;
  visible: Category[];
  hidden: string[];
  selection: Selection | null;
  isolated: boolean;
  view: 'perspective' | 'top' | 'front' | 'back';
  cameraRevision: number;
  focusRevision: number;
  /** The component being opened, while the isolate-and-close-in ramp runs. */
  diveInto: string | null;
  /** Bumped to start a dive; the scene watches this rather than `diveInto`. */
  diveRevision: number;
};

export const initialState: ExplorerState = {
  level: rootLevel,
  explode: 0,
  visible: [...categories],
  hidden: [],
  selection: null,
  isolated: false,
  view: 'perspective',
  cameraRevision: 0,
  focusRevision: 0,
  diveInto: null,
  diveRevision: 0,
};

export function selectSearch(state: ExplorerState, id: string): ExplorerState {
  const c = byId[id];
  // Scales themselves are navigated to, not selected: there is no single piece
  // to highlight, so open the scale cleanly instead.
  if (isLevelRoot(c))
    return {
      ...state,
      level: c.level,
      explode: 0,
      selection: null,
      visible: [...categories],
      hidden: [],
      isolated: false,
      view: 'perspective',
      focusRevision: 0,
      cameraRevision: state.cameraRevision + 1,
    };
  return {
    ...state,
    level: c.level,
    // Physical assemblies hide their internals, so part-way open is the only
    // position where a result inside one is actually visible.
    explode: isPhysical(c.level) ? 48 : 0,
    selection: { concept: id },
    visible: state.visible.includes(c.category)
      ? state.visible
      : [...state.visible, c.category],
    hidden: state.hidden.filter((x) => x !== id),
    isolated: false,
    focusRevision: state.focusRevision + 1,
    cameraRevision: state.cameraRevision + 1,
  };
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
