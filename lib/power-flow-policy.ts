import type { Category } from './concept.ts';
import type { LevelId } from './levels.ts';
import type { SourceId } from './sources.ts';
import { smoothstep } from './layout.ts';
import { graphicsFeed, type DesktopBuild } from './desktop-build.ts';

/** Three-free metadata shared by the controls and the authored overlay. */
export type PowerTarget = 'all' | 'cpu' | 'gpu' | 'storage';
export type PowerRouteId = 'atx' | 'eps' | 'gpu' | 'sata' | 'slot';
export interface PowerRoute {
  id: PowerRouteId;
  label: string;
  destination: string;
  voltage: string;
  color: string;
  targets: readonly Exclude<PowerTarget, 'all'>[];
  requires: readonly string[];
  categories: readonly Category[];
  inspect: string;
  description: string;
  sources: readonly SourceId[];
}

export const powerRoutes: readonly PowerRoute[] = [
  {
    id: 'atx',
    label: '24-pin ATX',
    destination: 'Motherboard',
    voltage: '12 V · 5 V · 3.3 V',
    color: '#f4bd68',
    targets: ['gpu'],
    requires: ['psu', 'psucable', 'motherboard'],
    categories: ['Power', 'Board'],
    inspect: 'motherboard',
    description:
      'The main cable supplies the motherboard. The board also distributes power to expansion slots and onboard devices.',
    sources: ['psu', 'mainboardmanual'],
  },
  {
    id: 'eps',
    label: '8-pin EPS',
    destination: 'CPU regulators',
    voltage: '12 V',
    color: '#7dc9ff',
    targets: ['cpu'],
    requires: ['psu', 'psucable', 'motherboard'],
    categories: ['Power', 'Board'],
    inspect: 'motherboard',
    description:
      'A separate 12 V feed reaches the motherboard near the CPU. Voltage regulators reduce it to the lower, changing voltages the processor needs.',
    sources: ['psu', 'mainboardmanual', 'mpscontroller'],
  },
  {
    id: 'gpu',
    label: '12V-2x6',
    destination: 'Graphics card',
    voltage: '12 V',
    color: '#cfabff',
    targets: ['gpu'],
    requires: ['psu', 'psucable', 'graphicscard'],
    categories: ['Power', 'Graphics'],
    inspect: 'graphicscard',
    description:
      'The installed RTX 5090 has a direct auxiliary feed from the PSU as well as slot power. Regulators on the card produce lower voltages for the GPU and memory.',
    sources: ['psu', 'tuf5090', 'powerdesign'],
  },
  {
    id: 'sata',
    label: 'SATA power',
    destination: 'SATA SSD',
    voltage: '5 V used by this SSD',
    color: '#7de0b7',
    targets: ['storage'],
    requires: ['psu', 'psucable', 'ssd'],
    categories: ['Power', 'Storage'],
    inspect: 'ssd',
    description:
      'The 15-pin power connector is separate from the 7-pin SATA data connector. This representative 2.5-inch SSD uses 5 V supplied directly by the PSU.',
    sources: ['psu', 'samsungsata'],
  },
  {
    id: 'slot',
    label: 'PCIe slot',
    destination: 'Graphics card',
    voltage: '12 V · 3.3 V',
    color: '#f4bd68',
    targets: ['gpu'],
    requires: ['psu', 'psucable', 'motherboard', 'graphicscard'],
    categories: ['Power', 'Board', 'Graphics'],
    inspect: 'graphicscard',
    description:
      'The motherboard supplies power through the PCIe slot too. The dashed route shows this relationship, not the layout of copper traces inside the board.',
    sources: ['psu', 'pcie'],
  },
];

export function hasPowerFlow(level: LevelId) {
  return level === 'pc';
}
export function powerStrength(amount: number) {
  return 1 - smoothstep(0.005, 0.085, amount);
}
export function matchesPowerTarget(route: PowerRoute, target: PowerTarget) {
  return target === 'all' || route.targets.includes(target);
}

export interface PowerView {
  level: LevelId;
  power: boolean;
  powerTarget: PowerTarget;
  visible: readonly Category[];
  hidden: readonly string[];
  isolated: boolean;
  diveInto: string | null;
}

/** Do not leave a live-looking route attached to hidden or isolated hardware. */
export function visiblePowerRoutes(state: PowerView): PowerRouteId[] {
  if (
    !state.power ||
    !hasPowerFlow(state.level) ||
    state.isolated ||
    state.diveInto
  )
    return [];
  return powerRoutes
    .filter(
      (route) =>
        matchesPowerTarget(route, state.powerTarget) &&
        route.categories.every((category) =>
          state.visible.includes(category),
        ) &&
        route.requires.every((id) => !state.hidden.includes(id)),
    )
    .map((route) => route.id);
}

const explanationRoutes: Record<Exclude<PowerTarget, 'all'>, PowerRouteId> = {
  cpu: 'eps',
  gpu: 'gpu',
  storage: 'sata',
};

/** Derive the legend independently of React and the animation clock. */
export function powerPanelState(
  state: PowerView & { explode: number; build?: DesktopBuild },
) {
  // The card's own feed is named for the card the build installed.
  const feed = state.build && graphicsFeed(state.build);
  const routes = powerRoutes
    .filter((route) => matchesPowerTarget(route, state.powerTarget))
    .map((route) =>
      feed && route.id === 'gpu' ? { ...route, ...feed } : route,
    );
  const visible = visiblePowerRoutes(state);
  const explanationId =
    state.powerTarget === 'all' ? null : explanationRoutes[state.powerTarget];
  const explanation = routes.find(
    (route) => route.id === explanationId,
  )?.description;

  let status: string | null = null;
  if (state.explode >= 9) status = 'Reassemble the PC to see the power paths.';
  else if (!visible.length) {
    if (state.isolated) status = 'Leave isolation to see the power paths.';
    else if (state.diveInto)
      status = 'Power paths pause while opening a component.';
    else
      status =
        'Show the power supply, cables and destination components to see their paths.';
  }
  return { routes, visible, explanation, status };
}
