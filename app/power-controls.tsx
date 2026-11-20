'use client';
import { useState } from 'react';
import { Zap } from 'lucide-react';
import {
  hasPowerFlow,
  powerPanelState,
  type PowerTarget,
} from '@/lib/power-flow-policy';
import type { ExplorerState } from '@/lib/explorer-state';
import { t } from '@/lib/i18n/messages';

const targets: { id: PowerTarget; label: string }[] = [
  { id: 'all', label: t.power.all },
  { id: 'cpu', label: 'CPU' },
  { id: 'gpu', label: 'GPU' },
  { id: 'storage', label: t.power.storage },
];

export default function PowerControls({
  state,
  onToggle,
  onTarget,
  onInspect,
}: {
  state: ExplorerState;
  onToggle: () => void;
  onTarget: (target: PowerTarget) => void;
  onInspect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!hasPowerFlow(state.level)) return null;
  const { routes, visible, explanation, status } = powerPanelState(state);
  return (
    <>
      <button
        className={
          'airflow-toggle power-toggle' + (state.power ? ' active' : '')
        }
        aria-label={state.power ? t.power.hide : t.power.show}
        aria-pressed={state.power}
        aria-controls="power-flow-panel"
        title={t.power.toggleTitle}
        onClick={onToggle}
      >
        <Zap size={15} />
        <span>{t.power.toggle}</span>
        <small>{state.power ? t.common.on : t.common.off}</small>
      </button>
      {state.power && (
        <section
          className={'power-panel' + (expanded ? ' expanded' : '')}
          id="power-flow-panel"
          aria-label={t.power.panel}
        >
          <div className="power-heading">
            <strong>{t.power.heading}</strong>
            <span>{t.power.fromPsu}</span>
            <button
              className="power-legend-toggle"
              aria-expanded={expanded}
              aria-controls="power-legend"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? t.power.less : t.power.details}
            </button>
          </div>
          <fieldset className="power-targets" aria-label={t.power.destination}>
            {targets.map((target) => (
              <button
                key={target.id}
                aria-pressed={state.powerTarget === target.id}
                onClick={() => onTarget(target.id)}
              >
                {target.label}
              </button>
            ))}
          </fieldset>
          {status && <output className="power-status">{status}</output>}
          <ul className="power-legend" id="power-legend">
            {routes.map((route) => (
              <li
                key={route.id}
                className={!visible.includes(route.id) ? 'power-muted' : ''}
              >
                <i style={{ background: route.color }} aria-hidden="true" />
                <button
                  onClick={() => onInspect(route.inspect)}
                  title={route.description}
                  aria-label={t.power.inspect(route.destination, route.label)}
                >
                  <span>
                    <strong>{route.label}</strong>
                    <small>{route.voltage}</small>
                  </span>
                  <span className="power-destination">
                    {route.destination} →
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {explanation && <p className="power-explanation">{explanation}</p>}
          <p className="power-note">{t.power.note}</p>
        </section>
      )}
    </>
  );
}
