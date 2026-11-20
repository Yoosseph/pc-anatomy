'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { byId, searchConcepts } from '@/lib/manifest';
import { hueOfSystem, hueStyle } from '@/lib/palette';
import { levels } from '@/lib/levels';
import { t } from '@/lib/i18n/messages';

/** What the palette offers before anything has been typed. */
const suggested = [
  'package',
  'gddr7',
  'gpc',
  'sm',
  'tensor',
  'rt',
  'l2',
  'vrm',
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
};

export default function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onSelect,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="search-dialog">
        <DialogTitle>{t.search.title}</DialogTitle>
        <DialogDescription>{t.search.description}</DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onQueryChange}
            placeholder={t.search.placeholder}
          />
          <CommandList>
            <CommandEmpty>{t.search.empty}</CommandEmpty>
            <CommandGroup
              heading={query ? t.search.matches : t.search.suggested}
            >
              {(query
                ? searchConcepts(query)
                : suggested.map((id) => byId[id])
              ).map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  style={hueStyle(hueOfSystem(c.category))}
                  onSelect={() => onSelect(c.id)}
                >
                  <i />
                  <div>
                    {c.name}
                    <small>
                      <span>{levels[c.level].name}</span>
                      <em>
                        <b>{t.categories[c.category]}</b> ·{' '}
                        {c.representationType === 'logical'
                          ? t.search.logical
                          : t.search.physical}
                      </em>
                    </small>
                  </div>
                  <ArrowUpRight size={15} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="search-hint">
          {t.search.browse} <span>{t.search.inspect}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
