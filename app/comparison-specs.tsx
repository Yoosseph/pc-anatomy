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
  comparisonGroups,
  comparisonItem,
  type ComparisonGroupId,
  type ComparisonLevel,
} from '@/lib/comparison-state';

type Props = {
  group: ComparisonGroupId;
  left: ComparisonLevel;
  right: ComparisonLevel;
  open: boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
};

export default function ComparisonSpecs({
  group,
  left,
  right,
  open,
  returnFocusRef,
  onOpenChange,
}: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const leftItem = comparisonItem(group, left),
    rightItem = comparisonItem(group, right),
    definition = comparisonGroups[group];
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
              Published {definition.shortLabel} catalogue values, shown without
              ranking either model.
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
        <table className="comparison-specs-grid">
          <thead>
            <tr className="spec-row spec-head">
              <th scope="col">Specification</th>
              <th scope="col">{leftItem.shortName}</th>
              <th scope="col">{rightItem.shortName}</th>
            </tr>
          </thead>
          <tbody>
            {leftItem.specs.map((leftSpec, index) => {
              const rightSpec = rightItem.specs[index],
                different = leftSpec.value !== rightSpec.value;
              return (
                <tr
                  className="spec-row"
                  data-different={different || undefined}
                  key={leftSpec.id}
                >
                  <th scope="row">{leftSpec.label}</th>
                  <td>{leftSpec.value}</td>
                  <td>{rightSpec.value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="comparison-specs-note">
          Sources and modeling accuracy remain available with each model in the
          explorer.
        </p>
      </SheetContent>
    </Sheet>
  );
}
