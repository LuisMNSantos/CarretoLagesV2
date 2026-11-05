// Summarises `npm audit` into reports/summary/audit.json.
// Gate: production dependencies (what ships in dist/) must have no moderate+ vulnerabilities.
// Dev-only findings (test tooling run locally) are recorded for the report but do not fail the gate.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

function audit(args) {
  let raw;
  try { raw = execSync(`npm audit --json ${args}`, { encoding: 'utf8' }); } catch (e) { raw = e.stdout; }
  const a = JSON.parse(raw);
  const v = a.metadata?.vulnerabilities ?? {};
  return {
    counts: { info: v.info ?? 0, low: v.low ?? 0, moderate: v.moderate ?? 0, high: v.high ?? 0, critical: v.critical ?? 0 },
    packages: Object.entries(a.vulnerabilities ?? {}).map(([name, x]) => ({
      name,
      severity: x.severity,
      direct: x.isDirect,
      via: (x.via ?? []).map((y) => (typeof y === 'string' ? y : y.title)).join('; '),
    })),
  };
}

const production = audit('--omit=dev');
const all = audit('');
const summary = { date: new Date().toISOString(), production, all };
mkdirSync('reports/summary', { recursive: true });
writeFileSync('reports/summary/audit.json', JSON.stringify(summary, null, 2));
console.log(`production: ${JSON.stringify(production.counts)}  all (incl. dev tooling): ${JSON.stringify(all.counts)}`);
const p = production.counts;
if (p.moderate + p.high + p.critical > 0) process.exit(1);
