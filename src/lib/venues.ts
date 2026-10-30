import 'server-only';
import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { hireForDay, packageTotal, STARTER_PACKAGE, type PricedOption } from './rules';

export type SearchInput = { area: string; day: string; guests: number; evening: number; sort: 'rec' | 'price' | 'cap'; maxPence?: number };

export type VenueCardData = {
  id: string; slug: string; name: string; place: string; style: string | null; capacityDinner: number;
  photos: string[]; hirePence: number; fullDayPence: number; free: boolean; licensed: boolean; isSample: boolean;
};

const photosFor = async (ids: string[]) => {
  if (!ids.length) return new Map<string, string[]>();
  const rows = await db.select({ venueId: schema.venuePhotos.venueId, url: schema.venuePhotos.url }).from(schema.venuePhotos)
    .where(inArray(schema.venuePhotos.venueId, ids)).orderBy(asc(schema.venuePhotos.position));
  const m = new Map<string, string[]>();
  for (const r of rows) m.set(r.venueId, [...(m.get(r.venueId) ?? []), r.url]);
  return m;
};

const optionsFor = async (ids: string[]) => {
  if (!ids.length) return new Map<string, PricedOption[]>();
  const rows = await db.select({ venueId: schema.venueOptions.venueId, code: schema.venueOptions.code, name: schema.venueOptions.name, pricePence: schema.venueOptions.pricePence, unit: schema.venueOptions.unit, chapter: schema.venueOptions.chapter })
    .from(schema.venueOptions).where(and(inArray(schema.venueOptions.venueId, ids), eq(schema.venueOptions.active, true)));
  const m = new Map<string, PricedOption[]>();
  for (const r of rows) m.set(r.venueId, [...(m.get(r.venueId) ?? []), r]);
  return m;
};

type Q = Pick<SearchInput, 'day' | 'guests' | 'evening'>;

/** Turns venue rows into priced cards for one day and guest count. */
async function cardsFor(vs: (typeof schema.venues.$inferSelect)[], q: Q): Promise<VenueCardData[]> {
  const ids = vs.map(v => v.id);
  const [photos, options, dates] = await Promise.all([
    photosFor(ids), optionsFor(ids),
    ids.length ? db.select().from(schema.venueDates).where(and(inArray(schema.venueDates.venueId, ids), eq(schema.venueDates.day, q.day))) : Promise.resolve([]),
  ]);
  const taken = new Map(dates.map(d => [d.venueId, d]));
  return vs.map(v => {
    const d = taken.get(v.id);
    return {
      id: v.id, slug: v.slug, name: v.name, place: v.place, style: v.style, capacityDinner: v.capacityDinner, isSample: v.isSample,
      photos: photos.get(v.id) ?? [], licensed: !!v.ceremonyName,
      hirePence: hireForDay(v.hireBasePence, q.day, d?.pricePence),
      fullDayPence: packageTotal(options.get(v.id) ?? [], STARTER_PACKAGE, q.day, v.hireBasePence, q.guests, q.evening, d?.pricePence),
      free: !d,
    };
  });
}

/** Live venues in an area that seat the guests, priced for the day, with taken dates left out. */
export async function searchVenues(q: SearchInput) {
  const vs = await db.select().from(schema.venues)
    .where(and(eq(schema.venues.status, 'live'), eq(schema.venues.area, q.area), gte(schema.venues.capacityDinner, q.guests)))
    .orderBy(asc(schema.venues.createdAt), asc(schema.venues.name));
  const cards = await cardsFor(vs, q);
  const free = cards.filter(c => c.free);
  let list = q.maxPence ? free.filter(c => c.fullDayPence <= q.maxPence!) : free;
  if (q.sort === 'price') list = [...list].sort((a, b) => a.fullDayPence - b.fullDayPence);
  if (q.sort === 'cap') list = [...list].sort((a, b) => b.capacityDinner - a.capacityDinner);
  return { list, takenCount: cards.length - free.length, hiddenByBudget: free.length - list.length };
}

/** Every live venue a couple has liked, newest first, priced for their day whether or not it is free. */
export async function likedVenues(userId: string, q: Q) {
  const rows = await db.select({ v: schema.venues }).from(schema.likes)
    .innerJoin(schema.venues, eq(schema.venues.id, schema.likes.venueId))
    .where(and(eq(schema.likes.userId, userId), eq(schema.venues.status, 'live')))
    .orderBy(desc(schema.likes.createdAt));
  return cardsFor(rows.map(r => r.v), q);
}

export async function getVenue(slug: string) {
  const [v] = await db.select().from(schema.venues).where(eq(schema.venues.slug, slug)).limit(1);
  if (!v) return null;
  const [photos, options] = await Promise.all([
    db.select().from(schema.venuePhotos).where(eq(schema.venuePhotos.venueId, v.id)).orderBy(asc(schema.venuePhotos.position)),
    db.select().from(schema.venueOptions).where(and(eq(schema.venueOptions.venueId, v.id), eq(schema.venueOptions.active, true))).orderBy(asc(schema.venueOptions.position)),
  ]);
  return { venue: v, photos, options };
}

export async function dateStateFor(venueId: string, day: string) {
  const [d] = await db.select().from(schema.venueDates).where(and(eq(schema.venueDates.venueId, venueId), eq(schema.venueDates.day, day))).limit(1);
  return d ?? null;
}

export async function likedIds(userId: string) {
  const rows = await db.select({ venueId: schema.likes.venueId }).from(schema.likes).where(eq(schema.likes.userId, userId));
  return new Set(rows.map(r => r.venueId));
}
