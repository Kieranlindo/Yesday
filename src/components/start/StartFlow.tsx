'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { savePlan } from '@/app/actions';
import { pounds } from '@/lib/money';
import { addDays, dayLong, MON, parseDay, weekday } from '@/lib/dates';
import { NEEDS, STYLES } from '@/lib/labels';

type Plan = { firstName: string; partnerName: string; lastName: string; weddingDate: string | null; flexDow: number | null; flexMonths: string[]; guests: number; evening: number; budgetPence: number | null; styles: string[]; needs: string[] };

const PHOTOS = ['/photos/kew-2.jpg', '/photos/fulham-2.jpg', '/photos/ornc-2.jpg', '/photos/pemb-1.jpg'];
const LINES = [<>Every love story<br /><i>starts with a yes.</i></>, <>Pick a date,<br /><i>or let it find you.</i></>, <>Real prices,<br /><i>for your guests.</i></>, <>A day that’s<br /><i>entirely yours.</i></>];
const DOWS: [number | null, string][] = [[6, 'Saturday'], [5, 'Friday'], [0, 'Sunday'], [null, 'Any day']];
const BUDGET_MAX = 8_000_000;

/** "Tell us about your day": four short steps that slide past, then straight to venues that fit. */
export default function StartFlow({ initial, next, today, suggested }: { initial: Plan; next: string; today: string; suggested: string }) {
  const router = useRouter();
  const [p, setP] = useState<Plan>(initial);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [mode, setMode] = useState<'date' | 'flex'>(initial.weddingDate || !initial.flexMonths.length ? 'date' : 'flex');
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Plan>(k: K, v: Plan[K]) => setP(x => ({ ...x, [k]: v }));
  const tog = (k: 'styles' | 'needs' | 'flexMonths', v: string) => setP(x => ({ ...x, [k]: x[k].includes(v) ? x[k].filter(y => y !== v) : [...x[k], v] }));

  const months = useMemo(() => {
    const t = parseDay(today); const out: [string, string][] = [];
    for (let i = 3; i < 27; i++) { const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + i, 1)); out.push([`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, `${MON[d.getUTCMonth()].slice(0, 3)} ${String(d.getUTCFullYear()).slice(2)}`]); }
    return out;
  }, [today]);

  /** The date we search on: their date, or the first matching day in their first chosen month. */
  const searchDay = () => {
    if (mode === 'date' && p.weddingDate) return p.weddingDate;
    const m = [...p.flexMonths].sort()[0];
    if (!m) return suggested;
    let d = `${m}-01`;
    for (let i = 0; i < 31; i++) { if (p.flexDow == null || weekday(d) === p.flexDow) return d; d = addDays(d, 1); }
    return suggested;
  };

  const go = (n: number) => { setErr(null); if (step === 0 && !p.firstName.trim()) return setErr('Tell us your first name.'); setDir(n > step ? 'fwd' : 'back'); setStep(n); };
  const finish = () => start(async () => {
    const r = await savePlan({ ...p, weddingDate: mode === 'date' ? p.weddingDate : null, flexDow: mode === 'flex' ? p.flexDow : null, flexMonths: mode === 'flex' ? p.flexMonths : [] });
    if (r.error) { setErr(r.error); return; }
    if (next) { router.push(next); return; }
    const q = new URLSearchParams({ area: 'London', date: searchDay(), guests: String(p.guests), evening: String(p.evening) });
    if (p.budgetPence) q.set('max', String(Math.round(p.budgetPence / 100)));
    if (p.needs.length) q.set('needs', p.needs.join('.'));
    if (p.styles.length) q.set('style', p.styles.join('.'));
    router.push(`/search?${q}&welcome=1`);
  });

  const budgetPct = p.budgetPence == null ? 100 : (p.budgetPence / BUDGET_MAX) * 100;
  const names = p.partnerName.trim() ? `${p.firstName.trim() || 'You'} & ${p.partnerName.trim()}` : p.firstName.trim();

  return (
    <main className="startw">
      <div className="side" style={{ backgroundImage: `url(${PHOTOS[step]})` }}><p key={step} className="pagein">{LINES[step]}</p></div>
      <div className="pane">
        <div className="sprog" aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} className={i <= step ? 'on' : ''} />)}</div>
        <div key={step} className={`sstep ${dir}`}>
          {step === 0 && (<>
            <div className="col g8"><span className="eyebrow">Step one of four</span><h1>Tell us about <i className="goldtext">your day</i></h1><p className="muted" style={{ fontSize: 17 }}>A few quick questions, then we’ll show you venues that are free and priced for you.</p></div>
            <div className="row g24"><label className="field grow"><span className="small muted">Your first name</span><input className="underline" value={p.firstName} onChange={e => set('firstName', e.target.value)} autoComplete="given-name" autoFocus /></label>
              <label className="field grow"><span className="small muted">Last name</span><input className="underline" value={p.lastName} onChange={e => set('lastName', e.target.value)} autoComplete="family-name" /></label></div>
            <label className="field"><span className="small muted">Your partner’s first name <span className="faint">(optional)</span></span><input className="underline" value={p.partnerName} onChange={e => set('partnerName', e.target.value)} placeholder="You can add this later" autoComplete="off" /></label>
          </>)}
          {step === 1 && (<>
            <div className="col g8"><span className="eyebrow">Step two of four</span><h1>When are you thinking?</h1></div>
            <div className="seg" style={{ maxWidth: 380 }}><button className={mode === 'date' ? 'on' : ''} onClick={() => setMode('date')}>We have a date</button><button className={mode === 'flex' ? 'on' : ''} onClick={() => setMode('flex')}>We’re flexible</button></div>
            {mode === 'date' ? (
              <div className="col g12">
                <label className="field"><span className="small muted">Your wedding date</span><input className="inp" type="date" min={today} value={p.weddingDate ?? ''} onChange={e => set('weddingDate', e.target.value || null)} style={{ maxWidth: 320, fontSize: 18 }} /></label>
                {p.weddingDate ? <p className="serif" style={{ fontSize: 30 }}>{dayLong(p.weddingDate)}</p> : <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => set('weddingDate', suggested)}>Not sure yet? Try {dayLong(suggested)}</button>}
              </div>
            ) : (
              <div className="col g20">
                <div className="col g10"><span className="glabel">Which day of the week</span><div className="chipset">{DOWS.map(([k, l]) => <button key={l} className={`pchip${p.flexDow === k ? ' on' : ''}`} onClick={() => set('flexDow', k)}>{l}</button>)}</div></div>
                <div className="col g10"><span className="glabel">Which months <span className="faint">· pick as many as you like</span></span><div className="chipset">{months.map(([k, l]) => <button key={k} className={`pchip${p.flexMonths.includes(k) ? ' on' : ''}`} onClick={() => tog('flexMonths', k)}>{l}</button>)}</div></div>
              </div>
            )}
          </>)}
          {step === 2 && (<>
            <div className="col g8"><span className="eyebrow">Step three of four</span><h1>Who’s coming?</h1><p className="muted">Roughly is fine. Every price on Yesday is worked out for your numbers.</p></div>
            <div className="row g40 wrapr">
              {([['guests', 'Day guests', 10, 5], ['evening', 'Extra in the evening', 0, 5]] as const).map(([k, l, min, st]) => (
                <div key={k} className="col g8"><span className="glabel">{l}</span><div className="row g16">
                  <button className="ib" onClick={() => set(k, Math.max(min, p[k] - st))} aria-label={`Fewer ${l.toLowerCase()}`}>−</button>
                  <span className="bignum num" style={{ minWidth: 100, textAlign: 'center' }}>{p[k]}</span>
                  <button className="ib" onClick={() => set(k, Math.min(500, p[k] + st))} aria-label={`More ${l.toLowerCase()}`}>+</button></div></div>
              ))}
            </div>
            <div className="col g12" style={{ maxWidth: 560 }}>
              <div className="row between"><span className="glabel">Budget for your whole day</span><span className="serif" style={{ fontSize: 30 }}>{p.budgetPence == null ? 'No limit yet' : `Up to ${pounds(p.budgetPence)}`}</span></div>
              <input className="brange" type="range" min={500_000} max={BUDGET_MAX} step={50_000} value={p.budgetPence ?? BUDGET_MAX} style={{ ['--p' as string]: `${budgetPct}%` }} aria-label="Budget"
                onChange={e => { const v = Number(e.target.value); set('budgetPence', v >= BUDGET_MAX ? null : v); }} />
              <div className="row between tiny muted"><span>£5,000</span><span>No limit</span></div>
            </div>
          </>)}
          {step === 3 && (<>
            <div className="col g8"><span className="eyebrow">Last step</span><h1>What matters to you?</h1><p className="muted">We’ll show venues that can do these first. Skip anything that doesn’t matter.</p></div>
            <div className="col g10"><span className="glabel">Food, faith and the day itself</span><div className="chipset">{NEEDS.map(([k, l]) => <button key={k} className={`pchip${p.needs.includes(k) ? ' on' : ''}`} onClick={() => tog('needs', k)}>{l}</button>)}</div></div>
            <div className="col g10"><span className="glabel">Kinds of venue you love</span><div className="chipset">{STYLES.map(s => <button key={s} className={`pchip${p.styles.includes(s) ? ' on' : ''}`} onClick={() => tog('styles', s)}>{s}</button>)}</div></div>
          </>)}
          {err && <p className="err" role="alert">{err}</p>}
        </div>
        <div className="sfoot">
          {step > 0 ? <button className="btn o" onClick={() => go(step - 1)}>Back</button> : <span className="small muted">{names ? <>Lovely to meet you, <span className="b" style={{ color: 'var(--ink)' }}>{names}</span>.</> : 'You can change all of this later.'}</span>}
          {step < 3 ? <button className="btn lg" onClick={() => go(step + 1)}>Continue</button> : <button className="btn lg gold" disabled={pending} onClick={finish}>{pending ? <><span className="spin" /> Finding your venues…</> : next ? 'Save and carry on' : 'Show me venues'}</button>}
        </div>
      </div>
    </main>
  );
}
