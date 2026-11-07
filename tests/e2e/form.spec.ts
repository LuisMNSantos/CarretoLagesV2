import { expect, test, type Page } from './fixtures';

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

const fillValid = async (page: Page) => {
  const f = form(page);
  await f.locator('[name="nome"]').fill('Maria Silva');
  await f.locator('[name="email"]').fill('maria@example.pt');
  await f.locator('[name="mensagem"]').fill('Preciso de ajuda com uma notificação das Finanças.');
  await f.locator('[name="consentimento"]').check();
  await page.waitForTimeout(3100); // minimum fill time
};
const posts = (page: Page) => {
  const list: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST') list.push(r.postData() ?? ''); });
  return list;
};

test('a valid submission posts once and goes to the thank-you page', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.fulfill({ json: { ok: true } }));
  const sent = posts(page);
  await page.goto('/#contacto');
  await fillValid(page);
  await form(page).locator('[data-submit]').click();
  await expect(page).toHaveURL(/\/obrigado$/);
  expect(sent).toHaveLength(1);
  expect(sent[0]).toContain('cf-turnstile-response');
  expect(sent[0]).toMatch(/name="locale"\r\n\r\npt\r\n/);
});

test('submits once while sending', async ({ page }) => {
  await page.route('**/api/contacto', async (r) => { await new Promise((ok) => setTimeout(ok, 1000)); await r.fulfill({ json: { ok: true } }); });
  const sent = posts(page);
  await page.goto('/#contacto');
  await fillValid(page);
  const button = form(page).locator('[data-submit]');
  await button.dblclick();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toContainText('A enviar…');
  await expect(page).toHaveURL(/\/obrigado$/);
  expect(sent).toHaveLength(1);
});

test('server rejection keeps the typed values and resets Turnstile', async ({ page }) => {
  await page.route('**/api/contacto', (r) => r.fulfill({ status: 422, json: { ok: false, errors: { email: 'Indique um email válido.' } } }));
  await page.goto('/#contacto');
  await fillValid(page);
  const f = form(page);
  await f.locator('[data-submit]').click();
  await expect(f.locator('[data-error-for="email"]')).toHaveText('Indique um email válido.');
  await expect(f.locator('[name="nome"]')).toHaveValue('Maria Silva');
  await expect(f.locator('[data-submit]')).not.toHaveAttribute('aria-busy', 'true');
  expect(await page.evaluate(() => (window as unknown as { __tsResets: number }).__tsResets)).toBe(1);
  await expect(page).toHaveURL(/\/#contacto$/);
});

test('send failure shows the fallback message', async ({ page }) => {
  let mode: 'error' | 'abort' = 'error';
  await page.route('**/api/contacto', (r) =>
    mode === 'abort' ? r.abort() : r.fulfill({ status: 502, json: { ok: false, errors: { form: 'Não foi possível enviar a mensagem. Tente de novo ou contacte-nos por telefone ou email.' } } }));
  await page.goto('/#contacto');
  await fillValid(page);
  const f = form(page);
  await f.locator('[data-submit]').click();
  await expect(f.locator('[data-form-summary]')).toContainText('telefone ou email');
  mode = 'abort';
  await f.locator('[data-submit]').click();
  await expect(f.locator('[data-form-summary]')).toContainText('telefone ou email');
  await expect(page).toHaveURL(/\/#contacto$/);
});

test('English form shows English errors', async ({ page }) => {
  await page.goto('/en#contacto');
  await form(page).locator('[data-submit]').click();
  await expect(form(page).locator('[data-error-for="nome"]')).toHaveText('Please enter your name (2 to 100 characters).');
});

test('with JavaScript the no-JS notice is not shown', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-nojs-notice]').first()).toBeHidden();
});

test('the area select chevron sits inside the field', async ({ page }) => {
  await page.goto('/#contacto');
  // Measure both boxes in one frame: smooth scrolling to #contacto would skew separate measurements.
  const inside = await form(page).locator('.select-wrap').evaluate((wrap) => {
    const s = wrap.querySelector('select')!.getBoundingClientRect();
    const i = wrap.querySelector('.select-icon')!.getBoundingClientRect();
    return i.top >= s.top && i.bottom <= s.bottom + 1 && i.right <= s.right + 1;
  });
  expect(inside).toBe(true);
});

test('the Turnstile widget is compact when the form is narrower than 300px', async ({ page }) => {
  for (const [width, size] of [[1440, 'flexible'], [360, 'compact']] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contactos');
    await form(page).locator('[name="nome"]').focus();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __tsSizes?: string[] }).__tsSizes ?? [])).toEqual([size]);
  }
});

test('Turnstile only takes space when it needs the visitor (no blank band above the button)', async ({ page }) => {
  await page.goto('/contactos');
  await form(page).locator('[name="nome"]').focus();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tsOpts?: { appearance?: string } }).__tsOpts?.appearance)).toBe('interaction-only');
});

test('Turnstile loads only once the visitor starts filling in the form (never on page load)', async ({ page }) => {
  const hits: string[] = [];
  page.on('request', (r) => { if (r.url().includes('challenges.cloudflare.com')) hits.push(r.url()); });
  await page.goto('/contactos');
  await page.waitForLoadState('networkidle');
  expect(hits).toEqual([]);
  await form(page).locator('[name="nome"]').focus();
  await expect.poll(() => hits.length).toBe(1);
});

test('without a Turnstile token nothing is posted and the visitor gets phone and email', async ({ page }) => {
  await page.addInitScript(() => { (window as unknown as { __tsNoToken: boolean }).__tsNoToken = true; });
  await page.route('**/api/contacto', (r) => r.fulfill({ json: { ok: true } }));
  const sent = posts(page);
  await page.goto('/#contacto');
  await fillValid(page);
  const f = form(page);
  await f.locator('[data-submit]').click();
  await expect(f.locator('[data-form-summary]')).toContainText('telefone ou email', { timeout: 15_000 });
  await expect(f.locator('[data-submit]')).toBeEnabled();
  expect(sent).toEqual([]);
});
