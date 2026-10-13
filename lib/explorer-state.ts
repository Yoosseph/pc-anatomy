import { byId, isLevelRoot } from './manifest.ts';
import { categories, type Category } from './concept.ts';
import { isPhysical, rootLevel, type LevelId } from './levels.ts';
import type { AirflowMode } from './airflow-policy.ts';

/**
 * What the explorer is currently showing, and the moves that change it.
 *
 * The catalogue in `manifest.ts` describes the machine and never changes; this
 * is the part that does. Keeping the two apart means a change to what the
 * viewer is looking at cannot quietly become a change to what exists.
 */

export type Selection = { concept: string; instance?: number };
export type ExplorerState = {
  level: LevelId;
  explode: number;
  visible: Category[];
  hidden: string[];
  selection: Selection | null;
  isolated: boolean;
  view: 'perspective' | 'top' | 'front' | 'back';
  /**
   * Whether the airflow chevrons are drawn, or `auto` to let the scale decide.
   *
   * A preference rather than a property of the view: once set either way it
   * survives navigating, diving and searching, because someone who has asked
   * to see where the air goes has asked it of the machine and not of one
   * scale of it. `airflowShown` resolves it against the current scale.
   */
  airflow: AirflowMode;
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
  airflow: 'auto',
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
    // Hidden objects belong to the scale where they were hidden. A search that
    // jumps to another scale starts with a clean visibility state, just like
    // navigation and diving do.
    hidden: state.level === c.level ? state.hidden.filter((x) => x !== id) : [],
    isolated: false,
    focusRevision: state.focusRevision + 1,
    cameraRevision: state.cameraRevision + 1,
  };
}
