import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { allRoutes } from '../../src/lib/all-routes';

const routes = allRoutes(true);
const PT_ONLY = /\b(Advogados|Contactos|Sociedade|Marcar uma conversa|Áreas de atuação)\b/;

test.describe.configure({ mode: 'parallel' });

for (const r of routes) {
  test(`${r.path} renders correctly`, async ({ page, request }, info) => {
    test.skip(info.project.name !== 'desktop', 'route sweep runs once');
    if (r.key === '404') {
      expect(existsSync(`dist${r.path}.html`)).toBe(true);
    }
    const res = await page.goto(r.path);
    if (r.key !== '404') expect(res?.status(), r.path).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', r.locale === 'pt' ? 'pt-PT' : 'en');
    expect((await page.title()).length).toBeGreaterThan(5);
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();

    for (const href of await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => new URL((l as HTMLLinkElement).href).pathname))) {
      const alt = await request.get(href);
      expect(alt.status(), `${r.path} → hreflang ${href}`).toBe(200);
    }

    if (r.locale === 'en') {
      const text = await page.locator('body').evaluate((b) => {
        const clone = b.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.lang-switch, [lang="pt-PT"]').forEach((n) => n.remove());
        // Proper nouns (the firm's legal name, the Bar Association) stay in Portuguese.
        return clone.innerText.replaceAll('Sociedade de Advogados', '').replaceAll('Ordem dos Advogados', '');
      });
      expect(text, `Portuguese UI text on ${r.path}`).not.toMatch(PT_ONLY);
    }
  });
}

test('language switch maps slugged pages and falls back to home', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop header switch');
  await page.goto('/areas-de-atuacao/direito-fiscal');
  await page.locator('[data-site-header] [data-lang-link="en"]').click();
  await expect(page).toHaveURL(/\/en\/practice-areas\/tax-law$/);
});
