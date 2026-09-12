'use client';
import { useEffect, useRef, useState } from 'react';
import type { ExplorerState, Selection } from '@/lib/manifest';
import type { createViewer } from '@/lib/scene';
type Props = {
  state: ExplorerState;
  onSelect: (v: Selection | null) => void;
  onCount: (v: number) => void;
  /** The scene has cleared the stage around the part being opened. */
  onDived: () => void;
};
export default function Viewer({ state, onSelect, onCount, onDived }: Props) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<ReturnType<typeof createViewer> | null>(null),
    latest = useRef({ state, onSelect, onCount, onDived });
  const [error, setError] = useState(''),
    [hover, setHover] = useState<{
      name: string;
      x: number;
      y: number;
      opens: boolean;
    } | null>(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    latest.current = { state, onSelect, onCount, onDived };
    engine.current?.update(state);
  }, [state, onSelect, onCount, onDived]);
  useEffect(() => {
    let stopped = false;
    void import('@/lib/scene')
      .then(({ createViewer }) => {
        if (stopped || !host.current) return;
        try {
          engine.current = createViewer(host.current, latest.current.state, {
            select: (v) => latest.current.onSelect(v),
            stats: (v) => latest.current.onCount(v),
            dived: () => latest.current.onDived(),
            hover: (name, x, y, opens) =>
              setHover(name ? { name, x, y, opens } : null),
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
          role="tooltip"
          style={{
            left: Math.max(8, Math.min(hover.x + 16, window.innerWidth - 276)),
            top: Math.max(10, Math.min(hover.y - 60, window.innerHeight - 80)),
          }}
        >
          {hover.name}
          <span>{hover.opens ? 'Click to open' : 'Click to inspect'}</span>
        </div>
      )}
    </>
  );
}
