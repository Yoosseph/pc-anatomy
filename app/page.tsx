'use client';
import { useCallback, useEffect, useState } from 'react';
import { EyeOff } from 'lucide-react';
import { airflowShown } from '@/lib/airflow-policy';
import { levelPath } from '@/lib/levels';
import { useExplorer } from './use-explorer';
import { useFirstVisitHint } from './use-first-visit-hint';
import { useBuildWorkspace } from './use-build-workspace';
import Viewer from './viewer';
import PerformanceTip from './performance-tip';
import Topbar from './topbar';
import ScaleNav from './scale-nav';
import SystemsList from './systems-list';
import StageHeading from './stage-heading';
import StageTools from './stage-tools';
import PowerControls from './power-controls';
import Disassembly from './disassembly';
import SearchDialog from './search-dialog';
import DetailPanel from './detail-panel';
import AboutDialog from './about-dialog';
import ComparisonWorkbench from './comparison-workbench';
import BuildWorkspace from './build-workspace';

export default function Home() {
  const explorer = useExplorer();
  const { state, selected, logical, layers, selectConcept, choose, navigate } =
    explorer;
  const [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [about, setAbout] = useState(false),
    [comparing, setComparing] = useState(false),
    // `null` until the viewer has reported for the first time. Zero means the
    // viewer is running and nothing is switched on, which is a different thing
    // to say to the reader, and saying the wrong one was what put "No
    // structures visible" on screen for the whole of a cold load.
    [count, setCount] = useState<number | null>(null);
  const building = state.workspace === 'build';
  const workspace = useBuildWorkspace(explorer);
  const { pointAt } = workspace;

  const { hint, dismissHint } = useFirstVisitHint(
    state,
    count !== null && count > 0,
  );

  /** Jump to a component, closing the palette if that is where it came from. */
  const selectResult = useCallback(
    (id: string) => {
      selectConcept(id);
      setSearch(false);
      setQuery('');
    },
    [selectConcept],
  );

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (comparing) return;
      // A key pressed while nothing is focused reports the document, not an
      // element, and on some soft keyboards the target is the window itself.
      // Reaching for closest() on either throws out of the handler.
      const el = event.target;
      if (
        el instanceof Element &&
        el.closest('input,textarea,[contenteditable=true]')
      )
        return;
      if (search || about) return;
      if (building) {
        if (event.key === 'Escape') pointAt(null);
        return;
      }
      if (event.key === '/') {
        event.preventDefault();
        setSearch(true);
      }
      if (event.key === 'Escape') choose(null);
      if (event.key === 'Backspace') {
        const currentPath = levelPath(state.level);
        if (currentPath.length > 1) {
          event.preventDefault();
          navigate(currentPath[currentPath.length - 2]);
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [
    about,
    building,
    choose,
    comparing,
    navigate,
    pointAt,
    search,
    state.level,
  ]);

  if (comparing)
    return (
      <ComparisonWorkbench
        initialLevel={state.level}
        onExit={() => {
          setComparing(false);
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLButtonElement>('.compare-button')
              ?.focus(),
          );
        }}
      />
    );

  // The viewer keeps its place among its siblings in both layouts, so React
  // keeps the same scene when the workspace opens or closes.
  return (
    <main
      className={
        'workbench' +
        (building
          ? ' build-workbench'
          : (selected ? ' has-selection' : '') + (logical ? ' logical' : ''))
      }
    >
      {building ? (
        <BuildWorkspace
          build={state.build}
          fitting={workspace.fitting}
          focus={workspace.focus}
          airflow={airflowShown(state.airflow, state.level)}
          power={state.power}
          onSetPart={workspace.choosePart}
          onRestore={explorer.restoreBuild}
          onExit={() => {
            workspace.leave();
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLButtonElement>('.build-button')
                ?.focus(),
            );
          }}
          onToggleAirflow={explorer.toggleAirflow}
          onTogglePower={explorer.togglePower}
        />
      ) : (
        <>
          <Topbar
            layers={layers}
            onReset={explorer.reset}
            onToggleLayers={() => explorer.setLayers(!layers)}
            onSearch={() => setSearch(true)}
            onAbout={() => setAbout(true)}
          />
          <PerformanceTip ready={count !== null && count > 0} />
          {layers && (
            // Without this the drawer floats over a live 3-D view: a tap
            // meant to dismiss it lands in the scene and selects whatever was
            // behind it.
            <button
              className="drawer-scrim"
              aria-label="Close systems"
              onClick={() => explorer.setLayers(false)}
            />
          )}
          <aside
            className={'explorer' + (layers ? ' mobile-open' : '')}
            aria-label="System visibility"
          >
            <ScaleNav
              level={state.level}
              shownMenu={explorer.shownMenu}
              shownSubmenu={explorer.shownSubmenu}
              onOpenMenu={explorer.showMenu}
              onOpenSubmenu={explorer.showSubmenu}
              onNavigate={navigate}
              onCompare={() => setComparing(true)}
              onBuild={explorer.openBuild}
              onClose={() => explorer.setLayers(false)}
            />
            <SystemsList
              level={state.level}
              visible={state.visible}
              hidden={state.hidden}
              onToggleCategory={explorer.toggleCategory}
              onToggleAll={explorer.toggleAllCategories}
              onSetConceptVisible={explorer.setConceptVisible}
              onSelectConcept={selectResult}
            />
          </aside>
          <StageHeading
            level={state.level}
            explode={state.explode}
            logical={logical}
            selected={selected}
            hint={hint}
            onDismissHint={dismissHint}
            onNavigate={navigate}
          />
        </>
      )}
      <Viewer
        state={workspace.viewerState}
        loading={count === null}
        onSelect={building ? pointAt : choose}
        onCount={setCount}
        onDived={explorer.arrive}
        hoverHint={building ? 'Click to find its slot' : undefined}
      />
      {building ? null : (
        <>
          {count === 0 && (
            <div className="empty-scene">
              <EyeOff size={27} />
              <h3>No structures visible</h3>
              <button onClick={explorer.showEverything}>
                Show all systems
              </button>
            </div>
          )}
          <StageTools
            view={state.view}
            level={state.level}
            explode={state.explode}
            logical={logical}
            airflow={state.airflow}
            hidden={state.hidden}
            hiddenMenuOpen={explorer.hiddenMenuOpen}
            onToggleHiddenMenu={() =>
              explorer.setHiddenMenuOpen((open) => !open)
            }
            onSetView={explorer.setView}
            onToggleAirflow={explorer.toggleAirflow}
            onUnhide={explorer.unhide}
            onClearHidden={explorer.clearHidden}
          >
            <PowerControls
              state={state}
              onToggle={explorer.togglePower}
              onTarget={explorer.setPowerTarget}
              onInspect={(id) => choose({ concept: id })}
            />
          </StageTools>
          <Disassembly
            level={state.level}
            explode={state.explode}
            logical={logical}
            playing={explorer.playing}
            onToggleAuto={explorer.toggleAuto}
            onSetExplode={explorer.setExplode}
            onReset={explorer.reset}
          />
          <SearchDialog
            open={search}
            onOpenChange={setSearch}
            query={query}
            onQueryChange={setQuery}
            onSelect={selectResult}
          />
          <DetailPanel
            selected={selected}
            selection={state.selection}
            opens={explorer.opens}
            level={state.level}
            isolated={state.isolated}
            onClose={() => choose(null)}
            onSelectConcept={selectResult}
            onDive={explorer.dive}
            onIsolate={explorer.toggleIsolate}
            onFocus={explorer.refocus}
            onHide={explorer.hide}
          />
        </>
      )}
      <AboutDialog open={about} onOpenChange={setAbout} />
    </main>
  );
}
