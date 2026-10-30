import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { signOut } from '@/app/actions';

export default async function Nav({ over = false }: { over?: boolean }) {
  const u = await currentUser();
  return (
    <header className={`nav${over ? ' over' : ''}`}>
      <div className="wrap in">
        <Link href="/" className="wm" aria-label="Yesday home">Yes<i>day</i></Link>
        <nav className="links" aria-label="Main">
          <Link href="/search">Find a venue</Link>
          <Link href="/#how">How it works</Link>
          <Link href={u?.role === 'venue' ? '/venue' : '/for-venues'}>For venues</Link>
        </nav>
        <div className="right">
          {u ? (
            <>
              <Link className="me" href={u.role === 'venue' ? '/venue' : '/my'}><span className="av">{u.firstName[0]}</span>{u.partnerName ? `${u.firstName} & ${u.partnerName}` : u.firstName}</Link>
              <form action={signOut}><button className={`btn sm ${over ? 'light' : 'o'}`}>Sign out</button></form>
            </>
          ) : (
            <Link className={`btn sm ${over ? 'light' : ''}`} href="/signin">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
