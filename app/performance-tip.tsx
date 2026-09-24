import { useEffect, useState } from 'react';
import { ArrowUpRight, X, Zap } from 'lucide-react';
import { hasHardwareAcceleration } from '@/lib/graphics-acceleration';

const seenKey = 'pc-anatomy-performance-tip-v1';

export default function PerformanceTip({ ready }: { ready: boolean }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!ready) return;
    // Only remind people whose browser is rendering without the GPU.
    if (hasHardwareAcceleration()) return;
    try {
      if (sessionStorage.getItem(seenKey)) return;
    } catch {
      /* The tip still works when browser storage is unavailable. */
    }
    const timer = window.setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem(seenKey, '1');
      } catch {
        /* Optional persistence. */
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (!visible || hovered || focused) return;
    const timer = window.setTimeout(() => setVisible(false), 12000);
    return () => window.clearTimeout(timer);
  }, [visible, hovered, focused]);

  if (!visible) return null;
  return (
    // Pausing a passive notification on hover/focus does not make the region a control.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <aside
      className="performance-tip"
      aria-label="3D performance tip"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <Zap size={19} aria-hidden="true" />
      <div>
        <output>
          <strong>Smoother 3D exploration</strong>
          <span className="tip-copy">
            Try enabling browser hardware acceleration for smoother rendering.
          </span>
        </output>
        <a
          href="/guide/index.html#smoother-3d"
          target="_blank"
          rel="noreferrer"
        >
          How to enable it <ArrowUpRight size={13} />
        </a>
      </div>
      <button
        aria-label="Dismiss performance tip"
        onClick={() => setVisible(false)}
      >
        <X size={17} />
      </button>
    </aside>
  );
}
