// Lighthouse (mobile preset, simulated 4G) on key pages. Expects a server on LH_BASE serving a build made
// with PUBLIC_NOINDEX=false (otherwise the preview's noindex lowers the SEO score by design).
import { mkdirSync, writeFileSync } from 'node:fs';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const base = process.env.LH_BASE ?? 'http://localhost:4321';
const pages = ['/', '/en', '/sociedade', '/areas-de-atuacao/direito-fiscal', '/advogados', '/advogados/catarina-pereira-carvalho', '/contactos'];
const chromePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const gates = { performance: 90, accessibility: 95, lcpMs: 2500, cls: 0.1 };
const RUNS = Number(process.env.LH_RUNS ?? 3);

// Warm the local server (first request after start-up is not representative of a CDN).
for (const p of pages) await fetch(`${base}${p}`).then((r) => r.arrayBuffer());

const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-first-run'] });
const rows = [];
try {
  for (const p of pages) {
    // Median of RUNS runs per page (Lighthouse guidance: single runs are noisy).
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const { lhr } = await lighthouse(`${base}${p}`, { port: chrome.port, output: 'json', logLevel: 'error' });
      const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
      runs.push({
        performance: score('performance'),
        accessibility: score('accessibility'),
        bestPractices: score('best-practices'),
        seo: score('seo'),
        lcpMs: Math.round(lhr.audits['largest-contentful-paint'].numericValue),
        cls: Number(lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
        tbtMs: Math.round(lhr.audits['total-blocking-time'].numericValue),
        fcpMs: Math.round(lhr.audits['first-contentful-paint'].numericValue),
      });
    }
    const median = (k) => runs.map((r) => r[k]).sort((a, b) => a - b)[Math.floor(runs.length / 2)];
    rows.push({ path: p, runs: runs.length, ...Object.fromEntries(Object.keys(runs[0]).map((k) => [k, median(k)])) });
    console.log(JSON.stringify(rows.at(-1)));
  }
} finally {
  await chrome.kill();
}
mkdirSync('reports/summary', { recursive: true });
writeFileSync('reports/summary/lighthouse.json', JSON.stringify({ date: new Date().toISOString(), gates, rows }, null, 2));
const failed = rows.filter((r) => r.performance < gates.performance || r.accessibility < gates.accessibility || r.lcpMs >= gates.lcpMs || r.cls >= gates.cls);
if (failed.length) {
  console.error('Lighthouse gates failed for:', failed.map((r) => r.path).join(', '));
  process.exit(1);
}
