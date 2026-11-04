import type { Locale } from '../i18n/locale';
import { localizePath, type RouteKey } from '../i18n/routes';
import { t, type UiKey } from '../i18n/ui';

export type NavItem = { key: RouteKey; href: string; label: string; children?: NavItem[] };

const item = (key: RouteKey, label: UiKey, locale: Locale): NavItem => ({ key, href: localizePath(key, locale), label: t(locale, label) });

/** Main navigation. Case studies and insights disappear when they have no visible items (spec: coleções vazias). */
export function navItems(locale: Locale, counts: { cases: number; insights: number }): NavItem[] {
  const firm: NavItem = {
    ...item('firm', 'nav.firm', locale),
    children: [
      item('firm', 'nav.firmOverview', locale),
      item('history', 'nav.history', locale),
      item('values', 'nav.values', locale),
      item('proBono', 'nav.proBono', locale),
    ],
  };
  return [
    firm,
    item('areas', 'nav.areas', locale),
    item('lawyers', 'nav.lawyers', locale),
    ...(counts.cases > 0 ? [item('cases', 'nav.cases', locale)] : []),
    ...(counts.insights > 0 ? [item('insights', 'nav.insights', locale)] : []),
    item('contact', 'nav.contact', locale),
  ];
}
