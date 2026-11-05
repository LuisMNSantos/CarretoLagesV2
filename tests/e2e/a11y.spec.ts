import { mkdirSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { allRoutes } from '../../src/lib/all-routes';

// One result file per page and viewport: parallel workers must not overwrite each other.
const DIR = 'reports/summary/axe';

for (const r of allRoutes(true)) {
  test(`axe: ${r.path}`, async ({ page }, info) => {
    test.skip(info.project.name === 'nojs', 'JS projects');
    await page.goto(r.path);
    await page.waitForLoadState('networkidle');
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const violations = res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    mkdirSync(DIR, { recursive: true });
    const name = `${info.project.name}${r.path.replace(/\//g, '_')}.json`;
    writeFileSync(`${DIR}/${name}`, JSON.stringify({ path: r.path, viewport: info.project.name, violations }));
    const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  });
}
