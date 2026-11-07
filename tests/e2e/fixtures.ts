// Every e2e spec imports test/expect from here: the real Turnstile script (third-party, never idle, sets its own
// cookies) is always replaced by the deterministic stub. Real Turnstile is checked live after publishing.
import { test as base, expect } from '@playwright/test';
import { stubTurnstile } from './turnstile-stub';

export const test = base.extend<{ turnstileStub: void }>({
  turnstileStub: [async ({ page }, use) => { await stubTurnstile(page); await use(); }, { auto: true }],
});
export { expect };
export type { Page } from '@playwright/test';
