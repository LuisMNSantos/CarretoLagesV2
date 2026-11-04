import { locales, type Locale } from '../i18n/locale';
import { localizePath, routeMap, type RouteKey } from '../i18n/routes';
import { areas, cases, insights, lawyers, visible } from './content';
import { designPreview } from './env';

export type BuiltRoute = {
  path: string;
  locale: Locale;
  key: RouteKey | '404';
  slug?: string;
  alternates: { pt?: string; en?: string };
};

type Sluggable = { slug: { pt: string; en?: string | undefined } | string; placeholder?: boolean | undefined; order: number };

const slugOf = (item: Sluggable, locale: Locale): string | undefined =>
  typeof item.slug === 'string' ? item.slug : item.slug[locale];

/** Every page the build produces (both locales). Single source for e2e, screenshots and the report. */
export function allRoutes(preview: boolean = designPreview): BuiltRoute[] {
  const out: BuiltRoute[] = [];
  const counts = {
    cases: { pt: visible(cases, 'pt', { preview }).length, en: visible(cases, 'en', { preview }).length },
    insights: { pt: visible(insights, 'pt', { preview }).length, en: visible(insights, 'en', { preview }).length },
  };

  for (const key of Object.keys(routeMap) as RouteKey[]) {
    if ((key === 'cases' || key === 'insights') && (counts[key].pt === 0 || counts[key].en === 0)) {
      for (const locale of locales) {
        if (counts[key][locale] > 0) out.push({ path: localizePath(key, locale), locale, key, alternates: { [locale]: localizePath(key, locale) } });
      }
      continue;
    }
    const alternates = { pt: localizePath(key, 'pt'), en: localizePath(key, 'en') };
    for (const locale of locales) out.push({ path: alternates[locale], locale, key, alternates });
  }

  const detail = (key: RouteKey, items: readonly Sluggable[]) => {
    const pt = new Set(visible(items, 'pt', { preview }));
    const en = new Set(visible(items, 'en', { preview }));
    for (const item of items) {
      const alternates: { pt?: string; en?: string } = {};
      const ptSlug = slugOf(item, 'pt');
      const enSlug = slugOf(item, 'en');
      if (pt.has(item) && ptSlug) alternates.pt = localizePath(key, 'pt', ptSlug);
      if (en.has(item) && enSlug) alternates.en = localizePath(key, 'en', enSlug);
      for (const locale of locales) {
        const path = alternates[locale];
        const slug = locale === 'pt' ? ptSlug : enSlug;
        if (path && slug) out.push({ path, locale, key, slug, alternates });
      }
    }
  };
  detail('areas', areas);
  detail('lawyers', lawyers);
  detail('cases', cases);
  detail('insights', insights);

  out.push({ path: '/404', locale: 'pt', key: '404', alternates: {} });
  out.push({ path: '/en/404', locale: 'en', key: '404', alternates: {} });
  return out;
}
