/** Build-time flags (see .env.example and .env.<plan>). Preview flags default to "on" so a bare build is a safe preview.
 *  Read from Vite (`import.meta.env`) in Astro/Vitest, and from process.env in plain Node (Playwright, scripts). */
type Env = {
  PUBLIC_DESIGN_PREVIEW?: string;
  PUBLIC_NOINDEX?: string;
  PUBLIC_PLAN?: string;
  PUBLIC_TURNSTILE_SITE_KEY?: string;
  PUBLIC_SANITY_PROJECT_ID?: string;
  PUBLIC_SANITY_DATASET?: string;
};
const viteEnv = (import.meta as ImportMeta & { env?: Env }).env;
const nodeEnv = (globalThis as { process?: { env?: Env } }).process?.env;
const read = (k: keyof Env) => viteEnv?.[k] ?? nodeEnv?.[k];

export const designPreview: boolean = read('PUBLIC_DESIGN_PREVIEW') !== 'false';
export const noindex: boolean = read('PUBLIC_NOINDEX') !== 'false';

/** Which budget variant this build is (docs/superpowers/specs/2026-11-07-tres-versoes-design.md). */
export type Plan = 'base' | 'formulario' | 'sanity';
const PLANS: readonly Plan[] = ['base', 'formulario', 'sanity'];
const rawPlan = read('PUBLIC_PLAN');
export const plan: Plan = PLANS.includes(rawPlan as Plan) ? (rawPlan as Plan) : 'formulario';
export const hasForm: boolean = plan !== 'base';

/** Cloudflare's always-pass test key is the fallback; the published form plans set a real key in .env.<plan>. */
export const turnstileSiteKey: string = read('PUBLIC_TURNSTILE_SITE_KEY') || '1x00000000000000000000AA';

/** sanity plan: where the content is read from at build time (public, non-secret values in .env.sanity). */
export const sanityProjectId: string = read('PUBLIC_SANITY_PROJECT_ID') ?? '';
export const sanityDataset: string = read('PUBLIC_SANITY_DATASET') || 'production';
