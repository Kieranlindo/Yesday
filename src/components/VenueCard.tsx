import Link from 'next/link';
import { pounds } from '@/lib/money';
import { dayShort } from '@/lib/dates';
import Heart from './fx/Heart';
import type { VenueCardData } from '@/lib/venues';

export default function VenueCard({ v, day, guests, query, liked, back }: { v: VenueCardData; day: string; guests: number; query: string; liked: boolean; back: string }) {
  return (
    <article className="vc">
      <Heart venueId={v.id} name={v.name} liked={liked} back={back} />
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
