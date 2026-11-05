// Turns test summaries, the screenshot manifests and decisions.json into LaTeX fragments
// under docs/report/generated/ (included by docs/report/relatorio-v2.tex).
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { parseHeaders } from './headers-file.mjs';

const OUT = 'docs/report/generated';
mkdirSync(OUT, { recursive: true });
const read = (p, fallback = null) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);

const TEX_MAP = {
  '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', $: '\\$', '#': '\\#', _: '\\_',
  '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
};
// Escape LaTeX specials, then turn straight double quotes into typographic ones.
const tex = (s) => String(s ?? '')
  .replace(/[\\&%$#_{}~^]/g, (c) => TEX_MAP[c])
  .replace(/"([^"]*)"/g, "``$1''");
const kb = (n) => `${(n / 1024).toFixed(0)}\\,KB`;
const mb = (n) => `${(n / 1e6).toFixed(2)}\\,MB`;

// ---------- Screenshots ----------
const manifests = ['desktop', 'mobile'].flatMap((v) => read(`docs/report/screenshots/manifest-${v}.json`, []));
const order = (p) => (p === '/' || p === '/en' ? '' : p.replace(/^\/en/, ''));
const groups = new Map();
for (const s of manifests) {
  const key = `${s.kind}|${s.locale}|${s.kind === 'page' ? s.path : s.id}`;
  if (!groups.has(key)) groups.set(key, { kind: s.kind, locale: s.locale, path: s.path, id: s.id, title: s.title, desktop: [], mobile: [] });
  groups.get(key)[s.viewport].push(...s.slices);
}
const sorted = [...groups.values()].sort((a, b) =>
  a.kind.localeCompare(b.kind) || a.locale.localeCompare(b.locale) * -1 || order(a.path).localeCompare(order(b.path)) || a.id.localeCompare(b.id));

function figureRows(slices, perRow, width) {
  const rows = [];
  for (let i = 0; i < slices.length; i += perRow) {
    rows.push(slices.slice(i, i + perRow).map((f) => `\\includegraphics[width=${width}\\textwidth]{${f}}`).join('\\hspace{0.012\\textwidth}\n') + '\\par\\medskip');
  }
  return rows.join('\n');
}

let shotsTex = '';
let lastHeading = '';
for (const g of sorted) {
  const heading = g.kind === 'state'
    ? (g.locale === 'pt' ? 'Estados e interações — versão portuguesa' : 'Estados e interações — versão inglesa')
    : (g.locale === 'pt' ? 'Páginas — versão portuguesa' : 'Páginas — versão inglesa');
  if (heading !== lastHeading) {
    shotsTex += `\\clearpage\n\\section{${tex(heading)}}\n`;
    lastHeading = heading;
  }
  shotsTex += `\\needspace{8\\baselineskip}\n\\subsection*{${tex(g.title)}}\n\\addcontentsline{toc}{subsection}{${tex(g.title)} (\\texttt{${tex(g.path)}})}\n`;
  shotsTex += `\\noindent{\\small\\color{tintasuave}\\texttt{${tex(g.path)}}}\\par\\smallskip\n`;
  // States are single viewport captures: show them larger than the sliced full pages.
  const isState = g.kind === 'state';
  if (g.desktop.length) shotsTex += `\\noindent{\\footnotesize Computador (1440\\,px)}\\par\\smallskip\n\\noindent ${figureRows(g.desktop, isState ? 1 : 2, isState ? '0.9' : '0.485')}\n`;
  if (g.mobile.length) shotsTex += `\\noindent{\\footnotesize Telemóvel (390\\,px)}\\par\\smallskip\n\\noindent ${figureRows(g.mobile, isState ? 3 : 4, isState ? '0.3' : '0.235')}\n`;
  shotsTex += '\\bigskip\n';
}
writeFileSync(`${OUT}/screenshots.tex`, shotsTex);

const pageCount = sorted.filter((g) => g.kind === 'page').length;
const stateCount = sorted.filter((g) => g.kind === 'state').length;
const sliceCount = manifests.reduce((n, s) => n + s.slices.length, 0);

// ---------- Results ----------
const vitest = read('reports/summary/vitest.json', {});
const pw = read('reports/summary/playwright.json', { stats: {} });
const sec = read('reports/summary/playwright-security.json', { stats: {} });
const live = read('reports/summary/playwright-live.json', { stats: {} });
const axeDir = 'reports/summary/axe';
const axe = existsSync(axeDir) ? readdirSync(axeDir).map((f) => JSON.parse(readFileSync(`${axeDir}/${f}`, 'utf8'))) : [];
const links = read('reports/summary/links.json', { checked: 0, broken: [] });
const js = read('reports/summary/js-budget.json', []);
const lh = read('reports/summary/lighthouse.json', { rows: [] });
const audit = read('reports/summary/audit.json', { production: { counts: {} }, all: { counts: {}, packages: [] } });

const impactCount = {};
for (const r of axe) for (const v of r.violations) impactCount[v.impact ?? 'n/a'] = (impactCount[v.impact ?? 'n/a'] ?? 0) + 1;
const axeRules = {};
for (const r of axe) for (const v of r.violations) axeRules[v.id] = (axeRules[v.id] ?? 0) + 1;

const videoRows = readdirSync('public/video').sort().map((f) => `\\texttt{${tex(f)}} & ${mb(statSync(`public/video/${f}`).size)} \\\\`).join('\n');
const posterRows = readdirSync('dist/_astro').filter((f) => f.startsWith('hero-poster')).sort().map((f) => `\\texttt{${tex(f.replace(/\.[A-Za-z0-9_-]+\.(avif|webp|jpg)$/, '.$1'))}} & ${kb(statSync(`dist/_astro/${f}`).size)} \\\\`).join('\n');
const headers = parseHeaders(readFileSync('public/_headers', 'utf8')).find((r) => r.pattern === '/*').headers;
const headerRows = Object.entries(headers).filter(([k]) => k !== 'Content-Security-Policy').map(([k, v]) => `\\texttt{${tex(k)}} & \\texttt{${tex(v)}} \\\\`).join('\n');
const csp = headers['Content-Security-Policy'].split(';').map((d) => `\\item \\texttt{${tex(d.trim())}}`).join('\n');

const s = pw.stats ?? {};
const ss = sec.stats ?? {};
const results = `
\\newcommand{\\resPages}{${pageCount}}
\\newcommand{\\resStates}{${stateCount}}
\\newcommand{\\resSlices}{${sliceCount}}
\\newcommand{\\resUnitTotal}{${vitest.numTotalTests ?? '?'}}
\\newcommand{\\resUnitPassed}{${vitest.numPassedTests ?? '?'}}
\\newcommand{\\resUnitFiles}{${vitest.numTotalTestSuites ?? '?'}}
\\newcommand{\\resEtoePassed}{${s.expected ?? '?'}}
\\newcommand{\\resEtoeFailed}{${s.unexpected ?? '?'}}
\\newcommand{\\resEtoeSkipped}{${s.skipped ?? '?'}}
\\newcommand{\\resEtoeFlaky}{${s.flaky ?? 0}}
\\newcommand{\\resSecPassed}{${ss.expected ?? '?'}}
\\newcommand{\\resSecFailed}{${ss.unexpected ?? '?'}}
\\newcommand{\\resLivePassed}{${live.stats?.expected ?? '?'}}
\\newcommand{\\resLiveFailed}{${live.stats?.unexpected ?? '?'}}
\\newcommand{\\resAxeRuns}{${axe.length}}
\\newcommand{\\resAxeSerious}{${(impactCount.serious ?? 0) + (impactCount.critical ?? 0)}}
\\newcommand{\\resAxeOther}{${(impactCount.moderate ?? 0) + (impactCount.minor ?? 0)}}
\\newcommand{\\resLinksChecked}{${links.checked}}
\\newcommand{\\resLinksBroken}{${links.broken.length}}
\\newcommand{\\resJsMax}{${kb(Math.max(...js.map((r) => r.bytes), 0))}}
\\newcommand{\\resJsMin}{${kb(Math.min(...js.map((r) => r.bytes)))}}
\\newcommand{\\resJsPages}{${js.length}}
\\newcommand{\\resAuditProd}{${Object.values(audit.production.counts).reduce((a, b) => a + b, 0)}}
\\newcommand{\\resAuditDevModerate}{${audit.all.counts.moderate ?? 0}}
\\newcommand{\\resAuditDevPackages}{${tex(audit.all.packages.map((p) => p.name).join(', ') || '—')}}
\\newcommand{\\resAxeRules}{${tex(Object.entries(axeRules).map(([k, v]) => `${k} (${v})`).join(', ') || 'nenhuma')}}

\\newcommand{\\resLighthouseTable}{%
\\begin{tabular}{lrrrrrr}
\\toprule
\\textbf{Página} & \\textbf{Desemp.} & \\textbf{Acess.} & \\textbf{Boas pr.} & \\textbf{SEO} & \\textbf{LCP} & \\textbf{CLS} \\\\
\\midrule
${lh.rows.map((r) => `\\texttt{${tex(r.path)}} & ${r.performance} & ${r.accessibility} & ${r.bestPractices} & ${r.seo} & ${(r.lcpMs / 1000).toFixed(2)}\\,s & ${r.cls} \\\\`).join('\n')}
\\bottomrule
\\end{tabular}}

\\newcommand{\\resJsTable}{%
\\begin{tabular}{lr}
\\toprule
\\textbf{Página (as 8 mais pesadas)} & \\textbf{JS (gzip)} \\\\
\\midrule
${js.slice(0, 8).map((r) => `\\texttt{${tex(r.page)}} & ${kb(r.bytes)} \\\\`).join('\n')}
\\bottomrule
\\end{tabular}}

\\newcommand{\\resVideoTable}{%
\\begin{tabular}{lr}
\\toprule
\\textbf{Ficheiro} & \\textbf{Tamanho} \\\\
\\midrule
${videoRows}
\\bottomrule
\\end{tabular}}

\\newcommand{\\resPosterTable}{%
\\begin{tabular}{lr}
\\toprule
\\textbf{Imagem de capa (formatos e tamanhos gerados)} & \\textbf{Tamanho} \\\\
\\midrule
${posterRows}
\\bottomrule
\\end{tabular}}

\\newcommand{\\resHeadersTable}{%
\\begin{tabularx}{\\textwidth}{lX}
\\toprule
\\textbf{Cabeçalho} & \\textbf{Valor} \\\\
\\midrule
${headerRows}
\\bottomrule
\\end{tabularx}}

\\newcommand{\\resCspList}{%
\\begin{itemize}
${csp}
\\end{itemize}}
`;
writeFileSync(`${OUT}/results.tex`, results);

// ---------- Decisions ----------
const decisions = read('docs/report/decisions.json', []);
writeFileSync(`${OUT}/decisions.tex`, `\\begin{longtable}{p{3.2cm}p{6.4cm}p{5.4cm}}
\\toprule
\\textbf{Tema} & \\textbf{Decisão} & \\textbf{Porquê} \\\\
\\midrule
\\endhead
${decisions.map((d) => `${tex(d.area)} & ${tex(d.decision)} & ${tex(d.reason)} \\\\`).join('\n')}
\\bottomrule
\\end{longtable}
`);

// ---------- Image credits ----------
const credits = read('src/content/image-credits.json', []);
writeFileSync(`${OUT}/credits.tex`, `\\begin{longtable}{p{4cm}p{4cm}p{6.8cm}}
\\toprule
\\textbf{Imagem} & \\textbf{Autor} & \\textbf{Origem} \\\\
\\midrule
\\endhead
${credits.map((c) => `\\texttt{${tex(c.id)}} & ${tex(c.author)} & \\url{${c.page}} (${tex(c.license)}) \\\\`).join('\n')}
\\bottomrule
\\end{longtable}
`);

console.log(`report data: ${pageCount} pages, ${stateCount} states, ${sliceCount} slices, ${decisions.length} decisions`);
