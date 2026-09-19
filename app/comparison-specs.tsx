'use client';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  comparisonCard,
  type GpuComparisonLevel,
} from '@/lib/comparison-state';

type Props = {
  left: GpuComparisonLevel;
  right: GpuComparisonLevel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ComparisonSpecs({
  left,
  right,
  open,
  onOpenChange,
}: Props) {
  const leftCard = comparisonCard(left),
    rightCard = comparisonCard(right);
  return (
    <Sheet open={open} modal={false} onOpenChange={onOpenChange}>
      <SheetContent
        className="comparison-specs"
        side="right"
        showCloseButton={false}
        initialFocus={false}
      >
        <div className="comparison-specs-heading">
          <div>
            <SheetTitle>Specification comparison</SheetTitle>
            <SheetDescription>
              Published catalogue values, shown without ranking either card.
            </SheetDescription>
          </div>
          <button
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
              <th scope="col">{leftCard.shortName}</th>
              <th scope="col">{rightCard.shortName}</th>
            </tr>
          </thead>
          <tbody>
            {leftCard.specs.map((leftSpec, index) => {
              const rightSpec = rightCard.specs[index],
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
          Sources and modeling accuracy remain available with each card in the
          explorer.
        </p>
      </SheetContent>
    </Sheet>
  );
}
