import 'server-only';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { db, schema } from '@/db';

/** A couple's plan, tours and saved packages, with the venue details each card needs. */
export async function coupleSpace(userId: string) {
  const [[plan], tours, pkgs] = await Promise.all([
    db.select().from(schema.plans).where(eq(schema.plans.userId, userId)).limit(1),
    db.select().from(schema.tours).where(and(eq(schema.tours.coupleId, userId), ne(schema.tours.status, 'cancelled'))).orderBy(schema.tours.startsAt),
    db.select().from(schema.packages).where(eq(schema.packages.coupleId, userId)).orderBy(desc(schema.packages.updatedAt)),
  ]);
  const ids = [...new Set([...tours.map(t => t.venueId), ...pkgs.map(p => p.venueId)])];
  const venues = ids.length ? await db.select({ id: schema.venues.id, slug: schema.venues.slug, name: schema.venues.name, place: schema.venues.place, managerName: schema.venues.managerName, depositPercent: schema.venues.depositPercent }).from(schema.venues).where(inArray(schema.venues.id, ids)) : [];
  const photos = ids.length ? await db.select({ venueId: schema.venuePhotos.venueId, url: schema.venuePhotos.url, position: schema.venuePhotos.position }).from(schema.venuePhotos).where(inArray(schema.venuePhotos.venueId, ids)) : [];
  const cover = new Map<string, string>();
  for (const p of photos.sort((a, b) => a.position - b.position)) if (!cover.has(p.venueId)) cover.set(p.venueId, p.url);
  const vmap = new Map(venues.map(v => [v.id, { ...v, photo: cover.get(v.id) ?? null }]));
  return { plan: plan ?? null, tours: tours.map(t => ({ ...t, venue: vmap.get(t.venueId)! })).filter(t => t.venue), packages: pkgs.map(p => ({ ...p, venue: vmap.get(p.venueId)! })).filter(p => p.venue) };
}
