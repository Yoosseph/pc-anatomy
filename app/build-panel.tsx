'use client';
import {
  CircleCheck,
  CircleX,
  RotateCcw,
  TriangleAlert,
  X,
} from 'lucide-react';
import { sources } from '@/lib/manifest';
import {
  buildStatus,
  checkBuild,
  conflicts,
  defaultBuild,
  powerOptions,
  ratedDraw,
  slotOptions,
  slots,
  type BuildCheck,
  type BuildSlot,
  type CheckStatus,
  type DesktopBuild,
} from '@/lib/desktop-build';

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

type SetPart = <S extends BuildSlot>(slot: S, part: DesktopBuild[S]) => void;
type Props = {
  build: DesktopBuild;
  onSetPart: SetPart;
  onRestore: () => void;
  onClose: () => void;
};

/**
 * Build your own desktop: one choice per slot, and what those choices mean
 * together. The tower on the stage follows the card and supply chosen here.
 */
export default function BuildPanel({
  build,
  onSetPart,
  onRestore,
  onClose,
}: Props) {
  const checks = checkBuild(build);
  const changed = slots.some(({ id }) => build[id] !== defaultBuild[id]);
  return (
    <section className="build-section" aria-label="Build your own PC">
      <div className="section-heading">
        BUILD YOUR PC
        <button onClick={onClose} aria-label="Close the build panel">
          <X size={13} />
        </button>
      </div>
      <p className="build-intro">
        Pick a part for each slot. The tower changes to match, and the checks
        say whether the parts work together.
      </p>
      {/* The verdict stays in view; the parts and the checks scroll. */}
      <Verdict checks={checks} />
      <RatedPower build={build} />
      <div className="build-scroll">
        {slots.map(({ id, label }) => (
          <SlotPicker
            key={id}
            slot={id}
            label={label}
            build={build}
            onSetPart={onSetPart}
          />
        ))}
        <p className="build-fixed">
          Fixed in every build: the AM5 motherboard with four DDR5 slots, the
          tower air cooler, the SATA SSD and the case.
        </p>
        <ul className="build-checks">
          {checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </ul>
        <p className="build-note">
          Figures are each maker’s published numbers. A supply below a
          recommendation may still run the machine; one below a stated minimum
          is not supported by the card’s maker.
        </p>
        {changed && (
          <button className="build-restore" onClick={onRestore}>
            <RotateCcw size={13} />
            Back to the original build
          </button>
        )}
      </div>
    </section>
  );
}

/** The build's worst result, counted. */
function Verdict({ checks }: { checks: BuildCheck[] }) {
  const overall = buildStatus(checks);
  const count = (status: CheckStatus) =>
    checks.filter((c) => c.status === status).length;
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? '' : 's'}`;
  const Icon = statusIcon[overall];
  return (
    <output className={'build-summary status-' + overall}>
      <Icon size={15} aria-hidden="true" />
      <strong>
        {overall === 'ok'
          ? 'Everything works together'
          : overall === 'warn'
            ? `Works, with ${plural(count('warn'), 'thing')} to check`
            : `${plural(count('fail'), 'problem')} to fix`}
      </strong>
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
 * The parts one slot can take. A ✕ marks a part that fails a check it is
 * involved in, given the rest of the build.
 */
function SlotPicker({
  slot,
  label,
  build,
  onSetPart,
}: {
  slot: BuildSlot;
  label: string;
  build: DesktopBuild;
  onSetPart: SetPart;
}) {
  return (
    <fieldset className="build-slot">
      <legend>{label}</legend>
      {slotOptions(slot).map((option) => (
        <button
          key={option.id}
          className="build-option"
          aria-pressed={build[slot] === option.id}
          onClick={() => onSetPart(slot, option.id)}
        >
          <span>
            <strong>{option.name}</strong>
            <small>{option.summary}</small>
          </span>
          {conflicts(build, slot, option.id) && (
            <em
              title="This part does not work with the rest of the build"
              aria-label="does not work with the rest of the build"
            >
              ✕
            </em>
          )}
        </button>
      ))}
    </fieldset>
  );
}

/** One check: its result, what it compared, and the sources it rests on. */
function CheckRow({ check }: { check: BuildCheck }) {
  const Icon = statusIcon[check.status];
  return (
    <li className={'status-' + check.status}>
      <Icon size={14} aria-label={statusWord[check.status]} />
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
