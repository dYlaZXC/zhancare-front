import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only src/**/*.test.ts — e2e/ holds Playwright specs (different test
    // runner, same *.spec.ts-ish naming convention) and must stay excluded.
    include: ['src/**/*.test.ts'],
  },
});
