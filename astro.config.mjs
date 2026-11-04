// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://carretolages-v2.pages.dev',
  output: 'static',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'pt', locales: { pt: 'pt-PT', en: 'en' } },
      filter: (page) => !/\/(404|obrigado|thank-you)$/.test(new URL(page).pathname),
    }),
  ],
  trailingSlash: 'never',
  i18n: { defaultLocale: 'pt', locales: ['pt', 'en'], routing: { prefixDefaultLocale: false } },
  build: { format: 'file', inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
