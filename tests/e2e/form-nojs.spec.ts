import { expect, test } from '@playwright/test';

test('without JavaScript the form explains that sending is disabled', async ({ page }, info) => {
  test.skip(info.project.name !== 'nojs', 'no-JS only');
  await page.goto('/');
  await expect(page.getByText('Nesta versão de pré-visualização o formulário precisa de JavaScript')).toBeVisible();
});
