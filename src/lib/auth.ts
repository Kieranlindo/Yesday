import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db, schema } from '@/db';

const COOKIE = 'yd_session';
const DAYS = 30;
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export type SessionUser = { id: string; email: string; role: 'couple' | 'venue' | 'admin'; firstName: string; partnerName: string | null };

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const checkPassword = (pw: string, h: string) => bcrypt.compare(pw, h);

export async function startSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + DAYS * 864e5);
  await db.insert(schema.sessions).values({ id: hash(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, hash(token)));
  jar.delete(COOKIE);
}

/** The signed-in person, or null. Cheap enough to call from any server component. */
export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role, firstName: schema.users.firstName, partnerName: schema.users.partnerName })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, hash(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export async function requireUser(role?: SessionUser['role'], next = '/') {
  const u = await currentUser();
  if (!u) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (role && u.role !== role && u.role !== 'admin') redirect(u.role === 'venue' ? '/venue' : '/');
  return u;
}
