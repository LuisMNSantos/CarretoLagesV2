import { describe, expect, test } from 'vitest';
import {
  areas, cases, faq, getCollectionCounts, insights, isTranslated, lawyers, offices, pages, pick,
  settings, situations, steps, testimonials, visible, blocksFor,
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

describe('blocksFor (plan-dependent copy)', () => {
  const blocks = [
    { type: 'p' as const, text: { pt: 'sempre' } },
    { type: 'p' as const, text: { pt: 'com formulário' }, when: 'form' as const },
    { type: 'p' as const, text: { pt: 'sem formulário' }, when: 'noForm' as const },
  ];
  test('with the form, keeps unconditional and form-only blocks', () => {
    expect(blocksFor(blocks, true).map((b) => b.type === 'p' && b.text.pt)).toEqual(['sempre', 'com formulário']);
  });
  test('without the form, keeps unconditional and noForm blocks', () => {
    expect(blocksFor(blocks, false).map((b) => b.type === 'p' && b.text.pt)).toEqual(['sempre', 'sem formulário']);
  });
  test('privacy and pro bono have a version of their form text for each plan', () => {
    for (const id of ['privacy', 'proBono'] as const) {
      const tags = pages[id].body.map((b) => b.when);
      expect(tags, id).toContain('form');
      expect(tags, id).toContain('noForm');
    }
  });

  test('the cookie policy names Turnstile only in the plans with the form', () => {
    const text = (hasForm: boolean) => JSON.stringify(blocksFor(pages.cookies.body, hasForm));
    expect(text(true)).toMatch(/Turnstile/);
    expect(text(true)).toMatch(/começa a preencher o formulário/);
    expect(text(false)).not.toMatch(/Turnstile|formulário/);
  });
});
