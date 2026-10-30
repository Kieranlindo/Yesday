import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import HeroRotator from '@/components/HeroRotator';
import SearchForm from '@/components/SearchForm';
import VenueCard from '@/components/VenueCard';
import Splash from '@/components/fx/Splash';
import { currentUser } from '@/lib/auth';
import { searchVenues, likedIds } from '@/lib/venues';
import { readSearch, searchQuery } from '@/lib/search-params';
import { dayLong } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const HERO = [
  { src: '/photos/ornc-1.jpg', credit: 'Old Royal Naval College, Greenwich' },
  { src: '/photos/fulham-1.jpg', credit: 'Fulham Palace' },
  { src: '/photos/kew-1.jpg', credit: 'Kew Gardens' },
  { src: '/photos/bh-1.jpg', credit: 'Banqueting House' },
];

export default async function Home() {
  const q = readSearch({});
  const [u, res] = await Promise.all([currentUser(), searchVenues(q)]);
  const liked = u ? await likedIds(u.id) : new Set<string>();
  const query = searchQuery(q);
  return (
    <>
      <Splash />
      <Nav over />
      <section className="hero">
        <HeroRotator photos={HERO} />
        <div className="wrap in stagger">
          <span className="script">say yes to the date.</span>
          <h1>Real prices. Live dates.<br /><i>Your venue, booked.</i></h1>
          <SearchForm q={q} />
        </div>
      </section>

      <main>
        <section className="sec wrap col g40" data-reveal>
          <div className="row between wrapr g24" style={{ alignItems: 'flex-end' }}>
            <div className="col g12">
              <span className="eyebrow">Free on {dayLong(q.day)}</span>
              <h2 className="big">Venues with your date open</h2>
            </div>
            <Link className="btn o" href={`/search?${query}`}>See all {res.list.length} venues</Link>
          </div>
          <div className="grid3 stagger">
            {res.list.slice(0, 6).map(v => <VenueCard key={v.id} v={v} day={q.day} guests={q.guests} query={query} liked={liked.has(v.id)} back="/" />)}
          </div>
          <p className="small muted">Prices are for {q.guests} guests, with {q.evening} more joining in the evening. Change them in the search and every price updates.</p>
        </section>

        <section id="how" className="sec" style={{ background: 'var(--stone)' }}>
          <div className="wrap col g40" data-reveal>
            <div className="col g12"><span className="eyebrow">How it works</span><h2 className="big">Booking a venue, the way<br />you book everything else.</h2></div>
            <div className="steps4">
              <div><span className="k">1</span><h3 style={{ fontSize: 26 }}>See the real price</h3><p className="muted">Every venue shows its live dates and the full price for your guest count. No enquiry forms, no waiting for a brochure.</p></div>
              <div><span className="k">2</span><h3 style={{ fontSize: 26 }}>Build your day</h3><p className="muted">Choose the ceremony, dinner, drinks and evening. The total changes as you go, so there are no surprises later.</p></div>
              <div><span className="k">3</span><h3 style={{ fontSize: 26 }}>Book a custom tour</h3><p className="muted">Tell the venue what you want to see. They show you round with your package in hand and hold your date for a day afterwards.</p></div>
              <div><span className="k">4</span><h3 style={{ fontSize: 26 }}>Say yes to the date</h3><p className="muted">Pay a 20% deposit online to secure it. The rest is spread into monthly payments, finishing eight weeks before the day.</p></div>
            </div>
          </div>
        </section>

        <section className="sec wrap row between wrapr g40" data-reveal>
          <div className="col g16" style={{ maxWidth: 620 }}>
            <span className="eyebrow">For venues</span>
            <h2 className="big">Fill your dates without the back and forth.</h2>
            <p className="muted" style={{ fontSize: 18, lineHeight: 1.6 }}>Couples arrive knowing your price, your dates and what they want to see. Bring your listing across from your website in minutes.</p>
          </div>
          <div className="row g12"><Link className="btn lg" href="/for-venues">Yesday for venues</Link><Link className="btn o lg" href="/signup?role=venue">List your venue</Link></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
