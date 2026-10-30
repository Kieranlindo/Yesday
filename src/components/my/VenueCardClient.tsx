import Link from 'next/link';
import { pounds } from '@/lib/money';
import { dayShort } from '@/lib/dates';
import type { VenueCardData } from '@/lib/venues';

/** The venue card without its heart, for places that add their own controls. */
export default function VenueCardClient({ v, day, guests, query }: { v: VenueCardData; day: string; guests: number; query: string }) {
  return (
    <Link href={`/venues/${v.slug}?${query}`} className="vc" style={{ textDecoration: 'none' }}>
      <div className="ph">
        {v.photos.slice(0, 2).map((src, i) => <img key={src} src={src} alt={i ? '' : v.name} loading="lazy" />)}
        <span className={`pill lic ${v.free ? 'free' : 'booked'}`}>{v.free ? 'Free' : 'Booked'} on {dayShort(day)}</span>
      </div>
      <div className="col g4"><h3 className="nm">{v.name}</h3><p className="small muted">{v.place}<span className="sep" />Up to {v.capacityDinner} for dinner</p></div>
      <div className="prices">
        <div className="col"><span className="tiny muted">Venue hire</span><span className="p num">{pounds(v.hirePence)}</span></div>
        <div className="col"><span className="tiny muted">Full day for {guests}</span><span className="p num">{pounds(v.fullDayPence)}</span></div>
      </div>
    </Link>
  );
}
