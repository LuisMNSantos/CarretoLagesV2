import { mkdirSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { allRoutes } from '../../src/lib/all-routes';

const results: { path: string; viewport: string; violations: { id: string; impact: string | null | undefined; nodes: number }[] }[] = [];

test.afterAll(({}, info) => {
  mkdirSync('reports/summary', { recursive: true });
  writeFileSync(`reports/summary/axe-${info.project.name}.json`, JSON.stringify(results, null, 2));
});

for (const r of allRoutes(true)) {
  test(`axe: ${r.path}`, async ({ page }, info) => {
    test.skip(info.project.name === 'nojs', 'JS projects');
    await page.goto(r.path);
    await page.waitForLoadState('networkidle');
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const violations = res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    results.push({ path: r.path, viewport: info.project.name, violations });
    const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  });
}
