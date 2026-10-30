import Link from 'next/link';
import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { requireUser } from '@/lib/auth';
import { db, schema } from '@/db';

export const metadata: Metadata = { title: 'Your venue' };

export default async function VenueHome() {
  const u = await requireUser('venue', '/venue');
  const mine = await db.select({ name: schema.venues.name, slug: schema.venues.slug, status: schema.venues.status }).from(schema.venues).where(eq(schema.venues.ownerId, u.id));
  return (
    <>
      <Nav />
      <main className="wrap results" style={{ minHeight: '60vh' }}>
        <div className="col g8">
          <span className="eyebrow">Yesday for venues</span>
          <h1 style={{ fontSize: 56, lineHeight: 1.02 }}>Welcome, {u.firstName}</h1>
        </div>
        {mine.length ? (
          <div className="col g12">{mine.map(m => <Link key={m.slug} className="card am" href={`/venues/${m.slug}`}><span className="b">{m.name}</span><span className="pill gold">{m.status === 'live' ? 'Live' : m.status === 'paused' ? 'Paused' : 'Draft'}</span></Link>)}</div>
        ) : (
          <div className="card empty" style={{ alignItems: 'flex-start', textAlign: 'left', maxWidth: 720 }}>
            <h2 style={{ fontSize: 34 }}>Your dashboard is ready for your venue</h2>
            <p className="muted" style={{ lineHeight: 1.6 }}>Next, you’ll bring your listing across from your website: photos, spaces, packages and prices. Then set your dates and deposit, and go live.</p>
            <p className="notice">The setup tool and the full dashboard arrive in the next stage of the build.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
