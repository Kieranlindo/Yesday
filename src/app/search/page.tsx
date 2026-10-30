import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';
import VenueCard from '@/components/VenueCard';
import { currentUser } from '@/lib/auth';
import { searchVenues, likedIds } from '@/lib/venues';
import { readSearch, searchQuery } from '@/lib/search-params';
import { dayLong } from '@/lib/dates';

export const metadata: Metadata = { title: 'Find a venue' };

const SORTS = [['rec', 'Recommended'], ['price', 'Lowest price'], ['cap', 'Largest']] as const;

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = readSearch(await searchParams);
  const [u, res] = await Promise.all([currentUser(), searchVenues(q)]);
  const liked = u ? await likedIds(u.id) : new Set<string>();
  const query = searchQuery(q);
  const back = `/search?${query}${q.sort !== 'rec' ? `&sort=${q.sort}` : ''}`;
  return (
    <>
      <Nav />
      <div className="sbar"><div className="wrap"><SearchForm q={q} compact /></div></div>
      <main className="wrap results">
        <div className="row between wrapr g16" style={{ alignItems: 'flex-end' }}>
          <div className="col g8">
            <span className="eyebrow">{q.area} · {dayLong(q.day)}</span>
            <h1 style={{ fontSize: 48, lineHeight: 1.05 }}>{res.list.length === 1 ? '1 venue is' : `${res.list.length} venues are`} free on your date</h1>
            <p className="muted">Priced for {q.guests} guests, with {q.evening} more in the evening.{res.takenCount ? ` ${res.takenCount} more ${res.takenCount === 1 ? 'is' : 'are'} already booked that day.` : ''}</p>
          </div>
          <nav className="row g8" aria-label="Sort">
            {SORTS.map(([k, label]) => (
              <Link key={k} href={`/search?${query}${k === 'rec' ? '' : `&sort=${k}`}`} className={`btn sm ${q.sort === k ? '' : 'o'}`} aria-current={q.sort === k ? 'true' : undefined}>{label}</Link>
            ))}
          </nav>
        </div>
        {res.list.length ? (
          <div className="grid3">
            {res.list.map(v => <VenueCard key={v.id} v={v} day={q.day} guests={q.guests} query={query} liked={liked.has(v.id)} back={back} />)}
          </div>
        ) : (
          <div className="card empty">
            <h2 style={{ fontSize: 34 }}>Nothing free for that date and guest count</h2>
            <p className="muted">Try another date nearby, or fewer guests for dinner.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
