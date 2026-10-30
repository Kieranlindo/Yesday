import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { SignUpForm } from '@/components/auth/AuthForm';
import { currentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Create your account' };
const safe = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '');

export default async function SignUp({ searchParams }: { searchParams: Promise<{ next?: string; role?: string }> }) {
  const sp = await searchParams;
  const u = await currentUser();
  if (u) redirect(u.role === 'venue' ? '/venue' : '/my');
  const role = sp.role === 'venue' ? 'venue' : 'couple';
  return (
    <>
      <Nav />
      <main className="authwrap">
        <div className="side" style={{ backgroundImage: `url(/photos/${role === 'venue' ? 'syon-1' : 'kew-2'}.jpg)` }}><p>{role === 'venue' ? <>Fill your dates,<br /><i>beautifully.</i></> : <>Real prices.<br /><i>Live dates.</i></>}</p></div>
        <div className="form"><SignUpForm next={safe(sp.next)} role={role} /></div>
      </main>
    </>
  );
}
