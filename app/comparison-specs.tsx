'use client';
import { useRef, type RefObject } from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  comparisonItem,
  comparisonRows,
  type ComparisonLevel,
} from '@/lib/comparison-state';
import { byId } from '@/lib/manifest';
import { levels } from '@/lib/levels';
import { sources } from '@/lib/sources';

type Props = {
  left: ComparisonLevel;
  right: ComparisonLevel;
  open: boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
};

export default function ComparisonSpecs({
  left,
  right,
  open,
  returnFocusRef,
  onOpenChange,
}: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const leftItem = comparisonItem(left),
    rightItem = comparisonItem(right);
  const aligned =
    leftItem.category === rightItem.category &&
    leftItem.kind === rightItem.kind;
  const rows = comparisonRows(left, right);
  return (
    <Sheet open={open} modal={false} onOpenChange={onOpenChange}>
      <SheetContent
        className="comparison-specs"
        side="right"
        showCloseButton={false}
        initialFocus={closeButton}
        finalFocus={returnFocusRef}
      >
        <div className="comparison-specs-heading">
          <div>
            <SheetTitle>Specification comparison</SheetTitle>
            <SheetDescription>
              {aligned
                ? 'Matching fields are aligned. Not listed means the catalogue has no value for that model.'
                : 'Different kinds of parts, with each model’s own specifications.'}
            </SheetDescription>
          </div>
          <button
            ref={closeButton}
            aria-label="Close specification comparison"
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </button>
        </div>
        {aligned ? (
          <table className="comparison-specs-grid">
            <thead>
              <tr className="spec-row spec-head">
                <th scope="col">Specification</th>
                <th scope="col">A · {leftItem.shortName}</th>
                <th scope="col">B · {rightItem.shortName}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  className="spec-row"
                  key={row.id}
                  data-different={
                    Boolean(row.left && row.right && row.left !== row.right) ||
                    undefined
                  }
                >
                  <th scope="row">{row.label}</th>
                  <td>
                    {row.left ?? (
                      <span className="spec-unlisted">Not listed</span>
                    )}
                  </td>
                  <td>
                    {row.right ?? (
                      <span className="spec-unlisted">Not listed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="comparison-independent-specs">
            {[leftItem, rightItem].map((item, i) => (
              <section className="comparison-spec-card" key={item.level}>
                <h3>
                  {i === 0 ? 'A' : 'B'} · {item.name}
                </h3>
                <p>
                  {levels[item.system].name} ·{' '}
                  {item.kind === 'physical'
                    ? 'Hardware'
                    : 'Architecture diagram'}
                </p>
                <dl>
                  {item.specs.map((spec) => (
                    <div key={spec.id}>
                      <dt>{spec.label}</dt>
                      <dd>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
                {!item.specs.length && (
                  <p>No specifications listed for this model.</p>
                )}
              </section>
            ))}
          </div>
        )}
        {aligned && !rows.length && (
          <p className="comparison-specs-note">
            No specifications listed for these models.
          </p>
        )}
        <div className="comparison-source-notes">
          {[leftItem, rightItem].map((item, i) => {
            const concept = byId[levels[item.level].concept];
            return (
              <section key={item.level}>
                <h3>
                  {i === 0 ? 'A' : 'B'} · {item.shortName}
                </h3>
                <p>{concept.physicalAccuracy}</p>
                <ul>
                  {concept.sources.map((id) => (
                    <li key={id}>
                      <a
                        href={sources[id].url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {sources[id].name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
