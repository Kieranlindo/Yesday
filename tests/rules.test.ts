import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coupleCancels, depositFor, feeFor, hireForDay, instalments, packageTotal } from '../src/lib/rules';

test('deposit and fee on a £16,000 wedding', () => {
  assert.equal(depositFor(1_600_000, 15), 240_000);
  assert.equal(depositFor(1_600_000, 5), 160_000); // never below 10%
  assert.equal(depositFor(1_600_000, 40), 400_000); // never above 25%
  assert.equal(feeFor(1_600_000), 128_000);
});

test('couple cancels early under Moderate: the plan’s worked example', () => {
  const r = coupleCancels({ policy: 'Moderate', totalPence: 1_600_000, depositPence: 240_000, feePence: 128_000, paidPence: 540_000, monthsBefore: 8 });
  assert.deepEqual([r.coupleBack, r.venue, r.yesday], [420_000, 56_000, 64_000]);
});

test('couple cancels late: venue keeps up to everything paid, less our half fee', () => {
  const r = coupleCancels({ policy: 'Moderate', totalPence: 1_600_000, depositPence: 240_000, feePence: 128_000, paidPence: 540_000, monthsBefore: 2 });
  assert.deepEqual([r.coupleBack, r.venue, r.yesday], [0, 476_000, 64_000]);
});

test('Flexible early cancellation leaves the venue exactly covered', () => {
  const r = coupleCancels({ policy: 'Flexible', totalPence: 1_600_000, depositPence: 240_000, feePence: 128_000, paidPence: 240_000, monthsBefore: 5 });
  assert.equal(r.venue, 0);
});

test('day prices follow the prototype', () => {
  assert.equal(hireForDay(500_000, '2027-09-18'), 500_000); // peak Saturday
  assert.equal(hireForDay(500_000, '2028-02-11'), 310_000); // winter Friday, as on the home page
});

test('instalments add up to the balance and finish eight weeks before', () => {
  const s = instalments(1_761_000, 350_000, '2026-10-30', '2027-09-18');
  assert.equal(s.reduce((a, x) => a + x.amountPence, 0), 1_411_000);
  assert.equal(s[0].due, '2026-12-01');
  assert.ok(s[s.length - 1].due <= '2027-07-24');
});

test('starter package total for Fulham Palace matches the prototype (£17,610)', () => {
  const o = (code: string, pricePence: number, unit: 'flat' | 'pp' | 'eve' = 'flat') => ({ code, name: code, pricePence, unit, chapter: 'x' });
  const opts = [o('hire', 500_000), o('cer_room', 60_000), o('can3', 900, 'pp'), o('dinner3', 10_000, 'pp'), o('d_classic', 2_800, 'pp'), o('dj', 65_000), o('lights', 40_000)];
  assert.equal(packageTotal(opts, ['hire', 'cer_room', 'can3', 'dinner3', 'd_classic', 'dj', 'lights', 'suite'], '2027-09-18', 500_000, 80, 30), 1_761_000);
});
