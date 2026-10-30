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
