/** Money is held in pence. These helpers only format it. */
export const pounds = (pence: number) => {
  const p = Math.round(pence) / 100;
  return '£' + p.toLocaleString('en-GB', { minimumFractionDigits: p % 1 ? 2 : 0, maximumFractionDigits: 2 });
};
export const roundTo = (pence: number, stepPence: number) => Math.round(pence / stepPence) * stepPence;
