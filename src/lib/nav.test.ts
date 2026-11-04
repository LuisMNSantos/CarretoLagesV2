import { expect, test } from 'vitest';
import { navItems } from './nav';

test('order and keys (PT, all collections present)', () => {
  expect(navItems('pt', { cases: 3, insights: 2 }).map((i) => i.key)).toEqual(
    ['firm', 'areas', 'lawyers', 'cases', 'insights', 'contact'],
  );
});

test('the firm item has four children in order', () => {
  const firm = navItems('pt', { cases: 1, insights: 1 })[0]!;
  expect(firm.children?.map((c) => c.href)).toEqual(['/sociedade', '/sociedade/historia', '/sociedade/perfil-e-valores', '/sociedade/pro-bono']);
});

test('empty collections are omitted', () => {
  const keys = navItems('pt', { cases: 0, insights: 2 }).map((i) => i.key);
  expect(keys).not.toContain('cases');
  expect(keys).toContain('insights');
  expect(navItems('en', { cases: 1, insights: 0 }).map((i) => i.key)).not.toContain('insights');
});

test('English hrefs and labels', () => {
  const items = navItems('en', { cases: 1, insights: 1 });
  expect(items.map((i) => i.href)).toEqual(['/en/the-firm', '/en/practice-areas', '/en/lawyers', '/en/case-studies', '/en/insights', '/en/contact']);
  expect(items.map((i) => i.label)).toEqual(['The Firm', 'Practice Areas', 'Lawyers', 'Case Studies', 'Insights', 'Contact']);
});
