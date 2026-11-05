import { expect, test } from '@playwright/test';
import { allRoutes } from '../../src/lib/all-routes';

test.use({ viewport: { width: 360, height: 780 } });

for (const r of allRoutes(true)) {
  test(`360px: ${r.path} has no horizontal scroll or clipped labels`, async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'runs once, at 360 px');
    await page.goto(r.path);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
    const clipped = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, a.btn, button'))
        .filter((el) => el.offsetParent !== null && el.clientWidth > 1 && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible')
        .map((el) => el.textContent?.trim().slice(0, 40)),
    );
    expect(clipped).toEqual([]);
  });
}
