'use client';
import {
  ArrowUpRight,
  ChevronRight,
  EyeOff,
  Focus,
  Maximize,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { byId, colors, sources, type Concept } from '@/lib/manifest';
import type { Selection } from '@/lib/explorer-state';
import { levels, type LevelId } from '@/lib/levels';

type Props = {
  /** What the selected piece describes: in a custom build, the part installed. */
  selected: Concept | null;
  selection: Selection | null;
  /** The scale opening the selected piece leads to. */
  opens: LevelId | null;
  level: LevelId;
  isolated: boolean;
  onClose: () => void;
  onSelectConcept: (id: string) => void;
  onDive: (id: string) => void;
  onIsolate: () => void;
  onFocus: () => void;
  onHide: (id: string) => void;
};

export default function DetailPanel({
  selected,
  selection,
  opens,
  level,
  isolated,
  onClose,
  onSelectConcept,
  onDive,
  onIsolate,
  onFocus,
  onHide,
}: Props) {
  // Actions apply to the piece on stage, which keeps its own id whatever part
  // it describes.
  const piece = selection?.concept ?? selected?.id;
  return (
    <Sheet
      open={!!selected}
      modal={false}
      onOpenChange={(open, details) => {
        if (!open && details.reason !== 'outside-press') onClose();
      }}
    >
      <SheetContent
        className="detail-panel"
        side="right"
        showCloseButton={false}
        initialFocus={false}
      >
        {selected && (
          <>
            <div className="detail-top">
              <span style={{ color: colors[selected.category] }}>
                {selected.category} /{' '}
                {selected.representationType === 'logical'
                  ? 'ARCHITECTURE'
                  : 'HARDWARE'}
              </span>
              <button aria-label="Close component details" onClick={onClose}>
                <X size={17} />
              </button>
            </div>
            <SheetTitle>{selected.name}</SheetTitle>
            <div className="instance-label">
              {selection?.instance !== undefined
                ? 'INSTANCE ' + String(selection.instance + 1).padStart(2, '0')
                : 'COMPONENT GROUP'}
            </div>
            <SheetDescription>{selected.description}</SheetDescription>
            <div className="purpose">
              <h3>What it does</h3>
              <p>{selected.purpose}</p>
            </div>
            <div className="quantity">{selected.quantity}</div>
            <dl>
              {Object.entries(selected.specifications).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {selected.parent && (
              <div className="parent-link">
                Part of{' '}
                <button onClick={() => onSelectConcept(selected.parent!)}>
                  {byId[selected.parent].shortName}
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
            {opens && opens !== level && (
              <button className="open-component" onClick={() => onDive(piece!)}>
                Take apart {levels[opens].name}
                <ChevronRight size={17} />
              </button>
            )}
            <div className="detail-actions">
              <button onClick={onIsolate}>
                <Focus size={14} />
                {isolated ? 'Show context' : 'Isolate'}
              </button>
              <button onClick={onFocus}>
                <Maximize size={14} />
                Focus
              </button>
              <button onClick={() => onHide(piece!)}>
                <EyeOff size={14} />
                Hide
              </button>
            </div>
            <p className="accuracy">{selected.physicalAccuracy}</p>
            {selected.sources.length > 0 && (
              <div className="source-links">
                <h3>References & architecture</h3>
                <p>
                  Manufacturer documents and standards explain this component
                  family. Illustrative geometry is not a product schematic.
                </p>
                {selected.sources.map((s) => (
                  <a
                    key={s}
                    href={sources[s].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sources[s].name}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
