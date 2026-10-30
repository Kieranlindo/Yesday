/**
 * The package builder's logic, shared by the venue page (in the browser) and the
 * server (when a package is saved or a tour is booked), so both always agree on
 * the price. Pure functions only: no database, no React.
 */
import { BALANCE_DUE_DAYS_BEFORE, DEPOSIT_MIN_PERCENT, depositFor, hireForDay, instalments, KIDS_MENU_PENCE, lineTotal, type Unit } from './rules';

export type BuilderOption = { code: string; chapter: string; name: string; detail: string; pricePence: number; unit: Unit; required: boolean };

/** Options in the same group replace each other (radio). Everything else is an add-on (checkbox). */
const GROUP: Record<string, string> = {
  cer_room: 'cer', cer_garden: 'cer', cer_none: 'cer',
  can3: 'can', can5: 'can',
  dinner3: 'meal', feast: 'meal',
  d_none: 'drink', d_classic: 'drink', d_sig: 'drink', d_pres: 'drink',
};
/** Groups a couple must always have one of. Canapés are optional. */
const MUST = new Set(['cer', 'meal', 'drink']);
export const groupOf = (code: string) => GROUP[code] ?? null;

export const GROUP_LABEL: Record<string, string> = { cer: 'Your ceremony', can: 'Canapés', meal: 'Your menu', drink: 'Choose a package' };
export const EXTRA_LABEL: Record<string, string> = { ceremony: 'Music', evening: 'Food, music and dancing', styling: 'Add to the rooms', stay: 'For you and your guests' };

export const MOST_CHOSEN = new Set(['cer_room', 'dinner3', 'd_classic', 'dj', 'lights']);
export const RECOMMENDS = new Set(['can5', 'feast', 'd_sig']);

/** The chapters of a day, in the order couples build it. */
export const CHAPTERS: { key: string; title: string; intro: string; short: string }[] = [
  { key: 'numbers', title: 'Your guests', intro: 'Who’s coming, and when', short: 'Guests' },
  { key: 'ceremony', title: 'Ceremony and drinks reception', intro: 'The first part of your day', short: 'Ceremony' },
  { key: 'breakfast', title: 'Wedding breakfast', intro: 'Your meal together', short: 'Dinner' },
  { key: 'drinks', title: 'Drinks package', intro: 'From the welcome drink to the toast', short: 'Drinks' },
  { key: 'evening', title: 'The evening', intro: 'Food, music and dancing', short: 'Evening' },
  { key: 'styling', title: 'Styling', intro: 'How the rooms look and feel', short: 'Styling' },
  { key: 'stay', title: 'Staying over', intro: 'For you and your guests', short: 'Stay' },
];

export const STARTER = ['hire', 'cer_room', 'can3', 'dinner3', 'd_classic', 'dj', 'lights', 'suite'];

/** The suggested day: our starter package, limited to what this venue offers. */
export function starterFor(options: BuilderOption[], licensed: boolean) {
  const have = new Set(options.map(o => o.code));
  return STARTER.map(c => (c === 'cer_room' && !licensed ? 'cer_none' : c)).filter(c => have.has(c));
}

/** Turns a tap on an option into the new selection, keeping groups to one choice and required items in. */
export function toggle(selected: string[], code: string, options: BuilderOption[]) {
  const o = options.find(x => x.code === code);
  if (!o || o.required) return selected;
  const g = groupOf(code);
  const on = selected.includes(code);
  if (g) {
    if (on) return MUST.has(g) ? selected : selected.filter(c => c !== code);
    return [...selected.filter(c => groupOf(c) !== g), code];
  }
  return on ? selected.filter(c => c !== code) : [...selected, code];
}

/** Keeps only codes this venue offers, adds anything required, and fills any must-have group. */
export function clean(codes: string[], options: BuilderOption[], licensed: boolean) {
  const have = new Set(options.map(o => o.code));
  let out = [...new Set(codes)].filter(c => have.has(c));
  for (const o of options) if (o.required && !out.includes(o.code)) out.unshift(o.code);
  const starter = starterFor(options, licensed);
  for (const g of MUST) {
    const inGroup = out.filter(c => groupOf(c) === g);
    if (inGroup.length > 1) out = out.filter(c => groupOf(c) !== g || c === inGroup[inGroup.length - 1]);
    if (!inGroup.length) { const s = starter.find(c => groupOf(c) === g) ?? options.find(o => groupOf(o.code) === g)?.code; if (s) out.push(s); }
  }
  return out;
}

export type Numbers = { day: string; guests: number; evening: number; kids: number };
export type Priced = { code: string; name: string; chapter: string; pence: number; qtyLabel: string };

export function priceLines(options: BuilderOption[], codes: string[], n: Numbers, hireBasePence: number, hireOverride?: number | null): Priced[] {
  return options.filter(o => codes.includes(o.code)).map(o => {
    const pence = o.code === 'hire' ? hireForDay(hireBasePence, n.day, hireOverride) : lineTotal(o, n.guests, n.evening);
    const qtyLabel = o.unit === 'pp' ? `${n.guests} guests` : o.unit === 'eve' ? `${n.guests + n.evening} guests` : '';
    return { code: o.code, name: o.chapter === 'drinks' && o.code !== 'd_none' ? `${o.name} drinks` : o.name, chapter: o.chapter, pence, qtyLabel };
  });
}

export function summarise(options: BuilderOption[], codes: string[], n: Numbers, hireBasePence: number, venuePercent: number, today: string, hireOverride?: number | null) {
  const lines = priceLines(options, codes, n, hireBasePence, hireOverride);
  const kidsPence = n.kids * KIDS_MENU_PENCE;
  const total = lines.reduce((s, l) => s + l.pence, 0) + kidsPence;
  const percent = Math.max(DEPOSIT_MIN_PERCENT, venuePercent);
  const deposit = depositFor(total, percent);
  const plan = total > 0 ? instalments(total, deposit, today, n.day) : [];
  const byChapter: Record<string, number> = {};
  for (const l of lines) byChapter[l.chapter] = (byChapter[l.chapter] ?? 0) + l.pence;
  byChapter.numbers = kidsPence;
  return { lines, total, deposit, percent, plan, byChapter, kidsPence, perGuest: n.guests ? Math.round(total / n.guests) : total, balanceDueDays: BALANCE_DUE_DAYS_BEFORE };
}

/** A short sentence for each chapter, e.g. "Three-course dinner" or "DJ, Uplighting". */
export function chapterSummary(options: BuilderOption[], codes: string[], chapter: string, n?: Numbers) {
  if (chapter === 'numbers' && n) return `${n.guests} for the day, ${n.evening} more in the evening${n.kids ? `, ${n.kids} ${n.kids === 1 ? 'child' : 'children'}` : ''}`;
  const names = options.filter(o => o.chapter === chapter && codes.includes(o.code)).map(o => (o.chapter === 'drinks' && o.code !== 'd_none' ? `${o.name} package` : o.name));
  return names.length ? names.join(', ') : 'Nothing added';
}

/** Package codes travel in links as a compact, readable list: "cer_garden.can5.feast". */
export const encodeCodes = (codes: string[]) => codes.filter(c => c !== 'hire').join('.');
export const decodeCodes = (s: string | undefined | null) => (s ? s.split('.').filter(c => /^[a-z0-9_]{1,24}$/.test(c)).slice(0, 40) : []);

/** What a couple can ask to see, taste or hear on their tour, from the package they built. */
export const SEE_CHAPTERS = ['ceremony', 'breakfast', 'drinks', 'evening', 'styling'];
export function seeLabel(o: Pick<BuilderOption, 'code' | 'chapter' | 'name'>) {
  const n = o.chapter === 'drinks' ? `${o.name} drinks` : o.name;
  const lower = /^[A-Z]{2}/.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1);
  const verb = o.chapter === 'breakfast' || o.code.startsWith('can') || o.code === 'buffet' ? 'Taste' : o.chapter === 'drinks' ? 'Try' : ['dj', 'band', 'quartet', 'dhol'].includes(o.code) ? 'Hear' : 'See';
  return `${verb} the ${lower}`;
}
