'use client';
import { useMemo, useRef, useState, type RefObject } from 'react';
import { Check, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  comparisonCategories,
  comparisonItem,
  filterComparisonItems,
  type ComparisonCategoryId,
  type ComparisonLevel,
  type ComparisonSide,
} from '@/lib/comparison-state';
import { levelPath, levels, systemRoots } from '@/lib/levels';

type Props = {
  side: ComparisonSide;
  selected: ComparisonLevel;
  other: ComparisonLevel;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onChoose: (level: ComparisonLevel) => void;
  onClose: () => void;
};

export default function ComparisonPicker({
  side,
  selected,
  other,
  returnFocusRef,
  onChoose,
  onClose,
}: Props) {
  const search = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<ComparisonCategoryId | undefined>(
    comparisonItem(selected).category,
  );
  const [system, setSystem] = useState<ComparisonLevel | undefined>();
  const [query, setQuery] = useState('');
  const matches = useMemo(
    () => filterComparisonItems({ system, query }),
    [system, query],
  );
  const results = category
    ? matches.filter((item) => item.category === category)
    : matches;
  const groups = comparisonCategories
    .map((entry) => ({
      ...entry,
      items: results.filter((item) => item.category === entry.id),
    }))
    .filter((entry) => entry.items.length);
  const clear = () => {
    setCategory(undefined);
    setSystem(undefined);
    setQuery('');
    search.current?.focus();
  };
  const letter = side === 'left' ? 'A' : 'B';
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="comparison-picker"
        showCloseButton={false}
        initialFocus={search}
        finalFocus={returnFocusRef}
      >
        <header className="comparison-picker-heading">
          <div>
            <DialogTitle>Choose part {letter}</DialogTitle>
            <DialogDescription>
              Browse any system. Your other choice stays in place.
            </DialogDescription>
          </div>
          <button aria-label="Close part picker" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="comparison-picker-filters">
          <label className="comparison-search">
            <Search size={17} aria-hidden="true" />
            <input
              ref={search}
              aria-label="Search parts"
              placeholder="Search parts, models or architecture…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="comparison-system-filter">
            <span>System</span>
            <select
              aria-label="System"
              value={system ?? 'all'}
              onChange={(event) =>
                setSystem(
                  event.target.value === 'all'
                    ? undefined
                    : (event.target.value as ComparisonLevel),
                )
              }
            >
              <option value="all">All systems</option>
              {systemRoots.map((root) => (
                <option key={root} value={root}>
                  {levels[root].name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="comparison-picker-body">
          <nav className="comparison-category-nav" aria-label="Part categories">
            <button
              aria-pressed={!category}
              onClick={() => setCategory(undefined)}
            >
              All parts <span aria-hidden="true">{matches.length}</span>
            </button>
            {comparisonCategories.map((entry) => (
              <button
                key={entry.id}
                aria-pressed={category === entry.id}
                onClick={() => setCategory(entry.id)}
              >
                {entry.label}
                <span aria-hidden="true">
                  {matches.filter((item) => item.category === entry.id).length}
                </span>
              </button>
            ))}
          </nav>
          <div className="comparison-results">
            <output className="comparison-result-count">
              {results.length} {results.length === 1 ? 'part' : 'parts'}
            </output>
            {!results.length && (
              <div className="comparison-empty">
                <strong>No matching parts</strong>
                <p>Try another category, system or search.</p>
                <button onClick={clear}>Clear filters</button>
              </div>
            )}
            {groups.map((group) => (
              <section key={group.id} aria-label={group.label}>
                <h3>{group.label}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.level}>
                      <button
                        data-level={item.level}
                        disabled={item.level === other}
                        aria-pressed={item.level === selected}
                        onClick={() => onChoose(item.level)}
                      >
                        <span className="comparison-result-copy">
                          <strong>{item.name}</strong>
                          <small>
                            {levelPath(item.level)
                              .slice(0, -1)
                              .map((level) => levels[level].name)
                              .join(' / ') || levels[item.system].name}
                          </small>
                          <span>{item.note}</span>
                        </span>
                        <span className="comparison-result-kind">
                          {item.level === other
                            ? `On ${letter === 'A' ? 'B' : 'A'}`
                            : item.kind === 'logical'
                              ? 'Diagram'
                              : 'Hardware'}
                        </span>
                        {item.level === selected && (
                          <Check size={16} aria-label="Selected" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
