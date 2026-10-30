/**
 * Seeds the 11 sample London venues from the prototypes. Safe to run again:
 * it replaces sample venues and leaves real venues and accounts alone.
 */
import './env';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as s from '../src/db/schema';

type Raw = { id: string; name: string; place: string; style: string; cap: number; hire: number; am: string; policy: 'Flexible' | 'Moderate' | 'Strict'; cuisine: string[]; feats: string[]; web: string; cerName: string; cerDetail: string; about: string; area: string; booked: string[]; use: string; hireDetail: string; photoFiles: string[]; practical?: [string, string][]; rules: Record<string, string>; options: { id: string; ch: string; name: string; price: number; unit: string; detail: string; req: boolean }[] };

const data = JSON.parse(readFileSync('scripts/venues.json', 'utf8')) as { venues: Raw[] };
const sizes = JSON.parse(readFileSync('scripts/photo-sizes.json', 'utf8')) as Record<string, [number, number]>;
// Dates already taken outside Yesday, so search shows real gaps.
const TAKEN: Record<string, string[]> = { fulham: ['2027-09-25'], kew: ['2027-09-18', '2027-06-12'], bh: ['2027-06-05'] };
const DEPOSIT: Record<string, number> = { fulham: 20, kew: 25, bh: 25, ornc: 25, pemb: 20, nhm: 20, mandarin: 25 };

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
const db = drizzle(sql, { schema: s });

await db.transaction(async tx => {
  await tx.delete(s.venues).where(eq(s.venues.isSample, true));
  for (const v of data.venues) {
    const live = v.photoFiles.length >= 2;
    const [row] = await tx.insert(s.venues).values({
      slug: v.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      status: live ? 'live' : 'draft',
      isSample: true,
      name: v.name, place: v.place, area: v.area || 'London', style: v.style, about: v.about, website: v.web,
      capacityDinner: v.cap, capacityEvening: Math.round(v.cap * 1.5 / 10) * 10,
      hireBasePence: Math.round(v.hire * 100),
      spacesSummary: v.use, ceremonyName: v.cerName, ceremonyDetail: v.cerDetail, hireDetail: v.hireDetail,
      cuisine: v.cuisine ?? [], features: v.feats ?? [], practical: v.practical ?? [], rules: v.rules ?? {},
      policy: v.policy, depositPercent: DEPOSIT[v.id] ?? 15,
      managerName: v.am, managerPhoto: v.id === 'fulham' ? '/people/sophie.jpg' : null,
    }).returning({ id: s.venues.id });
    if (v.photoFiles.length) await tx.insert(s.venuePhotos).values(v.photoFiles.map((f, i) => ({ venueId: row.id, url: `/photos/${f}`, width: sizes[f]?.[0], height: sizes[f]?.[1], alt: `${v.name}, photo ${i + 1}`, position: i })));
    await tx.insert(s.venueOptions).values(v.options.map((o, i) => ({
      venueId: row.id, code: o.id, chapter: o.ch as typeof s.chapterEnum.enumValues[number], name: o.name, detail: o.detail,
      pricePence: Math.round(o.price * 100), unit: o.unit as typeof s.unitEnum.enumValues[number], required: o.req, position: i,
    })));
    const taken = [...(v.booked ?? []), ...(TAKEN[v.id] ?? [])];
    if (taken.length) await tx.insert(s.venueDates).values(taken.map(day => ({ venueId: row.id, day, state: 'booked' as const, note: 'Booked outside Yesday' })));
  }
});
const [{ n }] = await sql`select count(*)::int as n from venues where status = 'live'`;
console.log(`Seeded ${data.venues.length} sample venues (${n} live).`);
await sql.end();
