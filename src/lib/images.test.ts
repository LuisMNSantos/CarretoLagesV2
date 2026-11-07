import { describe, expect, test } from 'vitest';
import { imageSource } from './images';

describe('imageSource', () => {
  test('a local id resolves to the bundled image metadata', () => {
    // In Astro this is ImageMetadata; under Vitest (no Astro image plugin) the import is the file URL.
    for (const [id, kind] of [['office-corridor', 'stock'], ['jose-carreto-lages', 'team']] as const) {
      const s = imageSource(id, kind);
      expect(Object.keys(s)).toEqual(['src']);
      expect(String((s.src as { src?: string }).src ?? s.src)).toMatch(new RegExp(id));
    }
  });

  test('a CMS image becomes a remote src with its dimensions', () => {
    const remote = { url: 'https://cdn.sanity.io/images/p/production/abc-1200x800.jpg', width: 1200, height: 800 };
    expect(imageSource(remote, 'stock')).toEqual({ src: remote.url, width: 1200, height: 800 });
  });

  test('an unknown local id fails loudly', () => {
    expect(() => imageSource('does-not-exist', 'stock')).toThrow(/Missing image/);
  });
});
