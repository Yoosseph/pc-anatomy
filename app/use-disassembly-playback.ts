'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Shared 0–100 disassembly playback used by exploration and comparison. */
export function useDisassemblyPlayback(
  explode: number,
  onExplodeChange: (explode: number) => void,
) {
  const [playing, setPlaying] = useState(false);
  const explodeRef = useRef(explode);
  const changeRef = useRef(onExplodeChange);
  useEffect(() => {
    explodeRef.current = explode;
  }, [explode]);
  useEffect(() => {
    changeRef.current = onExplodeChange;
  }, [onExplodeChange]);

  const stop = useCallback(() => setPlaying(false), []);
  const setExplode = useCallback((value: number) => {
    setPlaying(false);
    const next = Math.min(100, Math.max(0, value));
    explodeRef.current = next;
    changeRef.current(next);
  }, []);

  const toggleAuto = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      explodeRef.current = 100;
      changeRef.current(100);
      return;
    }
    if (explodeRef.current >= 99) {
      explodeRef.current = 0;
      changeRef.current(0);
    }
    setPlaying(true);
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      const next = Math.min(100, explodeRef.current + delta * 11);
      explodeRef.current = next;
      changeRef.current(next);
      if (next >= 100) setPlaying(false);
      else frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  return { playing, setExplode, stop, toggleAuto };
}
