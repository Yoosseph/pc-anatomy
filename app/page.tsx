'use client';
import { useCallback, useEffect, useState } from 'react';
import { EyeOff } from 'lucide-react';
import { levelPath } from '@/lib/levels';
import { useExplorer } from './use-explorer';
import Viewer from './viewer';
import PerformanceTip from './performance-tip';
import Topbar from './topbar';
import ScaleNav from './scale-nav';
import SystemsList from './systems-list';
import StageHeading from './stage-heading';
import StageTools from './stage-tools';
import Disassembly from './disassembly';
import SearchDialog from './search-dialog';
import DetailPanel from './detail-panel';
import AboutDialog from './about-dialog';
import ComparisonWorkbench from './comparison-workbench';

export default function Home() {
  const explorer = useExplorer();
  const { state, selected, logical, layers, selectConcept, choose, navigate } =
    explorer;
  const [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [about, setAbout] = useState(false),
    [mode, setMode] = useState<'explorer' | 'comparison'>('explorer'),
    // `null` until the viewer has reported for the first time. Zero means the
    // viewer is running and nothing is switched on, which is a different thing
    // to say to the reader, and saying the wrong one was what put "No
    // structures visible" on screen for the whole of a cold load.
    [count, setCount] = useState<number | null>(null);

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
  }, [about, choose, navigate, search, state.level]);

  if (mode === 'comparison')
    return (
      <ComparisonWorkbench
        onExit={() => {
          setMode('explorer');
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLButtonElement>('.compare-button')
              ?.focus(),
          );
        }}
      />
    );

  return (
    <main
      className={
        'workbench' +
        (selected ? ' has-selection' : '') +
        (logical ? ' logical' : '')
      }
    >
      <Topbar
        layers={layers}
        onReset={explorer.reset}
        onToggleLayers={() => explorer.setLayers(!layers)}
        onSearch={() => setSearch(true)}
        onAbout={() => setAbout(true)}
        onCompare={() => setMode('comparison')}
      />
      <PerformanceTip ready={count !== null && count > 0} />
      {layers && (
        // Without this the drawer floats over a live 3-D view: a tap meant to
        // dismiss it lands in the scene and selects whatever was behind it.
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
          onClose={() => explorer.setLayers(false)}
        />
        <SystemsList
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
        count={count}
        onNavigate={navigate}
      />
      <Viewer
        state={state}
        onSelect={choose}
        onCount={setCount}
        onDived={explorer.arrive}
      />
      {count === null && (
        <div className="empty-scene loading">
          <h3>Loading components for you…</h3>
        </div>
      )}
      {count === 0 && (
        <div className="empty-scene">
          <EyeOff size={27} />
          <h3>No structures visible</h3>
          <button onClick={explorer.showEverything}>Show all systems</button>
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
        onToggleHiddenMenu={() => explorer.setHiddenMenuOpen((open) => !open)}
        onSetView={explorer.setView}
        onToggleAirflow={explorer.toggleAirflow}
        onUnhide={explorer.unhide}
        onClearHidden={explorer.clearHidden}
      />
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
        level={state.level}
        isolated={state.isolated}
        onClose={() => choose(null)}
        onSelectConcept={selectResult}
        onDive={explorer.dive}
        onIsolate={explorer.toggleIsolate}
        onFocus={explorer.refocus}
        onHide={explorer.hide}
      />
      <AboutDialog open={about} onOpenChange={setAbout} />
    </main>
  );
}
