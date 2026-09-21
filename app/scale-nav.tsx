'use client';
import {
  Box,
  ChevronDown,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Droplets,
  Fan,
  HardDrive,
  Layers3,
  Microscope,
  PcCase,
  X,
  Zap,
} from 'lucide-react';
import {
  branches,
  levels,
  menuRoot,
  rootLevel,
  submenuRoot,
  type LevelId,
} from '@/lib/levels';

/** One icon per scale, so the branch you are on is recognisable at a glance. */
const levelIcon: Record<LevelId, typeof Box> = {
  pc: PcCase,
  motherboard: CircuitBoard,
  dimm: CircuitBoard,
  dram: Box,
  banks: Layers3,
  bank: Microscope,
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
  onClose: () => void;
};

export default function ScaleNav({
  level,
  shownMenu,
  shownSubmenu,
  onOpenMenu,
  onOpenSubmenu,
  onNavigate,
  onClose,
}: Props) {
  return (
    <div className="explore-section">
      <div className="section-heading">
        EXPLORE BY SCALE
        <button
          className="mobile-close"
          aria-label="Close systems"
          onClick={onClose}
        >
          <X size={17} />
        </button>
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
          <PcCase size={18} />
          <div>
            {levels[rootLevel].name}
            <small>{levels[rootLevel].summary}</small>
          </div>
          <ChevronRight size={15} />
        </button>

        {branches().map(({ root, label, levels: scales, submenus }, index) => {
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
                      ? `${submenus.length} ${label === 'GPU' ? 'cards' : 'models'} · ${scales.length} scales`
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
        })}
      </nav>
    </div>
  );
}
