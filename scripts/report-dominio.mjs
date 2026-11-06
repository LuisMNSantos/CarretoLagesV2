// Builds docs/report/dominio/relatorio-dominio.pdf (pdflatex three times so the table of contents settles).
// Run `node scripts/domain-audit.mjs` first to refresh the screenshots of the old site.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// pdflatex reads aux files from the source folder before the output folder: drop stale ones an editor left there.
for (const ext of ['aux', 'toc', 'out', 'log']) rmSync(`docs/report/dominio/relatorio-dominio.${ext}`, { force: true });
const out = mkdtempSync(join(tmpdir(), 'relatorio-dominio-'));
for (let pass = 1; pass <= 3; pass++) {
  try {
    execFileSync('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', `-output-directory=${out}`, 'relatorio-dominio.tex'], {
      cwd: 'docs/report/dominio',
      stdio: 'ignore',
    });
  } catch {
    console.error(`pdflatex failed on pass ${pass}; log: ${join(out, 'relatorio-dominio.log')}`);
    process.exit(1);
  }
}
copyFileSync(join(out, 'relatorio-dominio.pdf'), 'docs/report/dominio/relatorio-dominio.pdf');
console.log(`docs/report/dominio/relatorio-dominio.pdf written (build dir ${out})`);
