'use client';
import { useState } from 'react';
import {
  comparisonItem,
  type ComparisonViewState,
} from '@/lib/comparison-state';
import { useViewerEngine } from './use-viewer-engine';

type Props = {
  state: ComparisonViewState;
  onCount: (count: number) => void;
};

export default function ComparisonViewer({ state, onCount }: Props) {
  const [hover, setHover] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const left = comparisonItem(state.group, state.left),
    right = comparisonItem(state.group, state.right);
  const { host, error, ready } = useViewerEngine(
    state,
    { onCount },
    () =>
      import('@/lib/comparison-scene').then(
        ({ createComparisonViewer }) => createComparisonViewer,
      ),
    (current, reportError) => ({
      stats: (count) => current().onCount(count),
      hover: (name, x, y) => setHover(name ? { name, x, y } : null),
      error: reportError,
    }),
    'The comparison viewer could not load. Reload to try again.',
  );

  return (
    <>
      <div
        ref={host}
        className="comparison-viewport"
        data-active-side={state.activeSide}
        aria-label={`Synchronized 3D comparison of ${left.shortName} and ${right.shortName}`}
      >
        <section
          className="comparison-pane-a11y left"
          aria-label={`Left viewport: ${left.name}`}
        />
        <section
          className="comparison-pane-a11y right"
          aria-label={`Right viewport: ${right.name}`}
        />
      </div>
      {!ready && !error && (
        <output className="comparison-loading">Loading both models…</output>
      )}
      {error && (
        <div className="comparison-error" role="alert">
          {error}
          <button onClick={() => location.reload()}>Reload viewer</button>
        </div>
      )}
      {hover && (
        <div
          className="hover-label comparison-hover"
          role="tooltip"
          style={{
            left: Math.max(8, Math.min(hover.x + 16, window.innerWidth - 220)),
            top: Math.max(10, Math.min(hover.y - 48, window.innerHeight - 70)),
          }}
        >
          {hover.name}
          <span>Compared part</span>
        </div>
      )}
    </>
  );
}
