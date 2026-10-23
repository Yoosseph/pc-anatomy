'use client';
import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  Columns2,
} from 'lucide-react';
import {
  canComparePhysicalScale,
  comparisonCategoryLabel,
  comparisonItem,
  createComparisonState,
  selectComparisonItem,
  setComparisonActiveSide,
  setComparisonExplode,
  setComparisonFraming,
  setComparisonSpecsOpen,
  otherSide,
  sideLetter,
  swapComparisonSides,
  type ComparisonFraming,
  type ComparisonItem,
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

function framingNote(framing: ComparisonFraming, trueSizeAvailable: boolean) {
  if (framing === 'scale') return 'Same physical scale in both panes.';
  return trueSizeAvailable
    ? 'Each model fits its pane. Sizes are not relative.'
    : 'Each model fits its pane. Diagrams and illustrative parts have no physical scale.';
}

function disassemblyTitle(left: ComparisonItem, right: ComparisonItem) {
  if (left.kind !== right.kind) return 'Explore both';
  return left.kind === 'logical' ? 'Expand both' : 'Disassemble both';
}

type PartSelectorProps = {
  side: ComparisonSide;
  item: ComparisonItem;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
};

/** The card above each pane; it opens that side's picker. */
function PartSelector({ side, item, buttonRef, onOpen }: PartSelectorProps) {
  return (
    <button
      className={`comparison-selector ${side}`}
      ref={buttonRef}
      aria-label={`Choose part ${sideLetter(side)}`}
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <span className="comparison-letter">{sideLetter(side)}</span>
      <span className="comparison-selected-part">
        <small>
          {comparisonCategoryLabel(item.category)} · {levels[item.system].name}
        </small>
        <strong>{item.shortName}</strong>
        <span>
          {item.kind === 'physical' ? 'Hardware model' : 'Architecture diagram'}
        </span>
      </span>
      <ChevronDown size={17} aria-hidden="true" />
    </button>
  );
}

export default function ComparisonWorkbench({ initialLevel, onExit }: Props) {
  const specsButton = useRef<HTMLButtonElement>(null);
  const selectorButtons = {
    left: useRef<HTMLButtonElement>(null),
    right: useRef<HTMLButtonElement>(null),
  };
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
  const trueSizeAvailable = canComparePhysicalScale(state.left, state.right);
  const logical = leftItem.kind === 'logical' && rightItem.kind === 'logical';
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
  const openPicker = (side: ComparisonSide) => {
    stopDisassembly();
    setPicker(side);
  };
  const selector = (side: ComparisonSide) => (
    <PartSelector
      side={side}
      item={side === 'left' ? leftItem : rightItem}
      buttonRef={selectorButtons[side]}
      onOpen={() => openPicker(side)}
    />
  );
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
            {framingNote(state.framing, trueSizeAvailable)}
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
        title={disassemblyTitle(leftItem, rightItem)}
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
          other={state[otherSide(picker)]}
          returnFocusRef={selectorButtons[picker]}
          onChoose={choose}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
