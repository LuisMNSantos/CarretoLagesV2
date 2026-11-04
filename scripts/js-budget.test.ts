import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, test } from 'vitest';

const BUDGET = 51_200; // 50 KB gzip per page (spec: "Desempenho")

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });
}

test('every page ships less than 50 KB of gzipped JavaScript', () => {
  const rows: { page: string; bytes: number }[] = [];
  for (const file of htmlFiles('dist')) {
    const html = readFileSync(file, 'utf8');
    const scripts = [...html.matchAll(/<script[^>]+src="(\/_astro\/[^"]+\.js)"/g)].map((m) => m[1]!);
    // Follow static imports one level deep so shared chunks are counted.
    const seen = new Set<string>();
    const queue = [...scripts];
    while (queue.length) {
      const s = queue.shift()!;
      if (seen.has(s)) continue;
      seen.add(s);
      const code = readFileSync(join('dist', s), 'utf8');
      for (const m of code.matchAll(/from\s*"\.\/([^"]+\.js)"/g)) queue.push(`/_astro/${m[1]}`);
    }
    const bytes = [...seen].reduce((n, s) => n + gzipSync(readFileSync(join('dist', s))).length, 0);
    rows.push({ page: file.replaceAll('\\', '/').replace('dist', '').replace(/\.html$/, ''), bytes });
  }
  mkdirSync('reports/summary', { recursive: true });
  writeFileSync('reports/summary/js-budget.json', JSON.stringify(rows.sort((a, b) => b.bytes - a.bytes), null, 2));
  expect(rows.length).toBeGreaterThan(50);
  for (const r of rows) expect(r.bytes, r.page).toBeLessThan(BUDGET);
});
