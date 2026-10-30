import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Setup check: says whether the database is reachable, without ever showing the password. */
export async function GET() {
  const raw = process.env.DATABASE_URL ?? '';
  const info: Record<string, unknown> = { databaseUrlSet: !!raw };
  try {
    const u = new URL(raw);
    Object.assign(info, {
      host: u.hostname, port: u.port, user: decodeURIComponent(u.username), database: u.pathname.slice(1),
      passwordLength: decodeURIComponent(u.password).length, passwordHasBrackets: /[\[\]]/.test(u.password),
    });
  } catch { if (raw) info.urlProblem = 'DATABASE_URL is not a valid address. A symbol in the password may be breaking it.'; }
  try {
    const { db, schema } = await import('@/db');
    const rows = await db.select({ slug: schema.venues.slug }).from(schema.venues);
    return NextResponse.json({ ok: true, venues: rows.length, ...info });
  } catch (e) {
    const err = e as { message?: string; code?: string; cause?: { message?: string; code?: string } };
    const pw = (() => { try { return decodeURIComponent(new URL(raw).password); } catch { return ''; } })();
    const clean = (s?: string) => (s && pw ? s.split(pw).join('•••') : s);
    return NextResponse.json({ ok: false, error: clean(err.message), code: err.code, cause: clean(err.cause?.message), causeCode: err.cause?.code, ...info }, { status: 500 });
  }
}
