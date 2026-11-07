// Base plan (budget 2026-003): no contact form anywhere, direct contacts instead.
// Run against a base build only: `PUBLIC_PLAN=base npx playwright test tests/e2e/plan-base.spec.ts`.
import { expect, test } from './fixtures';
import { allRoutes } from '../../src/lib/all-routes';

test.skip(process.env.PUBLIC_PLAN !== 'base', 'base-plan build only');

test.beforeAll(async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html, 'the server must be serving a base build (stop any server reused from another plan)').toContain('data-plan="base"');
});

const FORM_WORDS = /formulário|contact form|\bthe form\b/i;

for (const r of allRoutes(true, 'base')) {
  test(`${r.path} has no form and never mentions one`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'route sweep runs once');
    await page.goto(r.path);
    await expect(page.locator('[data-contact-form]')).toHaveCount(0);
    expect(await page.locator('main').innerText()).not.toMatch(FORM_WORDS);
  });
}

test('the contact section offers email and phone links', async ({ page }) => {
  for (const path of ['/', '/en', '/contactos', '/en/contact']) {
    await page.goto(path);
    const section = page.locator('#contacto');
    await expect(section.locator('a[href^="mailto:"]').first(), path).toBeVisible();
    await expect(section.locator('a[href^="tel:"]').first(), path).toBeVisible();
  }
});

test('there is no thank-you page', async ({ request }) => {
  expect((await request.get('/obrigado')).status()).toBe(404);
  expect((await request.get('/en/thank-you')).status()).toBe(404);
});

test('nothing is loaded from Turnstile', async ({ page }) => {
  const hits: string[] = [];
  page.on('request', (r) => { if (r.url().includes('challenges.cloudflare.com')) hits.push(r.url()); });
  await page.goto('/contactos');
  await page.waitForLoadState('networkidle');
  expect(hits).toEqual([]);
});
