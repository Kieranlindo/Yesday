import { isValidDay, londonToday, suggestedDate } from './dates';
import { NEEDS, STYLES } from './labels';
import type { SearchInput } from './venues';

export const AREAS = ['London'];

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const int = (v: string | undefined, d: number, lo: number, hi: number) => { const n = Number.parseInt(v ?? '', 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

export function readSearch(p: Params): SearchInput {
  const area = AREAS.includes(one(p.area) ?? '') ? one(p.area)! : 'London';
  const raw = one(p.date);
  const day = isValidDay(raw) && raw > londonToday() ? raw : suggestedDate();
  const sort = (['rec', 'price', 'cap'] as const).find(s => s === one(p.sort)) ?? 'rec';
  const max = int(one(p.max), 0, 0, 1_000_000);
  const list = (v: string | undefined, ok: string[]) => (v ?? '').split('.').filter(x => ok.includes(x));
  return {
    area, day, guests: int(one(p.guests), 80, 10, 500), evening: int(one(p.evening), 30, 0, 500), sort, maxPence: max ? max * 100 : undefined,
    needs: list(one(p.needs), NEEDS.map(n => n[0])), styles: list(one(p.style), STYLES),
  };
}

export const searchQuery = (q: Partial<SearchInput> & { day?: string }) => {
  const u = new URLSearchParams();
  if (q.area) u.set('area', q.area);
  if (q.day) u.set('date', q.day);
  if (q.guests) u.set('guests', String(q.guests));
  if (q.evening != null) u.set('evening', String(q.evening));
  return u.toString();
};

/** The full search, filters and sort included, for links that come back to the same results. */
export const filterQuery = (q: SearchInput) => {
  const u = new URLSearchParams(searchQuery(q));
  if (q.maxPence) u.set('max', String(Math.round(q.maxPence / 100)));
  if (q.needs?.length) u.set('needs', q.needs.join('.'));
  if (q.styles?.length) u.set('style', q.styles.join('.'));
  if (q.sort !== 'rec') u.set('sort', q.sort);
  return u.toString();
};
