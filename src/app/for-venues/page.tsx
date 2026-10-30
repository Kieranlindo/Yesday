import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { FEE_BP, FOUNDING_FEE_BP, DEPOSIT_MIN_PERCENT } from '@/lib/rules';

export const metadata: Metadata = { title: 'Yesday for venues' };

export default function ForVenues() {
  return (
    <>
      <Nav />
      <main>
        <section className="sec wrap col g24 stagger" style={{ maxWidth: 1044 }}>
          <span className="eyebrow">Yesday for venues</span>
          <h1 style={{ fontSize: 'clamp(48px, 6vw, 84px)', lineHeight: 1 }}>Couples who arrive knowing your price, your dates and what they want to see.</h1>
          <p className="muted" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 720 }}>List your venue with real prices and live dates. Couples build their day, book a custom tour, and pay their deposit online. You keep your own packages and your own policy.</p>
          <div className="row g12 wrapr"><Link className="btn lg" href="/signup?role=venue">List your venue</Link><Link className="btn o lg" href="/signin?next=/venue">Venue sign in</Link></div>
        </section>
        <section className="sec" style={{ background: 'var(--stone)' }}>
          <div className="wrap steps4">
            <div><span className="k">{FEE_BP / 100}%</span><h3 style={{ fontSize: 24 }}>Only when you’re booked</h3><p className="muted">No listing fee. Founding venues pay {FOUNDING_FEE_BP / 100}% for their first year.</p></div>
            <div><span className="k">{DEPOSIT_MIN_PERCENT}%+</span><h3 style={{ fontSize: 24 }}>Deposit to book</h3><p className="muted">Every booking starts with at least {DEPOSIT_MIN_PERCENT}% of the package. Ask for more if you like, and couples see it before they book.</p></div>
            <div><span className="k">Covered</span><h3 style={{ fontSize: 24 }}>If a couple cancels</h3><p className="muted">What you keep from the deposit always covers our fee, so a cancellation never leaves you out of pocket.</p></div>
            <div><span className="k">8 weeks</span><h3 style={{ fontSize: 24 }}>Paid in full</h3><p className="muted">Couples pay monthly, finishing eight weeks before the day.</p></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
