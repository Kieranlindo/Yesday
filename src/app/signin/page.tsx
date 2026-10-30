import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { SignInForm } from '@/components/auth/AuthForm';
import { currentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Sign in' };
const safe = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '');

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safe((await searchParams).next);
  const u = await currentUser();
  if (u) redirect(next || (u.role === 'venue' ? '/venue' : '/my'));
  return (
    <>
      <Nav />
      <main className="authwrap">
        <div className="side" style={{ backgroundImage: 'url(/photos/fulham-2.jpg)' }}><p>Your date,<br /><i>kept safe.</i></p></div>
        <div className="form"><SignInForm next={next} /></div>
      </main>
    </>
  );
}
