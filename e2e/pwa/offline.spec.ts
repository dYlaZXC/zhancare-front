import { test, expect } from "@playwright/test";
import { gotoAndWaitForControl } from "./helpers";

/**
 * Offline behaviour is a direct consequence of the allowlist design: static
 * build assets/icons/fonts should serve from cache while offline, and
 * everything else (pages, /api/*) should fail like a normal uncached
 * request — not silently succeed with stale/wrong data.
 */
test.describe("Offline behaviour", () => {
  test("cached static assets still resolve offline", async ({ page, context }) => {
    await gotoAndWaitForControl(page);

    // Most JS/CSS chunks are intercepted by Serwist's own precache route
    // (serwist-precache-v2-*) before they'd ever reach the custom
    // zc-static-build CacheFirst matcher — that one only ends up holding
    // whatever /_next/static/* assets were excluded from precaching (the
    // marketing images/video, per next.config.mjs's `exclude`). So search
    // every cache, not just zc-static-build, for a cached JS asset. Also
    // poll: cache.put() runs inside the fetch handler's extendable-event
    // lifetime, which can still be settling for a moment after reload.
    const cachedJsUrl = await page.evaluate(async (deadline) => {
      while (Date.now() < deadline) {
        const names = await caches.keys();
        for (const name of names) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          const jsUrl = keys.map((k) => k.url).find((u) => u.endsWith(".js"));
          if (jsUrl) return jsUrl;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      return null;
    }, Date.now() + 10000);
    expect(cachedJsUrl, "expected at least one cached JS asset before going offline").toBeTruthy();

    await context.setOffline(true);
    try {
      const [response] = await Promise.all([
        page.waitForResponse(cachedJsUrl!),
        page.evaluate((url) => fetch(url), cachedJsUrl!),
      ]);
      expect(response.status()).toBe(200);
      // Proves it came from the SW's CacheFirst handler, not just the
      // browser's own disk HTTP cache (which can also serve some requests
      // offline regardless of the Service Worker).
      expect(response.fromServiceWorker()).toBe(true);
    } finally {
      await context.setOffline(false);
    }
  });

  test("uncached requests (pages, /api/*) fail offline instead of serving stale/wrong data", async ({
    page,
    context,
  }) => {
    await gotoAndWaitForControl(page);

    await context.setOffline(true);
    try {
      const apiFailed = await page
        .evaluate(() => fetch("/api/frontend/does-not-exist-pwa-probe"))
        .then(() => false) // resolved at all while offline would be unexpected
        .catch(() => true);
      expect(apiFailed).toBe(true);

      const navFailed = await page
        .evaluate(async () => {
          const res = await fetch("/specialists", { cache: "no-store" });
          return res.ok;
        })
        .then((ok) => !ok)
        .catch(() => true);
      expect(navFailed).toBe(true);
    } finally {
      await context.setOffline(false);
    }
  });
});
