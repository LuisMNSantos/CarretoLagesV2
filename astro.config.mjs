// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://carretolages-v2.pages.dev',
  output: 'static',
  trailingSlash: 'never',
  i18n: { defaultLocale: 'pt', locales: ['pt', 'en'], routing: { prefixDefaultLocale: false } },
  build: { format: 'file', inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
