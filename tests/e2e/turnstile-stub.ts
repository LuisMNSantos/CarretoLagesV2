import type { Page } from '@playwright/test';

/** Replaces Cloudflare's Turnstile script (explicit-render API) with a deterministic stub: render() appends
 *  Cloudflare's documented dummy token and records the requested size; window.__tsResets counts reset() calls. */
export async function stubTurnstile(page: Page): Promise<void> {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `
        window.__tsResets = 0;
        window.__tsSizes = [];
        window.turnstile = {
          render(el, opts) {
            window.__tsSizes.push(opts.size);
            window.__tsOpts = opts;
            const i = document.createElement('input');
            i.type = 'hidden'; i.name = 'cf-turnstile-response'; i.value = 'XXXX.DUMMY.TOKEN.XXXX';
            el.appendChild(i);
            return 'stub-widget';
          },
          reset() { window.__tsResets++; },
        };`,
    }),
  );
}
