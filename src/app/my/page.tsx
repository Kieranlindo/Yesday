import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import VenueCard from '@/components/VenueCard';
import { requireUser } from '@/lib/auth';
import { likedVenues } from '@/lib/venues';
import { readSearch, searchQuery } from '@/lib/search-params';

export const metadata: Metadata = { title: 'Your wedding' };

export default async function My() {
  const u = await requireUser('couple', '/my');
  const q = readSearch({});
  const list = await likedVenues(u.id, q);
  const query = searchQuery(q);
  return (
    <>
      <Nav />
      <main className="wrap results">
        <div className="col g8">
          <span className="eyebrow">{u.partnerName ? `${u.firstName} & ${u.partnerName}` : u.firstName}</span>
          <h1 style={{ fontSize: 56, lineHeight: 1.02 }}>Your wedding</h1>
        </div>
        <section className="col g24">
          <h2 style={{ fontSize: 34 }}>Venues you’ve liked</h2>
          {list.length ? (
            <div className="grid3">{list.map(v => <VenueCard key={v.id} v={v} day={q.day} guests={q.guests} query={query} liked back="/my" />)}</div>
          ) : (
            <div className="card empty">
              <h3 style={{ fontSize: 28 }}>Nothing liked yet</h3>
              <p className="muted">Tap the heart on any venue and it’ll wait for you here.</p>
              <Link className="btn" href="/search">Find a venue</Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
