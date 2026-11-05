import { expect, test } from 'vitest';
import { AUTOPLAY_MS, autoplayIndex, nextIndex, slideLabel } from './carousel';

test.each([
  [0, 4, '01 / 04'],
  [1, 4, '02 / 04'],
  [3, 4, '04 / 04'],
  [9, 12, '10 / 12'],
])('slideLabel(%i, %i) → %s', (i, total, label) => {
  expect(slideLabel(i, total)).toBe(label);
});

test('nextIndex clamps at both ends', () => {
  expect(nextIndex(0, 1, 4)).toBe(1);
  expect(nextIndex(3, 1, 4)).toBe(3);
  expect(nextIndex(0, -1, 4)).toBe(0);
  expect(nextIndex(2, -1, 4)).toBe(1);
});

test('autoplayIndex steps forward and wraps from the last slide to the first', () => {
  expect(autoplayIndex(0, 4)).toBe(1);
  expect(autoplayIndex(2, 4)).toBe(3);
  expect(autoplayIndex(3, 4)).toBe(0);
});

test('AUTOPLAY_MS is six seconds', () => {
  expect(AUTOPLAY_MS).toBe(6000);
});
