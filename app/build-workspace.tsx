'use client';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  CircleCheck,
  CircleX,
  CircuitBoard,
  Cpu,
  Fan,
  Gpu,
  HardDrive,
  LoaderCircle,
  MemoryStick,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plug,
  RotateCcw,
  Share2,
  TriangleAlert,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { sources } from '@/lib/manifest';
import {
  buildStatus,
  checkBuild,
  checkSlots,
  optionFit,
  slotStatus,
  type BuildCheck,
  type CheckStatus,
} from '@/lib/build-checks';
import {
  brandName,
  changedParts,
  graphicsOptions,
  isCustomBuild,
  plural,
  powerOptions,
  processorOptions,
  slotOptions,
  slots,
  type Brand,
  type BuildSlot,
  type DesktopBuild,
} from '@/lib/desktop-build';
import { partFacts, type Meter } from '@/lib/part-facts';
import './build.css';

const statusIcon = {
  ok: CircleCheck,
  warn: TriangleAlert,
  fail: CircleX,
} satisfies Record<CheckStatus, typeof CircleCheck>;
const statusWord: Record<CheckStatus, string> = {
  ok: 'Works',
  warn: 'Check',
  fail: 'Problem',
};
const slotIcon = {
  processor: Cpu,
  cooler: Fan,
  board: CircuitBoard,
  memory: MemoryStick,
  storage: HardDrive,
  graphics: Gpu,
  power: Plug,
} satisfies Record<BuildSlot, typeof Cpu>;
/** Short names for the slot tags on each check. */
const slotTag: Record<BuildSlot, string> = {
  processor: 'CPU',
  cooler: 'Cooler',
  board: 'Board',
  memory: 'RAM',
  storage: 'Storage',
  graphics: 'GPU',
  power: 'PSU',
};
const slotLabel = Object.fromEntries(
  slots.map(({ id, label }) => [id, label]),
) as Record<BuildSlot, string>;

/** Each slot's colour, used on its icon, its options and its check tags. */
const tint = (slot: BuildSlot) =>
  ({ '--slot': `var(--slot-${slot})` }) as CSSProperties;

type SetPart = <S extends BuildSlot>(slot: S, part: DesktopBuild[S]) => void;
type Props = {
  build: DesktopBuild;
  /** The tower on the stage is still being rebuilt for the last choice. */
  fitting: boolean;
  /** The slot whose piece was last clicked in the tower. */
  focus: BuildSlot | null;
  airflow: boolean;
  power: boolean;
  onSetPart: SetPart;
  onRestore: () => void;
  onExit: () => void;
  onToggleAirflow: () => void;
  onTogglePower: () => void;
};

/**
 * Build your own desktop, as its own page: the parts on one side, the tower
 * in the middle, and on the other side whether the parts work together.
 * Either side folds away to a slim rail, to give the tower the room.
 *
 * The 3D viewer is not part of this component. The page draws the same
 * viewer for the explorer and for this workspace, so opening it keeps the
 * scene and the tower already built, and only the layout around it changes.
 * The stylesheet sizes the viewer from which panels are open.
 */
export default function BuildWorkspace({
  build,
  fitting,
  focus,
  airflow,
  power,
  onSetPart,
  onRestore,
  onExit,
  onToggleAirflow,
  onTogglePower,
}: Props) {
  const checks = checkBuild(build);
  const overall = buildStatus(checks);
  const flagged = checks.filter((c) => c.status !== 'ok').length;
  // On a phone the parts and the report share the space under the tower,
  // and the sheet can drop away to give the tower the screen.
  const [tab, setTab] = useState<'parts' | 'checks'>('parts');
  const [sheet, setSheet] = useState(true);
  const [partsShown, setPartsOpen] = useState(true);
  const [checksShown, setChecksOpen] = useState(true);
  // A phone has no rails: the tabs take turns instead, so a panel folded on
  // a wider screen opens again here.
  const narrow = useNarrow();
  const partsOpen = partsShown || narrow,
    checksOpen = checksShown || narrow;
  // One slot open at a time: the build reads as a list, and a slot with
  // many options does not push every other slot off the panel.
  const [open, setOpen] = useState<BuildSlot | null>(null);
  // A piece clicked in the tower opens its slot, wherever the panel is.
  const [seen, setSeen] = useState(focus);
  if (focus !== seen) {
    setSeen(focus);
    if (focus) {
      setOpen(focus);
      setPartsOpen(true);
      setTab('parts');
      setSheet(true);
    }
  }
  const changed = changedParts(build);
  const showSlot = (slot: BuildSlot) => {
    setOpen(slot);
    setPartsOpen(true);
  };

  return (
    <>
      <header className="build-topbar">
        <button className="build-back" onClick={onExit}>
          <ChevronLeft size={17} aria-hidden="true" />
          <span>Explorer</span>
        </button>
        <div className="build-title">
          <span className="build-title-icon" aria-hidden="true">
            <Wrench size={17} />
          </span>
          <div>
            <h1>Build your PC</h1>
            <p>
              {changed
                ? `${plural(changed, 'part')} changed from the original machine`
                : 'The original machine'}
            </p>
          </div>
        </div>
        <ShareBuild />
      </header>

      <div
        className={'build-panels' + (sheet ? '' : ' sheet-down')}
        data-tab={tab}
      >
        <div className="build-tabs" role="tablist" aria-label="Build panels">
          <button
            role="tab"
            aria-selected={tab === 'parts'}
            onClick={() => {
              setTab('parts');
              setSheet(true);
            }}
          >
            Parts
            {changed > 0 && <span className="build-tab-count">{changed}</span>}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'checks'}
            onClick={() => {
              setTab('checks');
              setSheet(true);
            }}
            className={'status-' + overall}
          >
            Checks
            {flagged > 0 && (
              <span className="build-tab-count status">{flagged}</span>
            )}
          </button>
          <button
            className="build-sheet-toggle"
            aria-expanded={sheet}
            aria-label={sheet ? 'Hide the panels' : 'Show the panels'}
            onClick={() => setSheet((shown) => !shown)}
          >
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        </div>

        <section
          id="build-parts"
          className={'build-parts' + (partsOpen ? '' : ' collapsed')}
          aria-label="Parts"
        >
          <PanelHead
            title="Parts"
            note={`${slots.length} slots`}
            open={partsOpen}
            side="left"
            controls="build-parts"
            onToggle={() => setPartsOpen(!partsOpen)}
          />
          {partsOpen ? (
            <div className="build-scroll">
              <ol className="build-slots">
                {slots.map(({ id }) => (
                  <SlotSection
                    key={id}
                    slot={id}
                    build={build}
                    checks={checks}
                    open={open === id}
                    focused={focus === id}
                    onToggle={() =>
                      setOpen((current) => (current === id ? null : id))
                    }
                    onSetPart={onSetPart}
                  />
                ))}
              </ol>
              <p className="build-fixed">
                The case stays the same in every build: an ATX tower with
                standoffs for ATX and micro-ATX boards, room for a 420 mm card
                and three 120 mm front fans.
              </p>
            </div>
          ) : (
            <SlotRail build={build} checks={checks} onShow={showSlot} />
          )}
        </section>

        <section
          id="build-report"
          className={'build-report' + (checksOpen ? '' : ' collapsed')}
          aria-label="Compatibility"
        >
          <PanelHead
            title="Compatibility"
            note={plural(checks.length, 'check')}
            open={checksOpen}
            side="right"
            controls="build-report"
            onToggle={() => setChecksOpen(!checksOpen)}
          />
          {checksOpen ? (
            <div className="build-scroll">
              <Verdict checks={checks} />
              <PowerBudget build={build} />
              <ul className="build-checks">
                {checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
              <p className="build-note">
                Figures are each maker’s published numbers, or measurements of
                the modelled case. A supply below a recommendation may still run
                the machine; one below a stated minimum is not supported by the
                card’s maker.
              </p>
              {isCustomBuild(build) && (
                <button className="build-restore" onClick={onRestore}>
                  <RotateCcw size={13} aria-hidden="true" />
                  Back to the original build
                </button>
              )}
            </div>
          ) : (
            <VerdictRail
              status={overall}
              flagged={flagged}
              onShow={() => setChecksOpen(true)}
            />
          )}
        </section>
      </div>

      <div className="build-stage-bar">
        {fitting && (
          <output className="build-fitting" aria-live="polite">
            <LoaderCircle size={14} aria-hidden="true" />
            Fitting the parts…
          </output>
        )}
        <button aria-pressed={airflow} onClick={onToggleAirflow}>
          <Wind size={14} aria-hidden="true" />
          Airflow
        </button>
        <button aria-pressed={power} onClick={onTogglePower}>
          <Zap size={14} aria-hidden="true" />
          Power
        </button>
      </div>
    </>
  );
}

/** Whether the screen is the phone layout, which shows no rails. */
function useNarrow() {
  const query = '(max-width: 900px)';
  const [narrow, setNarrow] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia(query).matches,
  );
  useEffect(() => {
    const list = matchMedia(query);
    const change = () => setNarrow(list.matches);
    list.addEventListener('change', change);
    return () => list.removeEventListener('change', change);
  }, []);
  return narrow;
}

/** A panel's title, and the button that folds it away or brings it back. */
function PanelHead({
  title,
  note,
  open,
  side,
  controls,
  onToggle,
}: {
  title: string;
  note: string;
  open: boolean;
  side: 'left' | 'right';
  controls: string;
  onToggle: () => void;
}) {
  const Icon =
    side === 'left'
      ? open
        ? PanelLeftClose
        : PanelLeftOpen
      : open
        ? PanelRightClose
        : PanelRightOpen;
  return (
    <div className="build-panel-head">
      {open && (
        <h2>
          {title}
          <small>{note}</small>
        </h2>
      )}
      <button
        className="build-collapse"
        aria-expanded={open}
        aria-controls={controls}
        aria-label={`${open ? 'Hide' : 'Show'} ${title.toLowerCase()}`}
        title={`${open ? 'Hide' : 'Show'} ${title.toLowerCase()}`}
        onClick={onToggle}
      >
        <Icon size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Copies the address, which carries the build, so it can be sent on. */
function ShareBuild() {
  const [copied, setCopied] = useState<'yes' | 'no' | null>(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied('yes');
    } catch {
      setCopied('no');
    }
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 2200);
  };
  return (
    <button
      className="build-share"
      onClick={copy}
      title="Copy a link to this build"
    >
      {copied === 'yes' ? (
        <Check size={15} aria-hidden="true" />
      ) : (
        <Share2 size={15} aria-hidden="true" />
      )}
      <span aria-live="polite">
        {copied === 'yes'
          ? 'Link copied'
          : copied === 'no'
            ? 'Copy the address bar'
            : 'Share your build'}
      </span>
    </button>
  );
}

/**
 * One slot: what is in it, and when opened, every part it can take, each
 * with the facts the checks compare and whether it would work here.
 */
function SlotSection({
  slot,
  build,
  checks,
  open,
  focused,
  onToggle,
  onSetPart,
}: {
  slot: BuildSlot;
  build: DesktopBuild;
  checks: BuildCheck[];
  open: boolean;
  focused: boolean;
  onToggle: () => void;
  onSetPart: SetPart;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (open && focused)
      ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open, focused]);
  const Icon = slotIcon[slot];
  const status = slotStatus(checks, slot);
  const StatusIcon = statusIcon[status];
  const options = slotOptions(slot);
  const chosen = options.find((o) => o.id === build[slot])!;
  const brands = [
    ...new Set(options.flatMap((o) => (o.brand ? [o.brand] : []))),
  ];
  const [brand, setBrand] = useState<Brand | 'all'>('all');
  const shown =
    brand === 'all' ? options : options.filter((o) => o.brand === brand);
  const panel = `build-options-${slot}`;
  return (
    <li
      ref={ref}
      className={
        'build-slot' +
        (open ? ' open' : '') +
        (focused ? ' focused' : '') +
        ' status-' +
        status
      }
      style={tint(slot)}
    >
      <button
        className="build-slot-head"
        aria-expanded={open}
        aria-controls={panel}
        onClick={onToggle}
      >
        <span className="build-slot-icon" aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className="build-slot-text">
          <span className="build-slot-label">{slotLabel[slot]}</span>
          <strong>{chosen.name}</strong>
          <small>{chosen.summary}</small>
        </span>
        <span
          className={'build-slot-status status-' + status}
          title={statusWord[status]}
        >
          <StatusIcon size={14} aria-label={statusWord[status]} />
        </span>
        <ChevronDown
          size={15}
          className="build-slot-chevron"
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="build-slot-body" id={panel}>
          {options.length > 2 && brands.length > 1 && (
            <fieldset
              className="build-filter"
              aria-label={`Filter ${slotLabel[slot].toLowerCase()} by maker`}
            >
              {(['all', ...brands] as const).map((b) => (
                <button
                  key={b}
                  aria-pressed={brand === b}
                  className={b === 'all' ? '' : 'brand-' + b}
                  onClick={() => setBrand(b)}
                >
                  {b === 'all' ? `All ${options.length}` : brandName[b]}
                </button>
              ))}
            </fieldset>
          )}
          <fieldset
            className="build-options"
            aria-label={`${slotLabel[slot]} options`}
          >
            {shown.map((option) => (
              <OptionCard
                key={option.id}
                slot={slot}
                id={option.id}
                name={option.name}
                summary={option.summary}
                brand={option.brand}
                build={build}
                onSetPart={onSetPart}
              />
            ))}
          </fieldset>
        </div>
      )}
    </li>
  );
}

/** One part a slot can take, as a card you press to fit it. */
function OptionCard<S extends BuildSlot>({
  slot,
  id,
  name,
  summary,
  brand,
  build,
  onSetPart,
}: {
  slot: S;
  id: DesktopBuild[S];
  name: string;
  summary: string;
  brand?: Brand;
  build: DesktopBuild;
  onSetPart: SetPart;
}) {
  const chosen = build[slot] === id;
  const fit = optionFit(build, slot, id);
  const { facts, meter } = partFacts(build, slot, id);
  return (
    <button
      className={'build-option fit-' + fit.status}
      aria-pressed={chosen}
      onClick={() => {
        if (!chosen) onSetPart(slot, id);
      }}
    >
      <span className="build-option-top">
        <span className="build-option-mark" aria-hidden="true">
          {chosen && <Check size={11} strokeWidth={3} />}
        </span>
        <span className="build-option-text">
          <strong>{name}</strong>
          <small>{summary}</small>
        </span>
        {brand && (
          <span className={'build-brand brand-' + brand}>
            {brandName[brand]}
          </span>
        )}
      </span>
      {facts.length > 0 && (
        <span className="build-facts">
          {facts.map((fact) => (
            <span
              key={fact.text}
              className={'build-fact' + (fact.tone ? ' ' + fact.tone : '')}
            >
              {fact.text}
            </span>
          ))}
        </span>
      )}
      {meter && <FitMeter meter={meter} />}
      {fit.status !== 'ok' && (
        <span className={'build-option-fit status-' + fit.status}>
          {fit.status === 'fail' ? (
            <CircleX size={12} aria-hidden="true" />
          ) : (
            <TriangleAlert size={12} aria-hidden="true" />
          )}
          <em>{fit.status === 'fail' ? 'Conflicts' : 'Check'}</em>
          {fit.reason}
        </span>
      )}
    </button>
  );
}

/** How much of what it has to fit in a part takes: the case, the supply. */
function FitMeter({ meter }: { meter: Meter }) {
  return (
    <span className={'build-fit-meter tone-' + meter.tone}>
      <span className="build-fit-track" aria-hidden="true">
        <span style={{ width: `${Math.min(100, meter.share * 100)}%` }} />
      </span>
      <span className="build-fit-label">{meter.label}</span>
    </span>
  );
}

/** The parts panel folded away: each slot's icon and state, to open it. */
function SlotRail({
  build,
  checks,
  onShow,
}: {
  build: DesktopBuild;
  checks: BuildCheck[];
  onShow: (slot: BuildSlot) => void;
}) {
  return (
    <ul className="build-rail" aria-label="Slots">
      {slots.map(({ id, label }) => {
        const Icon = slotIcon[id];
        const status = slotStatus(checks, id);
        const options = slotOptions(id);
        const part = options.find((o) => o.id === build[id])!.name;
        return (
          <li key={id} style={tint(id)}>
            <button
              className={'build-rail-slot status-' + status}
              title={`${label}: ${part}`}
              aria-label={`${label}: ${part}, ${statusWord[status].toLowerCase()}`}
              onClick={() => onShow(id)}
            >
              <Icon size={16} aria-hidden="true" />
              <span className="build-rail-dot" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** The report folded away: the verdict as an icon and a count. */
function VerdictRail({
  status,
  flagged,
  onShow,
}: {
  status: CheckStatus;
  flagged: number;
  onShow: () => void;
}) {
  const Icon = statusIcon[status];
  return (
    <button
      className={'build-rail-verdict status-' + status}
      title="Show compatibility"
      aria-label={`Compatibility: ${
        flagged ? plural(flagged, 'thing') + ' to look at' : 'everything works'
      }`}
      onClick={onShow}
    >
      <Icon size={18} aria-hidden="true" />
      {flagged > 0 && <span>{flagged}</span>}
    </button>
  );
}

/** The build's worst result, counted. */
function Verdict({ checks }: { checks: BuildCheck[] }) {
  const overall = buildStatus(checks);
  const count = (status: CheckStatus) =>
    checks.filter((c) => c.status === status).length;
  const Icon = statusIcon[overall];
  return (
    <output className={'build-summary status-' + overall}>
      <Icon size={22} aria-hidden="true" />
      <span>
        <strong>
          {overall === 'ok'
            ? 'Everything works together'
            : overall === 'warn'
              ? `Works, with ${plural(count('warn'), 'thing')} to check`
              : `${plural(count('fail'), 'problem')} to fix`}
        </strong>
        <small>
          {count('ok')} of {checks.length} checks pass
        </small>
      </span>
      <span className="build-tally" aria-hidden="true">
        {(['ok', 'warn', 'fail'] as const).map((s) => (
          <span key={s} className={'status-' + s} style={{ flex: count(s) }} />
        ))}
      </span>
    </output>
  );
}

/**
 * The processor's and the card's published power, stacked in their slots'
 * colours against the supply's rating.
 */
function PowerBudget({ build }: { build: DesktopBuild }) {
  const cpu = processorOptions[build.processor].watts,
    gpu = graphicsOptions[build.graphics].watts,
    supply = powerOptions[build.power].watts;
  const scale = Math.max(supply, cpu + gpu);
  const over = cpu + gpu > supply;
  return (
    <div className={'build-power' + (over ? ' over' : '')}>
      <div className="build-power-head">
        <span>Rated draw</span>
        <strong>
          {cpu + gpu} W <small>of {supply} W</small>
        </strong>
      </div>
      {/* The figures are in the heading and the key; this is their picture. */}
      <div className="build-power-bar" aria-hidden="true">
        <span
          style={{ ...tint('processor'), width: `${(cpu / scale) * 100}%` }}
        />
        <span
          style={{ ...tint('graphics'), width: `${(gpu / scale) * 100}%` }}
        />
        <i style={{ left: `${(supply / scale) * 100}%` }} />
      </div>
      <div className="build-power-key">
        <Key slot="processor">CPU {cpu} W</Key>
        <Key slot="graphics">GPU {gpu} W</Key>
        <Key slot="power">PSU {supply} W</Key>
      </div>
    </div>
  );
}

function Key({ slot, children }: { slot: BuildSlot; children: ReactNode }) {
  return (
    <span className="build-key" style={tint(slot)}>
      {children}
    </span>
  );
}

/** One check: its result, what it compared, and the sources it rests on. */
function CheckRow({ check }: { check: BuildCheck }) {
  const Icon = statusIcon[check.status];
  return (
    <li className={'status-' + check.status}>
      <Icon size={15} aria-label={statusWord[check.status]} />
      <div>
        <strong>{check.title}</strong>
        <span className="build-check-slots">
          {checkSlots(check.id).map((slot) => (
            <span key={slot} style={tint(slot)}>
              {slotTag[slot]}
            </span>
          ))}
        </span>
        <p>{check.detail}</p>
        <span className="build-sources">
          {check.sources.map((id) => (
            <a
              key={id}
              href={sources[id].url}
              target="_blank"
              rel="noreferrer"
              title={sources[id].name}
            >
              {sources[id].name}
            </a>
          ))}
        </span>
      </div>
    </li>
  );
}
