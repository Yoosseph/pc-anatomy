'use client';
import { useState } from 'react';
import type { ExplorerState, Selection } from '@/lib/explorer-state';
import type { PartLabel } from '@/lib/inventory-labels';
import { useViewerEngine } from './use-viewer-engine';
import { t } from '@/lib/i18n/messages';
type Props = {
  state: ExplorerState;
  /** Nothing has been drawn yet. */
  loading: boolean;
  onSelect: (v: Selection | null, intent: 'open' | 'inspect') => void;
  onCount: (v: number) => void;
  /** The scene has cleared the stage around the part being opened. */
  onDived: () => void;
  /** What a click on a hovered part does, when it is not the explorer's. */
  hoverHint?: string;
};
export default function Viewer({
  state,
  loading,
  onSelect,
  onCount,
  onDived,
  hoverHint,
}: Props) {
  const [hover, setHover] = useState<{
    name: string;
    x: number;
    y: number;
    opens: boolean;
  } | null>(null);
  const [labels, setLabels] = useState<PartLabel[]>([]);
  const { host, error, ready } = useViewerEngine(
    state,
    { onSelect, onCount, onDived },
    () => import('@/lib/scene').then(({ createViewer }) => createViewer),
    (current, reportError) => ({
      select: (value, intent) => current().onSelect(value, intent),
      stats: (value) => current().onCount(value),
      dived: () => current().onDived(),
      hover: (name, x, y, opens) =>
        setHover((previous) =>
          name
            ? previous?.name === name &&
              previous.x === x &&
              previous.y === y &&
              previous.opens === opens
              ? previous
              : { name, x, y, opens }
            : null,
        ),
      labels: setLabels,
      error: reportError,
    }),
    t.viewer.loadFailed,
  );
  return (
    <>
      <div ref={host} className="viewport" aria-label={t.viewer.model}>
        {labels.length > 0 && (
          <ul className="part-labels" aria-label={t.viewer.tray}>
            {labels.map((label) => (
              <li
                key={label.concept}
                style={{ left: label.left, top: label.top }}
              >
                <button
                  onClick={() =>
                    onSelect(
                      { concept: label.concept, instance: label.instance },
                      'inspect',
                    )
                  }
                  aria-pressed={state.selection?.concept === label.concept}
                >
                  {label.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* One message at a time: the loading line until the first frame
          reports in, unless the viewer failed, when the error replaces it
          rather than being drawn underneath it. */}
      {loading && !error && (
        <div className="empty-scene loading">
          <h3>{t.viewer.loadingComponents}</h3>
        </div>
      )}
      {!ready && !error && (
        <output className="viewer-status sr-only">{t.viewer.loading}</output>
      )}
      {error && (
        <div className="viewer-status error" role="alert">
          {error}
          <button onClick={() => location.reload()}>{t.viewer.reload}</button>
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
          <span>
            {hoverHint ??
              (hover.opens ? t.viewer.hoverOpen : t.viewer.hoverInspect)}
          </span>
        </div>
      )}
    </>
  );
}
