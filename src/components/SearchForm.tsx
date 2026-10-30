import { AREAS } from '@/lib/search-params';
import type { SearchInput } from '@/lib/venues';

/** A plain form that works without JavaScript: it submits to /search. */
export default function SearchForm({ q, compact = false }: { q: SearchInput; compact?: boolean }) {
  return (
    <form action="/search" className={`search${compact ? ' compact' : ''}`} role="search">
      <label><span className="l">Where</span>
        <select name="area" defaultValue={q.area} aria-label="Where">{AREAS.map(a => <option key={a}>{a}</option>)}</select></label>
      <label><span className="l">When</span><input type="date" name="date" defaultValue={q.day} aria-label="Wedding date" required /></label>
      <label><span className="l">Day guests</span><input type="number" name="guests" min={10} max={500} defaultValue={q.guests} aria-label="Day guests" /></label>
      <label><span className="l">Evening guests</span><input type="number" name="evening" min={0} max={500} defaultValue={q.evening} aria-label="Extra evening guests" /></label>
      <button className="btn" type="submit">Search venues</button>
    </form>
  );
}
