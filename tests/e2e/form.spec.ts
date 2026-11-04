import { expect, test, type Page } from '@playwright/test';

test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, 'JS-enhanced form; no-JS notice tested separately');

const form = (page: Page) => page.locator('[data-contact-form]').first();

test('empty submit shows inline errors and focuses the first invalid field', async ({ page }) => {
  await page.goto('/#contacto');
  await form(page).locator('[data-submit]').click();
  await expect(form(page).locator('.field-error:not([hidden])')).toHaveCount(4);
  await expect(form(page).locator('[name="nome"]')).toBeFocused();
  await expect(form(page).locator('[name="nome"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(form(page).locator('[data-form-summary]')).toBeVisible();
});

test('typed values persist after an error and the error clears on input', async ({ page }) => {
  await page.goto('/#contacto');
  const f = form(page);
  await f.locator('[name="nome"]').fill('Maria Silva');
  await f.locator('[name="email"]').fill('maria@');
  await f.locator('[data-submit]').click();
  await expect(f.locator('[name="nome"]')).toHaveValue('Maria Silva');
  await expect(f.locator('[data-error-for="email"]')).toBeVisible();
  await f.locator('[name="email"]').fill('maria@example.pt');
  await expect(f.locator('[data-error-for="email"]')).toBeHidden();
});

test('a valid submission goes to the thank-you page and sends nothing', async ({ page }) => {
  await page.goto('/#contacto');
  const f = form(page);
  const posts: string[] = [];
  page.on('request', (r) => { if (r.method() !== 'GET' || /maria%40example|Maria/.test(r.url())) posts.push(`${r.method()} ${r.url()}`); });
  await f.locator('[name="nome"]').fill('Maria Silva');
  await f.locator('[name="email"]').fill('maria@example.pt');
  await f.locator('[name="mensagem"]').fill('Preciso de ajuda com uma notificação das Finanças.');
  await f.locator('[name="consentimento"]').check();
  await page.waitForTimeout(3100);
  await f.locator('[data-submit]').click();
  await expect(page).toHaveURL(/\/obrigado$/);
  expect(posts).toEqual([]);
});

test('English form shows English errors', async ({ page }) => {
  await page.goto('/en#contacto');
  await form(page).locator('[data-submit]').click();
  await expect(form(page).locator('[data-error-for="nome"]')).toHaveText('Please enter your name (2 to 100 characters).');
});
