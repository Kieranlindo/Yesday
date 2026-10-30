import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="f">
      <div className="wrap">
        <div className="cols">
          <div className="col g16"><span className="wm">Yes<i>day</i></span><p style={{ maxWidth: 340, lineHeight: 1.6 }}>Real prices and live dates for wedding venues. Book your venue the way you book everything else.</p></div>
          <div><h5>Couples</h5><Link href="/search">Find a venue</Link><Link href="/#how">How it works</Link><Link href="/my">Your wedding</Link></div>
          <div><h5>Venues</h5><Link href="/for-venues">Yesday for venues</Link><Link href="/signin?next=/venue">Venue sign in</Link><Link href="/signup?role=venue">List your venue</Link></div>
          <div><h5>Your account</h5><Link href="/signin">Sign in</Link><Link href="/signup">Create an account</Link></div>
        </div>
        <div className="base"><span className="small">© {new Date().getFullYear()} Yesday · London</span><span className="script">say yes to the date.</span></div>
      </div>
    </footer>
  );
}
