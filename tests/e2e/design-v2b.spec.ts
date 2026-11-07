import { expect, test } from './fixtures';
import { allRoutes } from '../../src/lib/all-routes';

// Second design round (client feedback): hero legibility, hidden pause button, compact mobile CTAs,
// image-led headers on secondary pages, names/roles inside the lawyer photos.

test.describe('with JavaScript', () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, 'JS behaviour');

  test('the pause button is invisible until reached with the keyboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-hero]')).toHaveAttribute('data-video', 'playing', { timeout: 15_000 });
    const btn = page.locator('[data-hero-toggle]');
    const before = await btn.boundingBox();
    expect((before?.width ?? 0) <= 1 && (before?.height ?? 0) <= 1).toBe(true);
    await btn.focus();
    const after = await btn.boundingBox();
    expect(after?.width ?? 0).toBeGreaterThanOrEqual(40);
  });

  test('mobile call/contact buttons are compact, not a full-width bar', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile only');
    await page.goto('/');
    const box = await page.locator('[data-sticky-cta]').boundingBox();
    expect(box?.width ?? 999).toBeLessThan(160);
    expect(box?.height ?? 999).toBeLessThanOrEqual(60);
  });
});

test('hero text on the phone sits on a dark enough veil (text shadow present)', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile only');
  await page.goto('/');
  const shadow = await page.locator('#hero-title').evaluate((e) => getComputedStyle(e).textShadow);
  expect(shadow).not.toBe('none');
});

const secondary = allRoutes(true).filter((r) => !['home', 'thanks', '404'].includes(r.key));
for (const r of secondary) {
  test(`${r.path}: image-led page header`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'once');
    await page.goto(r.path);
    const hero = page.locator('[data-page-hero]');
    await expect(hero).toHaveCount(1);
    await expect(hero).toHaveAttribute('data-variant', /^(banner|feature)$/);
    await expect(page.locator('[data-site-header]')).toHaveAttribute('data-variant', 'overlay');
    await expect(hero.locator('h1')).toHaveCount(1);
  });
}

test('lawyer name and role are written inside the photo', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'once');
  await page.goto('/advogados');
  const card = page.locator('[data-lawyer="jose-carreto-lages"]');
  const media = card.locator('[data-lawyer-media]');
  await expect(media).toContainText('José Carreto Lages');
  await expect(media).toContainText('Sócio Fundador');
  await expect(page.locator('[data-lawyer="adriana-silva"] [data-lawyer-media]')).toContainText('Adriana Silva');
});

test('page headers run edge to edge from the top (no white margins)', async ({ page }, info) => {
  test.skip(info.project.name === 'nojs', 'layout');
  for (const path of ['/areas-de-atuacao', '/sociedade/historia']) {
    await page.goto(path);
    const box = await page.locator('[data-page-hero] [data-hero-panel]').boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box!.x, path).toBe(0);
    expect(box!.y, path).toBe(0);
    expect(Math.round(box!.width), path).toBe(vw);
  }
});

test('feature headers carry the vertical label and the offset bronze frame', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop layout');
  await page.goto('/sociedade');
  await expect(page.locator('[data-page-hero] [data-hero-label]')).toHaveText(/Sociedade/i);
  await expect(page.locator('[data-page-hero] [data-hero-frame]')).toBeVisible();
  await expect(page.locator('[data-page-hero] .watermark')).toHaveCount(0);
});

test('home has a 20th-anniversary section with the trophy photo', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('section[aria-labelledby="anniversary-title"]');
  await expect(section).toHaveCount(1);
  await expect(section.locator('img[src*="trofeu"]')).toHaveCount(1);
  await expect(section.locator('img[src*="trofeu"]')).toHaveAttribute('alt', /20/);
  await expect(section.getByRole('link', { name: /História/ })).toHaveAttribute('href', '/sociedade/historia');
});

test('the history page shows the trophy in its header', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'once');
  await page.goto('/en/the-firm/history');
  await expect(page.locator('[data-page-hero] img[src*="trofeu"]')).toHaveCount(1);
});
