import { expect, test } from './fixtures';

// Client feedback round 3: missing header photos, image boxes resizing on mobile, left drawer menu.

for (const path of ['/sociedade', '/sociedade/perfil-e-valores', '/sociedade/pro-bono', '/en/the-firm/profile-and-values', '/en/the-firm/pro-bono']) {
  test(`${path}: the header photo card shows a photo`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'once');
    await page.goto(path);
    await expect(page.locator('[data-page-hero] .hero-card img')).toHaveCount(1);
  });
}

for (const path of ['/destaques', '/areas-de-atuacao', '/']) {
  test(`${path}: image boxes keep their aspect ratio (no growth when photos load)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile');
    await page.goto(path);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
    await page.waitForLoadState('networkidle');
    const bad = await page.evaluate(() =>
      Array.from(document.querySelectorAll('picture > img.img-tone'))
        .map((img) => img.parentElement!.parentElement as HTMLElement)
        .filter((box) => getComputedStyle(box).aspectRatio !== 'auto' && box.offsetParent !== null)
        .map((box) => {
          const [w, h] = getComputedStyle(box).aspectRatio.split('/').map((n) => parseFloat(n));
          const r = box.getBoundingClientRect();
          return { expected: Math.round(r.width * (h! / w!)), actual: Math.round(r.height) };
        })
        .filter((x) => Math.abs(x.expected - x.actual) > 2),
    );
    expect(bad).toEqual([]);
  });
}

test.describe('mobile menu drawer', () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, 'JS');

  test('opens from the left and leaves a strip of the site visible on the right', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile');
    await page.goto('/');
    await page.locator('[data-menu-open]').click();
    const dialog = page.locator('[data-mobile-menu]');
    await expect(dialog).toBeVisible();
    await dialog.evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished)));
    const box = await dialog.boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box!.x).toBe(0);
    const gap = vw - (box!.x + box!.width);
    expect(gap).toBeGreaterThanOrEqual(40);
    expect(gap).toBeLessThanOrEqual(80);
  });

  test('tapping the visible strip closes the drawer', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile');
    await page.goto('/');
    await page.locator('[data-menu-open]').click();
    await page.waitForTimeout(400);
    const vw = page.viewportSize()!.width;
    await page.mouse.click(vw - 12, 400);
    await expect(page.locator('[data-mobile-menu]')).toBeHidden();
  });
});
