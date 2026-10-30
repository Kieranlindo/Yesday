import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';
import VenueCard from '@/components/VenueCard';
import FilterBar from '@/components/FilterBar';
import { currentUser } from '@/lib/auth';
import { searchVenues, likedIds } from '@/lib/venues';
import { filterQuery, readSearch, searchQuery } from '@/lib/search-params';
import { dayLong } from '@/lib/dates';
import { coupleName } from '@/lib/labels';

export const metadata: Metadata = { title: 'Find a venue' };

const SORTS = [['rec', 'Recommended'], ['price', 'Lowest price'], ['cap', 'Largest']] as const;

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = readSearch(sp);
  const [u, res] = await Promise.all([currentUser(), searchVenues(q)]);
  const liked = u ? await likedIds(u.id) : new Set<string>();
  const query = searchQuery(q);
  const back = `/search?${filterQuery(q)}`;
  const withSort = (k: string) => { const p = new URLSearchParams(filterQuery(q)); if (k === 'rec') p.delete('sort'); else p.set('sort', k); return `/search?${p}`; };
  const welcome = sp.welcome === '1' && u;
  return (
    <>
      <Nav />
      <div className="sbar"><div className="wrap"><SearchForm q={q} compact /></div></div>
      <main className="wrap results">
        <div className="row between wrapr g16" style={{ alignItems: 'flex-end' }}>
          <div className="col g8">
            <span className="eyebrow">{welcome ? `Lovely, ${coupleName(u)}` : `${q.area} · ${dayLong(q.day)}`}</span>
            <h1 style={{ fontSize: 52, lineHeight: 1.04 }}>{res.list.length === 1 ? '1 venue is' : `${res.list.length} venues are`} free on your date</h1>
            <p className="muted">{welcome ? `${dayLong(q.day)}. ` : ''}Priced for {q.guests} guests, with {q.evening} more in the evening.{res.takenCount ? ` ${res.takenCount} more ${res.takenCount === 1 ? 'is' : 'are'} already booked that day.` : ''}{res.hiddenByBudget ? ` ${res.hiddenByBudget} more ${res.hiddenByBudget === 1 ? 'is' : 'are'} over your budget.` : ''}</p>
          </div>
          <nav className="row g8" aria-label="Sort">
            {SORTS.map(([k, label]) => (
              <Link key={k} href={withSort(k)} scroll={false} className={`btn sm ${q.sort === k ? '' : 'o'}`} aria-current={q.sort === k ? 'true' : undefined}>{label}</Link>
            ))}
          </nav>
        </div>
        <FilterBar key={back} base={query} sortQ={q.sort === 'rec' ? '' : q.sort} initial={{ styles: q.styles ?? [], needs: q.needs ?? [], maxPence: q.maxPence ?? null }} />
        {res.list.length ? (
          <div key={`grid-${back}`} className="grid3 stagger">
            {res.list.map(v => <VenueCard key={v.id} v={v} day={q.day} guests={q.guests} query={query} liked={liked.has(v.id)} back={back} />)}
          </div>
        ) : (
          <div className="card empty">
            <h2 style={{ fontSize: 34 }}>Nothing free that fits everything</h2>
            <p className="muted">Try another date nearby, fewer guests for dinner, or loosen a filter.</p>
            <Link className="btn" href={`/search?${query}`}>Clear the filters</Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
