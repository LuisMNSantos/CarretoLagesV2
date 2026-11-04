import { describe, expect, test } from 'vitest';
import {
  areas, cases, faq, getCollectionCounts, insights, isTranslated, lawyers, offices, pages, pick,
  settings, situations, steps, testimonials, visible,
} from './content';

const item = (o: Partial<{ order: number; placeholder: boolean; en: boolean }>) => ({
  order: o.order ?? 1,
  ...(o.placeholder !== undefined ? { placeholder: o.placeholder } : {}),
  title: o.en === false ? { pt: 'Título' } : { pt: 'Título', en: 'Title' },
  nested: [{ text: { pt: 'a', en: 'b' } }],
});

describe('pick / isTranslated / visible', () => {
  test('pick returns the locale value or undefined', () => {
    expect(pick({ pt: 'Olá', en: 'Hello' }, 'en')).toBe('Hello');
    expect(pick({ pt: 'Olá' }, 'en')).toBeUndefined();
  });

  test('item missing EN is hidden in EN, shown in PT', () => {
    const list = [item({ en: false })];
    expect(visible(list, 'pt', { preview: true })).toHaveLength(1);
    expect(visible(list, 'en', { preview: true })).toHaveLength(0);
  });

  test('isTranslated walks nested arrays and objects', () => {
    expect(isTranslated({ a: [{ b: { pt: 'x' } }] }, 'en')).toBe(false);
    expect(isTranslated({ a: [{ b: { pt: 'x', en: 'y' } }] }, 'en')).toBe(true);
    expect(isTranslated({ a: [{ b: { pt: 'x' } }] }, 'pt')).toBe(true);
  });

  test('placeholders hidden when preview=false, shown when true', () => {
    const list = [item({ placeholder: true }), item({ order: 2 })];
    expect(visible(list, 'pt', { preview: false })).toHaveLength(1);
    expect(visible(list, 'pt', { preview: true })).toHaveLength(2);
  });

  test('visible() sorts by order', () => {
    const list = [item({ order: 3 }), item({ order: 1 }), item({ order: 2 })];
    expect(visible(list, 'pt', { preview: true }).map((i) => i.order)).toEqual([1, 2, 3]);
  });
});

describe('content files', () => {
  test('all collections parse and are non-empty', () => {
    for (const c of [areas, lawyers, situations, steps, faq, offices, cases, testimonials, insights]) {
      expect(c.length).toBeGreaterThan(0);
    }
    expect(settings.foundedYear).toBe(2002);
    expect(Object.keys(pages).sort()).toEqual(['cookies', 'disputes', 'firm', 'history', 'privacy', 'proBono', 'terms', 'values']);
  });

  test('the four areas with the expected PT/EN slugs', () => {
    expect(areas.map((a) => [a.slug.pt, a.slug.en])).toEqual([
      ['direito-penal', 'criminal-law'],
      ['direito-imobiliario', 'real-estate-law'],
      ['direito-fiscal', 'tax-law'],
      ['direito-financeiro', 'banking-and-finance-law'],
    ]);
  });

  test('every situation and case references an existing area', () => {
    const ids = new Set(areas.map((a) => a.id));
    for (const s of situations) expect(ids.has(s.area), s.id).toBe(true);
    for (const c of cases) expect(ids.has(c.area), c.id).toBe(true);
    for (const l of lawyers) for (const a of l.areas) expect(ids.has(a), l.id).toBe(true);
  });

  test('eight people; only the three partners have photos', () => {
    expect(lawyers).toHaveLength(8);
    expect(lawyers.filter((l) => l.photo).map((l) => l.slug).sort()).toEqual(
      ['catarina-pereira-carvalho', 'joao-carlos-lages', 'jose-carreto-lages'],
    );
  });

  test('everything is fully translated into English', () => {
    for (const c of [areas, lawyers, situations, steps, faq, offices, cases, testimonials, insights]) {
      for (const i of c) expect(isTranslated(i, 'en'), JSON.stringify(i).slice(0, 80)).toBe(true);
    }
    expect(isTranslated(settings, 'en')).toBe(true);
    for (const p of Object.values(pages)) expect(isTranslated(p, 'en'), p.id).toBe(true);
  });

  test('sample testimonials, cases and insights are placeholders', () => {
    for (const c of [cases, testimonials, insights]) for (const i of c) expect(i.placeholder, i.id).toBe(true);
  });

  test('four situations and four process steps', () => {
    expect(situations).toHaveLength(4);
    expect(steps.map((s) => s.title.pt)).toEqual(['Ouvir', 'Esclarecer', 'Agir', 'Acompanhar']);
  });

  test('collection counts honour preview flag', () => {
    expect(getCollectionCounts('pt', false)).toEqual({ cases: 0, testimonials: 0, insights: 0 });
    expect(getCollectionCounts('en', true).cases).toBe(cases.length);
  });
});
