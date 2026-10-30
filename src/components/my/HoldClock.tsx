'use client';
import { useEffect, useState } from 'react';

const fmt = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return d ? `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m` : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };

/** A live countdown to when a held date is released. */
export default function HoldClock({ until, label }: { until: string; label: string }) {
  const end = new Date(until).getTime();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => { const tick = () => setLeft(end - Date.now()); tick(); const t = setInterval(tick, 1000); return () => clearInterval(t); }, [end]);
  return (
    <div className="holdcard">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 1.5M9 2h6" /></svg>
      <span className="col g4 grow"><span className="b">{label}</span><span className="small" style={{ opacity: .8 }}>Released when the clock runs out</span></span>
      <span className="t">{left == null ? '—' : fmt(left)}</span>
    </div>
  );
}
