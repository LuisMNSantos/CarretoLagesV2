import { defineConfig } from '@playwright/test';

// Screenshot run for the design report (npm run screens). Not part of the test suite.
export default defineConfig({
  testDir: 'tests/screens',
  timeout: 120_000,
  workers: 4,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321', channel: 'chrome', reducedMotion: 'reduce' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 }, channel: 'chrome' } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, channel: 'chrome' } },
  ],
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 180_000, env: { ALLOW_TEST_TURNSTILE: '1' } },
});
