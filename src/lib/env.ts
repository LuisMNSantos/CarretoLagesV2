/** Build-time flags (see .env.example). Both default to "on" so a bare build is a safe preview.
 *  Read from Vite (`import.meta.env`) in Astro/Vitest, and from process.env in plain Node (Playwright, scripts). */
type Env = { PUBLIC_DESIGN_PREVIEW?: string; PUBLIC_NOINDEX?: string };
const viteEnv = (import.meta as ImportMeta & { env?: Env }).env;
const nodeEnv = (globalThis as { process?: { env?: Env } }).process?.env;
const read = (k: keyof Env) => viteEnv?.[k] ?? nodeEnv?.[k];

export const designPreview: boolean = read('PUBLIC_DESIGN_PREVIEW') !== 'false';
export const noindex: boolean = read('PUBLIC_NOINDEX') !== 'false';
