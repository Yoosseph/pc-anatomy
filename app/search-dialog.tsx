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
        <DialogTitle>Find a component</DialogTitle>
        <DialogDescription>
          Jump to any hardware or architecture resource.
        </DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onQueryChange}
            placeholder="Try Tensor, GDDR7, L2 or SM…"
          />
          <CommandList>
            <CommandEmpty>
              No matching components. Try “memory” or “CUDA”.
            </CommandEmpty>
            <CommandGroup
              heading={query ? 'Matching structures' : 'Explore the specimen'}
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
                        <b>{c.category}</b> ·{' '}
                        {c.representationType === 'logical'
                          ? 'Logical architecture'
                          : 'Physical hardware'}
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
          ↑ ↓ to browse <span>Enter to inspect</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
