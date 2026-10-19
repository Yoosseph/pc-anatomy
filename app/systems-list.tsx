'use client';
import { systemRoot, type LevelId } from '@/lib/levels';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { categories, colors, manifest, type Category } from '@/lib/manifest';

type Props = {
  level: LevelId;
  visible: Category[];
  hidden: string[];
  onToggleCategory: (category: Category) => void;
  onToggleAll: () => void;
  onSetConceptVisible: (
    id: string,
    category: Category,
    visible: boolean,
  ) => void;
  onSelectConcept: (id: string) => void;
};

export default function SystemsList({
  level,
  visible,
  hidden,
  onToggleCategory,
  onToggleAll,
  onSetConceptVisible,
  onSelectConcept,
}: Props) {
  // Which system is unfolded to show its parts. Nothing outside this list
  // cares, so it stays here rather than in the explorer's own state.
  const [expanded, setExpanded] = useState<Category | null>(null);
  return (
    <div className="systems-section">
      <div className="section-heading">
        VISIBLE SYSTEMS{' '}
        <button onClick={onToggleAll}>
          {visible.length === categories.length ? 'Hide all' : 'Show all'}
        </button>
      </div>
      <div className="layer-scroll">
        {categories.map((category) => (
          <div key={category}>
            <div className="layer-row">
              <button
                className="category-visibility"
                aria-pressed={visible.includes(category)}
                aria-label={
                  (visible.includes(category) ? 'Hide ' : 'Show ') + category
                }
                onClick={() => onToggleCategory(category)}
              >
                <i style={{ background: colors[category] }} />
                <span>{category}</span>
                <small>{visible.includes(category) ? 'On' : 'Off'}</small>
              </button>
              <button
                className="category-expand"
                onClick={() =>
                  setExpanded(expanded === category ? null : category)
                }
                aria-expanded={expanded === category}
                aria-label={
                  (expanded === category ? 'Hide ' : 'Show ') +
                  category +
                  ' components'
                }
              >
                <ChevronDown size={12} />
              </button>
            </div>
            {expanded === category && (
              <div className="sublayers">
                {manifest
                  .filter(
                    (c) =>
                      c.category === category &&
                      c.open !== c.level &&
                      systemRoot(c.level) === systemRoot(level),
                  )
                  .map((c) => (
                    <div key={c.id}>
                      <button onClick={() => onSelectConcept(c.id)}>
                        {c.shortName}
                      </button>
                      <Switch
                        size="sm"
                        checked={
                          visible.includes(category) && !hidden.includes(c.id)
                        }
                        onCheckedChange={(checked) =>
                          onSetConceptVisible(c.id, category, checked)
                        }
                        aria-label={
                          (visible.includes(category) && !hidden.includes(c.id)
                            ? 'Hide '
                            : 'Show ') + c.name
                        }
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
