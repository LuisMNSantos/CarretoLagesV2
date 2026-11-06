import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { allRoutes } from '../src/lib/all-routes';

// public/_redirects: old WordPress addresses -> new pages (Cloudflare Pages format: "from to status").
const rules = readFileSync('public/_redirects', 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.trim().split(/\s+/));
const pages = new Set(allRoutes().map((r) => r.path));

describe('public/_redirects', () => {
  test('every rule is a permanent redirect between two site paths', () => {
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.length).toBeLessThanOrEqual(2000); // Pages limit for static rules
    for (const r of rules) {
      expect(r, r.join(' ')).toHaveLength(3);
      expect(r[2], r.join(' ')).toBe('301');
      expect(r[0]!.startsWith('/') && r[1]!.startsWith('/'), r.join(' ')).toBe(true);
    }
  });

  test('every destination is a page the build produces', () => {
    for (const [from, to] of rules) expect(pages.has(to!), `${from} -> ${to}`).toBe(true);
  });

  test('no rule hides a real page and no source is listed twice', () => {
    const sources = rules.map((r) => r[0]!);
    expect(new Set(sources).size).toBe(sources.length);
    for (const s of sources) expect(pages.has(s.replace(/\/$/, '') || '/'), s).toBe(false);
  });

  test('each old address works with and without the trailing slash', () => {
    const sources = new Set(rules.map((r) => r[0]!));
    for (const s of sources) expect(sources.has(s.endsWith('/') ? s.slice(0, -1) : `${s}/`), s).toBe(true);
  });

  test('the injected spam posts are not redirected (they must return 404)', () => {
    for (const r of rules) expect(r[0], r.join(' ')).not.toMatch(/crack|replica|rolex/);
  });
});
