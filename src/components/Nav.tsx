import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { signOut } from '@/app/actions';
import { coupleName, nameCase } from '@/lib/labels';
import NavShell from './fx/NavShell';

export default async function Nav({ over = false }: { over?: boolean }) {
  const u = await currentUser();
  return (
    <NavShell over={over}>
      <div className="wrap in">
        <Link href="/" className="wm" aria-label="Yesday home">Yes<i>day</i></Link>
        <nav className="links" aria-label="Main">
          <Link href="/search">Find a venue</Link>
          {u?.role === 'couple' && <Link href="/my">Your wedding</Link>}
          <Link href="/#how">How it works</Link>
          <Link href={u?.role === 'venue' ? '/venue' : '/for-venues'}>For venues</Link>
        </nav>
        <div className="right">
          {u ? (
            <>
              <Link className="me" href={u.role === 'venue' ? '/venue' : '/my'}><span className="av">{nameCase(u.firstName)[0]}</span>{coupleName(u)}</Link>
              <form action={signOut}><button className="btn sm o signout">Sign out</button></form>
            </>
          ) : (
            <><Link className="navlink" href="/signin">Sign in</Link><Link className="btn sm" href="/signup">Start planning</Link></>
          )}
        </div>
      </div>
    </NavShell>
  );
}
