import { expect, test } from 'vitest';
import { chooseVideoVariant, type VideoEnv } from './hero-video';

const env = (o: Partial<VideoEnv>): VideoEnv => ({ width: 1440, height: 900, saveData: false, reducedMotion: false, ...o });

test.each([
  [env({ width: 390, height: 844 }), 'mobile'],
  [env({ width: 1024, height: 768 }), 'tablet'],
  [env({ width: 1440, height: 900 }), 'desktop'],
  [env({ width: 700, height: 500 }), 'tablet'],
  [env({ width: 820, height: 1180 }), 'tablet'],
  [env({ width: 1280, height: 800 }), 'desktop'],
] as const)('%o → %s', (e, expected) => {
  expect(chooseVideoVariant(e)).toBe(expected);
});

test('save-data disables the video', () => {
  expect(chooseVideoVariant(env({ saveData: true }))).toBeNull();
});

test('reduced motion disables the video', () => {
  expect(chooseVideoVariant(env({ reducedMotion: true }))).toBeNull();
});

test.each(['slow-2g', '2g', '3g'])('slow connection %s disables the video', (t) => {
  expect(chooseVideoVariant(env({ effectiveType: t }))).toBeNull();
});

test('4g keeps the video', () => {
  expect(chooseVideoVariant(env({ effectiveType: '4g' }))).toBe('desktop');
});
