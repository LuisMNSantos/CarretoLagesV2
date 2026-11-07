import { expect, test } from './fixtures';

// Findings from the final whole-branch review. Each test reproduced the problem before the fix.

test.describe('without JavaScript on a desktop screen', () => {
  test.use({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  test.beforeEach(() => { test.skip(test.info().project.name !== 'nojs', 'no-JS project only'); });

  test('all four process steps show their text', async ({ page }) => {
    await page.goto('/en');
    const opacities = await page.locator('[data-step] .step-body').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities).toEqual(['1', '1', '1', '1']);
  });

  test('the areas carousel shows a usable scrollbar', async ({ page }) => {
    await page.goto('/en');
    const sw = await page.locator('[data-carousel-track]').evaluate((e) => getComputedStyle(e).scrollbarWidth);
    expect(sw).not.toBe('none');
  });
});

test.describe('without JavaScript on a phone', () => {
  test.beforeEach(() => { test.skip(test.info().project.name !== 'nojs', 'no-JS project only'); });

  test('a visible language switch exists and the dead Menu button is hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[hreflang="en"]:visible')).not.toHaveCount(0);
    await expect(page.locator('[data-menu-open]')).toBeHidden();
  });

  test('buttons that need JavaScript are hidden (submit, map, copy link)', async ({ page }) => {
    await page.goto('/contactos');
    await expect(page.locator('[data-submit]').first()).toBeHidden();
    await expect(page.locator('[data-map-load]').first()).toBeHidden();
    await page.goto('/destaques/recebi-uma-notificacao-das-financas');
    await expect(page.locator('[data-copy-link]')).toBeHidden();
  });
});

test.describe('with JavaScript', () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, 'JS behaviour');

  test('the thank-you page no longer claims sending is disabled (sending is real)', async ({ page }) => {
    await page.goto('/obrigado');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main').getByText('pré-visualização')).toHaveCount(0);
  });

  test('carousel slides are never hidden from assistive technology', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop');
    await page.goto('/');
    await expect(page.locator('[data-slide][aria-hidden="true"]')).toHaveCount(0);
    await expect(page.locator('[data-slide]').first()).toHaveAttribute('aria-roledescription', 'diapositivo');
  });

  test('Escape really closes the desktop sub-menu', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop nav');
    await page.goto('/');
    await page.locator('[data-sub-toggle]').click();
    await expect(page.locator('#sub-firm')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#sub-firm')).toBeHidden();
  });

  test('scroll padding keeps focused elements clear of the sticky bar', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'sticky bar is mobile');
    await page.goto('/');
    const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom));
    expect(pad).toBeGreaterThanOrEqual(56);
  });
});
