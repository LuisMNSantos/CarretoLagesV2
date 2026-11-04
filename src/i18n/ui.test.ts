import { expect, test } from 'vitest';
import { t, ui } from './ui';

const SAME_IN_BOTH = new Set(['brand.name', 'brand.suffix', 'contact.phoneDisplay', 'contact.email', 'nav.proBono', 'lang.pt', 'lang.en', 'form.emailLabel', 'nav.menu', 'legal.cookies']);

test('every PT key exists in EN and both are non-empty', () => {
  const pt = Object.keys(ui.pt).sort();
  const en = Object.keys(ui.en).sort();
  expect(en).toEqual(pt);
  for (const k of pt) {
    expect(ui.pt[k as keyof typeof ui.pt].trim(), k).not.toBe('');
    expect(ui.en[k as keyof typeof ui.en].trim(), k).not.toBe('');
  }
});

test('EN values differ from PT except the allow-list', () => {
  for (const k of Object.keys(ui.pt) as (keyof typeof ui.pt)[]) {
    if (SAME_IN_BOTH.has(k)) continue;
    expect(ui.en[k], k).not.toBe(ui.pt[k]);
  }
});

test('t() returns the localized string', () => {
  expect(t('pt', 'cta.book')).toBe('Marcar uma conversa');
  expect(t('en', 'cta.book')).toBe('Book a conversation');
});
