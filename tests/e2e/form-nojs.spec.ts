import { expect, test } from './fixtures';

test('without JavaScript the form points to phone and email and hides the submit button', async ({ page }, info) => {
  test.skip(info.project.name !== 'nojs', 'no-JS only');
  await page.goto('/');
  await expect(page.getByText('O formulário precisa de JavaScript. Pode contactar-nos por telefone ou email.').first()).toBeVisible();
  await expect(page.locator('[data-contact-form] [data-submit]').first()).toBeHidden();
});
