'use client';
import { ArrowLeft, ChevronRight, MousePointerClick, X } from 'lucide-react';
import type { Concept } from '@/lib/manifest';
import { levelPath, levels, type LevelId } from '@/lib/levels';

type Props = {
  level: LevelId;
  explode: number;
  logical: boolean;
  selected: Concept | null;
  /** `null` until the viewer has reported for the first time. */
  count: number | null;
  /** Show the first-visit line about what clicking does. */
  hint?: boolean;
  onDismissHint?: () => void;
  onNavigate: (level: LevelId) => void;
};

/** A tap cannot right-click, so a phone is told the two-tap version. */
function hintCopy() {
  return typeof matchMedia !== 'undefined' &&
    matchMedia('(pointer: coarse)').matches
    ? 'Tap a part to see what it is and take it apart, or press Auto.'
    : 'Click a part to open it, right-click to inspect it, or press Auto.';
}

export default function StageHeading({
  level,
  explode,
  logical,
  selected,
  count,
  hint = false,
  onDismissHint,
  onNavigate,
}: Props) {
  const scale = levels[level],
    path = levelPath(level);
  return (
    <section className="stage-heading">
      <div>
        <h1>
          {explode === 100
            ? 'Component inventory'
            : explode > 0
              ? logical
                ? 'Resources, separated'
                : 'Coming apart'
              : scale.title}
        </h1>
        <div className="stage-meta">
          <p className="eyebrow">{scale.caption}</p>
          <nav className="breadcrumbs" aria-label="Component hierarchy">
            {path.length > 1 && (
              <button
                aria-label="Back one level"
                onClick={() => onNavigate(path[path.length - 2])}
              >
                <ArrowLeft size={14} />
              </button>
            )}
            {path.map((id, i) => (
              <span key={id}>
                {i > 0 && <ChevronRight size={12} />}
                <button
                  aria-current={id === level ? 'page' : undefined}
                  onClick={() => onNavigate(id)}
                >
                  {levels[id].name}
                </button>
              </span>
            ))}
            {selected && selected.shortName !== scale.name && (
              <span>
                <ChevronRight size={12} />
                <span className="crumb-selected">{selected.shortName}</span>
              </span>
            )}
          </nav>
        </div>
        {hint && (
          <p className="first-visit-hint">
            <MousePointerClick size={15} aria-hidden="true" />
            <span>{hintCopy()}</span>
            <button aria-label="Dismiss hint" onClick={onDismissHint}>
              <X size={14} />
            </button>
          </p>
        )}
      </div>
      {count !== null && (
        <output
          className="stage-counter"
          aria-live="polite"
          aria-label={`${count} visible parts`}
        >
          <strong>{count}</strong>
          <span>visible parts</span>
        </output>
      )}
    </section>
  );
}
