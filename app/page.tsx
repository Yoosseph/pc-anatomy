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
  Play,
  Pause,
  PcCase,
  CircuitBoard,
  Zap,
  Fan,
  HardDrive,
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
  levelPath,
  openLevel,
  selectSearch,
  searchConcepts,
  sources,
  type ExplorerState,
  type Selection,
  type Category,
} from '@/lib/manifest';
import {
  branchRoot,
  branches,
  isPhysical,
  levels,
  rootLevel,
  type LevelId,
} from '@/lib/levels';

/** One icon per scale, so the branch you are on is recognisable at a glance. */
const levelIcon: Record<LevelId, typeof Box> = {
  pc: PcCase,
  motherboard: CircuitBoard,
  cpu: Cpu,
  psu: Zap,
  fan: Fan,
  cooler: Fan,
  disk: HardDrive,
  card: Box,
  die: Cpu,
  gpc: Layers3,
  tpc: Layers3,
  sm: Microscope,
};
import Viewer from './viewer';

export default function Home() {
  const [playing, setPlaying] = useState(false);
  const [state, setState] = useState<ExplorerState>(initialState),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [about, setAbout] = useState(false),
    [layers, setLayers] = useState(false),
    [expanded, setExpanded] = useState<Category | null>(null),
    [count, setCount] = useState(0);
  // While a dive is in flight the selection exists only to aim the camera at
  // the part being opened. Showing its panel would flash the outer component's
  // description — and its "Take apart" button — for a few hundred milliseconds
  // before the deeper scale replaces it. The panel appears on arrival instead.
  const selected =
    state.selection && !state.diveInto ? byId[state.selection.concept] : null;
  const level = levels[state.level],
    logical = !isPhysical(state.level),
    path = levelPath(state.level),
    menus = branches(),
    phases = level.phases;
  // The subsystem whose menu is open. Follows wherever you are unless you
  // deliberately open another one.
  const [openMenu, setOpenMenu] = useState<LevelId | null>(null);
  const shownMenu = openMenu ?? branchRoot(state.level);
  const navigate = useCallback((level: LevelId) => {
    setPlaying(false);
    setState((s) => ({
      ...s,
      level,
      diveInto: null,
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
    setPlaying(false);
    setState((s) => ({
      ...initialState,
      cameraRevision: s.cameraRevision + 1,
    }));
    setLayers(false);
  }, []);
  // Descending is one continuous move owned by the scene: the stage clears
  // around the part you clicked while the camera closes in on it, and when the
  // scene reports the stage is clear we swap in the deeper scale, which then
  // grows back out of the same spot. Nothing cuts to black, and no timer here
  // can drift out of step with the animation. `diveInto` is the whole record of
  // a dive in flight, so cancelling one is just clearing it.
  const dive = useCallback((conceptId: string) => {
    if (!openLevel(conceptId)) return false;
    setPlaying(false);
    setLayers(false);
    setState((s) =>
      s.diveInto
        ? s
        : {
            ...s,
            selection: { concept: conceptId },
            isolated: false,
            diveInto: conceptId,
            diveRevision: s.diveRevision + 1,
            focusRevision: s.focusRevision + 1,
            cameraRevision: s.cameraRevision + 1,
          },
    );
    return true;
  }, []);

  const arrive = useCallback(() => {
    setState((s) => {
      const target = s.diveInto ? openLevel(s.diveInto) : null;
      if (!target) return s;
      return {
        ...s,
        level: target,
        explode: 0,
        visible: [...categories],
        hidden: [],
        isolated: false,
        view: 'perspective',
        diveInto: null,
        focusRevision: 0,
        cameraRevision: s.cameraRevision + 1,
        // Arrive with the thing you opened already described.
        selection: { concept: levels[target].concept },
      };
    });
  }, []);

  const choose = useCallback(
    (selection: Selection | null) => {
      if (selection && dive(selection.concept)) return;
      setState((s) => ({ ...s, selection, isolated: false, focusRevision: 0 }));
      setLayers(false);
    },
    [dive],
  );
  const selectResult = (id: string) => {
    setState((s) => selectSearch(s, id));
    setSearch(false);
    setQuery('');
    setLayers(false);
  };
  useEffect(() => {
    document
      .querySelector('input[type=range]')
      ?.setAttribute('aria-label', 'Disassemble the specimen');
    const key = (event: KeyboardEvent) => {
      // A key pressed while nothing is focused reports the document, not an
      // element, and on some soft keyboards the target is the window itself.
      // Reaching for closest() on either throws out of the handler.
      const el = event.target;
      if (
        el instanceof Element &&
        el.closest('input,textarea,[contenteditable=true]')
      )
        return;
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
  // Runs the disassembly slowly enough to follow, and hands control straight
  // back the moment the viewer touches the slider or changes scale.
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      last = performance.now();
    const step = (now: number) => {
      // Clamp the step so one stalled frame — a slow machine, a background
      // tab, a heavy rebuild — cannot teleport the disassembly to the end.
      // The run then takes a little longer on slow hardware but stays watchable.
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      setState((s) => {
        const next = Math.min(100, s.explode + delta * 11);
        if (next >= 100) setPlaying(false);
        return { ...s, explode: next, focusRevision: 0 };
      });
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const setExplode = useCallback((value: number) => {
    setPlaying(false);
    setState((s) => ({ ...s, explode: value, focusRevision: 0 }));
  }, []);

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
            PC Anatomy
          </span>
        </button>
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
      {layers && (
        // Without this the drawer floats over a live 3-D view: a tap meant to
        // dismiss it lands in the scene and selects whatever was behind it.
        <button
          className="drawer-scrim"
          aria-label="Close systems"
          onClick={() => setLayers(false)}
        />
      )}
      <aside
        className={'explorer' + (layers ? ' mobile-open' : '')}
        aria-label="System visibility"
      >
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
              className={state.level === rootLevel ? 'active' : ''}
              aria-current={state.level === rootLevel ? 'true' : undefined}
              onClick={() => {
                setOpenMenu(null);
                navigate(rootLevel);
              }}
            >
              <span>01</span>
              <PcCase size={18} />
              <div>
                {levels[rootLevel].name}
                <small>{levels[rootLevel].summary}</small>
              </div>
              <ChevronRight size={15} />
            </button>

            {menus.map(({ root, label, levels: scales }, index) => {
              const Icon = levelIcon[root];
              const open = shownMenu === root;
              const here = branchRoot(state.level) === root;
              return (
                <div
                  className={'branch' + (open ? ' open' : '') + (here ? ' here' : '')}
                  key={root}
                >
                  <button
                    className="branch-head"
                    aria-expanded={open}
                    onClick={() => setOpenMenu(open ? rootLevel : root)}
                  >
                    <span>{String(index + 2).padStart(2, '0')}</span>
                    <Icon size={18} />
                    <div>
                      {label}
                      <small>
                        {scales.length}{' '}
                        {scales.length === 1 ? 'scale' : 'scales'} inside
                      </small>
                    </div>
                    <ChevronDown size={15} />
                  </button>
                  {open && (
                    <div className="branch-scales">
                      {scales.map((id) => (
                        <button
                          key={id}
                          className={id === state.level ? 'active' : ''}
                          aria-current={id === state.level ? 'true' : undefined}
                          onClick={() => navigate(id)}
                        >
                          <i />
                          <div>
                            {levels[id].name}
                            <small>
                              {levels[id].detailed
                                ? levels[id].summary
                                : levels[id].summary + ' · placeholder'}
                            </small>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="systems-section">
          <div className="section-heading">
            VISIBLE SYSTEMS{' '}
            <button
              onClick={() =>
                setState((s) => ({
                  ...s,
                  visible: s.visible.length === categories.length ? [] : [...categories],
                  hidden: [],
                  selection: null,
                  isolated: false,
                  focusRevision: 0,
                }))
              }
            >
              {state.visible.length === categories.length ? 'Hide all' : 'Show all'}
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
              305 <small>MM</small>
            </strong>
            <span>ATX BOARD</span>
          </div>
          <div>
            <strong>
              5.0 <small>GEN</small>
            </strong>
            <span>PCI EXPRESS</span>
          </div>
          <div>
            <strong>{manifest.length}</strong>
            <span>CONCEPTS</span>
          </div>
        </div>
      </aside>
      <section className="stage-heading">
        <div>
          <p className="eyebrow">{level.caption}</p>
          <h2>
            {state.explode === 100
              ? 'Component inventory'
              : state.explode > 0
                ? logical
                  ? 'Resources, separated'
                  : 'Coming apart'
                : level.title}
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
            {path.map((id, i) => (
              <span key={id}>
                {i > 0 && <ChevronRight size={12} />}
                <button
                  aria-current={id === state.level ? 'page' : undefined}
                  onClick={() => navigate(id)}
                >
                  {levels[id].name}
                </button>
              </span>
            ))}
            {selected && selected.shortName !== level.name && (
              <span>
                <ChevronRight size={12} />
                <span className="crumb-selected">{selected.shortName}</span>
              </span>
            )}
          </nav>
        </div>
        <div className="stage-counter">
          <strong>{count.toString().padStart(3, '0')}</strong>
          <span>PARTS</span>
        </div>
      </section>
      <Viewer
        state={state}
        onSelect={choose}
        onCount={setCount}
        onDived={arrive}
      />
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
              disabled={logical && state.explode > 85 && view !== 'top'}
              aria-pressed={
                logical && state.explode > 85 ? view === 'top' : state.view === view
              }
              className={
                (logical && state.explode > 85
                  ? view === 'top'
                  : state.view === view)
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
      </div>
      <section className="disassembly" aria-label="Explosion control">
        <button
          className={'play' + (playing ? ' running' : '')}
          onClick={() => {
            if (playing) {
              setPlaying(false);
              return;
            }
            // Someone who has asked for less motion gets the end state, not a
            // nine-second animation they did not want.
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
              setState((s) => ({ ...s, explode: 100, focusRevision: 0 }));
              return;
            }
            setState((s) => ({
              ...s,
              explode: s.explode >= 99 ? 0 : s.explode,
              focusRevision: 0,
            }));
            setPlaying(true);
          }}
          aria-label={
            playing ? 'Pause automatic disassembly' : 'Take it apart automatically'
          }
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
          <span>{playing ? 'Pause' : 'Auto'}</span>
        </button>
        <div className="disassembly-label">
          <div>
            <strong>{logical ? 'Expand' : 'Disassemble'}</strong>
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
                onClick={() => setExplode(Number(value))}
              >
                {name}
              </button>
            ))}
          </div>
          <Slider
            value={[state.explode]}
            onValueChange={(value) =>
              setExplode(Array.isArray(value) ? value[0] : value)
            }
            aria-label="Disassemble the specimen"
          />
          <div className="ruler" aria-hidden="true">
            {Array.from({ length: 41 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>
        <output>
          {Math.round(state.explode)}
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
                  <button onClick={() => selectResult(selected.parent!)}>
                    {byId[selected.parent].shortName}
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
              {openLevel(selected.id) &&
                openLevel(selected.id) !== state.level && (
                <button
                  className="open-component"
                  onClick={() => navigate(openLevel(selected.id)!)}
                >
                  Take apart {levels[openLevel(selected.id)!].name}
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
              {selected.sources.length > 0 && (
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
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="about-dialog">
          <DialogTitle>From the case down to a compute core.</DialogTitle>
          <DialogDescription>
            PC Anatomy is an independent, open-source explorer of a whole
            desktop computer.
          </DialogDescription>
          <p>
            Start with an assembled ATX tower, take it apart, and keep going:
            into the motherboard, into the graphics card, and down through the
            GB202 processor to a single streaming multiprocessor. Every scale
            is a branch you can descend or step back out of.
          </p>
          <h3>Two kinds of model.</h3>
          <p>
            <strong>Hardware</strong> is original, approximate mechanical
            geometry. The ATX board outline, the expansion-slot pitch and the
            rear I/O aperture follow the published form factor; everything else
            — which controller sits where, how many regulator phases there are,
            how cables run — is a representative example of the component
            family, not a bill of materials for any real product. No part here
            is a named model except the graphics card.
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
            PC Anatomy source code
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
