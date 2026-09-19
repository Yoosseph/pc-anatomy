'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, BarChart3, ChevronLeft, Cpu } from 'lucide-react';
import {
  comparisonCard,
  gpuComparisonLevels,
  initialComparisonState,
  selectComparisonGpu,
  setComparisonActiveSide,
  setComparisonExplode,
  setComparisonPlaying,
  setComparisonSpecsOpen,
  swapComparisonSides,
  type ComparisonSide,
  type GpuComparisonLevel,
} from '@/lib/comparison-state';
import ComparisonViewer from './comparison-viewer';
import ComparisonSpecs from './comparison-specs';
import Disassembly from './disassembly';

type Props = { onExit: () => void };

export default function ComparisonWorkbench({ onExit }: Props) {
  const [state, setState] = useState(initialComparisonState),
    [count, setCount] = useState<number | null>(null),
    [viewerRevision, setViewerRevision] = useState(0);
  const cards = useMemo(
    () =>
      Object.fromEntries(
        gpuComparisonLevels.map((level) => [level, comparisonCard(level)]),
      ),
    [],
  ) as Record<GpuComparisonLevel, ReturnType<typeof comparisonCard>>;

  useEffect(() => {
    if (!state.playing) return;
    let frame = 0,
      last = performance.now();
    const step = (now: number) => {
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      setState((current) => {
        const explode = Math.min(100, current.explode + delta * 11);
        return {
          ...current,
          explode,
          playing: explode < 100,
        };
      });
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [state.playing]);

  const choose = (side: ComparisonSide, level: GpuComparisonLevel) =>
    setState((current) => selectComparisonGpu(current, side, level));

  const toggleAuto = () => {
    if (state.playing) {
      setState((current) => setComparisonPlaying(current, false));
      return;
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState((current) => setComparisonExplode(current, 100));
      return;
    }
    setState((current) =>
      setComparisonPlaying(
        current.explode >= 99 ? { ...current, explode: 0 } : current,
        true,
      ),
    );
  };

  const reset = () => {
    setState((current) => ({ ...current, explode: 0, playing: false }));
    setViewerRevision((revision) => revision + 1);
  };

  const selector = (side: ComparisonSide) => {
    const level = state[side],
      other = state[side === 'left' ? 'right' : 'left'],
      card = cards[level];
    return (
      <label className={`comparison-selector ${side}`}>
        <span>{side === 'left' ? 'A' : 'B'}</span>
        <select
          value={level}
          aria-label={`${side === 'left' ? 'Left' : 'Right'} graphics card`}
          onChange={(event) =>
            choose(side, event.target.value as GpuComparisonLevel)
          }
        >
          {gpuComparisonLevels.map((option) => (
            <option key={option} value={option} disabled={option === other}>
              {cards[option].shortName}
            </option>
          ))}
        </select>
        <small>{card.note}</small>
      </label>
    );
  };

  return (
    <main
      className="workbench comparison-workbench"
      data-active-side={state.activeSide}
    >
      <header className="comparison-topbar">
        <div className="comparison-brand">
          <Cpu size={19} />
          <div>
            <strong>GPU comparison</strong>
            <span>PC Anatomy</span>
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

      <section className="comparison-setup" aria-label="Graphics card pair">
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
        <strong>{cards[state.left].shortName}</strong>
      </div>
      <div className="comparison-pane-label right" aria-hidden="true">
        <span>B</span>
        <strong>{cards[state.right].shortName}</strong>
      </div>
      <div className="comparison-divider" aria-hidden="true" />
      <ComparisonViewer key={viewerRevision} state={state} onCount={setCount} />
      <div className="sr-only" aria-live="polite">
        Comparing {cards[state.left].shortName} on the left with{' '}
        {cards[state.right].shortName} on the right.
      </div>
      {count !== null && (
        <div className="comparison-count" aria-hidden="true">
          <strong>{count}</strong> parts across pair
        </div>
      )}

      <Disassembly
        level="card"
        explode={state.explode}
        logical={false}
        playing={state.playing}
        onToggleAuto={toggleAuto}
        onSetExplode={(explode) =>
          setState((current) => setComparisonExplode(current, explode))
        }
        onReset={reset}
        sectionLabel="Shared disassembly control"
        title="Disassemble both"
        sliderLabel="Disassemble both graphics cards"
        valueText={`${Math.round(state.explode)} percent for both graphics cards`}
      />
      <ComparisonSpecs
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
