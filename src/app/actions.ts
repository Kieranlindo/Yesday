'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { checkPassword, currentUser, endSession, hashPassword, startSession } from '@/lib/auth';

export type FormState = { error?: string; values?: Record<string, string> } | undefined;

/** What the person typed, minus the password, so a failed submit doesn't clear the form. */
const kept = (form: FormData) => {
  const v: Record<string, string> = {};
  for (const k of ['firstName', 'partnerName', 'email', 'role']) { const x = form.get(k); if (typeof x === 'string') v[k] = x; }
  return v;
};

const safeNext = (n: FormDataEntryValue | null, fallback: string) => {
  const s = typeof n === 'string' ? n : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : fallback;
};

const SignUp = z.object({
  firstName: z.string().trim().min(1, 'Tell us your first name.').max(60),
  partnerName: z.string().trim().max(60).optional(),
  email: z.string().trim().toLowerCase().email('That email address doesn’t look right.'),
  password: z.string().min(10, 'Use at least 10 characters for your password.').max(200),
  role: z.enum(['couple', 'venue']),
});

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const parsed = SignUp.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: kept(form) };
  const d = parsed.data;
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(sql`lower(${schema.users.email}) = ${d.email}`).limit(1);
  if (exists) return { error: 'There’s already an account with that email. Sign in instead.', values: kept(form) };
  const [u] = await db.insert(schema.users).values({ email: d.email, passwordHash: await hashPassword(d.password), role: d.role, firstName: d.firstName, partnerName: d.partnerName || null }).returning({ id: schema.users.id });
  await startSession(u.id);
  redirect(safeNext(form.get('next'), d.role === 'venue' ? '/venue' : '/my'));
}

const SignIn = z.object({ email: z.string().trim().toLowerCase().email('Enter the email you signed up with.'), password: z.string().min(1, 'Enter your password.') });

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const parsed = SignIn.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: kept(form) };
  const [u] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${parsed.data.email}`).limit(1);
  // Same message either way, so the form doesn't reveal who has an account.
  if (!u || !(await checkPassword(parsed.data.password, u.passwordHash))) return { error: 'That email and password don’t match. Try again.', values: kept(form) };
  await startSession(u.id);
  redirect(safeNext(form.get('next'), u.role === 'venue' ? '/venue' : '/my'));
}

export async function signOut() {
  await endSession();
  redirect('/');
}

export async function toggleLike(form: FormData) {
  const u = await currentUser();
  const venueId = String(form.get('venueId') ?? '');
  const back = safeNext(form.get('back'), '/');
  if (!u) redirect(`/signin?next=${encodeURIComponent(back)}`);
  if (!z.string().uuid().safeParse(venueId).success) return;
  const where = and(eq(schema.likes.userId, u.id), eq(schema.likes.venueId, venueId));
  const [had] = await db.select().from(schema.likes).where(where).limit(1);
  if (had) await db.delete(schema.likes).where(where);
  else await db.insert(schema.likes).values({ userId: u.id, venueId }).onConflictDoNothing();
  revalidatePath(back.split('?')[0]);
}
