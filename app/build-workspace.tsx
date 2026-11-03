'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  CircleCheck,
  CircleX,
  Cpu,
  Fan,
  Gpu,
  HardDrive,
  Link2,
  LoaderCircle,
  MemoryStick,
  Plug,
  RotateCcw,
  TriangleAlert,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { sources } from '@/lib/manifest';
import {
  buildStatus,
  checkBuild,
  conflicts,
  ratedDraw,
  slotStatus,
  type BuildCheck,
  type CheckStatus,
} from '@/lib/build-checks';
import {
  defaultBuild,
  isCustomBuild,
  partName,
  powerOptions,
  slotOptions,
  slots,
  type BuildSlot,
  type DesktopBuild,
} from '@/lib/desktop-build';
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
  memory: MemoryStick,
  graphics: Gpu,
  storage: HardDrive,
  power: Plug,
} satisfies Record<BuildSlot, typeof Cpu>;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

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
 *
 * The 3D viewer is not part of this component. The page draws the same
 * viewer for the explorer and for this workspace, so opening it keeps the
 * scene and the tower already built, and only the layout around it changes.
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
  // On a phone the parts and the report share the space under the tower.
  const [tab, setTab] = useState<'parts' | 'checks'>('parts');
  const overall = buildStatus(checks);
  const flagged = checks.filter((c) => c.status !== 'ok').length;
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
              {isCustomBuild(build)
                ? `${plural(
                    slots.filter(({ id }) => build[id] !== defaultBuild[id])
                      .length,
                    'part',
                  )} changed from the original machine`
                : 'The original machine'}
            </p>
          </div>
        </div>
        <ShareLink />
      </header>

      <div className="build-panels" data-tab={tab}>
        <div className="build-tabs" role="tablist" aria-label="Build panels">
          <button
            role="tab"
            aria-selected={tab === 'parts'}
            onClick={() => setTab('parts')}
          >
            Parts
          </button>
          <button
            role="tab"
            aria-selected={tab === 'checks'}
            onClick={() => setTab('checks')}
            className={'status-' + overall}
          >
            Checks
            {flagged > 0 && <span className="build-tab-count">{flagged}</span>}
          </button>
        </div>

        <section className="build-parts" aria-label="Parts">
          <h2 className="build-panel-heading">Parts</h2>
          <div className="build-scroll">
            {slots.map(({ id, label }, index) => (
              <SlotPicker
                key={id}
                slot={id}
                index={index}
                label={label}
                build={build}
                checks={checks}
                focused={focus === id}
                onSetPart={onSetPart}
              />
            ))}
            <p className="build-fixed">
              Fixed in every build: the AM5 motherboard, with four DDR5 slots
              and the M.2 slot the NVMe drive sits in, and the case.
            </p>
          </div>
        </section>

        <section className="build-report" aria-label="Compatibility">
          <Verdict checks={checks} />
          <RatedPower build={build} />
          <h2 className="build-panel-heading">
            {plural(checks.length, 'check')}
          </h2>
          <div className="build-scroll">
            <ul className="build-checks">
              {checks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </ul>
            <p className="build-note">
              Figures are each maker’s published numbers, or measurements of the
              modelled case. A supply below a recommendation may still run the
              machine; one below a stated minimum is not supported by the card’s
              maker.
            </p>
            {isCustomBuild(build) && (
              <button className="build-restore" onClick={onRestore}>
                <RotateCcw size={13} aria-hidden="true" />
                Back to the original build
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="build-stage-bar">
        <output
          className={'build-fitting' + (fitting ? ' active' : '')}
          aria-live="polite"
        >
          {fitting ? (
            <>
              <LoaderCircle size={14} aria-hidden="true" />
              Fitting the parts…
            </>
          ) : (
            <>
              <Check size={14} aria-hidden="true" />
              {partName(build, 'graphics')} · {partName(build, 'cooler')}
            </>
          )}
        </output>
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

/** Copies the address, which carries the build, so it can be sent on. */
function ShareLink() {
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
    <button className="build-share" onClick={copy}>
      {copied === 'yes' ? (
        <Check size={15} aria-hidden="true" />
      ) : (
        <Link2 size={15} aria-hidden="true" />
      )}
      <span aria-live="polite">
        {copied === 'yes'
          ? 'Link copied'
          : copied === 'no'
            ? 'Copy the address bar'
            : 'Copy link'}
      </span>
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
      <Icon size={20} aria-hidden="true" />
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
    </output>
  );
}

/** The processor's and card's published power against the supply's rating. */
function RatedPower({ build }: { build: DesktopBuild }) {
  const draw = ratedDraw(build),
    supply = powerOptions[build.power].watts;
  return (
    <div className="build-power">
      <div>
        <span>Processor and card, rated</span>
        <strong>
          {draw} W / {supply} W
        </strong>
      </div>
      <meter
        min={0}
        max={supply}
        value={Math.min(draw, supply)}
        high={supply * 0.9}
        optimum={supply * 0.5}
        aria-label={`Rated draw ${draw} watts of a ${supply} watt supply`}
      />
    </div>
  );
}

/**
 * The parts one slot can take. A part that fails a check it is involved in,
 * given the rest of the build, is marked; the slot's own marker is the worst
 * result among those checks.
 */
function SlotPicker({
  slot,
  index,
  label,
  build,
  checks,
  focused,
  onSetPart,
}: {
  slot: BuildSlot;
  index: number;
  label: string;
  build: DesktopBuild;
  checks: BuildCheck[];
  focused: boolean;
  onSetPart: SetPart;
}) {
  const ref = useRef<HTMLElement>(null);
  // A piece clicked in the tower brings its slot into view.
  useEffect(() => {
    if (focused)
      ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focused]);
  const Icon = slotIcon[slot];
  const status = slotStatus(checks, slot);
  const StatusIcon = statusIcon[status];
  return (
    <section
      ref={ref}
      className={'build-slot' + (focused ? ' focused' : '')}
      aria-labelledby={`build-slot-${slot}`}
    >
      <header>
        <span className="build-slot-index" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <Icon size={15} aria-hidden="true" />
        <h3 id={`build-slot-${slot}`}>{label}</h3>
        <StatusIcon
          size={14}
          className={'build-slot-status status-' + status}
          aria-label={statusWord[status]}
        />
      </header>
      <fieldset
        className="build-options"
        aria-labelledby={`build-slot-${slot}`}
      >
        {slotOptions(slot).map((option) => {
          const chosen = build[slot] === option.id;
          return (
            <button
              key={option.id}
              className="build-option"
              aria-pressed={chosen}
              onClick={() => {
                if (!chosen) onSetPart(slot, option.id);
              }}
            >
              <span className="build-option-mark" aria-hidden="true" />
              <span className="build-option-text">
                <strong>{option.name}</strong>
                <small>{option.summary}</small>
              </span>
              {conflicts(build, slot, option.id) && (
                <em title="This part does not work with the rest of the build">
                  Conflicts
                </em>
              )}
            </button>
          );
        })}
      </fieldset>
    </section>
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
