// Captures the evidence screenshots for docs/report/dominio/relatorio-dominio.tex from the CURRENT
// carretolages.com site (the old WordPress). Read-only: only GET requests, no logins, no forms.
// Pages known to carry injected spam are opened with JavaScript disabled.
// Usage: node scripts/domain-audit.mjs   (uses the installed Google Chrome, like the e2e tests)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'docs/report/dominio/screenshots';
mkdirSync(OUT, { recursive: true });
const BASE = 'https://www.carretolages.com';

/** @type {{ name: string; url: string; js?: boolean; height?: number; scrollY?: number; clipTop?: number; pretty?: boolean; mark?: string }[]} */
const shots = [
  { name: '01-home', url: `${BASE}/`, js: true },
  { name: '02-sitemap-posts', url: `${BASE}/wp-sitemap-posts-post-1.xml`, height: 680, clipTop: 106 },
  { name: '03-spam-photoshop', url: `${BASE}/photoshop-download-with-crack/`, height: 1250 },
  { name: '04-spam-rolex', url: `${BASE}/replica-rolex-gmt-master-ii-126711-two-tone-rose-gold-watch-from-bp-factory/`, height: 1250 },
  { name: '05-api-posts', url: `${BASE}/wp-json/wp/v2/posts?per_page=50&_fields=id,date,author,slug`, height: 380 },
  { name: '06-api-users', url: `${BASE}/wp-json/wp/v2/users?_fields=id,name,slug`, height: 160 },
  { name: '07-dir-uploads', url: `${BASE}/wp-content/uploads/`, height: 560 },
  { name: '08-dir-wp-includes', url: `${BASE}/wp-includes/`, height: 560 },
  { name: '09-readme', url: `${BASE}/readme.html`, height: 560 },
  { name: '10-wp-login', url: `${BASE}/wp-login.php`, height: 640 },
  { name: '11-demo-case', url: `${BASE}/cases/auto-accident/`, height: 900, scrollY: 560 },
  { name: '12-demo-post', url: `${BASE}/questions-you-should-ask-a-personal-injury-lawyer/`, height: 900, scrollY: 560 },
  { name: '13-safe-browsing', url: 'https://transparencyreport.google.com/safe-browsing/search?url=carretolages.com&hl=pt-PT', js: true, height: 820 },
  { name: '15-dead-partner-links', url: `${BASE}/`, js: true, mark: 'a[href*="cristina-lanca-advogada"], a[href*="jpalmslawfirm"]' },
];

// The host rate-limits bursts with HTTP 429 (also on CSS/images, which leaves pages unstyled), so pace the
// requests and retry a page until it loads with no 429 at all. `--only 03,06` re-captures a subset.
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'chrome' });
const log = [];
for (const s of shots.filter((x) => !only || only.some((o) => x.name.startsWith(o)))) {
  const own = s.url.startsWith(BASE);
  let done = false;
  for (let attempt = 1; attempt <= 4 && !done; attempt++) {
    if (own) await sleep(attempt === 1 ? 15_000 : 60_000);
    const ctx = await browser.newContext({ javaScriptEnabled: s.js ?? false, viewport: { width: 1280, height: s.height ?? 800 }, locale: 'pt-PT' });
    const page = await ctx.newPage();
    let throttled = 0;
    page.on('response', (r) => { if (r.status() === 429) throttled++; });
    try {
      const res = await page.goto(s.url, { waitUntil: 'load', timeout: 60_000 });
      await page.waitForTimeout(s.js ? 4000 : 800);
      if (throttled && attempt < 4) { console.log('429 ', s.name, `(${throttled}), retrying`); await ctx.close(); continue; }
      if (s.pretty !== false && s.url.includes('/wp-json/')) await page.locator('input[type=checkbox]').first().check().catch(() => {});
      if (s.mark) {
        // The partner logos sit in a hidden-until-animated carousel and the host often throttles the images,
        // so the capture annotates each marked link with its own href (stated in the report caption).
        await page.evaluate((sel) => {
          const links = [...document.querySelectorAll(sel)];
          for (const a of links) {
            for (let n = /** @type {HTMLElement | null} */ (a); n && n !== document.body; n = n.parentElement) {
              Object.assign(n.style, { opacity: '1', visibility: 'visible' });
            }
            const tag = document.createElement('div');
            tag.textContent = `ligação → ${a.getAttribute('href')}`;
            Object.assign(tag.style, { font: 'bold 18px sans-serif', color: '#d00', margin: '8px 0', whiteSpace: 'nowrap' });
            Object.assign(/** @type {HTMLElement} */ (a).style, { display: 'inline-block', outline: '4px solid #d00', outlineOffset: '4px', minWidth: '120px', minHeight: '40px' });
            a.prepend(tag);
          }
          links[0]?.scrollIntoView({ block: 'center' });
        }, s.mark);
      }
      if (s.scrollY) await page.evaluate((y) => window.scrollTo(0, y), s.scrollY);
      await page.waitForTimeout(300);
      // clipTop drops the XSLT deprecation banner Chrome draws over XML sitemaps.
      const vp = page.viewportSize();
      await page.screenshot({ path: `${OUT}/${s.name}.png`, ...(s.clipTop && vp ? { clip: { x: 0, y: s.clipTop, width: vp.width, height: vp.height - s.clipTop } } : {}) });
      log.push({ name: s.name, url: s.url, status: res?.status(), throttled });
      console.log('ok  ', s.name, res?.status(), throttled ? `(still ${throttled} x 429)` : '');
      done = true;
    } catch (e) {
      log.push({ name: s.name, url: s.url, error: String(e).slice(0, 200) });
      console.log('FAIL', s.name, String(e).slice(0, 120));
      done = true;
    }
    await ctx.close();
  }
}

await browser.close();
if (!only) writeFileSync('docs/report/dominio/audit-log.json', JSON.stringify({ capturedAt: new Date().toISOString(), shots: log }, null, 2));
