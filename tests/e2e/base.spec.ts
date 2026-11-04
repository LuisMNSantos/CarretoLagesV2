import { expect, test } from '@playwright/test';

test('fonts are self-hosted (no Google Fonts requests)', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) external.push(r.url());
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(external).toEqual([]);
});

test('skip link is first focusable and moves focus to main content', async ({ page, browserName }, info) => {
  test.skip(info.project.name === 'nojs', 'focus handling checked with JS projects');
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.locator('a.skip-link');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#conteudo$/);
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  expect(focusedId).toBe('conteudo');
  void browserName;
});

test('preview build is noindex', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});

test('uses the DM Sans font for body text', async ({ page }) => {
  await page.goto('/');
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toMatch(/DM Sans/);
});
