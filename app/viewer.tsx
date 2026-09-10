'use client';
import { useEffect, useRef, useState } from 'react';
import type { ExplorerState, Selection } from '@/lib/manifest';
import type { createViewer } from '@/lib/scene';
type Props = {
  state: ExplorerState;
  onSelect: (v: Selection | null) => void;
  onCount: (v: number) => void;
};
export default function Viewer({ state, onSelect, onCount }: Props) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<ReturnType<typeof createViewer> | null>(null),
    latest = useRef({ state, onSelect, onCount });
  const [error, setError] = useState(''),
    [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(
      null,
    ),
    [ready, setReady] = useState(false);
  useEffect(() => {
    latest.current = { state, onSelect, onCount };
    engine.current?.update(state);
  }, [state, onSelect, onCount]);
  useEffect(() => {
    let stopped = false;
    void import('@/lib/scene')
      .then(({ createViewer }) => {
        if (stopped || !host.current) return;
        try {
          engine.current = createViewer(host.current, latest.current.state, {
            select: (v) => latest.current.onSelect(v),
            stats: (v) => latest.current.onCount(v),
            hover: (name, x, y) => setHover(name ? { name, x, y } : null),
            error: setError,
          });
          setReady(true);
        } catch {
          setError(
            'WebGL could not start. Enable graphics acceleration in your browser, then reload the viewer.',
          );
        }
      })
      .catch(() => {
        if (!stopped)
          setError('The 3D viewer could not load. Reload to try again.');
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
        className="viewport"
        aria-label="Interactive 3D graphics card"
      />
      {!ready && !error && (
        <output className="viewer-status">Preparing the specimen…</output>
      )}
      {error && (
        <div className="viewer-status error" role="alert">
          {error}
          <button onClick={() => location.reload()}>Reload viewer</button>
        </div>
      )}
      {hover && (
        <div
          className="hover-label"
          style={{
            left: Math.min(hover.x + 16, window.innerWidth - 210),
            top: Math.max(10, hover.y - 37),
          }}
        >
          {hover.name}
          <span>Click to inspect</span>
        </div>
      )}
    </>
  );
}
