'use client';
import { useEffect, useRef, useState } from 'react';
import { comparisonCard, type ComparisonState } from '@/lib/comparison-state';
import type { createComparisonViewer } from '@/lib/comparison-scene';

type Props = {
  state: ComparisonState;
  onCount: (count: number) => void;
};

export default function ComparisonViewer({ state, onCount }: Props) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<ReturnType<typeof createComparisonViewer> | null>(null),
    latest = useRef({ state, onCount });
  const [error, setError] = useState(''),
    [hover, setHover] = useState<{
      name: string;
      x: number;
      y: number;
    } | null>(null),
    [ready, setReady] = useState(false);
  const left = comparisonCard(state.left),
    right = comparisonCard(state.right);

  useEffect(() => {
    latest.current = { state, onCount };
    engine.current?.update(state);
  }, [state, onCount]);

  useEffect(() => {
    let stopped = false;
    void import('@/lib/comparison-scene')
      .then(({ createComparisonViewer }) => {
        if (stopped || !host.current) return;
        try {
          engine.current = createComparisonViewer(
            host.current,
            latest.current.state,
            {
              stats: (count) => latest.current.onCount(count),
              hover: (name, x, y) => setHover(name ? { name, x, y } : null),
              error: setError,
            },
          );
          setReady(true);
        } catch {
          setError(
            'WebGL could not start. Enable graphics acceleration in your browser, then reload the viewer.',
          );
        }
      })
      .catch(() => {
        if (!stopped)
          setError(
            'The comparison viewer could not load. Reload to try again.',
          );
      });
    return () => {
      stopped = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

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
        <output className="comparison-loading">
          Loading both graphics cards…
        </output>
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
