import Link from 'next/link';
import { pounds } from '@/lib/money';
import { dayShort } from '@/lib/dates';
import { toggleLike } from '@/app/actions';
import type { VenueCardData } from '@/lib/venues';

const Heart = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 20s-7-4.4-9-8.6C1.6 8.3 3.4 5 6.6 5c2 0 3.4 1.2 4.1 2.3h2.6C14 6.2 15.4 5 17.4 5c3.2 0 5 3.3 3.6 6.4C19 15.6 12 20 12 20z" /></svg>;

export default function VenueCard({ v, day, guests, query, liked, back }: { v: VenueCardData; day: string; guests: number; query: string; liked: boolean; back: string }) {
  return (
    <article className="vc">
      <form action={toggleLike}>
        <input type="hidden" name="venueId" value={v.id} /><input type="hidden" name="back" value={back} />
        <button className={`heart${liked ? ' on' : ''}`} aria-pressed={liked} aria-label={liked ? `Remove ${v.name} from your liked venues` : `Like ${v.name}`}><Heart /></button>
      </form>
      <Link href={`/venues/${v.slug}?${query}`} className="col g12" style={{ textDecoration: 'none' }}>
        <div className="ph">
          {v.photos.slice(0, 2).map((src, i) => <img key={src} src={src} alt={i ? '' : v.name} loading="lazy" />)}
          <span className={`pill tl ${v.free ? 'free' : 'booked'}`}>{v.free ? 'Free' : 'Booked'} on {dayShort(day)}</span>
          {v.licensed && <span className="pill ink lic">Licensed for weddings</span>}
        </div>
        <div className="col g4">
          <h3 className="nm">{v.name}</h3>
          <p className="small muted">{v.place}<span className="sep" />Up to {v.capacityDinner} for dinner{v.style ? <><span className="sep" />{v.style}</> : null}</p>
        </div>
        <div className="prices">
          <div className="col"><span className="tiny muted">Venue hire on {dayShort(day)}</span><span className="p num">{pounds(v.hirePence)}</span></div>
          <div className="col"><span className="tiny muted">Full day for {guests}</span><span className="p num">{pounds(v.fullDayPence)}</span></div>
        </div>
      </Link>
    </article>
  );
}
