import type { BrowserContext, Page } from "@playwright/test";

/**
 * sw.ts is built with clientsClaim: false (deliberately — see its top
 * docstring), so the very tab that triggers the first-ever registration is
 * never itself claimed by the worker once it activates; only a fresh
 * navigation after that point is. Waiting on `navigator.serviceWorker
 * .controller` right after the first goto() would hang forever. Every test
 * that needs a controlled page calls this instead.
 */
// page.waitForFunction() polls by re-invoking the predicate as a *separate*
// CDP Runtime.evaluate call each tick; against this registration, that
// reliably loses `registration.active` (it reads back as undefined) even
// moments after a poll inside the very same call observed it as
// "activated". Polling in a single in-page evaluate() with its own loop
// does not have that problem — confirmed by hand before writing this.
async function waitForActiveInSinglePageEvaluate(page: Page, timeoutMs = 15000) {
  const ok = await page.evaluate(async (deadline) => {
    while (Date.now() < deadline) {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs[0]?.active?.state === "activated") return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }, Date.now() + timeoutMs);
  if (!ok) throw new Error("service worker never reached the activated state");
}

async function waitForControllerInSinglePageEvaluate(page: Page, timeoutMs = 15000) {
  const ok = await page.evaluate(async (deadline) => {
    while (Date.now() < deadline) {
      if (navigator.serviceWorker.controller) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }, Date.now() + timeoutMs);
  if (!ok) throw new Error("page never became controlled by the active service worker");
}

export async function gotoAndWaitForControl(page: Page, path = "/") {
  // `waitUntil: "networkidle"` is not usable here: the app has background
  // calls (analytics/telemetry) that keep retrying against a backend this
  // suite doesn't run, so the network never truly goes idle and the wait
  // just times out. Plain navigation + explicit polling instead.
  await page.goto(path);
  await waitForActiveInSinglePageEvaluate(page);
  // Reloading immediately after "activated" still races the browser's own
  // controller-assignment bookkeeping (confirmed by hand), so this settle
  // is deliberate, not arbitrary.
  await page.waitForTimeout(3000);
  await page.reload();
  await waitForControllerInSinglePageEvaluate(page);
}

/**
 * LanguageContext.tsx detects the UI language from `navigator.language` on
 * first mount when nothing is in localStorage yet (see detectLanguage()).
 * Playwright's default context reports "en-US", so any test asserting on
 * ru.json copy needs this pinned first — otherwise the page silently
 * renders in English and text-based assertions fail for an unrelated
 * reason.
 */
export async function forceRussianLocale(context: BrowserContext) {
  await context.addInitScript(() => {
    window.localStorage.setItem("zhancare_language", "ru");
  });
}
