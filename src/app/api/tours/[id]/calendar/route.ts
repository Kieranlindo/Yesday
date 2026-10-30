import { and, eq } from 'drizzle-orm';
import { currentUser } from '@/lib/auth';
import { db, schema } from '@/db';

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/[\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');

/** The tour as a calendar file, for Apple, Google or Outlook calendars. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  const { id } = await params;
  if (!u || !/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
  const [t] = await db.select().from(schema.tours).where(and(eq(schema.tours.id, id), eq(schema.tours.coupleId, u.id))).limit(1);
  if (!t) return new Response('Not found', { status: 404 });
  const [v] = await db.select().from(schema.venues).where(eq(schema.venues.id, t.venueId)).limit(1);
  const end = new Date(t.startsAt.getTime() + 45 * 60_000);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yesday//Tours//EN', 'BEGIN:VEVENT', `UID:${t.id}@yesday`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(t.startsAt)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Your custom tour at ${v.name}`)}`, `LOCATION:${esc(`${v.name}, ${v.place}`)}`, `DESCRIPTION:${esc(`${v.managerName} is showing you round with your package. Booked on Yesday.`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="yesday-tour.ics"` } });
}
