'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { signIn, signUp, type FormState } from '@/app/actions';

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, undefined);
  return (
    <form action={action} noValidate>
      <div className="col g8"><span className="eyebrow">Welcome back</span><h1 style={{ fontSize: 48 }}>Sign in</h1></div>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="email">Email</label><input className="inp" id="email" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required /></div>
      <div className="field"><label htmlFor="password">Password</label><input className="inp" id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <button className="btn lg full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
      <p className="small muted" style={{ textAlign: 'center' }}>New to Yesday? <Link className="link" href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link></p>
    </form>
  );
}

export function SignUpForm({ next, role }: { next: string; role: 'couple' | 'venue' }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, undefined);
  return (
    <form action={action} noValidate>
      <div className="col g8"><span className="eyebrow">Say yes to the date</span><h1 style={{ fontSize: 48 }}>Create your account</h1></div>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <input type="hidden" name="next" value={next} />
      <div className="roles" role="radiogroup" aria-label="I am">
        <label><input type="radio" name="role" value="couple" defaultChecked={(state?.values?.role ?? role) === 'couple'} /><span className="b">We’re getting married</span><span className="small muted">Find and book your venue</span></label>
        <label><input type="radio" name="role" value="venue" defaultChecked={(state?.values?.role ?? role) === 'venue'} /><span className="b">I run a venue</span><span className="small muted">List your dates and packages</span></label>
      </div>
      <div className="row g12">
        <div className="field grow"><label htmlFor="firstName">Your first name</label><input className="inp" id="firstName" name="firstName" autoComplete="given-name" defaultValue={state?.values?.firstName} required /></div>
        <div className="field grow"><label htmlFor="partnerName">Partner’s first name <span className="muted">(optional)</span></label><input className="inp" id="partnerName" name="partnerName" autoComplete="off" defaultValue={state?.values?.partnerName} /></div>
      </div>
      <div className="field"><label htmlFor="email">Email</label><input className="inp" id="email" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required /></div>
      <div className="field"><label htmlFor="password">Password</label><input className="inp" id="password" name="password" type="password" autoComplete="new-password" minLength={10} required /><span className="tiny muted">At least 10 characters.</span></div>
      <button className="btn lg full" disabled={pending}>{pending ? 'Creating your account…' : 'Create account'}</button>
      <p className="small muted" style={{ textAlign: 'center' }}>Already have an account? <Link className="link" href={`/signin?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
    </form>
  );
}
