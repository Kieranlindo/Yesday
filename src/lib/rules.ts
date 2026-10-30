/**
 * Yesday's business rules, in one place. Everything about money that the
 * product promises lives here, so the website, the app and the venue
 * dashboard all agree. See the business plan, "How we make money" and
 * "When plans change".
 */
import { addDays, month, parseDay, toDay, weekday } from './dates';
import { roundTo } from './money';

/** Our booking fee, in basis points (800 = 8%). Founding venues pay 5% for their first 12 months. */
export const FEE_BP = 800;
export const FOUNDING_FEE_BP = 500;

/** Deposits: a small share of the total, as consumer law expects. Venues choose within this range. */
export const DEPOSIT_MIN_PERCENT = 10;
export const DEPOSIT_DEFAULT_PERCENT = 15;
export const DEPOSIT_MAX_PERCENT = 25;

/** How long a date is held while a couple checks out, and after a tour. */
export const CHECKOUT_HOLD_MINUTES = 15;
export const TOUR_HOLD_HOURS = 24;

/** The final balance is due this many days before the wedding. */
export const BALANCE_DUE_DAYS_BEFORE = 56;

export type Unit = 'flat' | 'pp' | 'eve' | 'table' | 'room';
export type PricedOption = { code: string; name: string; pricePence: number; unit: Unit; chapter: string };

/** Peak season is May to September. */
export const isPeak = (day: string) => { const m = month(day); return m >= 4 && m <= 8; };

/** Venue hire for a given day, from the venue's Saturday peak price. */
export function hireForDay(hireBasePence: number, day: string, overridePence?: number | null) {
  if (overridePence) return overridePence;
  const w = weekday(day);
  const dayFactor = w === 6 ? 1 : w === 0 ? 0.8 : w === 5 ? 0.75 : 0.55;
  return roundTo(hireBasePence * dayFactor * (isPeak(day) ? 1 : 0.83), 5000);
}

export function quantityFor(unit: Unit, guests: number, evening: number) {
  switch (unit) {
    case 'pp': return guests;
    case 'eve': return guests + evening;
    case 'table': return Math.ceil(guests / 10);
    case 'room': return 0; // guests book their own rooms
    default: return 1;
  }
}

export const lineTotal = (o: Pick<PricedOption, 'pricePence' | 'unit'>, guests: number, evening: number) => o.pricePence * quantityFor(o.unit, guests, evening);

/** What a couple starts with before they change anything: the "full day" price shown in search. */
export const STARTER_PACKAGE = ['hire', 'cer_room', 'can3', 'dinner3', 'd_classic', 'dj', 'lights', 'suite'];

export function packageTotal(options: PricedOption[], codes: string[], day: string, hireBasePence: number, guests: number, evening: number, hireOverride?: number | null) {
  return options.filter(o => codes.includes(o.code)).reduce((sum, o) => {
    if (o.code === 'hire') return sum + hireForDay(hireBasePence, day, hireOverride);
    return sum + lineTotal(o, guests, evening);
  }, 0);
}

export function depositFor(totalPence: number, venuePercent: number) {
  const pct = Math.min(DEPOSIT_MAX_PERCENT, Math.max(DEPOSIT_MIN_PERCENT, venuePercent));
  return roundTo(totalPence * pct / 100, 5000);
}

export const feeFor = (totalPence: number, feeBp = FEE_BP) => Math.round(totalPence * feeBp / 10000);

/** Monthly instalments on the 1st of each month, the last one landing at least eight weeks before the wedding. */
export function instalments(totalPence: number, depositPence: number, bookedOn: string, weddingDay: string) {
  const balance = totalPence - depositPence;
  const last = parseDay(addDays(weddingDay, -BALANCE_DUE_DAYS_BEFORE));
  const booked = parseDay(bookedOn);
  let d = new Date(Date.UTC(booked.getUTCFullYear(), booked.getUTCMonth() + 1, 1)); // first of next month
  if ((d.getTime() - booked.getTime()) / 864e5 < 21) d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  const dates: string[] = [];
  while (d <= last && dates.length < 24) { dates.push(toDay(d)); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); }
  if (!dates.length) dates.push(toDay(last));
  const each = Math.floor(balance / dates.length);
  return dates.map((due, i) => ({ due, amountPence: i === dates.length - 1 ? balance - each * (dates.length - 1) : each }));
}

export type Policy = 'Flexible' | 'Moderate' | 'Strict';
export const POLICY_TEXT: Record<Policy, string> = {
  Flexible: 'Cancel at least 3 months before and get your deposit back, apart from 4% of the package. After that, the deposit isn’t refundable.',
  Moderate: 'Cancel at least 6 months before and get half your deposit back. After that, the deposit isn’t refundable.',
  Strict: 'The deposit isn’t refundable. Payments after the deposit are refunded if you cancel 9 months or more before.',
};
export const POLICY_EARLY_MONTHS: Record<Policy, number> = { Flexible: 3, Moderate: 6, Strict: 9 };

/**
 * Who ends up with what when a couple cancels. We take our full fee at booking,
 * and credit half of it back to the venue if the couple cancels, so the venue is
 * never out of pocket. Late-cancellation refunds of instalments follow the venue's
 * published sliding scale; here we return the most the venue may keep.
 */
export function coupleCancels(p: { policy: Policy; totalPence: number; depositPence: number; feePence: number; paidPence: number; monthsBefore: number }) {
  const early = p.monthsBefore >= POLICY_EARLY_MONTHS[p.policy];
  const credit = Math.round(p.feePence / 2);
  const instalmentsPaid = p.paidPence - p.depositPence;
  let depositBack = 0;
  if (early && p.policy === 'Flexible') depositBack = Math.max(0, p.depositPence - Math.round(p.totalPence * 0.04));
  if (early && p.policy === 'Moderate') depositBack = Math.round(p.depositPence / 2);
  const instalmentsBack = early ? instalmentsPaid : 0; // late: sliding scale decides, up to everything
  const coupleBack = depositBack + instalmentsBack;
  const yesday = p.feePence - credit;
  return { early, coupleBack, venue: p.paidPence - coupleBack - yesday, yesday, creditToVenue: credit };
}
