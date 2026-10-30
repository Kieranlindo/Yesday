import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { and, eq } from 'drizzle-orm';
import Nav from '@/components/Nav';
import Burst from '@/components/fx/Burst';
import HoldClock from '@/components/my/HoldClock';
import { requireUser } from '@/lib/auth';
import { db, schema } from '@/db';
import { dayShort, DOW, londonParts, MON, niceTime, parseDay } from '@/lib/dates';
import { pounds } from '@/lib/money';
import { seeLabel } from '@/lib/package';

export const metadata: Metadata = { title: 'Tour booked' };

export default async function TourBooked({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const u = await requireUser('couple', `/my/tours/${id}`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [t] = await db.select().from(schema.tours).where(and(eq(schema.tours.id, id), eq(schema.tours.coupleId, u.id))).limit(1);
  if (!t) notFound();
  const [v] = await db.select().from(schema.venues).where(eq(schema.venues.id, t.venueId)).limit(1);
  const [photo] = await db.select().from(schema.venuePhotos).where(eq(schema.venuePhotos.venueId, v.id)).orderBy(schema.venuePhotos.position).limit(1);
  const opts = await db.select().from(schema.venueOptions).where(eq(schema.venueOptions.venueId, v.id));
  const { day, time } = londonParts(t.startsAt);
  const d = parseDay(day);
  const fresh = Date.now() - t.createdAt.getTime() < 60_000;
  const see = opts.filter(o => t.toSee.includes(o.code));
  const short = v.name.replace(/^The /, '');
  const past = t.startsAt.getTime() < Date.now();
  return (
    <>
      <Nav />
      {fresh && <Burst />}
      <main className="booked">
        <div className="ph" style={{ backgroundImage: photo ? `url(${photo.url})` : undefined }}>
          <div className="cap col g4"><span className="eyebrow" style={{ color: 'var(--goldlite)' }}>{v.place}</span><span className="serif" style={{ fontSize: 36 }}>{v.name}</span></div>
        </div>
        <div className="in">
          <div className="col g16 stagger">
            <svg className="draw" width="72" height="72" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="#C5A35C" strokeWidth="1.6" strokeDasharray="190" style={{ ['--len' as string]: 190 }} /><path d="M21 33l7 7 15-16" fill="none" stroke="#15130F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" style={{ ['--len' as string]: 40 }} /></svg>
            <span className="eyebrow">{past ? 'Your tour' : 'Tour booked'}</span>
            <h1 style={{ fontSize: 'clamp(52px, 5vw, 76px)', lineHeight: 1 }}>{past ? <>How was <i className="goldtext">{short}?</i></> : <>See you at<br /><i className="goldtext">{short}.</i></>}</h1>
          </div>
          <div className="bigdate stagger">
            <span className="d num">{d.getUTCDate()}</span>
            <div className="col g4"><span className="serif" style={{ fontSize: 28 }}>{DOW[d.getUTCDay()]}, {MON[d.getUTCMonth()]} {d.getUTCFullYear()}</span><span className="muted">{niceTime(time)}<span className="sep" />About 45 minutes<span className="sep" />{v.place}</span></div>
          </div>
          {t.holdUntil && t.holdUntil.getTime() > Date.now() && t.weddingDate && <HoldClock until={t.holdUntil.toISOString()} label={`${dayShort(t.weddingDate)} is held for you`} />}
          <div className="row g12 wrapr">
            <a className="btn" href={`/api/tours/${t.id}/calendar`}>Add to your calendar</a>
            <a className="btn o" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.name}, ${v.place}`)}`} target="_blank" rel="noreferrer">Directions</a>
            <Link className="btn o" href={`/venues/${v.slug}?date=${t.weddingDate}&guests=${t.guests}&evening=${t.eveningGuests}`}>Your package, {pounds(t.totalPence ?? 0)}</Link>
          </div>
          <div className="col">
            <p className="glabel" style={{ paddingBottom: 6 }}>What happens next</p>
            <div className="steps">
              <div><span className="k">1</span><span className="col g4"><span className="b">{v.managerName} prepares your tour</span><span className="small muted">Your package is with {v.managerName} now.{see.length ? ` They’ll have these ready: ${see.map(o => seeLabel(o).replace(/^\w/, c => c.toLowerCase())).join(', ')}.` : ''}</span></span></div>
              <div><span className="k">2</span><span className="col g4"><span className="b">Your date is held</span><span className="small muted">Nobody else can book {t.weddingDate ? dayShort(t.weddingDate) : 'your date'} at {short} until 24 hours after your tour, so you can sleep on it.</span></span></div>
              <div><span className="k">3</span><span className="col g4"><span className="b">Tell us how it went</span><span className="small muted">After your tour we’ll ask how it was. If you love it, you can secure your date in a couple of taps.</span></span></div>
            </div>
          </div>
          <div className="row g12"><Link className="btn lg gold" href="/my">Go to your wedding</Link><Link className="btn o lg" href="/search">Keep looking</Link></div>
        </div>
      </main>
    </>
  );
}
