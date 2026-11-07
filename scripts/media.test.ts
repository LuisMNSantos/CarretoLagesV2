import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';
import credits from '../src/content/image-credits.json';
import { areas, offices, pages, situations, steps, insights } from '../src/lib/content';

const require = createRequire(import.meta.url);
const ffprobe: string = require('ffprobe-static').path;
const MB = 1_000_000;
const budgets = { mobile: 2.5 * MB, tablet: 4 * MB, desktop: 8 * MB } as const;
const dims = { mobile: [720, 1280], tablet: [1280, 720], desktop: [1920, 1080] } as const;
const variants = Object.keys(budgets) as (keyof typeof budgets)[];

function probe(file: string) {
  const out = execFileSync(ffprobe, ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file]);
  return JSON.parse(out.toString()) as { streams: { codec_type: string; width?: number; height?: number }[]; format: { duration: string } };
}

describe('hero video variants', () => {
  for (const v of variants) {
    for (const ext of ['webm', 'mp4']) {
      const file = `public/video/hero-${v}.${ext}`;
      test(`${file} exists, within budget, no audio, 10–20 s, ${dims[v].join('x')}`, () => {
        expect(existsSync(file), `${file} missing — run npm run video`).toBe(true);
        expect(statSync(file).size).toBeLessThanOrEqual(budgets[v]);
        expect(statSync(file).size).toBeLessThan(25 * 1024 * 1024);
        const p = probe(file);
        expect(p.streams.filter((s) => s.codec_type === 'audio')).toHaveLength(0);
        const d = Number(p.format.duration);
        expect(d).toBeGreaterThanOrEqual(10);
        expect(d).toBeLessThanOrEqual(20);
        const video = p.streams.find((s) => s.codec_type === 'video');
        expect([video?.width, video?.height]).toEqual([...dims[v]]);
      });
    }
  }

  test('poster exists', () => {
    expect(existsSync('src/assets/hero-poster.jpg')).toBe(true);
  });
});

describe('stock images', () => {
  test('every credit has author, license and a downloaded file', () => {
    for (const c of credits) {
      expect(c.author, c.id).toBeTruthy();
      expect(c.license, c.id).toBe('Unsplash License');
      expect(c.url.startsWith('https://images.unsplash.com/'), c.id).toBe(true);
      expect(existsSync(`src/assets/stock/${c.id}.jpg`), c.id).toBe(true);
    }
  });

  test('every image referenced by content has a credit', () => {
    const ids = new Set(credits.map((c) => c.id));
    const used = [
      ...areas.map((a) => a.image), ...situations.map((s) => s.image), ...steps.map((s) => s.image),
      ...offices.map((o) => o.image), ...insights.map((i) => i.image),
      ...Object.values(pages).flatMap((p) => (p.image ? [p.image] : [])),
    ];
    // Credits cover the bundled stock photos; CMS images (sanity plan) are credited in the CMS.
    for (const u of used.filter((x): x is string => typeof x === "string")) expect(ids.has(u), u).toBe(true);
  });
});
