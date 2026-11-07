import { describe, expect, test } from 'vitest';
import { allRoutes } from './all-routes';
import { routeMap } from '../i18n/routes';

describe('allRoutes(preview=true)', () => {
  const routes = allRoutes(true);
  const paths = routes.map((r) => r.path);

  test('contains every static route in both locales', () => {
    for (const [key, byLocale] of Object.entries(routeMap)) {
      if (key === 'cases' || key === 'insights') continue; // listings exist only when non-empty (checked below)
      expect(paths, key).toContain(byLocale.pt);
      expect(paths, key).toContain(byLocale.en);
    }
  });

  test('4 area pages and 8 lawyer pages per locale', () => {
    for (const locale of ['pt', 'en'] as const) {
      expect(routes.filter((r) => r.key === 'areas' && r.locale === locale && r.slug)).toHaveLength(4);
      expect(routes.filter((r) => r.key === 'lawyers' && r.locale === locale && r.slug)).toHaveLength(8);
    }
  });

  test('placeholder cases and insights are included in preview', () => {
    expect(paths).toContain('/casos');
    expect(paths).toContain('/en/case-studies/acquittal-computer-fraud');
    expect(paths).toContain('/destaques/recebi-uma-notificacao-das-financas');
  });

  test('alternates are symmetric', () => {
    const byPath = new Map(routes.map((r) => [r.path, r]));
    for (const r of routes) {
      if (!r.alternates.pt || !r.alternates.en) continue;
      expect(r.alternates[r.locale], r.path).toBe(r.path);
      const other = r.locale === 'pt' ? r.alternates.en : r.alternates.pt;
      expect(byPath.get(other)?.alternates, r.path).toEqual(r.alternates);
    }
  });

  test('no duplicate paths; 404 pages listed', () => {
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('/404');
    expect(paths).toContain('/en/404');
  });
});

test('without preview, empty collections disappear', () => {
  const paths = allRoutes(false).map((r) => r.path);
  expect(paths).not.toContain('/casos');
  expect(paths).not.toContain('/en/insights');
  expect(paths.some((p) => p.startsWith('/destaques/'))).toBe(false);
});

test('the base plan has no thank-you page; the form plans do', () => {
  const keys = (p: 'base' | 'formulario' | 'sanity') => allRoutes(true, p).map((r) => r.key);
  expect(keys('base')).not.toContain('thanks');
  expect(keys('formulario')).toContain('thanks');
  expect(keys('sanity')).toContain('thanks');
});
