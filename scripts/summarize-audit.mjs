// Summarises `npm audit --json` into reports/summary/audit.json and fails on moderate+ vulnerabilities.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

let raw;
try { raw = execSync('npm audit --json', { encoding: 'utf8' }); } catch (e) { raw = e.stdout; }
const audit = JSON.parse(raw);
const v = audit.metadata?.vulnerabilities ?? {};
const summary = {
  date: new Date().toISOString(),
  dependencies: audit.metadata?.dependencies ?? null,
  vulnerabilities: { info: v.info ?? 0, low: v.low ?? 0, moderate: v.moderate ?? 0, high: v.high ?? 0, critical: v.critical ?? 0 },
};
mkdirSync('reports/summary', { recursive: true });
writeFileSync('reports/summary/audit.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.vulnerabilities));
if (summary.vulnerabilities.moderate + summary.vulnerabilities.high + summary.vulnerabilities.critical > 0) process.exit(1);
