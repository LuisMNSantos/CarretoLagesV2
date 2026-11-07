// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { planBuild, resolvePlan } from './scripts/plan-build.mjs';

export default defineConfig({
  site: 'https://www.carretolages.com',
  output: 'static',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'pt', locales: { pt: 'pt-PT', en: 'en' } },
      filter: (page) => !/\/(404|obrigado|thank-you)$/.test(new URL(page).pathname),
    }),
    // Astro does not hand the --mode to the config, so the plan is resolved from argv + env files.
    planBuild(resolvePlan(process.argv, process.cwd())),
  ],
  trailingSlash: 'never',
  // sanity plan: CMS images are downloaded and optimised at build, so they are served from the site (CSP unchanged).
  image: { domains: ['cdn.sanity.io'] },
  i18n: { defaultLocale: 'pt', locales: ['pt', 'en'], routing: { prefixDefaultLocale: false } },
  build: { format: 'file', inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
