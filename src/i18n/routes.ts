import type { Locale } from './locale';
export { getLocale } from './locale';
export type { Locale } from './locale';

export type RouteKey =
  | 'home' | 'firm' | 'history' | 'values' | 'proBono'
  | 'areas' | 'lawyers' | 'cases' | 'insights'
  | 'contact' | 'thanks' | 'privacy' | 'terms' | 'disputes' | 'cookies';

/** Single source of truth for page paths (plan: "Routes"). */
export const routeMap: Record<RouteKey, Record<Locale, string>> = {
  home: { pt: '/', en: '/en' },
  firm: { pt: '/sociedade', en: '/en/the-firm' },
  history: { pt: '/sociedade/historia', en: '/en/the-firm/history' },
  values: { pt: '/sociedade/perfil-e-valores', en: '/en/the-firm/profile-and-values' },
  proBono: { pt: '/sociedade/pro-bono', en: '/en/the-firm/pro-bono' },
  areas: { pt: '/areas-de-atuacao', en: '/en/practice-areas' },
  lawyers: { pt: '/advogados', en: '/en/lawyers' },
  cases: { pt: '/casos', en: '/en/case-studies' },
  insights: { pt: '/destaques', en: '/en/insights' },
  contact: { pt: '/contactos', en: '/en/contact' },
  thanks: { pt: '/obrigado', en: '/en/thank-you' },
  privacy: { pt: '/politica-de-privacidade', en: '/en/privacy-policy' },
  terms: { pt: '/termos-e-condicoes', en: '/en/terms-and-conditions' },
  disputes: { pt: '/resolucao-de-litigios', en: '/en/dispute-resolution' },
  cookies: { pt: '/cookies', en: '/en/cookies' },
};

export function localizePath(key: RouteKey, locale: Locale, slug?: string): string {
  const base = routeMap[key][locale];
  return slug ? `${base}/${slug}` : base;
}

/** Path of the same page in `target`; a slugged page without a target slug falls back to the target home. */
export function alternatePath(key: RouteKey, target: Locale, slugs?: { pt?: string | undefined; en?: string | undefined }): string {
  if (!slugs) return localizePath(key, target);
  const slug = slugs[target];
  return slug ? localizePath(key, target, slug) : localizePath('home', target);
}
