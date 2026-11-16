import { test, expect } from "@playwright/test";
import { gotoAndWaitForControl } from "./helpers";

/**
 * The actual security requirement behind all of this ("Никаких медицинских
 * данных в Cache Storage"): after real navigation around the site, Cache
 * Storage must contain only same-origin build assets/icons/fonts — never a
 * document, an RSC payload, or anything under /api/*.
 */
const ALLOWED = [
  /^https?:\/\/[^/]+\/_next\/static\//,
  /^https?:\/\/[^/]+\/icons\//,
  /^https?:\/\/[^/]+\/apple-touch-icon\.png$/,
  /^https?:\/\/[^/]+\/favicon\.ico$/,
  /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
];

// sw.ts registers three custom runtime caches, but Serwist also keeps its
// own precache cache for `precacheEntries: self.__SW_MANIFEST` (the build
// assets it precaches up front) under a name like
// "serwist-precache-v2-<origin>/" — not one of the three custom names, but
// still only ever holding the same webpack-emitted /_next/static/* assets.
const KNOWN_CACHE_NAMES = [
  "zc-static-build",
  "zc-static-icons",
  "zc-static-fonts",
];
function isKnownCacheName(name: string) {
  return KNOWN_CACHE_NAMES.includes(name) || name.startsWith("serwist-precache-");
}

// Checked against the URL's *pathname*, not a raw substring match — a
// webpack chunk for a route under src/app/api/** legitimately has "/api/"
// in its /_next/static/chunks/... filename (the chunk path mirrors the
// source tree), so a naive `url.includes("/api/")` false-positives on
// perfectly safe build assets.
const FORBIDDEN_PATH_PREFIXES = [
  "/api/",
  "/_next/data/", // legacy pages-router style data fetches, just in case
];
function hasForbiddenPath(url: string) {
  const { pathname, search } = new URL(url);
  return (
    FORBIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    search.includes("_rsc=") // app-router RSC navigation fetches
  );
}

async function readAllCaches(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const names = await caches.keys();
    const out: Record<string, string[]> = {};
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      out[name] = keys.map((req) => req.url);
    }
    return out;
  });
}

test.describe("Cache Storage contents", () => {
  test("only known cache names exist, holding only allowlisted static assets", async ({ page }) => {
    // Drive some real navigation first so there's something to audit, not
    // just the initial precache.
    await gotoAndWaitForControl(page);
    await page.goto("/symptoms");
    await page.goto("/specialists");
    await page.goto("/");

    const caches = await readAllCaches(page);
    const cacheNames = Object.keys(caches);

    for (const name of cacheNames) {
      expect(isKnownCacheName(name), `unexpected cache name: ${name}`).toBe(true);
    }

    const allUrls = Object.values(caches).flat();
    expect(allUrls.length, "expected at least some precached build assets").toBeGreaterThan(0);

    for (const url of allUrls) {
      const allowed = ALLOWED.some((re) => re.test(url));
      expect(allowed, `unexpected URL in Cache Storage: ${url}`).toBe(true);
      expect(hasForbiddenPath(url), `forbidden path found in cached URL: ${url}`).toBe(false);
    }
  });

  test("the HTML document itself is never cached", async ({ page, baseURL }) => {
    await gotoAndWaitForControl(page);
    await page.goto("/specialists");
    await page.goto("/");

    const caches = await readAllCaches(page);
    const allUrls = Object.values(caches).flat();
    const homeUrl = new URL("/", baseURL!).toString();
    const specialistsUrl = new URL("/specialists", baseURL!).toString();

    expect(allUrls).not.toContain(homeUrl);
    expect(allUrls).not.toContain(specialistsUrl);
  });

  test("API requests are never served from or written to Cache Storage", async ({ page }) => {
    await gotoAndWaitForControl(page);

    // Any same-origin /api/* call must not be interceptable by the SW — it
    // should always reach the real network handler. response.fromServiceWorker()
    // is Playwright/CDP's own signal for "did a Service Worker's fetch
    // handler produce this response", which is the precise thing to check
    // (status code alone wouldn't prove it came from the network).
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("does-not-exist-pwa-probe")),
      page.evaluate(() => fetch("/api/frontend/does-not-exist-pwa-probe", { cache: "no-store" })),
    ]);
    expect(response.fromServiceWorker()).toBe(false);

    const caches = await readAllCaches(page);
    const allUrls = Object.values(caches).flat();
    expect(allUrls.some(hasForbiddenPath)).toBe(false);
  });
});
