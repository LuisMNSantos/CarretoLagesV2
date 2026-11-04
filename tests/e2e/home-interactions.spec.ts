import { expect, test } from '@playwright/test';

test.describe('with JavaScript', () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, 'JS behaviour');

  test('carousel next button advances the counter', async ({ page }) => {
    await page.goto('/');
    const counter = page.locator('[data-carousel-counter]');
    await expect(counter).toHaveText('01 / 04');
    await page.locator('[data-carousel-next]').click();
    await expect(counter).toHaveText('02 / 04');
    await page.locator('[data-carousel-prev]').click();
    await expect(counter).toHaveText('01 / 04');
  });

  test('situation tabs: ArrowRight moves focus and selection', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'tabs are the wide-screen pattern');
    await page.goto('/');
    const tabs = page.getByRole('tab');
    await tabs.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#sit-panel-comprar-casa')).toBeVisible();
    await expect(page.locator('#sit-panel-notificacao-penal')).toBeHidden();
    await page.keyboard.press('End');
    await expect(tabs.nth(3)).toBeFocused();
  });

  test('process: hovering a step makes it the active one', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'expanding cards are desktop-only');
    await page.goto('/');
    const steps = page.locator('[data-step]');
    await steps.nth(3).hover();
    await expect(steps.nth(3)).toHaveAttribute('data-active', 'true');
    await expect(steps.nth(1)).toHaveAttribute('data-active', 'false');
  });
});

test('without JavaScript all situations and all areas are present', async ({ page }, info) => {
  test.skip(info.project.name !== 'nojs', 'no-JS fallback');
  await page.goto('/');
  for (const prompt of ['Fui notificado num processo-crime.', 'Vou comprar, vender ou arrendar um imóvel.', 'Recebi uma carta das Finanças.', 'Tenho um problema com o banco ou com dívidas.']) {
    await expect(page.locator('details summary', { hasText: prompt })).toBeVisible();
  }
  for (const title of ['Direito Penal', 'Direito Imobiliário', 'Direito Fiscal', 'Direito Financeiro']) {
    await expect(page.locator('[data-slide]', { hasText: title })).toHaveCount(1);
  }
  await expect(page.locator('.carousel-controls')).toBeHidden();
});
