'use client';
import { useEffect, useState } from 'react';
import { towerKey, type DesktopBuild } from '@/lib/desktop-build';

/**
 * The build the tower on the stage shows, a frame behind the one chosen.
 *
 * Rebuilding the tower takes a few hundred milliseconds on the main thread.
 * Run from the click itself it would hold back the pressed option, the checks
 * and the verdict until it finished, so the page would feel stuck. Instead the
 * choice renders first, the browser paints it, and only then does the tower
 * follow. Several choices inside that frame are one rebuild, for the last.
 * Every slot changes the tower now, but a choice that ends on the tower
 * already shown (there and back inside one frame) builds nothing.
 *
 * `fitting` stays true until the viewer has taken the new build: this hook's
 * effects run after the viewer's, which is a child of the component using it,
 * and it clears on the frame after that, once the rebuild has finished.
 */
export function useTowerBuild(build: DesktopBuild) {
  const [behind, setBehind] = useState(build);
  const current = towerKey(build) === towerKey(behind);
  useEffect(() => {
    if (current) return;
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => setBehind(build), 0);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [build, current]);
  const tower = current ? build : behind;
  const shown = towerKey(tower);
  const [applied, setApplied] = useState(shown);
  useEffect(() => {
    // The frame after the viewer's own effect has rebuilt the tower.
    const frame = requestAnimationFrame(() => setApplied(shown));
    return () => cancelAnimationFrame(frame);
  }, [shown]);
  return { tower, fitting: applied !== towerKey(build) };
}
