/** Wedding dates are plain calendar days. We keep them as "YYYY-MM-DD" strings and do maths in UTC to avoid time-zone drift. */
export const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const parseDay = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const toDay = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => { const d = parseDay(s); d.setUTCDate(d.getUTCDate() + n); return toDay(d); };
export const isValidDay = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && toDay(parseDay(s)) === s;

/** Today in London, as YYYY-MM-DD. */
export function londonToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export const dayLong = (s: string) => { const d = parseDay(s); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
export const dayMed = (s: string) => { const d = parseDay(s); return `${DOW[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MON[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`; };
export const dayShort = (s: string) => { const d = parseDay(s); return `${DOW[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MON[d.getUTCMonth()].slice(0, 3)}`; };
export const weekday = (s: string) => parseDay(s).getUTCDay();
export const month = (s: string) => parseDay(s).getUTCMonth();

/** The default date the site suggests: the next Saturday in September at least ten months away. */
export function suggestedDate(from = londonToday()) {
  const f = parseDay(from);
  let y = f.getUTCFullYear() + (f.getUTCMonth() >= 6 ? 1 : 0);
  for (;;) {
    for (let d = 1; d <= 30; d++) {
      const s = `${y}-09-${String(d).padStart(2, '0')}`;
      if (weekday(s) === 6 && d >= 14 && parseDay(s) > parseDay(addDays(from, 300))) return s;
    }
    y++;
  }
}

/** The UTC instant for a wall-clock time in London on a given day (handles BST). */
export function londonInstant(day: string, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const guess = new Date(`${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(guess);
  const lh = Number(parts.find(p => p.type === 'hour')!.value), lm = Number(parts.find(p => p.type === 'minute')!.value);
  const offsetMin = (lh * 60 + lm) - (h * 60 + m);
  return new Date(guess.getTime() - offsetMin * 60_000);
}

/** "11:30" and day parts of an instant, in London. */
export function londonParts(d: Date) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const g = (t: string) => f.find(p => p.type === t)!.value;
  return { day: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` };
}

/** "11:30" as "11.30am", the way we write times. */
export const niceTime = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return `${h % 12 || 12}${m ? `.${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`; };

/** Days a venue shows couples round: the next ten Wednesdays to Sundays, starting two days from now. */
export const TOUR_TIMES = ['10:00', '11:30', '14:00', '16:00', '18:30'];
export function tourDays(from = londonToday(), count = 10) {
  const out: string[] = [];
  let d = addDays(from, 2);
  while (out.length < count) { const w = weekday(d); if (w === 0 || w >= 3) out.push(d); d = addDays(d, 1); }
  return out;
}
