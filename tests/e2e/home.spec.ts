import { expect, test } from './fixtures';

test('home sections appear in the approved order', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main section[aria-labelledby]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-labelledby')));
  expect(ids).toEqual(['hero-title', 'areas-title', 'situations-title', 'process-title', 'anniversary-title', 'team-title', 'cases-title', 'testimonials-title', 'faq-title', 'contact-title']);
});

test('no request to Google before the map is clicked; iframe after', async ({ page }) => {
  test.skip(test.info().project.name === 'nojs', 'click-to-load needs JS');
  const google: string[] = [];
  page.on('request', (r) => { if (/google\./.test(new URL(r.url()).hostname)) google.push(r.url()); });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');
  expect(google).toEqual([]);
  await page.locator('[data-map-load]').first().click();
  const iframe = page.locator('[data-map] iframe').first();
  await expect(iframe).toHaveAttribute('src', /google\.com\/maps/);
});

test('placeholder testimonials and cases carry the illustrative-example badge', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-section="testimonials"] [data-placeholder-badge]')).toHaveCount(3);
  await expect(page.locator('[data-section="cases"] [data-placeholder-badge]').first()).toContainText('Exemplo ilustrativo');
});

test('no cookies are set by the page', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');
  expect(await context.cookies()).toEqual([]);
});

test('partners appear with photos; the team link goes to the lawyers page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#team-title ~ * [data-lawyer], section[aria-labelledby="team-title"] [data-lawyer]')).toHaveCount(3);
  await expect(page.locator('section[aria-labelledby="team-title"] a', { hasText: 'Conhecer a equipa' })).toHaveAttribute('href', '/advogados');
});
