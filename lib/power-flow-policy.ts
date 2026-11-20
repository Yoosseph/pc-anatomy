import type { Category } from './concept.ts';
import type { LevelId } from './levels.ts';
import type { SourceId } from './sources.ts';
import { smoothstep } from './layout.ts';
import {
  graphicsFeed,
  storageOptions,
  type DesktopBuild,
} from './desktop-build.ts';
import { t } from './i18n/messages.ts';

const text = t.powerRoutes;

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
    destination: text.atx.destination,
    voltage: '12 V · 5 V · 3.3 V',
    color: '#f4bd68',
    targets: ['gpu'],
    requires: ['psu', 'psucable', 'motherboard'],
    categories: ['Power', 'Board'],
    inspect: 'motherboard',
    description: text.atx.description,
    sources: ['psu', 'mainboardmanual'],
  },
  {
    id: 'eps',
    label: '8-pin EPS',
    destination: text.eps.destination,
    voltage: '12 V',
    color: '#7dc9ff',
    targets: ['cpu'],
    requires: ['psu', 'psucable', 'motherboard'],
    categories: ['Power', 'Board'],
    inspect: 'motherboard',
    description: text.eps.description,
    sources: ['psu', 'mainboardmanual', 'mpscontroller'],
  },
  {
    id: 'gpu',
    label: '12V-2x6',
    destination: text.gpu.destination,
    voltage: '12 V',
    color: '#cfabff',
    targets: ['gpu'],
    requires: ['psu', 'psucable', 'graphicscard'],
    categories: ['Power', 'Graphics'],
    inspect: 'graphicscard',
    description: text.gpu.description('RTX 5090'),
    sources: ['psu', 'tuf5090', 'powerdesign'],
  },
  {
    id: 'sata',
    label: text.sata.label,
    destination: 'SATA SSD',
    voltage: text.sata.voltage,
    color: '#7de0b7',
    targets: ['storage'],
    requires: ['psu', 'psucable', 'ssd'],
    categories: ['Power', 'Storage'],
    inspect: 'ssd',
    description: text.sata.description,
    sources: ['psu', 'samsungsata'],
  },
  {
    id: 'slot',
    label: text.slot.label,
    destination: text.slot.destination,
    voltage: '12 V · 3.3 V',
    color: '#f4bd68',
    targets: ['gpu'],
    requires: ['psu', 'psucable', 'motherboard', 'graphicscard'],
    categories: ['Power', 'Board', 'Graphics'],
    inspect: 'graphicscard',
    description: text.slot.description,
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
  /** The parts in the tower; a build without a SATA drive has no SATA lead. */
  build?: DesktopBuild;
}

/** Whether the build in the tower has the cable this route draws. */
const fitted = (route: PowerRoute, build: DesktopBuild | undefined) =>
  route.id !== 'sata' || !build || storageOptions[build.storage].sata;

/** Said in place of the SATA explanation when no SATA drive is fitted. */
const noSataDrive = text.noSataDrive;

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
        fitted(route, state.build) &&
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
export function powerPanelState(state: PowerView & { explode: number }) {
  // The card's own feed is named for the card the build installed.
  const feed = state.build && graphicsFeed(state.build);
  const routes = powerRoutes
    .filter(
      (route) =>
        fitted(route, state.build) &&
        matchesPowerTarget(route, state.powerTarget),
    )
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
  if (state.powerTarget === 'storage' && !routes.length) status = noSataDrive;
  else if (state.explode >= 9) status = text.reassemble;
  else if (!visible.length) {
    if (state.isolated) status = text.leaveIsolation;
    else if (state.diveInto) status = text.paused;
    else status = text.showParts;
  }
  return { routes, visible, explanation, status };
}
