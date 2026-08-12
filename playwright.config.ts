import { defineConfig, devices } from "@playwright/test";

/**
 * baseURL/backend default to the same localhost ports the CI workflow spins the
 * stack up on (Next `next start` :3000, Django `runserver` :8000) — see
 * .github/workflows/tests.yml. Override via env for other local setups.
 */
const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  timeout: 30_000,

  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  globalSetup: "./e2e/global-setup.ts",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Locally, reuse whatever's already listening on :3000 (e.g. `npm run dev`).
  // In CI the workflow builds+starts the production server itself before
  // Playwright runs, so this only kicks in as a fallback.
  webServer: {
    command: "npm run build && npm run start",
    url: FRONTEND_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
