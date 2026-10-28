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

type Props = {
  build: DesktopBuild;
  onSetPart: (slot: BuildSlot, part: DesktopBuild[BuildSlot]) => void;
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
  const overall = buildStatus(checks);
  const problems = checks.filter((c) => c.status === 'fail').length,
    notes = checks.filter((c) => c.status === 'warn').length;
  const draw = ratedDraw(build),
    supply = powerOptions[build.power].watts;
  const changed = slots.some(({ id }) => build[id] !== defaultBuild[id]);
  const OverallIcon = statusIcon[overall];
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
      <output className={'build-summary status-' + overall}>
        <OverallIcon size={15} aria-hidden="true" />
        <strong>
          {overall === 'ok'
            ? 'Everything works together'
            : overall === 'warn'
              ? `Works, with ${notes} ${notes === 1 ? 'thing' : 'things'} to check`
              : `${problems} ${problems === 1 ? 'problem' : 'problems'} to fix`}
        </strong>
      </output>
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
      <div className="build-scroll">
        {slots.map(({ id: slot, label }) => (
          <fieldset className="build-slot" key={slot}>
            <legend>{label}</legend>
            {slotOptions(slot).map((option) => {
              const chosen = build[slot] === option.id;
              const part = option.id as DesktopBuild[BuildSlot];
              const clash = conflicts(build, slot, part);
              return (
                <button
                  key={option.id}
                  className="build-option"
                  aria-pressed={chosen}
                  onClick={() => onSetPart(slot, part)}
                >
                  <span>
                    <strong>{option.name}</strong>
                    <small>{option.summary}</small>
                  </span>
                  {clash && (
                    <em
                      title="This part does not work with the rest of the build"
                      aria-label="does not work with the rest of the build"
                    >
                      ✕
                    </em>
                  )}
                </button>
              );
            })}
          </fieldset>
        ))}
        <p className="build-fixed">
          Fixed in every build: the AM5 motherboard with four DDR5 slots, the
          tower air cooler, the SATA SSD and the case.
        </p>

        <ul className="build-checks">
          {checks.map((check) => {
            const Icon = statusIcon[check.status];
            return (
              <li key={check.id} className={'status-' + check.status}>
                <Icon size={14} aria-label={statusWord[check.status]} />
                <div>
                  <strong>{check.title}</strong>
                  <p>{check.detail}</p>
                  <span className="build-sources">
                    {[...new Set(check.sources)].map((id) => (
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
          })}
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
