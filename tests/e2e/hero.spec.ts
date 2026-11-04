import { expect, test } from '@playwright/test';

test.describe('hero background video', () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, 'video is JS-enhanced');

  test('video is requested only after load and becomes visible', async ({ page }) => {
    const videoRequests: { url: string; afterLoad: boolean }[] = [];
    let loaded = false;
    page.on('load', () => { loaded = true; });
    page.on('request', (r) => { if (r.url().includes('/video/')) videoRequests.push({ url: r.url(), afterLoad: loaded }); });
    await page.goto('/');
    await expect(page.locator('[data-hero]')).toHaveAttribute('data-video', 'playing', { timeout: 15_000 });
    expect(videoRequests.length).toBeGreaterThan(0);
    expect(videoRequests.every((r) => r.afterLoad)).toBe(true);
  });

  test('picks the variant that matches the screen', async ({ page }, info) => {
    const urls: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/video/')) urls.push(r.url()); });
    await page.goto('/');
    await expect(page.locator('[data-hero]')).toHaveAttribute('data-video', 'playing', { timeout: 15_000 });
    const expected = info.project.name === 'mobile' ? 'hero-mobile' : 'hero-desktop';
    expect(urls.some((u) => u.includes(expected))).toBe(true);
  });

  test('reduced motion: no video is downloaded', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const urls: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/video/')) urls.push(r.url()); });
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    expect(urls).toEqual([]);
    await expect(page.locator('[data-hero-poster]')).toBeVisible();
    await expect(page.locator('video[data-hero-video]')).toHaveCount(0);
    await ctx.close();
  });

  test('failed video keeps the poster and throws no page error', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (e) => errors.push(e));
    await page.route('**/video/**', (route) => route.abort());
    await page.goto('/');
    await expect(page.locator('[data-hero]')).toHaveAttribute('data-video', 'failed', { timeout: 10_000 });
    await expect(page.locator('[data-hero-poster]')).toBeVisible();
    await expect(page.locator('#hero-title')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('pause button toggles playback and aria-pressed', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('[data-hero]');
    await expect(hero).toHaveAttribute('data-video', 'playing', { timeout: 15_000 });
    const btn = page.locator('[data-hero-toggle]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(await page.locator('video[data-hero-video]').evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(await page.locator('video[data-hero-video]').evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  });

  test('LCP is the hero (poster or heading) and poster files weigh at most 100 KB', async ({ page }) => {
    const sizes = new Map<string, number>();
    page.on('response', async (r) => {
      if (r.request().resourceType() === 'image' && r.url().includes('/_astro/hero-poster')) {
        sizes.set(r.url(), (await r.body()).length);
      }
    });
    await page.goto('/');
    const lcp = await page.evaluate(() => new Promise<{ inHero: boolean; time: number }>((resolve) => {
      new PerformanceObserver((list) => {
        const e = list.getEntries().at(-1) as PerformanceEntry & { element?: Element };
        resolve({ inHero: Boolean(e?.element?.closest('[data-hero]')), time: e?.startTime ?? Infinity });
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    }));
    expect(lcp.inHero).toBe(true);
    // LCP timing is gated by Lighthouse (Task 13); wall-clock timing is unreliable under parallel e2e load.
    expect(sizes.size).toBeGreaterThan(0);
    for (const [url, size] of sizes) expect(size, url).toBeLessThanOrEqual(100 * 1024);
  });
});

test('hero heading and CTA are visible without JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hero-title')).toContainText('Decisões importantes.');
  await expect(page.locator('[data-hero]').getByRole('link', { name: /Marcar uma conversa/ })).toBeVisible();
});
