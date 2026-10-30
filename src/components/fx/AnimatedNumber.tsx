'use client';
import { useEffect, useRef, useState } from 'react';
import { pounds } from '@/lib/money';

/** A price that rolls smoothly to its new value, with a brief gold glint when it changes. */
export default function AnimatedNumber({ value, className, format = pounds }: { value: number; className?: string; format?: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const [glint, setGlint] = useState(false);
  const from = useRef(value);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const start = performance.now(), a = from.current, b = value, dur = 700;
    if (a === b) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(b); from.current = b; return; }
    setGlint(true);
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 4);
      const n = Math.round(a + (b - a) * e);
      setShown(n); from.current = n;
      if (k < 1) raf = requestAnimationFrame(tick); else setTimeout(() => setGlint(false), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={`${className ?? ''} num${glint ? ' glint' : ''}`}>{format(shown)}</span>;
}
