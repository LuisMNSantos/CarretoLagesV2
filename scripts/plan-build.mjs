// Per-plan build adjustments (docs/superpowers/specs/2026-11-07-tres-versoes-design.md).
// PUBLIC_PLAN picks the variant: base (no form), formulario (working form), sanity (form + CMS).
import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadEnv } from 'vite';
import { parseHeaders } from './headers-file.mjs';

export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
export const PLANS = ['base', 'formulario', 'sanity'];

/** The plan for this build: PUBLIC_PLAN from the environment, else from the `--mode` env file, else formulario. */
export function resolvePlan(argv, cwd) {
  const fromEnv = process.env.PUBLIC_PLAN;
  const i = argv.indexOf('--mode');
  const mode = i >= 0 && argv[i + 1] ? argv[i + 1] : 'production';
  const value = fromEnv ?? loadEnv(mode, cwd, 'PUBLIC_').PUBLIC_PLAN;
  return PLANS.includes(value) ? value : 'formulario';
}

/** Adds the Turnstile origin to script-src and frame-src for the plans that have the form. */
export function cspForPlan(csp, plan) {
  if (plan === 'base') return csp;
  return csp
    .split(';')
    .map((d) => {
      const t = d.trim();
      return t.startsWith('script-src ') || t.startsWith('frame-src ') ? `${d.replace(/\s+$/, '')} ${TURNSTILE_ORIGIN}` : d;
    })
    .join(';');
}

/** Pages that must not exist in the plan's output. */
export function pagesToDrop(plan) {
  return plan === 'base' ? ['obrigado.html', 'en/thank-you.html'] : [];
}

/** Astro integration: drops the plan's unused pages and rewrites the CSP in dist/_headers. */
export function planBuild(plan) {
  return {
    name: 'carretolages:plan-build',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        for (const page of pagesToDrop(plan)) await rm(join(out, page), { force: true });
        const file = join(out, '_headers');
        const text = await readFile(file, 'utf8');
        const csp = parseHeaders(text).find((r) => r.pattern === '/*')?.headers['Content-Security-Policy'];
        if (csp) await writeFile(file, text.replace(csp, cspForPlan(csp, plan)));
        logger.info(`plan "${plan}": dropped ${pagesToDrop(plan).length} page(s), CSP ${plan === 'base' ? 'unchanged' : 'with Turnstile'}`);
      },
    },
  };
}
