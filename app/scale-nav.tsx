'use client';
import {
  BatteryCharging,
  Box,
  ChevronDown,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Droplets,
  Fan,
  GitCompareArrows,
  HardDrive,
  Layers3,
  Laptop,
  MemoryStick,
  Microscope,
  Monitor,
  PcCase,
  X,
  Zap,
} from 'lucide-react';
import {
  branches,
  levels,
  menuRoot,
  systemRoot,
  systemRoots,
  submenuRoot,
  type LevelId,
} from '@/lib/levels';

/** One icon per scale, so the branch you are on is recognisable at a glance. */
const levelIcon: Record<LevelId, typeof Box> = {
  legion: Laptop,
  legionboard: CircuitBoard,
  legioncpu: Cpu,
  legioncore: Microscope,
  legiongpu: Box,
  legionsm: Microscope,
  legionmemory: MemoryStick,
  legionpackage: Box,
  legiondram: Layers3,
  legionbank: Microscope,
  legioncell: Microscope,
  legionstorage: HardDrive,
  legioncooling: Fan,
  legionbattery: BatteryCharging,
  legiondisplay: Monitor,
  macbook: Laptop,
  macboard: CircuitBoard,
  m1pro: Cpu,
  maccpu: Cpu,
  maccore: Microscope,
  macgpu: Box,
  macgpucore: Microscope,
  macmemory: MemoryStick,
  macdram: Layers3,
  macbank: Microscope,
  maccell: Microscope,
  macstorage: HardDrive,
  maccooling: Fan,
  macbattery: BatteryCharging,
  macdisplay: Monitor,
  pc: PcCase,
  motherboard: CircuitBoard,
  dimm: MemoryStick,
  dram: Box,
  banks: Layers3,
  bank: Microscope,
  cell: Microscope,
  ddr4: MemoryStick,
  ddr4dram: Box,
  ddr4banks: Layers3,
  ddr4array: Microscope,
  ddr4cell: Microscope,
  ryzen: Cpu,
  ryzenio: CircuitBoard,
  corei9: Cpu,
  coreio: CircuitBoard,
  psu: Zap,
  psubronze: Zap,
  fan: Fan,
  cooler: Fan,
  liquid: Droplets,
  ssd: HardDrive,
  nvme: CircuitBoard,
  card: Box,
  die: Cpu,
  gpc: Layers3,
  tpc: Layers3,
  sm: Microscope,
  rx9070: Box,
  navi48: Cpu,
  rxse: Layers3,
  rxwgp: Layers3,
  rxcu: Microscope,
  arcb580: Box,
  bmg: Cpu,
  xeslice: Layers3,
  xecore: Layers3,
  xve: Microscope,
};

type Props = {
  level: LevelId;
  shownMenu: LevelId | null;
  shownSubmenu: LevelId | null;
  onOpenMenu: (menu: LevelId | null) => void;
  onOpenSubmenu: (submenu: LevelId | 'none' | null) => void;
  onNavigate: (level: LevelId) => void;
  onCompare: () => void;
  onClose: () => void;
};

export default function ScaleNav({
  level,
  shownMenu,
  shownSubmenu,
  onOpenMenu,
  onOpenSubmenu,
  onNavigate,
  onCompare,
  onClose,
}: Props) {
  const rootLevel = systemRoot(level);
  const RootIcon = levelIcon[rootLevel];
  const systemBranches = branches(rootLevel);
  return (
    <div className="explore-section">
      <button
        className="mobile-close"
        aria-label="Close systems"
        onClick={onClose}
      >
        <X size={17} />
      </button>
      <div className="section-heading rail-top-heading">
        <span>SYSTEM</span>
      </div>
      <nav className="system-picker" aria-label="Choose a system">
        {systemRoots.map((root) => {
          const Icon = levelIcon[root];
          return (
            <button
              key={root}
              aria-pressed={root === rootLevel}
              onClick={() => onNavigate(root)}
            >
              <span className="system-picker-head">
                <Icon size={14} />
                <i className="system-picker-dot" />
              </span>
              <strong>
                {root === 'pc'
                  ? 'Desktop PC'
                  : root === 'legion'
                    ? 'Laptops'
                    : 'Mac'}
              </strong>
              <small>
                {root === 'pc'
                  ? 'ATX desktop'
                  : root === 'legion'
                    ? 'Legion 5'
                    : 'MacBook Pro'}
              </small>
            </button>
          );
        })}
      </nav>
      <button className="compare-button" onClick={onCompare}>
        <GitCompareArrows size={16} />
        <span>
          <strong>Compare components</strong>
          <small>Side-by-side 3D &amp; specs</small>
        </span>
        <ChevronRight size={14} />
      </button>
      <div className="section-heading scale-heading">
        <span>EXPLORE BY SCALE</span>
        <span className="section-badge">
          {systemBranches.reduce((sum, b) => sum + b.levels.length, 1)} scales
        </span>
      </div>
      <nav className="scale-navigation" aria-label="Exploration scale">
        <button
          className={level === rootLevel ? 'active' : ''}
          aria-current={level === rootLevel ? 'true' : undefined}
          onClick={() => {
            onOpenMenu(null);
            onNavigate(rootLevel);
          }}
        >
          <span>01</span>
          <RootIcon size={17} />
          <div>
            {levels[rootLevel].name}
            <small>{levels[rootLevel].summary}</small>
          </div>
          <ChevronRight size={14} />
        </button>

        {systemBranches.map(
          ({ root, label, levels: scales, submenus }, index) => {
            const Icon = levelIcon[root];
            const open = shownMenu === root;
            const here = menuRoot(level) === root;
            const scaleButton = (id: LevelId) => (
              <button
                key={id}
                className={id === level ? 'active' : ''}
                aria-current={id === level ? 'true' : undefined}
                onClick={() => onNavigate(id)}
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
            );
            return (
              <div
                className={
                  'branch' + (open ? ' open' : '') + (here ? ' here' : '')
                }
                key={root}
              >
                <button
                  className="branch-head"
                  aria-expanded={open}
                  onClick={() => onOpenMenu(open ? rootLevel : root)}
                >
                  <span>{String(index + 2).padStart(2, '0')}</span>
                  <Icon size={18} />
                  <div>
                    {label}
                    <small>
                      {submenus.length > 0
                        ? `${submenus.length} ${label === 'GPU' ? 'cards' : label === 'Memory' ? 'generations' : 'models'} · ${scales.length} scales`
                        : label === 'Power supply'
                          ? `${scales.length} models`
                          : `${scales.length} ${scales.length === 1 ? 'scale' : 'scales'} inside`}
                    </small>
                  </div>
                  <ChevronDown size={15} />
                </button>
                {open && submenus.length === 0 && (
                  <div className="branch-scales">{scales.map(scaleButton)}</div>
                )}
                {open && submenus.length > 0 && (
                  <div className="branch-scales branch-submenus">
                    {submenus.map((sub) => {
                      const subOpen = shownSubmenu === sub.root;
                      const subHere = submenuRoot(level) === sub.root;
                      return (
                        <div
                          key={sub.root}
                          className={
                            'submenu' +
                            (subOpen ? ' open' : '') +
                            (subHere ? ' here' : '')
                          }
                        >
                          <button
                            className="submenu-head"
                            aria-expanded={subOpen}
                            onClick={() =>
                              onOpenSubmenu(subOpen ? 'none' : sub.root)
                            }
                          >
                            <i />
                            <div>
                              {sub.label}
                              <small>
                                {sub.note ? sub.note + ' · ' : ''}
                                {sub.levels.length}{' '}
                                {sub.levels.length === 1 ? 'scale' : 'scales'}
                              </small>
                            </div>
                            <ChevronDown size={13} />
                          </button>
                          {subOpen && (
                            <div className="submenu-scales">
                              {sub.levels.map(scaleButton)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          },
        )}
      </nav>
    </div>
  );
}
