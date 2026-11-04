export type Locale = 'pt' | 'en';
export const locales: readonly Locale[] = ['pt', 'en'];

/** Locale from a URL: English lives under /en, Portuguese at the root. */
export function getLocale(url: URL): Locale {
  return url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'pt';
}
