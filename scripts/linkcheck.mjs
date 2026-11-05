// Crawls the header-aware server (npm run serve:headers) and fails on any broken internal link.
import { mkdirSync, writeFileSync } from 'node:fs';
import { LinkChecker } from 'linkinator';

const base = process.env.LINK_BASE ?? 'http://localhost:4330/';
const checker = new LinkChecker();
const result = await checker.check({
  path: base,
  recurse: true,
  linksToSkip: ['^tel:', '^mailto:', 'google\\.com', 'unsplash\\.com', 'consumidor\\.gov\\.pt'],
  concurrency: 8,
  // Canonical/hreflang/OG URLs point at the future preview host; check them against the local build instead.
  urlRewriteExpressions: [{ pattern: /^https:\/\/carretolages\.pages\.dev/, replacement: base.replace(/\/$/, '') }],
});
const broken = result.links
  .filter((l) => l.state === 'BROKEN')
  .map((l) => ({ url: l.url, status: l.status, parent: l.parent }));
const summary = { checked: result.links.length, broken };
mkdirSync('reports/summary', { recursive: true });
writeFileSync('reports/summary/links.json', JSON.stringify(summary, null, 2));
console.log(`checked ${summary.checked} links, broken ${broken.length}`);
for (const b of broken) console.log(`  ${b.status} ${b.url}  (from ${b.parent})`);
process.exit(broken.length ? 1 : 0);
