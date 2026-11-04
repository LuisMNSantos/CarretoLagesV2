import { expect, test } from 'vitest';
import { tabKeyTarget } from './tabs';

test.each([
  ['ArrowRight', 0, 4, 1],
  ['ArrowDown', 2, 4, 3],
  ['ArrowRight', 3, 4, 0],
  ['ArrowLeft', 0, 4, 3],
  ['ArrowUp', 2, 4, 1],
  ['Home', 2, 4, 0],
  ['End', 0, 4, 3],
] as const)('%s from %i of %i → %i', (key, current, total, expected) => {
  expect(tabKeyTarget(key, current, total)).toBe(expected);
});

test('other keys are ignored', () => {
  expect(tabKeyTarget('Enter', 1, 4)).toBeNull();
  expect(tabKeyTarget('a', 1, 4)).toBeNull();
});
