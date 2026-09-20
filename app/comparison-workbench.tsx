'use client';
import { useCallback, useMemo, useState } from 'react';
import { ArrowLeftRight, BarChart3, ChevronLeft, Cpu } from 'lucide-react';
import {
  comparisonGroupIds,
  comparisonGroups,
  comparisonItem,
  comparisonLevels,
  initialComparisonState,
  selectComparisonGroup,
  selectComparisonItem,
  setComparisonActiveSide,
  setComparisonExplode,
  setComparisonSpecsOpen,
  swapComparisonSides,
  type ComparisonGroupId,
  type ComparisonItem,
  type ComparisonLevel,
  type ComparisonSide,
  type ComparisonViewState,
} from '@/lib/comparison-state';
import { isPhysical } from '@/lib/levels';
import ComparisonViewer from './comparison-viewer';
import ComparisonSpecs from './comparison-specs';
import Disassembly from './disassembly';
import { useDisassemblyPlayback } from './use-disassembly-playback';

type Props = { onExit: () => void };

export default function ComparisonWorkbench({ onExit }: Props) {
  const [state, setState] = useState(initialComparisonState);
  const [count, setCount] = useState<number | null>(null);
  const [viewerRevision, setViewerRevision] = useState(0);
  const group = comparisonGroups[state.group];
  const items = useMemo(
    () =>
      Object.fromEntries(
        comparisonLevels(state.group).map((level) => [
          level,
          comparisonItem(state.group, level),
        ]),
      ) as Partial<Record<ComparisonLevel, ComparisonItem>>,
    [state.group],
  );
  const updateExplode = useCallback(
    (explode: number) =>
      setState((current) => setComparisonExplode(current, explode)),
    [],
  );
  const {
    playing,
    setExplode,
    stop: stopDisassembly,
    toggleAuto,
  } = useDisassemblyPlayback(state.explode, updateExplode);
  const viewerState = useMemo<ComparisonViewState>(
    () => ({
      group: state.group,
      left: state.left,
      right: state.right,
      activeSide: state.activeSide,
      explode: state.explode,
    }),
    [state.activeSide, state.explode, state.group, state.left, state.right],
  );

  const choose = (side: ComparisonSide, level: ComparisonLevel) =>
    setState((current) => selectComparisonItem(current, side, level));

  const chooseGroup = (nextGroup: ComparisonGroupId) => {
    stopDisassembly();
    setState((current) => selectComparisonGroup(current, nextGroup));
  };

  const reset = () => {
    stopDisassembly();
    setState((current) => ({ ...current, explode: 0 }));
    setViewerRevision((revision) => revision + 1);
  };

  const selector = (side: ComparisonSide) => {
    const level = state[side];
    const other = state[side === 'left' ? 'right' : 'left'];
    const item = items[level]!;
    return (
      <label className={`comparison-selector ${side}`}>
        <span>{side === 'left' ? 'A' : 'B'}</span>
        <select
          value={level}
          aria-label={`${side === 'left' ? 'Left' : 'Right'} ${group.itemLabel}`}
          onChange={(event) =>
            choose(side, event.target.value as ComparisonLevel)
          }
        >
          {comparisonLevels(state.group).map((option) => (
            <option key={option} value={option} disabled={option === other}>
              {items[option]!.shortName}
            </option>
          ))}
        </select>
        <small>{item.note}</small>
      </label>
    );
  };

  const leftItem = items[state.left]!;
  const rightItem = items[state.right]!;
  const logical = !isPhysical(state.left);

  return (
    <main
      className="workbench comparison-workbench"
      data-active-side={state.activeSide}
    >
      <header className="comparison-topbar">
        <div className="comparison-brand">
          <Cpu size={19} />
          <div>
            <strong>Component comparison</strong>
            <span>{group.label}</span>
          </div>
        </div>
        <div className="comparison-top-actions">
          <button
            className="comparison-specs-button"
            onClick={() =>
              setState((current) => setComparisonSpecsOpen(current, true))
            }
          >
            <BarChart3 size={16} />
            Specs
          </button>
          <button className="comparison-exit" onClick={onExit}>
            <ChevronLeft size={17} />
            Back to explorer
          </button>
        </div>
      </header>

      <section className="comparison-setup" aria-label="Comparison pair">
        <fieldset className="comparison-groups">
          <legend className="sr-only">Component category</legend>
          {comparisonGroupIds.map((groupId) => (
            <button
              key={groupId}
              aria-pressed={state.group === groupId}
              onClick={() => chooseGroup(groupId)}
            >
              {comparisonGroups[groupId].label}
            </button>
          ))}
        </fieldset>
        <div className="comparison-pair">
          {selector('left')}
          <button
            className="comparison-swap"
            onClick={() => setState((current) => swapComparisonSides(current))}
            aria-label="Swap comparison sides"
          >
            <ArrowLeftRight size={18} />
            <span>Swap sides</span>
          </button>
          {selector('right')}
        </div>
      </section>

      <fieldset className="comparison-mobile-switch">
        <legend className="sr-only">Visible comparison side</legend>
        {(['left', 'right'] as const).map((side) => (
          <button
            key={side}
            aria-pressed={state.activeSide === side}
            onClick={() =>
              setState((current) => setComparisonActiveSide(current, side))
            }
          >
            {side === 'left' ? 'A · Left' : 'B · Right'}
          </button>
        ))}
      </fieldset>

      <div className="comparison-pane-label left" aria-hidden="true">
        <span>A</span>
        <strong>{leftItem.shortName}</strong>
      </div>
      <div className="comparison-pane-label right" aria-hidden="true">
        <span>B</span>
        <strong>{rightItem.shortName}</strong>
      </div>
      <div className="comparison-divider" aria-hidden="true" />
      <ComparisonViewer
        key={viewerRevision}
        state={viewerState}
        onCount={setCount}
      />
      <div className="sr-only" aria-live="polite">
        Comparing {leftItem.shortName} on the left with {rightItem.shortName} on
        the right.
      </div>
      {count !== null && (
        <div className="comparison-count" aria-hidden="true">
          <strong>{count}</strong> parts across pair
        </div>
      )}

      <Disassembly
        level={state.left}
        explode={state.explode}
        logical={logical}
        playing={playing}
        onToggleAuto={toggleAuto}
        onSetExplode={setExplode}
        onReset={reset}
        sectionLabel="Shared disassembly control"
        title={logical ? 'Expand both' : 'Disassemble both'}
        sliderLabel={`${logical ? 'Expand' : 'Disassemble'} both ${group.label.toLowerCase()}`}
        valueText={`${Math.round(state.explode)} percent for both ${group.label.toLowerCase()}`}
      />
      <ComparisonSpecs
        group={state.group}
        left={state.left}
        right={state.right}
        open={state.specsOpen}
        onOpenChange={(open) =>
          setState((current) => setComparisonSpecsOpen(current, open))
        }
      />
    </main>
  );
}
