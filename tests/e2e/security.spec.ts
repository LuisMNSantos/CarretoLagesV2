import { expect, test } from '@playwright/test';
import { allRoutes } from '../../src/lib/all-routes';

// Runs against `npm run serve:headers` (PW_BASE_URL=http://localhost:4330), which applies public/_headers.
test.skip(!process.env.PW_BASE_URL, 'needs the header-aware server: PW_BASE_URL=http://localhost:4330');

const routes = allRoutes(true);

for (const r of routes) {
  test(`${r.path}: CSP enforced without violations, no cookies, no third-party requests`, async ({ page, context, baseURL }, info) => {
    test.skip(info.project.name === 'nojs', 'JS-enabled projects only');
    await page.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    const origin = new URL(baseURL!).host;
    const foreign: string[] = [];
    page.on('request', (req) => {
      const host = new URL(req.url()).host;
      if (host !== origin && !req.url().startsWith('data:')) foreign.push(req.url());
    });

    const res = await page.goto(r.path);
    expect(res?.headers()['content-security-policy']).toContain("default-src 'self'");
    expect(res?.headers()['x-content-type-options']).toBe('nosniff');
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((f) => setTimeout(f, 30)); } });
    await page.waitForLoadState('networkidle');

    expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([]);
    expect(errors.filter((e) => !e.includes('404'))).toEqual([]);
    expect(foreign).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });
}

test('the Google map may load only after the click, inside the frame-src allowance', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'once');
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(e.violatedDirective));
  });
  await page.goto('/contactos');
  await page.locator('[data-map-load]').first().click();
  await expect(page.locator('[data-map] iframe').first()).toHaveAttribute('src', /^https:\/\/www\.google\.com\/maps/);
  expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([]);
});

test('page cannot be framed by another origin', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(res.headers()['x-frame-options']).toBe('DENY');
});
