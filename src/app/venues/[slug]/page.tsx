import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { and, eq } from 'drizzle-orm';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Heart from '@/components/fx/Heart';
import Gallery from '@/components/builder/Gallery';
import PackageBuilder, { type BuilderVenue } from '@/components/builder/PackageBuilder';
import { currentUser } from '@/lib/auth';
import { db, schema } from '@/db';
import { getVenue, dateStateFor, likedIds } from '@/lib/venues';
import { readSearch, searchQuery } from '@/lib/search-params';
import { londonToday, tourDays } from '@/lib/dates';
import { FEATURES, RULES } from '@/lib/labels';
import { POLICY_TEXT, type Unit } from '@/lib/rules';
import { decodeCodes } from '@/lib/package';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getVenue((await params).slug);
  return data ? { title: data.venue.name, description: data.venue.about } : {};
}

export default async function VenuePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const data = await getVenue(slug);
  if (!data || data.venue.status !== 'live') notFound();
  const { venue: v, photos, options } = data;
  const sp = await searchParams;
  const q = readSearch(sp);
  const [u, date] = await Promise.all([currentUser(), dateStateFor(v.id, q.day)]);
  const liked = u ? (await likedIds(u.id)).has(v.id) : false;

  // Where the package starts: a shared link, then the couple's saved package, then our suggested day.
  const shared = decodeCodes(one(sp.pkg));
  const [saved] = u && !shared.length ? await db.select().from(schema.packages).where(and(eq(schema.packages.coupleId, u.id), eq(schema.packages.venueId, v.id))).limit(1) : [];
  const kidsParam = Number.parseInt(one(sp.kids) ?? '', 10);
  const hasNumbers = !!one(sp.guests) || !!one(sp.date);
  const numbers = saved && !hasNumbers
    ? { day: saved.weddingDate > londonToday() ? saved.weddingDate : q.day, guests: saved.guests, evening: saved.eveningGuests, kids: saved.kids }
    : { day: q.day, guests: q.guests, evening: q.evening, kids: Number.isFinite(kidsParam) ? Math.min(60, Math.max(0, kidsParam)) : saved?.kids ?? 0 };
  const dayState = numbers.day === q.day ? date : await dateStateFor(v.id, numbers.day);

  const shortName = v.name.replace(/^The /, '');
  const venue: BuilderVenue = {
    id: v.id, slug: v.slug, name: v.name, shortName, place: v.place, capacityDinner: v.capacityDinner, capacityEvening: v.capacityEvening,
    hireBasePence: v.hireBasePence, depositPercent: v.depositPercent, licensed: !!v.ceremonyName, manager: v.managerName, managerPhoto: v.managerPhoto, spaces: v.spacesSummary,
  };
  const opts = options.map(o => ({
    code: o.code, chapter: o.chapter, name: o.name, pricePence: o.pricePence, unit: o.unit as Unit, required: o.required,
    detail: o.code === 'hire' ? `${o.detail}${v.spacesSummary ? ` ${v.spacesSummary}.` : ''}` : o.code === 'cer_room' && v.ceremonyDetail ? v.ceremonyDetail : o.detail,
  }));
  const back = `/venues/${v.slug}?${searchQuery(q)}`;
  const policyColour = { Flexible: 'var(--ok)', Moderate: '#B5651D', Strict: 'var(--rose)' }[v.policy];

  return (
    <>
      <Nav />
      <main className="wrap">
        <div className="vhead">
          <div className="col g12">
            <span className="eyebrow">{v.place}</span>
            <h1>{v.name}</h1>
            <p className="muted">{v.style}<span className="sep" />Up to {v.capacityDinner} for dinner{v.capacityEvening ? <><span className="sep" />{v.capacityEvening} in the evening</> : null}{v.ceremonyName ? <><span className="sep" />Licensed for weddings</> : null}</p>
          </div>
          <div className="row g12">
            <Heart venueId={v.id} name={v.name} liked={liked} back={back} variant="pill" />
            <Link className="btn o" href={`/search?${searchQuery(q)}`}>Back to results</Link>
          </div>
        </div>

        <Gallery photos={photos.map(p => ({ url: p.url, alt: p.alt }))} name={v.name} />

        <section className="vintro" data-reveal>
          <p className="lede">{v.about}</p>
          {v.features.length > 0 && <div className="feats">{v.features.map(f => <p key={f}>{FEATURES[f] ?? f}</p>)}</div>}
        </section>

        <PackageBuilder
          venue={venue}
          options={opts}
          start={{
            numbers, codes: shared.length ? ['hire', ...shared] : saved?.codes ?? null, free: !dayState, overridePence: dayState?.pricePence ?? null,
            today: londonToday(), tourDays: tourDays(), signedIn: !!u, isCouple: !!u && (u.role === 'couple' || u.role === 'admin'), savedOnServer: !!saved && !shared.length,
            fromShare: shared.length > 0, openTour: one(sp.tour) === '1',
          }}
        />

        <div className="vmore">
          {v.practical.length > 0 && (
            <section className="vsec" data-reveal>
              <h2>Getting there and good to know</h2>
              <dl className="kv">{v.practical.map(([k, val]) => [<dt key={`${k}t`}>{k}</dt>, <dd key={`${k}d`}>{val}</dd>])}</dl>
            </section>
          )}
          {Object.keys(v.rules).length > 0 && (
            <section className="vsec" data-reveal>
              <h2>House rules</h2>
              <dl className="kv">{Object.entries(v.rules).map(([k, val]) => [<dt key={`${k}t`}>{RULES[k] ?? k}</dt>, <dd key={`${k}d`}>{val}</dd>])}</dl>
            </section>
          )}
          <section className="vsec" data-reveal>
            <h2>If plans change</h2>
            <span className={`pol${v.policy === 'Strict' ? ' strict' : ''}`} style={{ ['--pc' as string]: policyColour }}><span className="pd" />{v.policy} cancellation</span>
            <p className="muted" style={{ maxWidth: 680, lineHeight: 1.6 }}>{POLICY_TEXT[v.policy]}</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
