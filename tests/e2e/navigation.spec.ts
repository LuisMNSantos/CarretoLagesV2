import { expect, test } from './fixtures';

test.describe('with JavaScript', () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, 'JS behaviour');

  test('mobile menu opens, Escape closes it and focus returns to the toggle', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile menu');
    await page.goto('/');
    const toggle = page.locator('[data-menu-open]');
    await toggle.click();
    const dialog = page.locator('[data-mobile-menu]');
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('header switches to the solid state after scrolling', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('[data-site-header]');
    await expect(header).toHaveAttribute('data-scrolled', 'false');
    await page.mouse.wheel(0, 600);
    await expect(header).toHaveAttribute('data-scrolled', 'true');
  });

  test('desktop sub-menu opens with its toggle and closes on Escape', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop nav');
    await page.goto('/');
    const btn = page.locator('[data-sub-toggle]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#sub-firm')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('language switch on the home page goes to the English home', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop header switch');
    await page.goto('/');
    await page.locator('[data-site-header] [data-lang-link="en"]').click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test('without JavaScript every main destination is reachable from the footer', async ({ page }) => {
  await page.goto('/');
  const footerLinks = await page.locator('footer a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const href of ['/sociedade', '/sociedade/historia', '/sociedade/perfil-e-valores', '/sociedade/pro-bono', '/areas-de-atuacao', '/advogados', '/contactos', '/politica-de-privacidade']) {
    expect(footerLinks, href).toContain(href);
  }
});
