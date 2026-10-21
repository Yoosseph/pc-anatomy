'use client';
import { useState } from 'react';
import { Zap } from 'lucide-react';
import {
  hasPowerFlow,
  matchesPowerTarget,
  powerRoutes,
  visiblePowerRoutes,
  type PowerTarget,
} from '@/lib/power-flow-policy';
import type { ExplorerState } from '@/lib/explorer-state';

const targets: { id: PowerTarget; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cpu', label: 'CPU' },
  { id: 'gpu', label: 'GPU' },
  { id: 'storage', label: 'Storage' },
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
  const visible = visiblePowerRoutes(state);
  const open = state.explode >= 9;
  const explanationId = { all: 'atx', cpu: 'eps', gpu: 'gpu', storage: 'sata' }[
    state.powerTarget
  ];
  return (
    <>
      <button
        className={
          'airflow-toggle power-toggle' + (state.power ? ' active' : '')
        }
        aria-label={state.power ? 'Hide power flow' : 'Show power flow'}
        aria-pressed={state.power}
        aria-controls="power-flow-panel"
        title="Trace power from the PSU to each component"
        onClick={onToggle}
      >
        <Zap size={15} />
        <span>Power</span>
        <small>{state.power ? 'On' : 'Off'}</small>
      </button>
      {state.power && (
        <section
          className={'power-panel' + (expanded ? ' expanded' : '')}
          id="power-flow-panel"
          aria-label="Power flow"
        >
          <div className="power-heading">
            <strong>Follow the power</strong>
            <span>FROM THE PSU</span>
            <button
              className="power-legend-toggle"
              aria-expanded={expanded}
              aria-controls="power-legend"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? 'Less' : 'Details'}
            </button>
          </div>
          <fieldset className="power-targets" aria-label="Power destination">
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
          {open || !visible.length ? (
            <output className="power-status">
              {open
                ? 'Reassemble the PC to see the power paths.'
                : state.isolated
                  ? 'Leave isolation to see the power paths.'
                  : state.diveInto
                    ? 'Power paths pause while opening a component.'
                    : 'Show the power supply, cables and destination components to see their paths.'}
            </output>
          ) : null}
          <ul className="power-legend" id="power-legend">
            {powerRoutes
              .filter((route) => matchesPowerTarget(route, state.powerTarget))
              .map((route) => (
                <li
                  key={route.id}
                  className={!visible.includes(route.id) ? 'power-muted' : ''}
                >
                  <i style={{ background: route.color }} aria-hidden="true" />
                  <button
                    onClick={() => onInspect(route.inspect)}
                    title={route.description}
                    aria-label={`Inspect ${route.destination}: ${route.label}`}
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
          {state.powerTarget !== 'all' && (
            <p className="power-explanation">
              {
                powerRoutes.find((route) => route.id === explanationId)
                  ?.description
              }
            </p>
          )}
          <p className="power-note">
            Colors identify routes. Arrows show direction, not speed or watts.
            Dashed line: power through the board.
          </p>
        </section>
      )}
    </>
  );
}
