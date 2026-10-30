import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { currentUser } from '@/lib/auth';
import { getVenue, dateStateFor, likedIds } from '@/lib/venues';
import { readSearch, searchQuery } from '@/lib/search-params';
import { dayLong, dayShort } from '@/lib/dates';
import { pounds } from '@/lib/money';
import { CHAPTERS, FEATURES, RULES, UNIT } from '@/lib/labels';
import { depositFor, hireForDay, lineTotal, POLICY_TEXT, STARTER_PACKAGE, type Unit } from '@/lib/rules';
import { toggleLike } from '@/app/actions';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getVenue((await params).slug);
  return data ? { title: data.venue.name, description: data.venue.about } : {};
}

export default async function VenuePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const data = await getVenue(slug);
  if (!data || data.venue.status !== 'live') notFound();
  const { venue: v, photos, options } = data;
  const q = readSearch(await searchParams);
  const [u, date] = await Promise.all([currentUser(), dateStateFor(v.id, q.day)]);
  const liked = u ? (await likedIds(u.id)).has(v.id) : false;
  const free = !date;
  const back = `/venues/${v.slug}?${searchQuery(q)}`;

  const hire = hireForDay(v.hireBasePence, q.day, date?.pricePence);
  const lines = options.filter(o => STARTER_PACKAGE.includes(o.code)).map(o => ({
    name: o.chapter === 'drinks' ? `${o.name} drinks` : o.name, pence: o.code === 'hire' ? hire : lineTotal({ pricePence: o.pricePence, unit: o.unit as Unit }, q.guests, q.evening),
  }));
  const total = lines.reduce((s, l) => s + l.pence, 0);
  const deposit = depositFor(total, v.depositPercent);
  const chapters = Object.keys(CHAPTERS).map(c => [c, options.filter(o => o.chapter === c)] as const).filter(([, list]) => list.length);
  const fit = q.guests <= v.capacityDinner;

  return (
    <>
      <Nav />
      <main className="wrap">
        <div className="vhead">
          <div className="col g12">
            <span className="eyebrow">{v.place}</span>
            <h1>{v.name}</h1>
            <p className="muted">{v.style}<span className="sep" />Up to {v.capacityDinner} for dinner{v.capacityEvening ? <><span className="sep" />{v.capacityEvening} in the evening</> : null}</p>
          </div>
          <div className="row g12">
            <form action={toggleLike}>
              <input type="hidden" name="venueId" value={v.id} /><input type="hidden" name="back" value={back} />
              <button className="btn o" aria-pressed={liked}>{liked ? 'Liked' : 'Like this venue'}</button>
            </form>
            <Link className="btn o" href={`/search?${searchQuery(q)}`}>Back to results</Link>
          </div>
        </div>

        <div className={`gal${photos.length === 2 ? ' two' : ''}`}>
          {photos.slice(0, 3).map((p, i) => <img key={p.id} src={p.url} alt={p.alt || (i ? '' : v.name)} />)}
        </div>

        <div className="vbody">
          <div className="col">
            <section className="vsec">
              <p style={{ fontSize: 20, lineHeight: 1.6, maxWidth: 720 }}>{v.about}</p>
              {v.features.length > 0 && <div className="feats">{v.features.map(f => <p key={f}>{FEATURES[f] ?? f}</p>)}</div>}
            </section>

            {chapters.map(([c, list]) => (
              <section key={c} className="vsec">
                <h2>{CHAPTERS[c]}</h2>
                <div className="opts">
                  {list.map(o => (
                    <div key={o.id} className="o">
                      <span className="b">{o.name}{STARTER_PACKAGE.includes(o.code) && <span className="pill gold" style={{ marginLeft: 10 }}>In the starting package</span>}</span>
                      <span className="num" style={{ textAlign: 'right' }}>{o.code === 'hire' ? pounds(hire) : o.pricePence ? `${pounds(o.pricePence)}${UNIT[o.unit]}` : 'Included'}</span>
                      <span className="small muted" style={{ gridColumn: '1 / -1', maxWidth: 640 }}>{o.code === 'hire' ? `${o.detail} Priced for ${dayLong(q.day)}.` : o.detail}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {v.practical.length > 0 && (
              <section className="vsec">
                <h2>Getting there and good to know</h2>
                <dl className="kv">{v.practical.map(([k, val]) => [<dt key={`${k}t`}>{k}</dt>, <dd key={`${k}d`}>{val}</dd>])}</dl>
              </section>
            )}
            {Object.keys(v.rules).length > 0 && (
              <section className="vsec">
                <h2>House rules</h2>
                <dl className="kv">{Object.entries(v.rules).map(([k, val]) => [<dt key={`${k}t`}>{RULES[k] ?? k}</dt>, <dd key={`${k}d`}>{val}</dd>])}</dl>
              </section>
            )}
            <section className="vsec">
              <h2>If plans change</h2>
              <p className="muted" style={{ maxWidth: 680, lineHeight: 1.6 }}><span className="b" style={{ color: 'var(--ink)' }}>{v.policy} cancellation.</span> {POLICY_TEXT[v.policy]}</p>
            </section>
          </div>

          <aside className="rail" aria-label="Your date and price">
            <div className="card book">
              <form action={`/venues/${v.slug}`} className="col g12">
                <div className="row between g12">
                  <span className="pill" style={{ background: free ? 'var(--okbg)' : 'var(--rosebg)', color: free ? 'var(--ok)' : 'var(--rose)' }}>{free ? `Free on ${dayShort(q.day)}` : `Booked on ${dayShort(q.day)}`}</span>
                  <span className="small muted">{q.guests} guests, {q.evening} evening</span>
                </div>
                <div className="railf">
                  <label className="field full"><span className="tiny muted">Wedding date</span><input className="inp" type="date" name="date" defaultValue={q.day} /></label>
                  <label className="field"><span className="tiny muted">Day guests</span><input className="inp" type="number" name="guests" min={10} max={500} defaultValue={q.guests} /></label>
                  <label className="field"><span className="tiny muted">Evening guests</span><input className="inp" type="number" name="evening" min={0} max={500} defaultValue={q.evening} /></label>
                </div>
                <button className="btn o sm" type="submit">Update the price</button>
              </form>

              <div className="col g4">
                <span className="small muted">Your full day, as it stands</span>
                <span className="pp num">{pounds(total)}</span>
              </div>
              <div className="lines">
                {lines.map(l => <div key={l.name} className="ln"><span>{l.name}</span><span className="num">{pounds(l.pence)}</span></div>)}
                <div className="ln tot"><span>Deposit to secure the date</span><span className="num">{pounds(deposit)}</span></div>
              </div>
              {!fit && <p className="err">{v.name} seats up to {v.capacityDinner} for dinner, fewer than your {q.guests} guests.</p>}
              <p className="notice small">Custom tours and online booking arrive in the next stages of the build.</p>
              <p className="tiny muted">The rest is paid monthly, finishing eight weeks before the day.</p>
            </div>
            <div className="card am">
              {v.managerPhoto ? <img className="pic" src={v.managerPhoto} alt="" /> : <span className="pic av" style={{ width: 54, height: 54 }}>{v.managerName[0]}</span>}
              <div className="col g4"><span className="b">{v.managerName} looks after weddings here</span><span className="small muted">Replies within a day</span></div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
