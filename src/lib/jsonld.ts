import type { Locale } from '../i18n/locale';
import { localizePath } from '../i18n/routes';
import { areas, offices, settings, tr, type Area, type Faq, type Lawyer } from './content';

export const SITE = 'https://www.carretolages.com';
const abs = (path: string) => new URL(path, SITE).href;
const FIRM = 'Carreto Lages & Associados';
const phone = settings.phoneHref.replace('tel:', '');

export function legalServiceLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: FIRM,
    url: abs(localizePath('home', locale)),
    telephone: phone,
    email: settings.email,
    foundingDate: String(settings.foundedYear),
    inLanguage: locale === 'pt' ? 'pt-PT' : 'en',
    knowsAbout: areas.map((a) => tr(a.title, locale)),
    department: offices.map((o) => ({
      '@type': 'LegalService',
      name: `${FIRM} — ${o.name}`,
      telephone: phone,
      address: { '@type': 'PostalAddress', addressLocality: o.name, addressCountry: 'PT' },
    })),
  };
}

export function personLd(lawyer: Lawyer, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: lawyer.name,
    jobTitle: tr(lawyer.role, locale),
    email: lawyer.email,
    url: abs(localizePath('lawyers', locale, lawyer.slug)),
    worksFor: { '@type': 'LegalService', name: FIRM, url: abs(localizePath('home', locale)) },
    knowsAbout: lawyer.areas.map((id) => areas.find((a) => a.id === id)).filter((a) => a !== undefined).map((a) => tr(a.title, locale)),
  };
}

export function faqLd(items: readonly Faq[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: tr(q.question, locale),
      acceptedAnswer: { '@type': 'Answer', text: tr(q.answer, locale) },
    })),
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

export function serviceLd(area: Area, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: tr(area.title, locale),
    description: tr(area.summary, locale),
    serviceType: tr(area.title, locale),
    areaServed: 'PT',
    provider: { '@type': 'LegalService', name: FIRM, url: abs(localizePath('home', locale)) },
  };
}
