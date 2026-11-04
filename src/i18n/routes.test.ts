import { describe, expect, test } from 'vitest';
import { alternatePath, getLocale, localizePath } from './routes';
import { getLocale as getLocaleFromModule } from './locale';

describe('localizePath', () => {
  test.each([
    ['home', 'pt', undefined, '/'],
    ['home', 'en', undefined, '/en'],
    ['firm', 'pt', undefined, '/sociedade'],
    ['firm', 'en', undefined, '/en/the-firm'],
    ['history', 'en', undefined, '/en/the-firm/history'],
    ['values', 'pt', undefined, '/sociedade/perfil-e-valores'],
    ['proBono', 'en', undefined, '/en/the-firm/pro-bono'],
    ['areas', 'en', 'tax-law', '/en/practice-areas/tax-law'],
    ['areas', 'pt', 'direito-fiscal', '/areas-de-atuacao/direito-fiscal'],
    ['lawyers', 'en', undefined, '/en/lawyers'],
    ['cases', 'en', 'x', '/en/case-studies/x'],
    ['insights', 'pt', undefined, '/destaques'],
    ['contact', 'en', undefined, '/en/contact'],
    ['thanks', 'pt', undefined, '/obrigado'],
    ['privacy', 'en', undefined, '/en/privacy-policy'],
    ['terms', 'pt', undefined, '/termos-e-condicoes'],
    ['disputes', 'en', undefined, '/en/dispute-resolution'],
    ['cookies', 'pt', undefined, '/cookies'],
  ] as const)('%s/%s/%s → %s', (key, locale, slug, expected) => {
    expect(localizePath(key, locale, slug)).toBe(expected);
  });
});

describe('alternatePath', () => {
  test('falls back to target home when the slug is missing', () => {
    expect(alternatePath('insights', 'en', { pt: 'artigo-x' })).toBe('/en');
  });
  test('maps slugged pages across locales', () => {
    expect(alternatePath('areas', 'pt', { pt: 'direito-fiscal', en: 'tax-law' })).toBe('/areas-de-atuacao/direito-fiscal');
  });
  test('maps non-slugged pages', () => {
    expect(alternatePath('contact', 'en')).toBe('/en/contact');
  });
});

describe('getLocale', () => {
  test.each([
    ['https://x/en/lawyers', 'en'],
    ['https://x/en', 'en'],
    ['https://x/', 'pt'],
    ['https://x/entidades', 'pt'],
  ] as const)('%s → %s', (url, locale) => {
    expect(getLocale(new URL(url))).toBe(locale);
    expect(getLocaleFromModule(new URL(url))).toBe(locale);
  });
});
