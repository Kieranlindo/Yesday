'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { bookTour } from '@/app/actions';
import { pounds } from '@/lib/money';
import { dayLong, dayShort, DOW, MON, niceTime, parseDay, TOUR_TIMES } from '@/lib/dates';
import { CHAPTERS, chapterSummary, SEE_CHAPTERS, seeLabel, type BuilderOption, type Numbers } from '@/lib/package';
import type { BuilderVenue } from './PackageBuilder';

const Check = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

type Props = {
  open: boolean; onClose: () => void; venue: BuilderVenue; options: BuilderOption[]; codes: string[]; numbers: Numbers; total: number; days: string[];
  signedIn: boolean; isCouple: boolean; onSignIn: () => void; onBooked: (id: string) => void;
};

/** Book your custom tour: slides in over the venue page with the couple's package already in hand. */
export default function TourDrawer({ open, onClose, venue: v, options, codes, numbers: n, total, days, signedIn, isCouple, onSignIn, onBooked }: Props) {
  const seeable = useMemo(() => options.filter(o => SEE_CHAPTERS.includes(o.chapter) && o.pricePence > 0 && codes.includes(o.code)), [options, codes]);
  const [see, setSee] = useState<string[]>(() => seeable.map(o => o.code));
  const [day, setDay] = useState(days[2] ?? days[0]);
  const [time, setTime] = useState(TOUR_TIMES[1]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => { setSee(seeable.map(o => o.code)); }, [seeable]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const book = () => {
    setErr(null);
    start(async () => {
      const r = await bookTour({ venueId: v.id, codes, day: n.day, guests: n.guests, evening: n.evening, kids: n.kids, tourDay: day, time, toSee: see, note });
      if (r.signIn) return onSignIn();
      if (r.error) return setErr(r.error);
      if (r.id) onBooked(r.id);
    });
  };
  const evening = (d: string) => parseDay(d).getUTCDay() === 4; // late tours on Thursdays
  const times = TOUR_TIMES.filter(t => t !== '18:30' || evening(day));
  useEffect(() => { if (!times.includes(time)) setTime(times[1] ?? times[0]); }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`layer${open ? ' open' : ''}`} aria-hidden={!open}>
      <button className="backdrop" aria-label="Close" onClick={onClose} tabIndex={open ? 0 : -1} />
      <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="tour-h">
        <div className="dtop">
          <div className="col g4"><span className="eyebrow">{v.name}</span><h2 id="tour-h" style={{ fontSize: 38, lineHeight: 1 }}>Book your custom tour</h2></div>
          <button className="ib" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="dbody">
          <div className="card pkcard">
            <div className="row between"><span className="b">Your package</span><span className="b num">{pounds(total)}</span></div>
            <span className="small muted">{dayLong(n.day)}<span className="sep" />{n.guests} guests</span>
            <ul className="pkl">
              {CHAPTERS.slice(1).map(c => { const t = chapterSummary(options, codes, c.key); return t === 'Nothing added' ? null : <li key={c.key}><span className="k">{c.short}</span><span>{t}</span></li>; })}
            </ul>
          </div>

          {seeable.length > 0 && (
            <div className="col g10">
              <div className="col g4"><p className="glabel">What you’d like to see</p><p className="small muted">From your package. {v.manager} sets these up, so you see your day, not a standard show-round.</p></div>
              <div className="seegrid">
                {seeable.map(o => { const on = see.includes(o.code); return (
                  <button key={o.code} className={`choice${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setSee(s => (on ? s.filter(x => x !== o.code) : [...s, o.code]))}>
                    <span className={`check${on ? ' on' : ''}`} aria-hidden="true">{on ? <Check /> : null}</span><span className="small">{seeLabel(o)}</span>
                  </button>
                ); })}
              </div>
            </div>
          )}

          <div className="col g10">
            <p className="glabel">Days {v.manager} can show you round</p>
            <div className="daygrid">
              {days.map(d => { const x = parseDay(d); return (
                <button key={d} className={`daychip${d === day ? ' on' : ''}`} aria-pressed={d === day} onClick={() => setDay(d)}>
                  <span className="tiny">{DOW[x.getUTCDay()].slice(0, 3)}</span><span className="dn">{x.getUTCDate()}</span><span className="tiny">{MON[x.getUTCMonth()].slice(0, 3)}</span>
                </button>
              ); })}
            </div>
          </div>
          <div className="col g10">
            <p className="glabel">Choose a time</p>
            <div className="row g8 wrapr">{times.map(t => <button key={t} className={`tchip${t === time ? ' on' : ''}`} aria-pressed={t === time} onClick={() => setTime(t)}>{niceTime(t)}</button>)}</div>
            <p className="tiny muted">About 45 minutes. {evening(day) ? 'Thursday evening tours show the rooms lit for the evening.' : ''}</p>
          </div>
          <label className="field"><span className="glabel">Anything {v.manager} should know? <span className="faint">(optional)</span></span>
            <textarea className="inp ta" rows={3} maxLength={600} value={note} onChange={e => setNote(e.target.value)} placeholder="Parents joining us, a nut allergy, we’d love to see the garden at sunset…" />
          </label>
          <div className="amline">
            {v.managerPhoto ? <img className="pic" src={v.managerPhoto} alt="" /> : <span className="av" style={{ width: 40, height: 40, fontSize: 18 }}>{v.manager[0]}</span>}
            <p className="small">{v.manager} will receive your package and set up {see.length ? `the ${see.length} ${see.length === 1 ? 'thing' : 'things'} you’d like to see` : 'the venue'} for when you arrive.</p>
          </div>
          <div className="row g12 small holdline">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <p className="muted">We’ll hold {dayShort(n.day)} for you for 24 hours after your tour, so you can sleep on it.</p>
          </div>
          {err && <p className="err" role="alert">{err}</p>}
        </div>
        <div className="dfoot">
          {signedIn && !isCouple ? <p className="err small">Tours are booked from a couple’s account.</p> : null}
          <button className="btn lg full gold" disabled={pending || (signedIn && !isCouple)} onClick={signedIn ? book : onSignIn}>
            {pending ? <><span className="spin" /> Booking your tour…</> : signedIn ? `Book your tour, ${dayShort(day)}, ${niceTime(time)}` : 'Create an account to book your tour'}
          </button>
          {!signedIn && <p className="tiny muted" style={{ textAlign: 'center' }}>Your package comes with you. It takes under a minute.</p>}
        </div>
      </div>
    </div>
  );
}
