import { defineConfig, devices } from "@playwright/test";

/**
 * Separate config for the PWA/Serwist suite (e2e/pwa/). Unlike the main
 * playwright.config.ts, this suite needs no Django backend and no
 * globalSetup/storageState — it only exercises unauthenticated, static-asset
 * behaviour (manifest, Service Worker registration, Cache Storage contents,
 * offline fetch, install UI). Point E2E_FRONTEND_URL at any already-running
 * production build (standalone or `next start`); reuseExistingServer means
 * the webServer command below only fires if nothing answers there yet.
 */
const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? "http://localhost:4001";

export default defineConfig({
  testDir: "./e2e/pwa",
  // Forced to 1 everywhere, not just CI: these tests hit a single Node
  // server instance (no per-worker backend to parallelize against like the
  // main suite), and running them in parallel caused real, reproducible
  // flakiness from resource contention on that one process — confirmed by
  // hand (workers:1 made every failure disappear).
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  timeout: 30_000,

  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run build && npm run start",
    url: FRONTEND_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
