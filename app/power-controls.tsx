'use client';
import { useState } from 'react';
import { Zap } from 'lucide-react';
import {
  hasPowerFlow,
  powerPanelState,
  type PowerTarget,
} from '@/lib/power-flow-policy';
import type { ExplorerState } from '@/lib/explorer-state';
import { defaultBuild, graphicsFeed } from '@/lib/desktop-build';

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
  const panel = powerPanelState(state);
  const { visible, status } = panel;
  // The card's own feed is named for the card the build installed.
  let { routes, explanation } = panel;
  if (state.build.graphics !== defaultBuild.graphics) {
    const feed = graphicsFeed(state.build);
    const gpu = routes.find((route) => route.id === 'gpu');
    if (explanation && explanation === gpu?.description)
      explanation = feed.description;
    routes = routes.map((route) =>
      route.id === 'gpu' ? { ...route, ...feed } : route,
    );
  }
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
          {explanation && <p className="power-explanation">{explanation}</p>}
          <p className="power-note">
            Colors identify routes. Arrows show direction, not speed or watts.
            Dashed line: power through the board.
          </p>
        </section>
      )}
    </>
  );
}
