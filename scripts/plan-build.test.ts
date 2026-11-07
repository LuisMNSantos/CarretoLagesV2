import { existsSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, test } from 'vitest';
import { parseHeaders } from './headers-file.mjs';
import { assertTurnstileKey, cspForPlan, pagesToDrop, planBuild, readBuildEnv, resolvePlan } from './plan-build.mjs';

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

describe('assertTurnstileKey (a form plan never ships a form that always fails)', () => {
  test('a form plan with a Cloudflare test key or no key fails the build', () => {
    expect(() => assertTurnstileKey('formulario', '1x00000000000000000000AA', false)).toThrow(/Turnstile/);
    expect(() => assertTurnstileKey('sanity', undefined, false)).toThrow(/Turnstile/);
  });
  test('tests may opt in to the test key; base needs no key; a real key passes', () => {
    expect(() => assertTurnstileKey('formulario', '1x00000000000000000000AA', true)).not.toThrow();
    expect(() => assertTurnstileKey('base', undefined, false)).not.toThrow();
    expect(() => assertTurnstileKey('formulario', '0x4AAAAAAF3EQQQ2jSTc3Dul', false)).not.toThrow();
  });
  test('readBuildEnv reads the --mode file, and the environment wins', () => {
    const saved = process.env.PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.PUBLIC_TURNSTILE_SITE_KEY;
    expect(readBuildEnv(['astro', 'build', '--mode', 'formulario'], process.cwd()).PUBLIC_TURNSTILE_SITE_KEY).toMatch(/^0x4/);
    process.env.PUBLIC_TURNSTILE_SITE_KEY = 'from-env';
    expect(readBuildEnv(['astro', 'build', '--mode', 'formulario'], process.cwd()).PUBLIC_TURNSTILE_SITE_KEY).toBe('from-env');
    if (saved === undefined) delete process.env.PUBLIC_TURNSTILE_SITE_KEY; else process.env.PUBLIC_TURNSTILE_SITE_KEY = saved;
  });
});

test('the key guard only stops builds, never dev, check or sync', () => {
  const setup = planBuild('formulario', undefined).hooks['astro:config:setup'] as (o: { command: string }) => void;
  for (const command of ['dev', 'sync', 'preview']) expect(() => setup({ command }), command).not.toThrow();
  expect(() => setup({ command: 'build' })).toThrow(/Turnstile/);
});
