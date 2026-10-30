'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pounds } from '@/lib/money';
import { NEEDS, STYLES } from '@/lib/labels';

type F = { styles: string[]; needs: string[]; maxPence: number | null };
const Chev = () => <span className="cv"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></span>;
const BUDGET_MAX = 6_000_000;

/** Style, budget, and food and must-have filters, each in its own drop-down panel. */
export default function FilterBar({ base, initial, sortQ }: { base: string; initial: F; sortQ: string }) {
  const router = useRouter();
  const [open, setOpen] = useState<null | 'style' | 'budget' | 'needs'>(null);
  const [f, setF] = useState<F>(initial);
  const apply = (next: F) => {
    setOpen(null);
    const u = new URLSearchParams(base);
    if (next.styles.length) u.set('style', next.styles.join('.'));
    if (next.needs.length) u.set('needs', next.needs.join('.'));
    if (next.maxPence) u.set('max', String(Math.round(next.maxPence / 100)));
    if (sortQ) u.set('sort', sortQ);
    router.push(`/search?${u}`, { scroll: false });
  };
  const tog = (k: 'styles' | 'needs', v: string) => setF(x => ({ ...x, [k]: x[k].includes(v) ? x[k].filter(y => y !== v) : [...x[k], v] }));
  const count = f.styles.length + f.needs.length + (f.maxPence ? 1 : 0);
  const panel = (k: 'style' | 'budget' | 'needs', left: number, body: React.ReactNode, clear: () => void) => open === k && (
    <div className="ddpanel" style={{ left }} role="dialog">
      {body}
      <div className="ddfoot"><button className="link" onClick={clear}>Clear</button><button className="btn sm" onClick={() => apply(f)}>Show venues</button></div>
    </div>
  );
  const pct = ((f.maxPence ?? BUDGET_MAX) / BUDGET_MAX) * 100;
  return (
    <div className="fbar">
      {open && <button className="ddscrim" aria-label="Close filters" onClick={() => { setF(initial); setOpen(null); }} />}
      <button className={`ddbtn${open === 'style' ? ' open' : ''}${initial.styles.length ? ' set' : ''}`} onClick={() => setOpen(open === 'style' ? null : 'style')} aria-expanded={open === 'style'}>
        Style{initial.styles.length ? <span className="cnt">{initial.styles.length}</span> : null}<Chev /></button>
      <button className={`ddbtn${open === 'budget' ? ' open' : ''}${initial.maxPence ? ' set' : ''}`} onClick={() => setOpen(open === 'budget' ? null : 'budget')} aria-expanded={open === 'budget'}>
        {initial.maxPence ? `Up to ${pounds(initial.maxPence)}` : 'Budget'}<Chev /></button>
      <button className={`ddbtn${open === 'needs' ? ' open' : ''}${initial.needs.length ? ' set' : ''}`} onClick={() => setOpen(open === 'needs' ? null : 'needs')} aria-expanded={open === 'needs'}>
        Food, faith and must-haves{initial.needs.length ? <span className="cnt">{initial.needs.length}</span> : null}<Chev /></button>
      {count > 0 && <button className="link small" onClick={() => { const e = { styles: [], needs: [], maxPence: null }; setF(e); apply(e); }}>Clear all</button>}

      {panel('style', 0, <><p className="b">What kind of venue?</p><div className="chipset">{STYLES.map(s => <button key={s} className={`pchip${f.styles.includes(s) ? ' on' : ''}`} onClick={() => tog('styles', s)}>{s}</button>)}</div></>, () => setF(x => ({ ...x, styles: [] })))}
      {panel('budget', 90, <>
        <div className="row between"><p className="b">Your whole day</p><span className="serif" style={{ fontSize: 26 }}>{f.maxPence ? `Up to ${pounds(f.maxPence)}` : 'No limit'}</span></div>
        <input className="brange" type="range" min={500_000} max={BUDGET_MAX} step={50_000} value={f.maxPence ?? BUDGET_MAX} style={{ ['--p' as string]: `${pct}%` }} aria-label="Budget" onChange={e => { const v = Number(e.target.value); setF(x => ({ ...x, maxPence: v >= BUDGET_MAX ? null : v })); }} />
        <p className="tiny muted">Compared with each venue’s full day for your guests, not just the hire fee.</p>
      </>, () => setF(x => ({ ...x, maxPence: null })))}
      {panel('needs', 200, <><p className="b">Venues that can do all of these</p><div className="chipset">{NEEDS.map(([k, l]) => <button key={k} className={`pchip${f.needs.includes(k) ? ' on' : ''}`} onClick={() => tog('needs', k)}>{l}</button>)}</div></>, () => setF(x => ({ ...x, needs: [] })))}
    </div>
  );
}
