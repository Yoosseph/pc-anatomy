'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  Columns2,
} from 'lucide-react';
import {
  comparisonCategories,
  comparisonItem,
  createComparisonState,
  selectComparisonItem,
  setComparisonActiveSide,
  setComparisonExplode,
  setComparisonFraming,
  setComparisonSpecsOpen,
  swapComparisonSides,
  type ComparisonLevel,
  type ComparisonSide,
  type ComparisonViewState,
} from '@/lib/comparison-state';
import { levels } from '@/lib/levels';
import ComparisonPicker from './comparison-picker';
import ComparisonViewer from './comparison-viewer';
import ComparisonSpecs from './comparison-specs';
import Disassembly from './disassembly';
import { useDisassemblyPlayback } from './use-disassembly-playback';
import './comparison.css';

type Props = { initialLevel: ComparisonLevel; onExit: () => void };

export default function ComparisonWorkbench({ initialLevel, onExit }: Props) {
  const specsButton = useRef<HTMLButtonElement>(null);
  const leftButton = useRef<HTMLButtonElement>(null);
  const rightButton = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState(() => createComparisonState(initialLevel));
  const [picker, setPicker] = useState<ComparisonSide | null>(null);
  const [viewerRevision, setViewerRevision] = useState(0);
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
      left: state.left,
      right: state.right,
      activeSide: state.activeSide,
      explode: state.explode,
      framing: state.framing,
    }),
    [state.activeSide, state.explode, state.framing, state.left, state.right],
  );
  const leftItem = comparisonItem(state.left);
  const rightItem = comparisonItem(state.right);
  const trueSizeAvailable =
    leftItem.millimetersPerUnit !== null &&
    rightItem.millimetersPerUnit !== null;
  const logical = leftItem.kind === 'logical' && rightItem.kind === 'logical';
  const mixed = leftItem.kind !== rightItem.kind;
  const reset = () => {
    stopDisassembly();
    setState((current) => ({ ...current, explode: 0 }));
    setViewerRevision((revision) => revision + 1);
  };
  const choose = (level: ComparisonLevel) => {
    if (!picker) return;
    stopDisassembly();
    setState((current) => selectComparisonItem(current, picker, level));
    setPicker(null);
  };
  const selector = (side: ComparisonSide) => {
    const item = side === 'left' ? leftItem : rightItem;
    return (
      <button
        className={`comparison-selector ${side}`}
        ref={side === 'left' ? leftButton : rightButton}
        aria-label={`Choose part ${side === 'left' ? 'A' : 'B'}`}
        aria-haspopup="dialog"
        onClick={() => {
          stopDisassembly();
          setPicker(side);
        }}
      >
        <span className="comparison-letter">{side === 'left' ? 'A' : 'B'}</span>
        <span className="comparison-selected-part">
          <small>
            {
              comparisonCategories.find(
                (category) => category.id === item.category,
              )?.label
            }{' '}
            · {levels[item.system].name}
          </small>
          <strong>{item.shortName}</strong>
          <span>
            {item.kind === 'physical'
              ? 'Hardware model'
              : 'Architecture diagram'}
          </span>
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
    );
  };
  return (
    <main
      className="workbench comparison-workbench"
      data-active-side={state.activeSide}
    >
      <header className="comparison-topbar">
        <div className="comparison-brand">
          <Columns2 size={20} />
          <strong>Compare parts</strong>
        </div>
        <div className="comparison-top-actions">
          <button
            ref={specsButton}
            className="comparison-specs-button"
            aria-label="Specs"
            onClick={() =>
              setState((current) => setComparisonSpecsOpen(current, true))
            }
          >
            <BarChart3 size={16} />
            <span>Specs</span>
          </button>
          <button
            className="comparison-exit"
            onClick={onExit}
            aria-label="Back to explorer"
          >
            <ChevronLeft size={17} />
            <span>Back to explorer</span>
          </button>
        </div>
      </header>
      <section className="comparison-setup" aria-label="Comparison pair">
        <div className="comparison-pair">
          {selector('left')}
          <button
            className="comparison-swap"
            onClick={() => setState(swapComparisonSides)}
            aria-label="Swap comparison sides"
          >
            <ArrowLeftRight size={18} />
          </button>
          {selector('right')}
        </div>
        <div className="comparison-framing">
          <fieldset aria-label="Model scale">
            <button
              aria-pressed={state.framing === 'fit'}
              onClick={() =>
                setState((current) => setComparisonFraming(current, 'fit'))
              }
            >
              Fit each
            </button>
            <button
              aria-pressed={state.framing === 'scale'}
              disabled={!trueSizeAvailable}
              aria-describedby="comparison-scale-note"
              onClick={() =>
                setState((current) => setComparisonFraming(current, 'scale'))
              }
            >
              True size
            </button>
          </fieldset>
          <p id="comparison-scale-note">
            {state.framing === 'scale'
              ? 'Same physical scale in both panes.'
              : trueSizeAvailable
                ? 'Each model fits its pane. Sizes are not relative.'
                : 'Each model fits its pane. Diagrams and illustrative parts have no physical scale.'}
          </p>
        </div>
      </section>
      <fieldset
        className="comparison-mobile-switch"
        aria-label="Visible comparison side"
      >
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
      <div className="comparison-divider" aria-hidden="true" />
      <ComparisonViewer key={viewerRevision} state={viewerState} />
      <div className="sr-only" aria-live="polite">
        Comparing {leftItem.name} with {rightItem.name}.
      </div>
      <Disassembly
        level={state.left}
        explode={state.explode}
        logical={logical}
        playing={playing}
        onToggleAuto={toggleAuto}
        onSetExplode={setExplode}
        onReset={reset}
        sectionLabel="Shared disassembly control"
        title={
          mixed ? 'Explore both' : logical ? 'Expand both' : 'Disassemble both'
        }
        sliderLabel="Disassemble or expand both models"
        valueText={`${Math.round(state.explode)} percent for both models`}
      />
      <ComparisonSpecs
        left={state.left}
        right={state.right}
        open={state.specsOpen}
        returnFocusRef={specsButton}
        onOpenChange={(open) =>
          setState((current) => setComparisonSpecsOpen(current, open))
        }
      />
      {picker && (
        <ComparisonPicker
          key={`${picker}:${state[picker]}`}
          side={picker}
          selected={state[picker]}
          other={state[picker === 'left' ? 'right' : 'left']}
          returnFocusRef={picker === 'left' ? leftButton : rightButton}
          onChoose={choose}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
