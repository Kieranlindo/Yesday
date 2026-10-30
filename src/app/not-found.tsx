import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="wrap empty" style={{ minHeight: '60vh', justifyContent: 'center' }}>
        <span className="eyebrow">Not here, we’re afraid</span>
        <h1 style={{ fontSize: 56 }}>We couldn’t find that page.</h1>
        <p className="muted">It may have moved, or the venue may no longer be listed.</p>
        <Link className="btn" href="/search">Find a venue</Link>
      </main>
      <Footer />
    </>
  );
}
