'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  Cpu,
  Search,
  RotateCcw,
  Layers3,
  ArrowUpRight,
  Maximize,
  Info,
  ChevronRight,
  ArrowLeft,
  X,
  Focus,
  EyeOff,
  Box,
  Microscope,
  ChevronDown,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';

import {
  byId,
  manifest,
  categories,
  colors,
  initialState,
  levelNames,
  levelPath,
  selectSearch,
  searchConcepts,
  sources,
  type ExplorerState,
  type Level,
  type Selection,
  type Category,
} from '@/lib/manifest';
import Viewer from './viewer';

export default function Home() {
  const [state, setState] = useState<ExplorerState>(initialState),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [about, setAbout] = useState(false),
    [layers, setLayers] = useState(false),
    [expanded, setExpanded] = useState<Category | null>(null),
    [count, setCount] = useState(0);
  const selected = state.selection ? byId[state.selection.concept] : null;
  const logical = state.level !== 'card',
    path = levelPath[state.level];
  const phases = logical
    ? [
        ['Grouped', 0],
        ['Resources', 25],
        ['Partitions', 50],
        ['Separated', 75],
        ['Inventory', 100],
      ]
    : [
        ['Assembled', 0],
        ['Cooling', 25],
        ['Board', 50],
        ['Silicon', 75],
        ['Inventory', 100],
      ];
  const navigate = useCallback((level: Level) => {
    setState((s) => ({
      ...s,
      level,
      explode: 0,
      selection: null,
      isolated: false,
      focusRevision: 0,
      cameraRevision: s.cameraRevision + 1,
      visible: [...categories],
      hidden: [],
      view: 'perspective',
    }));
    setLayers(false);
  }, []);
  const reset = useCallback(() => {
    setState((s) => ({
      ...initialState,
      cameraRevision: s.cameraRevision + 1,
    }));
    setLayers(false);
  }, []);
  const choose = useCallback((selection: Selection | null) => {
    setState((s) => ({ ...s, selection, isolated: false, focusRevision: 0 }));
    setLayers(false);
  }, []);
  const selectResult = (id: string) => {
    setState((s) => selectSearch(s, id));
    setSearch(false);
    setQuery('');
    setLayers(false);
  };
  useEffect(() => {
    document
      .querySelector('input[type=range]')
      ?.setAttribute('aria-label', 'Explode GPU');
    const key = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement;
      if (el.closest('input,textarea,[contenteditable=true]')) return;
      if (event.key === '/') {
        event.preventDefault();
        setSearch(true);
      }
      if (event.key === 'Escape') {
        setState((s) => ({
          ...s,
          selection: null,
          isolated: false,
          focusRevision: 0,
        }));
        setLayers(false);
      }
      if (event.key === 'Backspace' && path.length > 1) {
        event.preventDefault();
        navigate(path[path.length - 2]);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [navigate, path]);
  const toggle = (category: Category) =>
    setState((s) => ({
      ...s,
      visible: s.visible.includes(category)
        ? s.visible.filter((c) => c !== category)
        : [...s.visible, category],
      selection:
        s.selection && byId[s.selection.concept].category === category
          ? null
          : s.selection,
      isolated: false,
      focusRevision: 0,
    }));
  return (
    <main
      className={
        'workbench' +
        (selected ? ' has-selection' : '') +
        (logical ? ' logical' : '')
      }
    >
      <header className="topbar">
        <button
          className="brand"
          onClick={reset}
          aria-label="Restore complete GPU"
        >
          <span className="brand-icon">
            <Cpu size={21} />
          </span>
          <span>
            DIEDIVE<small>HARDWARE, UNDERSTOOD.</small>
          </span>
        </button>
        <div className="header-specimen">
          <span className="live-dot" /> SPECIMEN 001 <span>/</span> NVIDIA
          BLACKWELL
        </div>
        <div className="header-actions">
          <button
            className="mobile-layers"
            onClick={() => setLayers(!layers)}
            aria-label="Toggle systems"
            aria-expanded={layers}
          >
            <Layers3 size={19} />
          </button>
          <button
            className="search-button"
            aria-label="Find a component"
            onClick={() => setSearch(true)}
          >
            <Search size={16} />
            <span>Search components</span>
            <kbd>/</kbd>
          </button>
          <button
            className="info-button"
            aria-label="About and sources"
            onClick={() => setAbout(true)}
          >
            <Info size={19} />
          </button>
        </div>
      </header>
      <aside
        className={'explorer' + (layers ? ' mobile-open' : '')}
        aria-label="System visibility"
      >
        <div className="specimen-heading">
          <p className="eyebrow">THE REFERENCE SPECIMEN</p>
          <h1>
            GeForce
            <br />
            <strong>RTX 5090</strong>
          </h1>
          <p>GB202 · Blackwell architecture</p>
          <div className="specimen-index">
            <span>01</span>
            <div>
              Desktop graphics processor
              <small>Physical & architectural model</small>
            </div>
          </div>
        </div>
        <div className="explore-section">
          <div className="section-heading">
            EXPLORE BY SCALE
            <button
              className="mobile-close"
              aria-label="Close systems"
              onClick={() => setLayers(false)}
            >
              <X size={17} />
            </button>
          </div>
          <nav className="scale-navigation" aria-label="Exploration scale">
            <button
              className={!logical && state.explode < 30 ? 'active' : ''}
              onClick={() => navigate('card')}
            >
              <span>01</span>
              <Box size={18} />
              <div>
                Complete assembly<small>The whole graphics card</small>
              </div>
              <ChevronRight size={15} />
            </button>
            <button
              className={!logical && state.explode >= 30 ? 'active' : ''}
              onClick={() => {
                setState((s) => ({
                  ...s,
                  level: 'card',
                  explode: 48,
                  visible: categories.filter((c) => c !== 'Cooling'),
                  selection: null,
                  hidden: [],
                  isolated: false,
                  focusRevision: 0,
                  cameraRevision: s.cameraRevision + 1,
                }));
                setLayers(false);
              }}
            >
              <span>02</span>
              <Layers3 size={18} />
              <div>
                Circuit board<small>Packages, power & connections</small>
              </div>
              <ChevronRight size={15} />
            </button>
            <button
              className={state.level === 'die' ? 'active' : ''}
              onClick={() => navigate('die')}
            >
              <span>03</span>
              <Cpu size={18} />
              <div>
                GPU architecture<small>Inside the Blackwell chip</small>
              </div>
              <ChevronRight size={15} />
            </button>
            <button
              className={
                ['gpc', 'tpc', 'sm'].includes(state.level) ? 'active' : ''
              }
              onClick={() => navigate('sm')}
            >
              <span>04</span>
              <Microscope size={18} />
              <div>
                Compute resources
                <small>Inside a streaming multiprocessor</small>
              </div>
              <ChevronRight size={15} />
            </button>
          </nav>
        </div>
        <div className="systems-section">
          <div className="section-heading">
            VISIBLE SYSTEMS{' '}
            <button
              onClick={() =>
                setState((s) => ({
                  ...s,
                  visible: s.visible.length === 6 ? [] : [...categories],
                  hidden: [],
                  selection: null,
                  isolated: false,
                  focusRevision: 0,
                }))
              }
            >
              {state.visible.length === 6 ? 'Hide all' : 'Show all'}
            </button>
          </div>
          <div className="layer-scroll">
            {categories.map((category) => (
              <div key={category}>
                <div className="layer-row">
                  <i style={{ background: colors[category] }} />
                  <button
                    className="category-name"
                    onClick={() =>
                      setExpanded(expanded === category ? null : category)
                    }
                    aria-expanded={expanded === category}
                  >
                    {category}
                    <ChevronDown size={12} />
                  </button>
                  <Switch
                    checked={state.visible.includes(category)}
                    onCheckedChange={() => toggle(category)}
                    aria-label={category + ' visibility'}
                  />
                </div>
                {expanded === category && (
                  <div className="sublayers">
                    {manifest
                      .filter((c) => c.category === category && c.id !== 'card')
                      .map((c) => (
                        <div key={c.id}>
                          <button onClick={() => selectResult(c.id)}>
                            {c.shortName}
                          </button>
                          <Switch
                            size="sm"
                            checked={
                              state.visible.includes(category) &&
                              !state.hidden.includes(c.id)
                            }
                            onCheckedChange={(checked) =>
                              setState((s) => ({
                                ...s,
                                visible:
                                  checked && !s.visible.includes(category)
                                    ? [...s.visible, category]
                                    : s.visible,
                                hidden: checked
                                  ? s.hidden.filter((x) => x !== c.id)
                                  : [...s.hidden, c.id],
                                selection: null,
                                isolated: false,
                                focusRevision: 0,
                              }))
                            }
                            aria-label={c.name + ' visibility'}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="reference-stats">
          <div>
            <strong>
              32 <small>GB</small>
            </strong>
            <span>GDDR7 MEMORY</span>
          </div>
          <div>
            <strong>
              92.2 <small>B</small>
            </strong>
            <span>TRANSISTORS</span>
          </div>
          <div>
            <strong>170</strong>
            <span>ENABLED SMs</span>
          </div>
        </div>
      </aside>
      <section className="stage-heading">
        <div>
          <p className="eyebrow">
            {logical ? 'ARCHITECTURAL SCALE' : 'PHYSICAL SCALE'}
          </p>
          <h2>
            {state.level === 'card'
              ? state.explode === 100
                ? 'Component inventory'
                : state.explode > 0
                  ? 'Beneath the enclosure'
                  : 'The complete assembly.'
              : state.level === 'die'
                ? 'GB202 architecture.'
                : state.level === 'sm'
                  ? 'Streaming Multiprocessor.'
                  : state.level === 'gpc'
                    ? 'Graphics Processing Cluster.'
                    : 'Texture Processing Cluster.'}
          </h2>
          <nav className="breadcrumbs" aria-label="Component hierarchy">
            {path.length > 1 && (
              <button
                aria-label="Back one level"
                onClick={() => navigate(path[path.length - 2])}
              >
                <ArrowLeft size={14} />
              </button>
            )}
            {path.map((level, i) => (
              <span key={level}>
                {i > 0 && <ChevronRight size={12} />}
                <button
                  aria-current={level === state.level ? 'page' : undefined}
                  onClick={() => navigate(level)}
                >
                  {levelNames[level]}
                </button>
              </span>
            ))}
            {selected && (
              <span>
                <ChevronRight size={12} />
                <span className="crumb-selected">{selected.shortName}</span>
              </span>
            )}
          </nav>
        </div>
        <div className="stage-counter">
          <strong>{count.toString().padStart(3, '0')}</strong>
          <span>VISIBLE STRUCTURES</span>
        </div>
      </section>
      <Viewer state={state} onSelect={choose} onCount={setCount} />
      {!count && (
        <div className="empty-scene">
          <EyeOff size={27} />
          <h3>No structures visible</h3>
          <button
            onClick={() =>
              setState((s) => ({
                ...s,
                visible: [...categories],
                hidden: [],
                isolated: false,
              }))
            }
          >
            Show all systems
          </button>
        </div>
      )}
      <div className="stage-tools">
        <div className="view-controls" aria-label="Camera controls">
          {(['perspective', 'top', 'front', 'back'] as const).map((view, i) => (
            <button
              key={view}
              title={view[0].toUpperCase() + view.slice(1) + ' view'}
              aria-label={view[0].toUpperCase() + view.slice(1) + ' view'}
              disabled={state.explode > 85 && view !== 'top'}
              aria-pressed={
                state.explode > 85 ? view === 'top' : state.view === view
              }
              className={
                (state.explode > 85 ? view === 'top' : state.view === view)
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setState((s) => ({
                  ...s,
                  view,
                  focusRevision: 0,
                  cameraRevision: s.cameraRevision + 1,
                }))
              }
            >
              {['3D', 'TOP', 'FRONT', 'BACK'][i]}
            </button>
          ))}
          <span />
          <button
            title="Fit visible components"
            aria-label="Fit visible components"
            onClick={() =>
              setState((s) => ({
                ...s,
                focusRevision: 0,
                cameraRevision: s.cameraRevision + 1,
              }))
            }
          >
            <Maximize size={15} />
          </button>
        </div>
        <span className="orbit-hint">
          DRAG TO ORBIT <span>·</span> SCROLL TO ZOOM
        </span>
      </div>
      <section className="disassembly" aria-label="Explosion control">
        <div className="disassembly-label">
          <Layers3 size={19} />
          <div>
            <strong>{logical ? 'Expand architecture' : 'Disassemble'}</strong>
            <span>
              {state.explode === 100
                ? 'EVERY VISIBLE STRUCTURE'
                : state.explode === 0
                  ? 'START EXPLORING'
                  : !logical && state.explode < 60
                    ? 'HARDWARE SEPARATION'
                    : 'LOGICAL STRUCTURES'}
            </span>
          </div>
        </div>
        <div className="timeline">
          <div className="phase-labels">
            {phases.map(([name, value]) => (
              <button
                key={name}
                className={
                  Math.abs(state.explode - Number(value)) < 13 ? 'active' : ''
                }
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    explode: Number(value),
                    focusRevision: 0,
                  }))
                }
              >
                {name}
              </button>
            ))}
          </div>
          <Slider
            value={[state.explode]}
            onValueChange={(value) =>
              setState((s) => ({
                ...s,
                explode: Array.isArray(value) ? value[0] : value,
                focusRevision: 0,
              }))
            }
            aria-label="Explode GPU"
          />
          <div className="ruler" aria-hidden="true">
            {Array.from({ length: 41 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>
        <output>
          {state.explode}
          <small>%</small>
        </output>
        <button
          className="reset"
          aria-label="Reset camera and assembly"
          onClick={reset}
        >
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </section>
      <footer>
        <span>
          <i className="live-dot" />
          {state.level === 'gpc'
            ? 'REPRESENTATIVE FULL GPC · NOT THE ENABLED RTX 5090 MAP'
            : logical || state.explode > 60
              ? 'LOGICAL ARCHITECTURE · NOT A PHYSICAL DIE FLOORPLAN'
              : 'ORIGINAL EDUCATIONAL MODEL · PHYSICAL GEOMETRY IS APPROXIMATE'}
        </span>
        <button onClick={() => setAbout(true)}>
          Sources & methodology
          <ArrowUpRight size={13} />
        </button>
      </footer>
      <Dialog open={search} onOpenChange={setSearch}>
        <DialogContent className="search-dialog">
          <DialogTitle>Find a component</DialogTitle>
          <DialogDescription>
            Jump to any hardware or architecture resource.
          </DialogDescription>
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
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
                  : [
                      'package',
                      'gddr7',
                      'gpc',
                      'sm',
                      'tensor',
                      'rt',
                      'l2',
                      'vrm',
                    ].map((id) => byId[id])
                ).map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => selectResult(c.id)}
                  >
                    <i style={{ background: colors[c.category] }} />
                    <div>
                      {c.name}
                      <small>
                        {c.category} ·{' '}
                        {c.representationType === 'logical'
                          ? 'Logical architecture'
                          : 'Physical hardware'}
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
      <Sheet
        open={!!selected}
        modal={false}
        onOpenChange={(open, details) => {
          if (!open && details.reason !== 'outside-press') choose(null);
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
                <button
                  aria-label="Close component details"
                  onClick={() => choose(null)}
                >
                  <X size={17} />
                </button>
              </div>
              <SheetTitle>{selected.name}</SheetTitle>
              <div className="instance-label">
                {state.selection?.instance !== undefined
                  ? 'INSTANCE ' +
                    String(state.selection.instance + 1).padStart(2, '0')
                  : 'COMPONENT GROUP'}
              </div>
              <SheetDescription>{selected.description}</SheetDescription>
              <p className="purpose">{selected.purpose}</p>
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
                  <button onClick={() => selectResult(selected.parent!)}>
                    {byId[selected.parent].shortName}
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
              {selected.open && (
                <button
                  className="open-component"
                  onClick={() => navigate(selected.open!)}
                >
                  Open {selected.open === 'die' ? 'GB202' : selected.shortName}
                  <ChevronRight size={17} />
                </button>
              )}
              <div className="detail-actions">
                <button
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      isolated: !s.isolated,
                      focusRevision: s.focusRevision + 1,
                      cameraRevision: s.cameraRevision + 1,
                    }))
                  }
                >
                  <Focus size={14} />
                  {state.isolated ? 'Show context' : 'Isolate'}
                </button>
                <button
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      focusRevision: s.focusRevision + 1,
                      cameraRevision: s.cameraRevision + 1,
                    }))
                  }
                >
                  <Maximize size={14} />
                  Focus
                </button>
                <button
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      hidden: [...s.hidden, selected.id],
                      selection: null,
                      isolated: false,
                      focusRevision: 0,
                    }))
                  }
                >
                  <EyeOff size={14} />
                  Hide
                </button>
              </div>
              <p className="accuracy">{selected.physicalAccuracy}</p>
              <div className="source-links">
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
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="about-dialog">
          <DialogTitle>From cooler to compute core.</DialogTitle>
          <DialogDescription>
            DieDive is an independent, open-source GPU anatomy explorer.
          </DialogDescription>
          <p>
            Explore a modern GPU from the cooler down to its compute cores. The
            reference is the NVIDIA GeForce RTX 5090, powered by GB202.
          </p>
          <h3>Two scales. One specimen.</h3>
          <p>
            <strong>Hardware</strong> is an original, approximate mechanical
            model. Board layout, power stages and cooling details are
            illustrative, not manufacturing or repair data.
          </p>
          <p>
            <strong>Silicon</strong> shows documented logical architecture.
            Exact transistor-level placement is not publicly available. A full
            GB202 has 192 SMs; the RTX 5090 enables 170. GPC interiors show a
            representative full cluster, not an invented map of disabled units.
          </p>
          <h3>Research & credits</h3>
          {Object.entries(sources)
            .slice(0, 2)
            .map(([id, s]) => (
              <a
                className="about-source"
                key={id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                {s.name}
                <ArrowUpRight size={15} />
              </a>
            ))}
          <a
            className="about-source"
            href="https://github.com/ashemag/human-atlas"
            target="_blank"
            rel="noreferrer"
          >
            Interaction inspiration · Human Atlas
            <ArrowUpRight size={15} />
          </a>
          <a
            className="about-source"
            href="https://github.com/Yoosseph/gpu_anatomy"
            target="_blank"
            rel="noreferrer"
          >
            DieDive source code · MIT license
            <ArrowUpRight size={15} />
          </a>
          <p className="about-foot">
            No affiliation with NVIDIA. No third-party model assets. Research
            reviewed September 2026.
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
