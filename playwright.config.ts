import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PW_BASE_URL ?? 'http://localhost:4321';
const external = Boolean(process.env.PW_BASE_URL);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list'], ['json', { outputFile: process.env.PW_JSON ?? 'reports/summary/playwright.json' }]],
  use: { baseURL, channel: 'chrome' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 }, channel: 'chrome' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, channel: 'chrome', defaultBrowserType: 'chromium' } },
    { name: 'nojs', use: { viewport: { width: 390, height: 844 }, javaScriptEnabled: false, channel: 'chrome' } },
  ],
  ...(external
    ? {}
    : { webServer: { command: 'npm run build && npm run preview', url: baseURL, reuseExistingServer: true, timeout: 180_000 } }),
});
