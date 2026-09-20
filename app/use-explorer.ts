'use client';
import { useCallback, useState } from 'react';
import { byId, categories, openLevel, type Category } from '@/lib/manifest';
import { airflowShown } from '@/lib/airflow';
import {
  initialState,
  selectSearch,
  type ExplorerState,
  type Selection,
} from '@/lib/explorer-state';
import {
  isPhysical,
  levelPath,
  levels,
  menuRoot,
  submenuRoot,
  type LevelId,
} from '@/lib/levels';
import { useDisassemblyPlayback } from './use-disassembly-playback';

/** Graphics cards whose chip diagrams open directly, without a dive. */
const gpuRoots = new Set<LevelId>(['card', 'rx9070', 'arcb580']);

/**
 * Every move the explorer can make, in one place.
 *
 * The page is a composition of panels and this is the vocabulary they share.
 * A panel asks for a named move — navigate, isolate, hide — rather than
 * writing its own patch of explorer state at the button that triggers it.
 */
export function useExplorer() {
  const [state, setState] = useState<ExplorerState>(initialState);
  const [layers, setLayers] = useState(false);
  const [hiddenMenuOpen, setHiddenMenuOpen] = useState(false);
  // The subsystem whose menu is open. Follows wherever you are unless you
  // deliberately open another one.
  const [openMenu, setOpenMenu] = useState<LevelId | null>(null);
  // The card dropdown open inside the GPU menu. `null` follows wherever you
  // are; `'none'` means you deliberately folded it away.
  const [openSubmenu, setOpenSubmenu] = useState<LevelId | 'none' | null>(null);
  const shownMenu = openMenu ?? menuRoot(state.level);
  const shownSubmenu =
    openSubmenu === 'none' ? null : (openSubmenu ?? submenuRoot(state.level));
  // While a dive is in flight the selection exists only to aim the camera at
  // the part being opened. Showing its panel would flash the outer component's
  // description, and its "Take apart" button, for a few hundred milliseconds
  // before the deeper scale replaces it. The panel appears on arrival instead.
  const selected =
    state.selection && !state.diveInto ? byId[state.selection.concept] : null;
  const logical = !isPhysical(state.level);
  const updateExplode = useCallback(
    (explode: number) =>
      setState((current) => ({ ...current, explode, focusRevision: 0 })),
    [],
  );
  const {
    playing,
    setExplode,
    stop: stopDisassembly,
    toggleAuto,
  } = useDisassemblyPlayback(state.explode, updateExplode);

  const navigate = useCallback(
    (level: LevelId, selection: Selection | null = null) => {
      stopDisassembly();
      setHiddenMenuOpen(false);
      setOpenMenu(menuRoot(level));
      setOpenSubmenu(null);
      setState((s) => ({
        ...s,
        level,
        diveInto: null,
        explode: 0,
        selection,
        isolated: false,
        focusRevision: 0,
        cameraRevision: s.cameraRevision + 1,
        visible: [...categories],
        hidden: [],
        view: 'perspective',
      }));
      setLayers(false);
    },
    [stopDisassembly],
  );

  const reset = useCallback(() => {
    stopDisassembly();
    setHiddenMenuOpen(false);
    setOpenMenu(null);
    setOpenSubmenu(null);
    setState((s) => ({
      ...initialState,
      cameraRevision: s.cameraRevision + 1,
    }));
    setLayers(false);
  }, [stopDisassembly]);

  // Physical disassembly is one continuous move owned by the scene: the stage clears
  // around the part you clicked while the camera closes in on it, and when the
  // scene reports the stage is clear we swap in the deeper scale, which then
  // grows back out of the same spot. Nothing cuts to black, and no timer here
  // can drift out of step with the animation. `diveInto` is the whole record of
  // a dive in flight, so cancelling one is just clearing it.
  const dive = useCallback(
    (conceptId: string) => {
      const target = openLevel(conceptId);
      if (!target) return false;
      // GPU diagrams open directly. The outgoing isolation animation selected
      // every repeated block and tinted the old scale green before replacing it.
      if (
        levelPath(target).some((id) => gpuRoots.has(id)) &&
        !isPhysical(target)
      ) {
        navigate(target, { concept: levels[target].concept });
        return true;
      }
      stopDisassembly();
      setLayers(false);
      setState((s) =>
        s.diveInto
          ? s
          : {
              ...s,
              selection: { concept: conceptId },
              isolated: false,
              diveInto: conceptId,
              diveRevision: s.diveRevision + 1,
              focusRevision: s.focusRevision + 1,
              cameraRevision: s.cameraRevision + 1,
            },
      );
      return true;
    },
    [navigate, stopDisassembly],
  );

  const arrive = useCallback(() => {
    const arrivedLevel = state.diveInto ? openLevel(state.diveInto) : null;
    if (!arrivedLevel) return;
    setHiddenMenuOpen(false);
    setOpenMenu(menuRoot(arrivedLevel));
    setOpenSubmenu(null);
    setState((s) => {
      const target = s.diveInto ? openLevel(s.diveInto) : null;
      if (!target || target !== arrivedLevel) return s;
      return {
        ...s,
        level: target,
        explode: 0,
        visible: [...categories],
        hidden: [],
        isolated: false,
        view: 'perspective',
        diveInto: null,
        focusRevision: 0,
        cameraRevision: s.cameraRevision + 1,
        // Arrive with the thing you opened already described.
        selection: { concept: levels[target].concept },
      };
    });
  }, [state.diveInto]);

  const choose = useCallback(
    (selection: Selection | null, intent: 'open' | 'inspect' = 'inspect') => {
      if (selection && intent === 'open' && dive(selection.concept)) return;
      setState((s) => ({
        ...s,
        selection,
        isolated: false,
        focusRevision: 0,
      }));
      setLayers(false);
    },
    [dive],
  );

  /** Jump to a component found by search, or named in another panel. */
  const selectConcept = useCallback((id: string) => {
    setOpenMenu(menuRoot(byId[id].level));
    setOpenSubmenu(null);
    setState((s) => selectSearch(s, id));
    setLayers(false);
  }, []);

  const toggleCategory = (category: Category) =>
    setState((s) => ({
      ...s,
      visible: s.visible.includes(category)
        ? s.visible.filter((c) => c !== category)
        : [...s.visible, category],
      selection:
        s.selection && byId[s.selection.concept].category === category
          ? null
          : s.selection,
      isolated: false,
      focusRevision: 0,
    }));

  const toggleAllCategories = () =>
    setState((s) => ({
      ...s,
      visible: s.visible.length === categories.length ? [] : [...categories],
      hidden: [],
      selection: null,
      isolated: false,
      focusRevision: 0,
    }));

  const setConceptVisible = (
    id: string,
    category: Category,
    checked: boolean,
  ) =>
    setState((s) => ({
      ...s,
      visible:
        checked && !s.visible.includes(category)
          ? [...s.visible, category]
          : s.visible,
      hidden: checked ? s.hidden.filter((x) => x !== id) : [...s.hidden, id],
      selection: null,
      isolated: false,
      focusRevision: 0,
    }));

  /** Everything back on screen, without disturbing the selection. */
  const showEverything = () =>
    setState((s) => ({
      ...s,
      visible: [...categories],
      hidden: [],
      isolated: false,
    }));

  const unhide = useCallback((id: string) => {
    const category = byId[id]?.category;
    setState((s) => ({
      ...s,
      visible:
        category && !s.visible.includes(category)
          ? [...s.visible, category]
          : s.visible,
      hidden: s.hidden.filter((hiddenId) => hiddenId !== id),
      focusRevision: 0,
    }));
  }, []);

  const clearHidden = () =>
    setState((s) => ({ ...s, hidden: [], focusRevision: 0 }));

  /**
   * Show or hide where the air goes. Deliberately touches nothing else: no
   * camera move, no change to the selection, so it can be switched on to
   * answer one question and off again without losing your place.
   *
   * Resolved against the current scale first, so the first press always does
   * what the control says it will, whichever way `auto` had fallen.
   */
  const toggleAirflow = () =>
    setState((s) => ({
      ...s,
      airflow: airflowShown(s.airflow, s.level) ? 'off' : 'on',
    }));

  const setView = (view: ExplorerState['view']) =>
    setState((s) => ({
      ...s,
      view,
      focusRevision: 0,
      cameraRevision: s.cameraRevision + 1,
    }));

  const toggleIsolate = () =>
    setState((s) => ({
      ...s,
      isolated: !s.isolated,
      focusRevision: s.focusRevision + 1,
      cameraRevision: s.cameraRevision + 1,
    }));

  const refocus = () =>
    setState((s) => ({
      ...s,
      focusRevision: s.focusRevision + 1,
      cameraRevision: s.cameraRevision + 1,
    }));

  const hide = (id: string) => {
    setHiddenMenuOpen(true);
    setState((s) => ({
      ...s,
      hidden: s.hidden.includes(id) ? s.hidden : [...s.hidden, id],
      selection: null,
      isolated: false,
      focusRevision: 0,
    }));
  };

  return {
    state,
    selected,
    logical,
    playing,
    layers,
    setLayers,
    hiddenMenuOpen,
    setHiddenMenuOpen,
    shownMenu,
    showMenu: setOpenMenu,
    shownSubmenu,
    showSubmenu: setOpenSubmenu,
    navigate,
    reset,
    dive,
    arrive,
    choose,
    selectConcept,
    setExplode,
    toggleAuto,
    toggleCategory,
    toggleAllCategories,
    setConceptVisible,
    showEverything,
    unhide,
    clearHidden,
    setView,
    toggleAirflow,
    toggleIsolate,
    refocus,
    hide,
  };
}

export type Explorer = ReturnType<typeof useExplorer>;
