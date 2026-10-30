import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import HoldClock from '@/components/my/HoldClock';
import TourFeedback from '@/components/my/TourFeedback';
import TourActions from '@/components/my/TourActions';
import LikedGrid from '@/components/my/LikedGrid';
import { requireUser } from '@/lib/auth';
import { likedVenues } from '@/lib/venues';
import { coupleSpace } from '@/lib/couple';
import { readSearch, searchQuery } from '@/lib/search-params';
import { dayLong, dayShort, londonParts, londonToday, MON, niceTime, parseDay } from '@/lib/dates';
import { coupleName, NEEDS } from '@/lib/labels';
import { pounds } from '@/lib/money';
import { depositFor } from '@/lib/rules';

export const metadata: Metadata = { title: 'Your wedding' };
export const dynamic = 'force-dynamic';

const Lock = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

export default async function My() {
  const u = await requireUser('couple', '/my');
  const { plan, tours, packages } = await coupleSpace(u.id);
  const q = readSearch(plan ? { date: plan.weddingDate ?? undefined, guests: String(plan.guests), evening: String(plan.eveningGuests) } : {});
  const liked = await likedVenues(u.id, q);
  const query = searchQuery(q);
  const now = Date.now();
  const today = londonToday();
  const days = plan?.weddingDate ? Math.round((parseDay(plan.weddingDate).getTime() - parseDay(today).getTime()) / 864e5) : null;
  const upcoming = tours.filter(t => t.startsAt.getTime() > now);
  const due = tours.filter(t => t.startsAt.getTime() <= now && !t.verdict);
  const reviewed = tours.filter(t => t.verdict);
  const when = plan?.weddingDate ? dayLong(plan.weddingDate) : plan?.flexMonths.length ? `Flexible: ${[...plan.flexMonths].sort().map(m => MON[Number(m.slice(5)) - 1].slice(0, 3)).join(', ')}` : null;

  return (
    <>
      <Nav />
      <main className="wrap">
        <section className="myhero">
          <div className="col g16 stagger">
            <span className="eyebrow">{plan?.lastName ? `The ${plan.lastName} wedding` : 'Your wedding'}</span>
            <h1>{coupleName(u)}</h1>
            {plan ? (
              <div className="planrow">
                {when && <span className="planchip"><b>{when}</b></span>}
                <span className="planchip"><span><b>{plan.guests}</b> guests, {plan.eveningGuests} more in the evening</span></span>
                {plan.budgetPence ? <span className="planchip"><span>Up to <b>{pounds(plan.budgetPence)}</b></span></span> : null}
                {plan.needs.map(n => <span key={n} className="planchip">{NEEDS.find(x => x[0] === n)?.[1] ?? n}</span>)}
                <Link className="link small" style={{ alignSelf: 'center' }} href="/start?next=/my">Edit</Link>
              </div>
            ) : (
              <div className="row g12 wrapr"><p className="muted" style={{ fontSize: 18 }}>Tell us about your day and every price on Yesday is worked out for you.</p><Link className="btn" href="/start?next=/my">Tell us about your day</Link></div>
            )}
          </div>
          {days != null && days > 0 && (
            <div className="cdown" aria-label={`${days} days to go`}><span className="n num">{days}</span><span className="small muted">days to go</span></div>
          )}
        </section>

        <div className="mygrid">
          <div className="col g40">
            {due.map(t => (
              <TourFeedback key={t.id} id={t.id} venue={t.venue.name.replace(/^The /, '')} manager={t.venue.managerName}
                held={t.holdUntil && t.holdUntil.getTime() > now && t.weddingDate ? `${dayShort(t.weddingDate)} is held for you until ${niceTime(londonParts(t.holdUntil).time)} on ${dayShort(londonParts(t.holdUntil).day)}.` : null} />
            ))}

            <section className="col g16">
              <div className="row between"><h2 style={{ fontSize: 36 }}>Your tours</h2>{upcoming.length > 0 && <span className="small muted">{upcoming.length} coming up</span>}</div>
              {upcoming.length ? upcoming.map(t => {
                const { day, time } = londonParts(t.startsAt);
                return (
                  <article key={t.id} className="card tourc" data-reveal>
                    <div className="img" style={{ backgroundImage: t.venue.photo ? `url(${t.venue.photo})` : undefined }} />
                    <div className="body">
                      <span className="eyebrow" style={{ fontSize: 19 }}>{dayLong(day)}, {niceTime(time)}</span>
                      <h3 style={{ fontSize: 30 }}>{t.venue.name}</h3>
                      <p className="small muted">{t.venue.managerName} has your {pounds(t.totalPence ?? 0)} package and is getting your tour ready.</p>
                      {t.holdUntil && t.weddingDate && <HoldClock until={t.holdUntil.toISOString()} label={`${dayShort(t.weddingDate)} is held for you`} />}
                      <div className="row g12 wrapr"><Link className="btn sm" href={`/my/tours/${t.id}`}>Tour details</Link><a className="btn sm o" href={`/api/tours/${t.id}/calendar`}>Add to calendar</a></div>
                      <TourActions id={t.id} past={false} />
                    </div>
                  </article>
                );
              }) : !tours.length && (
                <div className="card empty" style={{ alignItems: 'flex-start', textAlign: 'left', padding: 32 }}>
                  <h3 style={{ fontSize: 28 }}>No tours yet</h3>
                  <p className="muted">Build your day at a venue you love, then book a custom tour. The venue shows you round with your package in hand, and holds your date for a day afterwards.</p>
                  <Link className="btn" href={`/search?${query}`}>Find your venue</Link>
                </div>
              )}
              {reviewed.map(t => (
                <div key={t.id} className="row between card" style={{ padding: '16px 20px' }}>
                  <span className="col g4"><span className="b">{t.venue.name}</span><span className="small muted">Toured {dayShort(londonParts(t.startsAt).day)} · {'★'.repeat(t.rating ?? 0)} · {t.verdict === 'love' ? 'You loved it' : t.verdict === 'maybe' ? 'Still deciding' : 'Not for you'}</span></span>
                  <Link className="link small" href={`/venues/${t.venue.slug}?${query}`}>See the venue</Link>
                </div>
              ))}
            </section>

            {packages.length > 0 && (
              <section className="col g16">
                <h2 style={{ fontSize: 36 }}>Your packages</h2>
                {packages.map(p => (
                  <Link key={p.venueId} className="card pkgc" href={`/venues/${p.venue.slug}?date=${p.weddingDate}&guests=${p.guests}&evening=${p.eveningGuests}${p.kids ? `&kids=${p.kids}` : ''}`} data-reveal>
                    <span className="img" style={{ backgroundImage: p.venue.photo ? `url(${p.venue.photo})` : undefined }} />
                    <span className="col g4"><span className="serif" style={{ fontSize: 26 }}>{p.venue.name}</span><span className="small muted">{dayLong(p.weddingDate)} · {p.guests} guests · deposit {pounds(depositFor(p.totalPence, p.venue.depositPercent))}</span></span>
                    <span className="col g4" style={{ alignItems: 'flex-end' }}><span className="serif num" style={{ fontSize: 30 }}>{pounds(p.totalPence)}</span><span className="tiny muted">Continue building ›</span></span>
                  </Link>
                ))}
              </section>
            )}

            <section className="col g16">
              <h2 style={{ fontSize: 36 }}>Venues you’ve liked</h2>
              {liked.length ? <LikedGrid list={liked} day={q.day} guests={q.guests} query={query} /> : (
                <div className="card empty"><h3 style={{ fontSize: 28 }}>Nothing liked yet</h3><p className="muted">Tap the heart on any venue and it’ll wait for you here.</p><Link className="btn" href={`/search?${query}`}>Find a venue</Link></div>
              )}
            </section>
          </div>

          <aside className="col g16" style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
            <p className="glabel">Unlocks when you book</p>
            {[['Payments', 'Your deposit, then monthly payments that finish eight weeks before the day.'], ['Order of the day', 'Plan the timings together with your venue’s account manager.'], ['Guest list and invites', 'Invite guests by WhatsApp or text. RSVPs and dietary needs go straight to the venue.'], ['Messages', 'One real person at your venue, from first question to last dance.']].map(([t, d]) => (
              <div key={t} className="lockc"><Lock /><span className="col g4"><span className="b" style={{ color: 'var(--ink)' }}>{t}</span><span className="small">{d}</span></span></div>
            ))}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
