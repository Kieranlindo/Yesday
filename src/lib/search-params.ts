import { isValidDay, londonToday, suggestedDate } from './dates';
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
  return { area, day, guests: int(one(p.guests), 80, 10, 500), evening: int(one(p.evening), 30, 0, 500), sort, maxPence: max ? max * 100 : undefined };
}

export const searchQuery = (q: Partial<SearchInput> & { day?: string }) => {
  const u = new URLSearchParams();
  if (q.area) u.set('area', q.area);
  if (q.day) u.set('date', q.day);
  if (q.guests) u.set('guests', String(q.guests));
  if (q.evening != null) u.set('evening', String(q.evening));
  return u.toString();
};
