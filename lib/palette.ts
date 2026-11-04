import type { CSSProperties } from 'react';
import type { Category } from './concept.ts';
import {
  comparisonItem,
  type ComparisonCategoryId,
} from './comparison-catalogue.ts';
import {
  boardOptions,
  graphicsOptions,
  processorOptions,
  type Brand,
} from './desktop-build.ts';
import type { LevelId } from './levels.ts';

/**
 * The interface's colour for each kind of part, the same everywhere: the scale
 * menus, the visible systems, the detail panel, search, the comparison picker
 * and the build workspace's slots. The colours themselves are CSS custom
 * properties (`--hue-*` in workbench.css), so a stylesheet can mix them; this
 * module only says which one a part, a system or a scale takes.
 *
 * They are the interface's, not the model's: the 3D pieces keep the quieter
 * tints in `concept.ts`, which are tuned to sit under the scene's lighting.
 */
export type Hue =
  | 'system'
  | 'board'
  | 'processor'
  | 'graphics'
  | 'memory'
  | 'storage'
  | 'cooling'
  | 'power'
  | 'display'
  | 'chassis';

const categoryHue: Record<ComparisonCategoryId, Hue> = {
  systems: 'system',
  boards: 'board',
  processors: 'processor',
  graphics: 'graphics',
  memory: 'memory',
  storage: 'storage',
  cooling: 'cooling',
  power: 'power',
  displays: 'display',
  chassis: 'chassis',
};

/** The visibility systems, named by what they hold. */
const systemHue: Record<Category, Hue> = {
  Chassis: 'chassis',
  Cooling: 'cooling',
  Board: 'board',
  Power: 'power',
  Memory: 'memory',
  Storage: 'storage',
  Compute: 'processor',
  Graphics: 'graphics',
};

/** A comparison category's colour, for the picker's headings and rows. */
export const hueOfCategory = (id: ComparisonCategoryId) => categoryHue[id];

/** A system's colour, for the visibility list and every part in it. */
export const hueOfSystem = (category: Category) => systemHue[category];

/**
 * A scale's colour, from the part it shows: a GPU's die and SM stay
 * Graphics, a module's DRAM cell stays Memory, a whole machine is a system.
 */
export const hueOfLevel = (level: LevelId) =>
  categoryHue[comparisonItem(level).category];

const brands: Partial<Record<LevelId, Brand>> = Object.fromEntries(
  [processorOptions, boardOptions, graphicsOptions].flatMap((options) =>
    Object.entries(options).map(([id, option]) => [id, option.brand]),
  ),
);

/** Whose silicon a product carries, where the build workspace names one. */
export const brandOf = (level: LevelId): Brand | undefined => brands[level];

/** Sets `--hue` for a subtree, so its rules colour it with `var(--hue)`. */
export const hueStyle = (hue: Hue) =>
  ({ '--hue': `var(--hue-${hue})` }) as CSSProperties;

/** Sets `--hue` to a maker's colour instead. */
export const brandStyle = (brand: Brand) =>
  ({ '--hue': `var(--brand-${brand})` }) as CSSProperties;
