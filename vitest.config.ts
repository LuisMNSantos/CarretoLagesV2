import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
    reporters: ['default', ['json', { outputFile: 'reports/summary/vitest.json' }]],
  },
});
