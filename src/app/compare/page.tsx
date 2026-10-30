import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { getVenue, dateStateFor } from '@/lib/venues';
import { readSearch, searchQuery } from '@/lib/search-params';
import { dayShort } from '@/lib/dates';
import { pounds } from '@/lib/money';
import { FEATURES } from '@/lib/labels';
import { depositFor, hireForDay, packageTotal, POLICY_EARLY_MONTHS, type Unit } from '@/lib/rules';
import { starterFor } from '@/lib/package';

export const metadata: Metadata = { title: 'Compare venues' };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Two venues side by side, priced for the same day, with the better of each row marked in gold. */
export default async function Compare({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = readSearch(sp);
  const [a, b] = await Promise.all([getVenue(one(sp.a) ?? ''), getVenue(one(sp.b) ?? '')]);
  const query = searchQuery(q);
  if (!a || !b) return (<><Nav /><main className="wrap results"><div className="card empty"><h1 style={{ fontSize: 40 }}>Pick two venues to compare</h1><Link className="btn" href="/my">Back to your wedding</Link></div></main><Footer /></>);
  const rows = await Promise.all([a, b].map(async d => {
    const v = d.venue, ds = await dateStateFor(v.id, q.day);
    const opts = d.options.map(o => ({ code: o.code, name: o.name, pricePence: o.pricePence, unit: o.unit as Unit, chapter: o.chapter, detail: o.detail, required: o.required }));
    const total = packageTotal(opts, starterFor(opts, !!v.ceremonyName), q.day, v.hireBasePence, q.guests, q.evening, ds?.pricePence);
    return { v, photo: d.photos[0]?.url, free: !ds, hire: hireForDay(v.hireBasePence, q.day, ds?.pricePence), total, deposit: depositFor(total, v.depositPercent) };
  }));
  const [x, y] = rows;
  const win = (ax: number, bx: number, low = true) => (ax === bx ? [false, false] : low ? [ax < bx, bx < ax] : [ax > bx, bx > ax]);
  const line = (k: string, vals: [React.ReactNode, React.ReactNode], w: boolean[] = [false, false]) => [
    <div key={`${k}k`} className="k">{k}</div>, <div key={`${k}a`} className={w[0] ? 'win' : ''}>{vals[0]}</div>, <div key={`${k}b`} className={w[1] ? 'win' : ''}>{vals[1]}</div>,
  ];
  return (
    <>
      <Nav />
      <main className="wrap results">
        <div className="col g8"><span className="eyebrow">Side by side · {dayShort(q.day)} · {q.guests} guests</span><h1 style={{ fontSize: 56, lineHeight: 1 }}>{x.v.name} <i className="goldtext">or</i> {y.v.name}?</h1></div>
        <div className="cmpt" data-reveal>
          <div style={{ borderTop: 'none' }} />
          {rows.map(r => <Link key={r.v.id} href={`/venues/${r.v.slug}?${query}`} style={{ borderTop: 'none', paddingRight: 24, textDecoration: 'none' }} className="col g12"><img src={r.photo} alt="" style={{ aspectRatio: '16 / 10', objectFit: 'cover', borderRadius: 12, width: '100%' }} /><span className="serif" style={{ fontSize: 30 }}>{r.v.name}</span><span className="small muted">{r.v.place}</span></Link>)}
          {line(`On ${dayShort(q.day)}`, [x.free ? 'Free' : 'Booked', y.free ? 'Free' : 'Booked'], [x.free && !y.free, y.free && !x.free])}
          {line('Full day for your guests', [pounds(x.total), pounds(y.total)], win(x.total, y.total))}
          {line('Venue hire', [pounds(x.hire), pounds(y.hire)], win(x.hire, y.hire))}
          {line('Deposit to book', [`${pounds(x.deposit)} (${Math.max(20, x.v.depositPercent)}%)`, `${pounds(y.deposit)} (${Math.max(20, y.v.depositPercent)}%)`], win(x.deposit, y.deposit))}
          {line('Seats for dinner', [x.v.capacityDinner, y.v.capacityDinner], win(x.v.capacityDinner, y.v.capacityDinner, false))}
          {line('If plans change', [x.v.policy, y.v.policy], win(POLICY_EARLY_MONTHS[x.v.policy], POLICY_EARLY_MONTHS[y.v.policy]))}
          {line('Ceremony', [x.v.ceremonyName ?? 'Celebration only', y.v.ceremonyName ?? 'Celebration only'])}
          {line('Good to know', [x.v.features.map(f => FEATURES[f] ?? f).join(', '), y.v.features.map(f => FEATURES[f] ?? f).join(', ')])}
          {line('Looks after weddings', [x.v.managerName, y.v.managerName])}
          <div /><div style={{ paddingRight: 24 }}><Link className="btn" href={`/venues/${x.v.slug}?${query}`}>Build your day here</Link></div><div><Link className="btn" href={`/venues/${y.v.slug}?${query}`}>Build your day here</Link></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
