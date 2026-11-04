import { expect, test } from 'vitest';
import { contrastRatio } from './contrast';

test.each([
  ['#1F2420', '#F3F0E8'],
  ['#5B5347', '#F3F0E8'],
  ['#F3F0E8', '#0F241D'],
  ['#F3F0E8', '#1B3A2F'],
  ['#0F241D', '#E9D3B4'],
  ['#1F2420', '#E5E1D3'],
])('AA text pair %s on %s', (fg, bg) => {
  expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
});

test('bronze on marfim is below AA (decorative only)', () => {
  expect(contrastRatio('#AA8D73', '#F3F0E8')).toBeLessThan(4.5);
});

test('black on white is 21', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
});
