'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { checkPassword, currentUser, endSession, hashPassword, startSession } from '@/lib/auth';
import { isValidDay, londonInstant, londonToday, TOUR_TIMES, tourDays } from '@/lib/dates';
import { clean, summarise } from '@/lib/package';
import { TOUR_HOLD_HOURS, type Unit } from '@/lib/rules';

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
  redirect(d.role === 'venue' ? safeNext(form.get('next'), '/venue') : `/start${form.get('next') ? `?next=${encodeURIComponent(safeNext(form.get('next'), '/my'))}` : ''}`);
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

/* ---------- Build 2: actions the interactive pages call directly ---------- */

const Uuid = z.string().uuid();
const Day = z.string().refine(isValidDay, 'Choose a date.');

/** Likes or unlikes a venue from a heart, without reloading the page. */
export async function toggleLikeNow(venueId: string, back: string): Promise<{ liked?: boolean; signIn?: string }> {
  const u = await currentUser();
  if (!u) return { signIn: `/signin?next=${encodeURIComponent(safeNext(back, '/'))}` };
  if (!Uuid.safeParse(venueId).success) return {};
  const where = and(eq(schema.likes.userId, u.id), eq(schema.likes.venueId, venueId));
  const [had] = await db.select().from(schema.likes).where(where).limit(1);
  if (had) await db.delete(schema.likes).where(where);
  else await db.insert(schema.likes).values({ userId: u.id, venueId }).onConflictDoNothing();
  revalidatePath('/my');
  return { liked: !had };
}

/** Whether a venue is free on a day, and any special price for it. */
export async function checkDate(venueId: string, day: string) {
  if (!Uuid.safeParse(venueId).success || !isValidDay(day)) return { free: false, overridePence: null as number | null };
  const [d] = await db.select().from(schema.venueDates).where(and(eq(schema.venueDates.venueId, venueId), eq(schema.venueDates.day, day))).limit(1);
  return { free: !d, overridePence: d?.pricePence ?? null };
}

const PackageInput = z.object({
  venueId: Uuid, codes: z.array(z.string().max(24)).max(40), day: Day,
  guests: z.number().int().min(10).max(500), evening: z.number().int().min(0).max(500), kids: z.number().int().min(0).max(60),
});
type PackageInput = z.infer<typeof PackageInput>;

/** Prices a package on the server from the venue's own options, so a total can never be made up in the browser. */
async function pricePackage(p: PackageInput) {
  const data = await db.select().from(schema.venues).where(eq(schema.venues.id, p.venueId)).limit(1);
  const v = data[0];
  if (!v || v.status !== 'live') return null;
  const [options, [date]] = await Promise.all([
    db.select().from(schema.venueOptions).where(and(eq(schema.venueOptions.venueId, v.id), eq(schema.venueOptions.active, true))),
    db.select().from(schema.venueDates).where(and(eq(schema.venueDates.venueId, v.id), eq(schema.venueDates.day, p.day))).limit(1),
  ]);
  const opts = options.map(o => ({ code: o.code, chapter: o.chapter, name: o.name, detail: o.detail, pricePence: o.pricePence, unit: o.unit as Unit, required: o.required }));
  const codes = clean(p.codes, opts, !!v.ceremonyName);
  const s = summarise(opts, codes, { day: p.day, guests: p.guests, evening: p.evening, kids: p.kids }, v.hireBasePence, v.depositPercent, londonToday(), date?.pricePence);
  return { venue: v, codes, total: s.total, free: !date, options: opts };
}

async function upsertPackage(userId: string, p: PackageInput, codes: string[], total: number) {
  const row = { coupleId: userId, venueId: p.venueId, codes, weddingDate: p.day, guests: p.guests, eveningGuests: p.evening, kids: p.kids, totalPence: total, updatedAt: new Date() };
  await db.insert(schema.packages).values(row).onConflictDoUpdate({ target: [schema.packages.coupleId, schema.packages.venueId], set: row });
}

/** Saves the package a couple is building, as they go. */
export async function savePackage(input: PackageInput): Promise<{ saved?: boolean; signedOut?: boolean; error?: string }> {
  const u = await currentUser();
  if (!u) return { signedOut: true };
  if (u.role !== 'couple' && u.role !== 'admin') return { error: 'Packages are for couples’ accounts.' };
  const p = PackageInput.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  const priced = await pricePackage(p.data);
  if (!priced) return { error: 'That venue isn’t taking bookings right now.' };
  await upsertPackage(u.id, p.data, priced.codes, priced.total);
  return { saved: true };
}

const TourInput = PackageInput.extend({ tourDay: Day, time: z.enum(TOUR_TIMES as [string, ...string[]]), toSee: z.array(z.string().max(24)).max(20), note: z.string().trim().max(600) });

/** Books a custom tour with the package the couple built, and holds their wedding date for a day afterwards. */
export async function bookTour(input: z.infer<typeof TourInput>): Promise<{ id?: string; signIn?: string; error?: string }> {
  const u = await currentUser();
  if (!u) return { signIn: '/signin' };
  if (u.role !== 'couple' && u.role !== 'admin') return { error: 'Sign in with a couple’s account to book a tour.' };
  const p = TourInput.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  if (!tourDays().includes(p.data.tourDay)) return { error: 'Choose one of the days shown.' };
  const priced = await pricePackage(p.data);
  if (!priced) return { error: 'That venue isn’t taking bookings right now.' };
  if (!priced.free) return { error: 'Your wedding date has just been booked at this venue. Try another date.' };
  const startsAt = londonInstant(p.data.tourDay, p.data.time);
  await upsertPackage(u.id, p.data, priced.codes, priced.total);
  const [t] = await db.insert(schema.tours).values({
    venueId: p.data.venueId, coupleId: u.id, startsAt, weddingDate: p.data.day, guests: p.data.guests, eveningGuests: p.data.evening,
    toSee: p.data.toSee.filter(c => priced.codes.includes(c)), packageCodes: priced.codes, totalPence: priced.total,
    note: p.data.note || null, holdUntil: new Date(startsAt.getTime() + TOUR_HOLD_HOURS * 3600_000),
  }).returning({ id: schema.tours.id });
  revalidatePath('/my');
  return { id: t.id };
}

async function ownTour(id: string) {
  const u = await currentUser();
  if (!u || !Uuid.safeParse(id).success) return null;
  const [t] = await db.select().from(schema.tours).where(and(eq(schema.tours.id, id), eq(schema.tours.coupleId, u.id))).limit(1);
  return t ?? null;
}

/** After a tour: how it went, and whether they'd like to book. */
export async function tourFeedback(id: string, rating: number, verdict: 'love' | 'maybe' | 'no', feedback: string) {
  const t = await ownTour(id);
  if (!t) return { error: 'We couldn’t find that tour.' };
  await db.update(schema.tours).set({ rating: Math.min(5, Math.max(1, Math.round(rating))), verdict, feedback: feedback.trim().slice(0, 1000) || null, status: 'done' }).where(eq(schema.tours.id, t.id));
  // No revalidate here: the card plays its thank-you first, then refreshes the page itself.
  return { ok: true };
}

/** Demo only: moves a tour into the past, so the after-the-tour steps can be shown. */
export async function demoFinishTour(id: string) {
  const t = await ownTour(id);
  if (!t) return { error: 'We couldn’t find that tour.' };
  const startsAt = new Date(Date.now() - 2 * 3600_000);
  await db.update(schema.tours).set({ startsAt, holdUntil: new Date(startsAt.getTime() + TOUR_HOLD_HOURS * 3600_000) }).where(eq(schema.tours.id, t.id));
  revalidatePath('/my');
  return { ok: true };
}

export async function cancelTour(id: string) {
  const t = await ownTour(id);
  if (!t) return { error: 'We couldn’t find that tour.' };
  await db.update(schema.tours).set({ status: 'cancelled', holdUntil: null }).where(eq(schema.tours.id, t.id));
  revalidatePath('/my');
  return { ok: true };
}

const PlanInput = z.object({
  firstName: z.string().trim().min(1, 'Tell us your first name.').max(60), partnerName: z.string().trim().max(60), lastName: z.string().trim().max(60),
  weddingDate: z.string().nullable(), flexDow: z.number().int().min(0).max(6).nullable(), flexMonths: z.array(z.string().regex(/^\d{4}-\d{2}$/)).max(24),
  guests: z.number().int().min(10).max(500), evening: z.number().int().min(0).max(500), budgetPence: z.number().int().min(0).max(100_000_000).nullable(),
  styles: z.array(z.string().max(30)).max(12), needs: z.array(z.string().max(30)).max(12),
});

/** "Tell us about your day": saves the couple's plan and their names. */
export async function savePlan(input: z.infer<typeof PlanInput>): Promise<{ ok?: boolean; error?: string }> {
  const u = await currentUser();
  if (!u) return { error: 'Sign in first.' };
  const p = PlanInput.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  const weddingDate = d.weddingDate && isValidDay(d.weddingDate) && d.weddingDate > londonToday() ? d.weddingDate : null;
  await db.update(schema.users).set({ firstName: d.firstName, partnerName: d.partnerName || null }).where(eq(schema.users.id, u.id));
  const row = { userId: u.id, lastName: d.lastName || null, weddingDate, flexDow: weddingDate ? null : d.flexDow, flexMonths: weddingDate ? [] : d.flexMonths, guests: d.guests, eveningGuests: d.evening, budgetPence: d.budgetPence, styles: d.styles, needs: d.needs, updatedAt: new Date() };
  await db.insert(schema.plans).values(row).onConflictDoUpdate({ target: schema.plans.userId, set: row });
  revalidatePath('/my');
  return { ok: true };
}
