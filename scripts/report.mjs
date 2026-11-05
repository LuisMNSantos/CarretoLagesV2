// Builds docs/report/relatorio-v2.pdf: regenerates the LaTeX fragments, then runs pdflatex twice.
// Run `npm run screens` first (needs the preview server) so the screenshots are current.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

execFileSync('node', ['scripts/report-data.mjs'], { stdio: 'inherit' });
const out = mkdtempSync(join(tmpdir(), 'relatorio-'));
for (let pass = 1; pass <= 2; pass++) {
  try {
    execFileSync('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', `-output-directory=${out}`, 'relatorio-v2.tex'], {
      cwd: 'docs/report',
      stdio: pass === 2 ? 'pipe' : 'ignore',
    });
  } catch (e) {
    console.error(`pdflatex failed on pass ${pass}; log: ${join(out, 'relatorio-v2.log')}`);
    process.exit(1);
  }
}
copyFileSync(join(out, 'relatorio-v2.pdf'), 'docs/report/relatorio-v2.pdf');
console.log(`docs/report/relatorio-v2.pdf written (build dir ${out})`);
