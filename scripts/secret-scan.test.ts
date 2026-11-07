import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const PATTERNS: [string, RegExp][] = [
  ['Resend API key', /\bre_[A-Za-z0-9_]{20,}/],
  ['generic sk- key', /\bsk-[A-Za-z0-9]{20,}/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Cloudflare token', /\bCF_API_TOKEN\s*=\s*\S{10,}/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Sanity token', /\bsk[A-Za-z0-9]{60,}\b/],
];
const BINARY = /\.(png|jpe?g|webp|avif|mp4|webm|pdf|woff2?|ico)$/i;

test('no secrets or .env files are tracked by git', () => {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  // Mode files (.env.live, .env.<plan>) may be committed only when they hold nothing but public build flags.
  const envFiles = files.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example'));
  const nonPublic = envFiles.flatMap((f) =>
    readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#') && !/^PUBLIC_[A-Z_]+=/.test(l)).map((l) => `${f}: ${l.split('=')[0]}`),
  );
  expect(nonPublic).toEqual([]);
  expect(envFiles.filter((f) => f === '.env' || f.endsWith('/.env'))).toEqual([]);
  const hits: string[] = [];
  for (const f of files) {
    if (BINARY.test(f) || f.endsWith('package-lock.json') || f === 'scripts/secret-scan.test.ts') continue;
    const text = readFileSync(f, 'utf8');
    for (const [name, re] of PATTERNS) if (re.test(text)) hits.push(`${f}: ${name}`);
  }
  expect(hits).toEqual([]);
});
