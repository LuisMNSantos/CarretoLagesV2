import type { Locale } from '../i18n/locale';
import { localizePath } from '../i18n/routes';
import { t } from '../i18n/ui';
import { tr, type Area, type Lawyer } from './content';
import { breadcrumbLd, personLd, serviceLd } from './jsonld';

/** Structured data for slugged detail pages. */
export function pageJsonLd(key: 'areas' | 'lawyers', item: Area | Lawyer, locale: Locale): object[] {
  const home = { name: t(locale, 'nav.home'), path: localizePath('home', locale) };
  if (key === 'areas') {
    const a = item as Area;
    const path = localizePath('areas', locale, tr(a.slug, locale));
    return [serviceLd(a, locale), breadcrumbLd([home, { name: t(locale, 'nav.areas'), path: localizePath('areas', locale) }, { name: tr(a.title, locale), path }])];
  }
  const l = item as Lawyer;
  return [personLd(l, locale), breadcrumbLd([home, { name: t(locale, 'nav.lawyers'), path: localizePath('lawyers', locale) }, { name: l.name, path: localizePath('lawyers', locale, l.slug) }])];
}
