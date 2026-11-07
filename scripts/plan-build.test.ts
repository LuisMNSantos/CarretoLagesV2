import { existsSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, test } from 'vitest';
import { parseHeaders } from './headers-file.mjs';
import { cspForPlan, pagesToDrop, resolvePlan } from './plan-build.mjs';

const publicCsp = parseHeaders(readFileSync('public/_headers', 'utf8')).find((r) => r.pattern === '/*')!.headers['Content-Security-Policy']!;
const envFile = (name: string) =>
  Object.fromEntries(
    readFileSync(name, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );

describe('cspForPlan', () => {
  test('form plans allow the Turnstile script and frame', () => {
    const csp = cspForPlan(publicCsp, 'formulario');
    expect(csp).toContain("script-src 'self' https://challenges.cloudflare.com");
    expect(csp).toContain('frame-src https://www.google.com https://challenges.cloudflare.com');
    expect(cspForPlan(publicCsp, 'sanity')).toBe(csp);
  });

  test('base keeps the strict CSP untouched', () => {
    expect(cspForPlan(publicCsp, 'base')).toBe(publicCsp);
  });
});

describe('pagesToDrop', () => {
  test('base drops the thank-you pages, other plans keep them', () => {
    expect(pagesToDrop('base')).toEqual(['obrigado.html', 'en/thank-you.html']);
    expect(pagesToDrop('sanity')).toEqual([]);
    expect(pagesToDrop('formulario')).toEqual([]);
  });
});

describe('resolvePlan', () => {
  const saved = process.env.PUBLIC_PLAN;
  afterEach(() => {
    if (saved === undefined) delete process.env.PUBLIC_PLAN;
    else process.env.PUBLIC_PLAN = saved;
  });

  test('reads the plan from the --mode env file', () => {
    delete process.env.PUBLIC_PLAN;
    expect(resolvePlan(['node', 'astro', 'build', '--mode', 'base'], process.cwd())).toBe('base');
  });

  test('defaults to formulario', () => {
    delete process.env.PUBLIC_PLAN;
    expect(resolvePlan(['node', 'astro', 'build'], process.cwd())).toBe('formulario');
  });

  test('PUBLIC_PLAN in the environment wins over the mode', () => {
    process.env.PUBLIC_PLAN = 'sanity';
    expect(resolvePlan(['node', 'astro', 'build', '--mode', 'base'], process.cwd())).toBe('sanity');
  });
});

describe('mode files', () => {
  test('each plan has its committed mode file', () => {
    for (const p of ['base', 'formulario', 'sanity']) {
      expect(existsSync(`.env.${p}`), p).toBe(true);
      expect(envFile(`.env.${p}`).PUBLIC_PLAN, p).toBe(p);
      expect(envFile(`.env.${p}`).PUBLIC_NOINDEX, p).toBe('true');
      expect(envFile(`.env.${p}`).PUBLIC_DESIGN_PREVIEW, p).toBe('true');
    }
  });

  test('form plans use a real Turnstile site key, not a Cloudflare test key', () => {
    for (const p of ['formulario', 'sanity']) {
      const key = envFile(`.env.${p}`).PUBLIC_TURNSTILE_SITE_KEY ?? '';
      expect(key, p).toMatch(/^0x[0-9A-Za-z_-]{20,}$/);
      expect(key, p).not.toMatch(/^[123]x0000/);
    }
    expect(envFile('.env.base').PUBLIC_TURNSTILE_SITE_KEY).toBeUndefined();
  });
});
