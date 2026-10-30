'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedNumber from '@/components/fx/AnimatedNumber';
import { toast } from '@/components/fx/Toaster';
import TourDrawer from './TourDrawer';
import { checkDate, savePackage } from '@/app/actions';
import { pounds } from '@/lib/money';
import { dayLong, dayShort, MON, parseDay } from '@/lib/dates';
import { hireForDay, KIDS_MENU_PENCE } from '@/lib/rules';
import {
  CHAPTERS, chapterSummary, clean, encodeCodes, EXTRA_LABEL, GROUP_LABEL, groupOf, MOST_CHOSEN, RECOMMENDS, starterFor, summarise, toggle,
  type BuilderOption, type Numbers,
} from '@/lib/package';

export type BuilderVenue = {
  id: string; slug: string; name: string; shortName: string; place: string; capacityDinner: number; capacityEvening: number | null;
  hireBasePence: number; depositPercent: number; licensed: boolean; manager: string; managerPhoto: string | null; spaces: string | null;
};
export type BuilderStart = {
  numbers: Numbers; codes: string[] | null; free: boolean; overridePence: number | null; today: string; tourDays: string[];
  signedIn: boolean; isCouple: boolean; savedOnServer: boolean; fromShare: boolean; openTour: boolean;
};

const Check = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Minus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 12h12" /></svg>;
const Plus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 6v12M6 12h12" /></svg>;

const unitLabel = (o: BuilderOption) => !o.pricePence ? (o.code === 'd_none' ? 'No package cost' : 'Included') : o.unit === 'pp' ? `${pounds(o.pricePence)} a guest` : o.unit === 'eve' ? `${pounds(o.pricePence)} an evening guest` : pounds(o.pricePence);

export default function PackageBuilder({ venue: v, options, start }: { venue: BuilderVenue; options: BuilderOption[]; start: BuilderStart }) {
  const router = useRouter();
  const storeKey = `yd_pkg_${v.slug}`;
  const starter = useMemo(() => starterFor(options, v.licensed), [options, v.licensed]);
  const [codes, setCodes] = useState<string[]>(() => clean(start.codes ?? starter, options, v.licensed));
  const [n, setN] = useState<Numbers>(start.numbers);
  const [free, setFree] = useState(start.free);
  const [override, setOverride] = useState<number | null>(start.overridePence);
  const [perGuest, setPerGuest] = useState(false);
  const [save, setSave] = useState<'idle' | 'saving' | 'saved' | 'local'>(start.savedOnServer ? 'saved' : 'idle');
  const [active, setActive] = useState('numbers');
  const [tourOpen, setTourOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [, startT] = useTransition();
  const touched = useRef(false);

  // A couple who built a package before signing in picks up where they left off.
  useEffect(() => {
    if (start.codes || start.fromShare) return;
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.codes)) { setCodes(clean(p.codes, options, v.licensed)); if (start.signedIn) touched.current = true; } }
    } catch { /* storage unavailable */ }
    if (start.openTour) setTourOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const s = useMemo(() => summarise(options, codes, n, v.hireBasePence, v.depositPercent, start.today, override), [options, codes, n, v.hireBasePence, v.depositPercent, start.today, override]);
  const hire = hireForDay(v.hireBasePence, n.day, override);
  const isStarter = codes.length === starter.length && codes.every(c => starter.includes(c)) && n.kids === 0;

  // Keep the address bar in step, so a refresh or a shared link shows the same day.
  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set('date', n.day); u.searchParams.set('guests', String(n.guests)); u.searchParams.set('evening', String(n.evening));
    if (n.kids) u.searchParams.set('kids', String(n.kids)); else u.searchParams.delete('kids');
    if (isStarter) u.searchParams.delete('pkg'); else u.searchParams.set('pkg', encodeCodes(codes));
    u.searchParams.delete('tour');
    window.history.replaceState(window.history.state, '', u);
  }, [codes, n, isStarter]);

  // Save as they go: to their account if signed in, otherwise to this browser until they are.
  useEffect(() => {
    if (!touched.current) return;
    try { localStorage.setItem(storeKey, JSON.stringify({ codes, at: Date.now() })); } catch { /* ignore */ }
    if (!start.signedIn || !start.isCouple) { setSave('local'); return; }
    setSave('saving');
    const t = setTimeout(() => startT(async () => {
      const r = await savePackage({ venueId: v.id, codes, day: n.day, guests: n.guests, evening: n.evening, kids: n.kids });
      setSave(r.saved ? 'saved' : 'idle');
    }), 700);
    return () => clearTimeout(t);
  }, [codes, n]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the chapter you're reading in the chapter bar.
  useEffect(() => {
    const els = CHAPTERS.map(c => document.getElementById(`ch-${c.key}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(es => { const top = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (top) setActive(top.target.id.slice(3)); }, { rootMargin: '-140px 0px -55% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

  const pick = (code: string) => {
    touched.current = true;
    setCodes(c => toggle(c, code, options));
    setFlash(code); setTimeout(() => setFlash(f => (f === code ? null : f)), 600);
  };
  const setNum = (k: keyof Omit<Numbers, 'day'>, val: number) => {
    touched.current = true;
    const lim = { guests: [10, 500], evening: [0, 500], kids: [0, 60] }[k];
    setN(x => ({ ...x, [k]: Math.min(lim[1], Math.max(lim[0], Math.round(val) || 0)) }));
  };
  const setDay = useCallback((day: string) => {
    if (!day || day <= start.today) return;
    touched.current = true;
    setN(x => ({ ...x, day }));
    startT(async () => { const r = await checkDate(v.id, day); setFree(r.free); setOverride(r.overridePence); });
  }, [start.today, v.id]);
  const reset = () => { touched.current = true; setCodes(clean(starter, options, v.licensed)); setN(x => ({ ...x, kids: 0 })); toast('Back to our suggested day'); };
  const share = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); toast('Link copied. Anyone with it sees this exact day.'); }
    catch { window.prompt('Copy this link to share your day', url); }
  };
  const jump = (k: string) => document.getElementById(`ch-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const fit = n.guests <= v.capacityDinner;
  const evCap = v.capacityEvening ?? v.capacityDinner;
  const first = s.plan[0];
  const doneIdx = CHAPTERS.findIndex(c => c.key === active);

  const card = (o: BuilderOption) => {
    const on = codes.includes(o.code), g = groupOf(o.code);
    const forYou = o.unit === 'pp' || o.unit === 'eve' ? s.lines.find(l => l.code === o.code)?.pence ?? o.pricePence * (o.unit === 'pp' ? n.guests : n.guests + n.evening) : null;
    return (
      <button key={o.code} className={`ocard${on ? ' on' : ''}${flash === o.code ? ' flash' : ''}`} aria-pressed={on} onClick={() => pick(o.code)}>
        <span className="otop">
          <span className="row g6 wrapr">
            {MOST_CHOSEN.has(o.code) && <span className="otag">Most chosen</span>}
            {RECOMMENDS.has(o.code) && <span className="otag rec">{v.manager} recommends</span>}
          </span>
          <span className={g ? `radio${on ? ' on' : ''}` : `check${on ? ' on' : ''}`} aria-hidden="true">{!g && on ? <Check /> : null}</span>
        </span>
        <span className="oname">{o.name}</span>
        <span className="small muted">{unitLabel(o)}{forYou != null && o.pricePence > 0 && <><span className="sep" /><span className="num" style={{ color: 'var(--ink)' }}>{pounds(forYou)}</span> for you</>}</span>
        <span className="small muted odetail">{o.detail}</span>
      </button>
    );
  };

  return (
    <>
      <div className="vbody">
        <div className="col">
          <section className="builder" aria-labelledby="build-h">
            <div className="bhead" data-reveal>
              <span className="eyebrow">{isStarter ? 'Our suggested day' : 'Your day, your way'}</span>
              <h2 id="build-h" className="bh2">Build your day at {v.shortName}</h2>
              <p className="muted" style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 660 }}>It’s ready to go as it is. Change anything you like and the price updates as you go. {v.manager} sees this exact package before your tour.</p>
            </div>

            <nav className="chbar" aria-label="Parts of your day">
              <div className="chtabs">
                {CHAPTERS.map((c, i) => (
                  <button key={c.key} className={`chtab${active === c.key ? ' on' : ''}${i < doneIdx ? ' past' : ''}`} onClick={() => jump(c.key)}>
                    <span>{c.short}</span>
                    <span className="tiny num">{c.key === 'numbers' ? `${n.guests}` : s.byChapter[c.key] ? pounds(s.byChapter[c.key]) : '—'}</span>
                  </button>
                ))}
              </div>
              <div className="chprog"><span style={{ width: `${((doneIdx + 1) / CHAPTERS.length) * 100}%` }} /></div>
            </nav>

            {CHAPTERS.map((c, ci) => {
              const opts = options.filter(o => o.chapter === c.key);
              if (c.key !== 'numbers' && !opts.length) return null;
              const groups: [string, BuilderOption[]][] = [];
              for (const o of opts) { const g = groupOf(o.code) ?? 'extra'; const hit = groups.find(x => x[0] === g); if (hit) hit[1].push(o); else groups.push([g, [o]]); }
              return (
                <section key={c.key} id={`ch-${c.key}`} className="chap" data-reveal>
                  <header className="chh">
                    <div className="col g4"><span className="chn num">{String(ci + 1).padStart(2, '0')}</span><h3>{c.title}</h3><p className="muted">{c.intro}</p></div>
                    {c.key !== 'numbers' && <div className="col g4" style={{ alignItems: 'flex-end' }}><span className="tiny muted">This part of your day</span><AnimatedNumber className="chsub" value={s.byChapter[c.key] ?? 0} /></div>}
                  </header>
                  {c.key === 'numbers' ? (
                    <div className="col g16">
                      {([['guests', 'Day guests', 'At your ceremony and wedding breakfast'], ['evening', 'Evening guests', 'Joining for the party only'], ['kids', 'Children under 12', `Children’s menu at ${pounds(KIDS_MENU_PENCE)} each`]] as const).map(([k, label, d]) => (
                        <div key={k} className="stepper">
                          <span className="col g4 grow"><span className="b">{label}</span><span className="small muted">{d}</span></span>
                          <button className="ib" onClick={() => setNum(k, n[k] - (k === 'kids' ? 1 : 5))} aria-label={`Fewer ${label.toLowerCase()}`}><Minus /></button>
                          <input className="bigin num" inputMode="numeric" aria-label={label} value={n[k]} onChange={e => setNum(k, Number(e.target.value.replace(/\D/g, '')))} />
                          <button className="ib" onClick={() => setNum(k, n[k] + (k === 'kids' ? 1 : 5))} aria-label={`More ${label.toLowerCase()}`}><Plus /></button>
                        </div>
                      ))}
                      <div className="capm">
                        <div className="row between small"><span>{n.guests} of {v.capacityDinner} seats for dinner</span><span className="muted">{n.guests + n.evening} of {evCap} in the evening</span></div>
                        <div className="hcbar"><span className={`hcfill${fit ? '' : ' over'}`} style={{ width: `${Math.min(100, (n.guests / v.capacityDinner) * 100)}%` }}><span className="hcgem" /></span></div>
                        {!fit && <p className="err">{v.name} seats up to {v.capacityDinner} for dinner, fewer than your {n.guests} guests.</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="col g24">
                      {c.key === 'ceremony' && !v.licensed && <p className="notice small">{v.name} isn’t licensed for ceremonies, so marry first and celebrate here.</p>}
                      {groups.map(([g, list]) => {
                        const label = g === 'extra' ? EXTRA_LABEL[c.key] : GROUP_LABEL[g];
                        return (
                          <div key={g} className="col g12">
                            {label && <p className="glabel">{label}{g === 'extra' ? <span className="faint"> · add as many as you like</span> : g === 'can' ? <span className="faint"> · optional</span> : null}</p>}
                            <div className="ogrid">{list.map(card)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </section>
        </div>

        <aside className="rail" aria-label="Your day and price">
          <div className="card book">
            <div className="row between g12">
              <span className={`pill ${free ? 'free' : 'booked'} avail`}><span className="adot" />{free ? `Free on ${dayShort(n.day)}` : `Booked on ${dayShort(n.day)}`}</span>
              <span className="small muted">{n.guests} guests, {n.evening} evening</span>
            </div>
            <label className="field"><span className="tiny muted">Wedding date</span><input className="inp" type="date" value={n.day} min={start.today} onChange={e => setDay(e.target.value)} /></label>

            <div className="col g8 totalbox">
              <div className="row between"><span className="small muted">{perGuest ? 'Your day, per guest' : 'Your full day'}</span>
                <div className="seg mini"><button className={perGuest ? '' : 'on'} onClick={() => setPerGuest(false)}>Total</button><button className={perGuest ? 'on' : ''} onClick={() => setPerGuest(true)}>Per guest</button></div>
              </div>
              <AnimatedNumber className="pp" value={perGuest ? s.perGuest : s.total} />
              <span className="tiny muted">{dayLong(n.day)}</span>
            </div>

            <div className="depbox">
              <div className="row between"><span className="b">Deposit to secure the date</span><AnimatedNumber className="b" value={s.deposit} /></div>
              <span className="tiny muted">{s.percent > 20 ? `${v.shortName} asks ${s.percent}% of your package.` : 'Deposits on Yesday are 20% of your package.'}{first ? ` Then ${s.plan.length} monthly payments of about ${pounds(Math.round(first.amountPence / 100) * 100)} from ${MON[parseDay(first.due).getUTCMonth()]}, finishing eight weeks before the day.` : ''}</span>
            </div>

            <button className="btn lg full gold" disabled={!free || !fit} onClick={() => setTourOpen(true)}>Book your custom tour</button>
            {!free && <p className="err small">{v.name} is booked on {dayShort(n.day)}. Choose another date above.</p>}
            <div className="lines">
              <div className="ln"><span>Venue hire</span><AnimatedNumber value={hire} /></div>
              {CHAPTERS.slice(1).filter(c => options.some(o => o.chapter === c.key && codes.includes(o.code))).map(c => (
                <button key={c.key} className="ln lnb" onClick={() => jump(c.key)}><span className="col" style={{ minWidth: 0, textAlign: 'left' }}><span>{c.title}</span><span className="tiny muted ell">{chapterSummary(options, codes, c.key)}</span></span>{s.byChapter[c.key] ? <AnimatedNumber value={s.byChapter[c.key]} /> : <span className="muted">Included</span>}</button>
              ))}
              {n.kids > 0 && <div className="ln"><span>Children’s menus</span><AnimatedNumber value={s.kidsPence} /></div>}
            </div>

            <div className="row between small">
              <button className="link" onClick={share}>Share this day</button>
              {isStarter ? <span className="faint tiny">Our suggested day</span> : <button className="link" onClick={reset}>Back to our suggested day</button>}
            </div>
            <p className={`savestate tiny${save === 'saved' ? ' ok' : ''}`} aria-live="polite">
              {save === 'saving' ? 'Saving…' : save === 'saved' ? <><Check /> Saved to your wedding</> : save === 'local' ? (start.signedIn ? 'Saved in this browser' : <>Saved in this browser. <a className="link" href={`/signup?next=${encodeURIComponent(`/venues/${v.slug}`)}`}>Create an account</a> to keep it.</>) : start.signedIn ? 'Changes save as you go' : 'Your changes save as you go'}
            </p>
          </div>
          <div className="card am">
            {v.managerPhoto ? <img className="pic" src={v.managerPhoto} alt="" /> : <span className="pic av" style={{ width: 54, height: 54, fontSize: 24 }}>{v.manager[0]}</span>}
            <div className="col g4"><span className="b">{v.manager} looks after weddings here</span><span className="small muted">One real person, from your first question to your last dance. Replies within a day.</span></div>
          </div>
        </aside>
      </div>

      <TourDrawer
        open={tourOpen} onClose={() => setTourOpen(false)} venue={v} options={options} codes={codes} numbers={n} total={s.total} days={start.tourDays}
        signedIn={start.signedIn} isCouple={start.isCouple}
        onSignIn={() => { try { localStorage.setItem(storeKey, JSON.stringify({ codes, at: Date.now() })); } catch { /* ignore */ } const u = new URL(window.location.href); u.searchParams.set('tour', '1'); router.push(`/signup?next=${encodeURIComponent(u.pathname + u.search)}`); }}
        onBooked={id => { try { localStorage.removeItem(storeKey); } catch { /* ignore */ } router.push(`/my/tours/${id}`); }}
      />
    </>
  );
}
