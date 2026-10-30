'use client';
import { useEffect, useState } from 'react';

/** The gold signature that writes itself on a couple's first visit, once per browser session. */
export default function Splash() {
  const [state, setState] = useState<'off' | 'on' | 'leaving'>('off');
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('yd_splash') === '1'; sessionStorage.setItem('yd_splash', '1'); } catch { /* private mode */ }
    if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setState('on');
    const a = setTimeout(() => setState('leaving'), 3900), b = setTimeout(() => setState('off'), 4700);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (state === 'off') return null;
  return (
    <button className={`splash${state === 'leaving' ? ' leaving' : ''}`} onClick={() => setState('leaving')} aria-label="Skip the introduction">
      <span className="sscript">Yesday</span>
      <span className="sline" />
      <span className="stag">say yes to the date.</span>
    </button>
  );
}
