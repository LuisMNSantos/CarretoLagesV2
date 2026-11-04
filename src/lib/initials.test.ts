import { expect, test } from 'vitest';
import { initials } from './initials';

test.each([
  ['Diana Antão Seabra', 'DS'],
  ['Adriana Silva', 'AS'],
  ['Francisco Lopes', 'FL'],
  ['Madonna', 'M'],
  ['  sara   matos ', 'SM'],
  ['Ângela Ávila', 'ÂÁ'],
])('%s → %s', (name, expected) => {
  expect(initials(name)).toBe(expected);
});
