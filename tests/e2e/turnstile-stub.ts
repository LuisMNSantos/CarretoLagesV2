import type { Page } from '@playwright/test';

/** Replaces Cloudflare's Turnstile script (explicit-render API) with a deterministic stub: render() delivers
 *  Cloudflare's documented dummy token through the callback (unless window.__tsNoToken) and records the
 *  requested options; window.__tsResets counts reset() calls. */
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
            i.type = 'hidden'; i.name = 'cf-turnstile-response';
            el.appendChild(i);
            // window.__tsNoToken (set with addInitScript) simulates a challenge that never completes.
            window.__tsIssue = () => { if (!window.__tsNoToken) setTimeout(() => { i.value = 'XXXX.DUMMY.TOKEN.XXXX'; opts.callback && opts.callback(i.value); }, 50); };
            window.__tsIssue();
            return 'stub-widget';
          },
          // Like the real widget: a reset clears the token and Cloudflare issues a new one through the callback.
          reset() { window.__tsResets++; document.querySelectorAll('[name="cf-turnstile-response"]').forEach((i) => { i.value = ''; }); window.__tsIssue && window.__tsIssue(); },
        };`,
    }),
  );
}
