import { expect, test, type Page } from '@playwright/test';

test.describe('areas carousel', () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, 'JS behaviour');

  // The image no longer sets the height (it used to stretch the card to ~980px); the tallest
  // headline (four lines) does, and all cards share that height.
  test('desktop: every card has the same moderate height and fits in the viewport', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop layout only');
    await page.goto('/');
    const heights = await page.locator('[data-slide] > article').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(heights.length).toBe(4);
    for (const h of heights) {
      expect(h).toBeGreaterThanOrEqual(400);
      expect(h).toBeLessThanOrEqual(500);
    }
    expect(new Set(heights.map(Math.round)).size).toBe(1);
  });

  const counter = (p: Page) => p.locator('[data-carousel-counter]');
  // The fake clock follows real time until paused; freeze it once the page has loaded so
  // only the time the test runs on purpose counts.
  const open = async (p: Page) => {
    await p.clock.install({ time: new Date('2026-01-01T10:00:00') });
    await p.goto('/');
    await p.clock.pauseAt(new Date('2026-01-01T10:01:00'));
  };
  const showCarousel = async (p: Page) => {
    await p.locator('[data-carousel-track]').scrollIntoViewIfNeeded();
    await p.waitForTimeout(100); // let the IntersectionObserver report
  };

  test('advances by itself every 6 seconds and wraps back to the first card', async ({ page }) => {
    await open(page);
    await showCarousel(page);
    await expect(counter(page)).toHaveText('01 / 04');
    await page.clock.runFor(5_900);
    await expect(counter(page)).toHaveText('01 / 04');
    await page.clock.runFor(200);
    await expect(counter(page)).toHaveText('02 / 04');
    for (const label of ['03 / 04', '04 / 04', '01 / 04']) {
      await page.clock.runFor(6_000);
      await expect(counter(page)).toHaveText(label);
    }
  });

  test('keeps going while the pointer rests on a card', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'hover is a pointer thing');
    await open(page);
    await showCarousel(page);
    await page.locator('[data-slide] h3').first().hover();
    await page.clock.runFor(6_100);
    await expect(counter(page)).toHaveText('02 / 04');
  });

  test('an arrow click restarts the 6-second wait', async ({ page }) => {
    await open(page);
    await showCarousel(page);
    await page.clock.runFor(5_000);
    await page.locator('[data-carousel-next]').click();
    await expect(counter(page)).toHaveText('02 / 04');
    // The smooth scroll runs in real time; let it land before jumping the fake clock ahead.
    await expect.poll(() => page.locator('[data-carousel-track]').evaluate((t) => t.scrollLeft)).toBeGreaterThan(100);
    await page.waitForTimeout(300);
    await page.clock.runFor(5_000);
    await expect(counter(page)).toHaveText('02 / 04');
    await page.clock.runFor(1_100);
    await expect(counter(page)).toHaveText('03 / 04');
  });

  test('does not advance while the carousel is off-screen', async ({ page }) => {
    await open(page);
    await page.waitForTimeout(100);
    await page.clock.runFor(13_000);
    await expect(counter(page)).toHaveText('01 / 04');
  });

  test('does not advance for people who ask for reduced motion, and offers no pause button', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await showCarousel(page);
    await page.clock.runFor(13_000);
    await expect(counter(page)).toHaveText('01 / 04');
    await expect(page.locator('[data-carousel-toggle]')).toHaveCount(0);
  });

  test('a keyboard-only pause button stops and resumes the rotation', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard flow');
    await open(page);
    await showCarousel(page);
    const toggle = page.locator('[data-carousel-toggle]');
    // Invisible to mouse users until focused with the keyboard.
    expect((await toggle.boundingBox())!.width).toBeLessThanOrEqual(1);
    await expect(counter(page)).toHaveAttribute('aria-live', 'off');

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAttribute('aria-label', 'Retomar passagem automática');
    await expect(counter(page)).toHaveAttribute('aria-live', 'polite');
    await page.clock.runFor(13_000);
    await expect(counter(page)).toHaveText('01 / 04');

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.clock.runFor(6_100);
    await expect(counter(page)).toHaveText('02 / 04');
  });
});
