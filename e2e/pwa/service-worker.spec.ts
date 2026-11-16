import { test, expect } from "@playwright/test";

/**
 * Service worker registration/lifecycle + a static check of the compiled
 * sw.js itself, so a future edit that accidentally widens the runtime-
 * caching allowlist (e.g. someone adds a catch-all route) fails CI instead
 * of silently shipping.
 */
test.describe("Service worker registration", () => {
  test("registers at scope '/' and activates", async ({ page, baseURL }) => {
    await page.goto("/");

    // Polled inside a single in-page evaluate(), not via
    // page.waitForFunction()'s repeated separate CDP calls — against this
    // registration, re-fetching `registration.active` across separate
    // evaluate calls unreliably reads back as undefined even moments after
    // it was just observed as "activated" (confirmed by hand). Also used
    // to read the final values out, from the same call that confirmed them.
    const registration = await page.evaluate(async (deadline) => {
      while (Date.now() < deadline) {
        const regs = await navigator.serviceWorker.getRegistrations();
        const reg = regs[0];
        if (reg?.active?.state === "activated") {
          return {
            scope: reg.scope,
            activeState: reg.active.state,
            activeScriptURL: reg.active.scriptURL,
            hasWaiting: !!reg.waiting,
          };
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      return null;
    }, Date.now() + 15000);

    expect(registration, "service worker never reached the activated state").not.toBeNull();
    expect(registration!.scope).toBe(new URL("/", baseURL!).toString());
    expect(registration!.activeState).toBe("activated");
    expect(registration!.activeScriptURL).toContain("/sw.js");
    // Fresh install, single tab: nothing should be stuck waiting for
    // skipWaiting() confirmation.
    expect(registration!.hasWaiting).toBe(false);
  });

});

// Real skipWaiting:false / controlled-update behaviour (a second worker
// staying in `waiting` until the page posts SKIP_WAITING) needs two actual
// builds deployed in sequence to observe honestly — not simulable from a
// single build without faking the result. Left for the real-device/Preview
// update-lifecycle QA pass rather than asserted here.

test.describe("Compiled sw.js stays within the approved allowlist", () => {
  test("only references the three known cache names", async ({ request }) => {
    const swSource = await (await request.get("/sw.js")).text();

    for (const name of ["zc-static-build", "zc-static-icons", "zc-static-fonts"]) {
      expect(swSource).toContain(name);
    }

    // No catch-all/defaultCache-style route for pages, RSC or /api/* — this
    // is what makes everything outside the allowlist NetworkOnly "by
    // construction" rather than by a strategy choice that has to be trusted.
    expect(swSource).not.toMatch(/NetworkFirst/);
    expect(swSource).not.toMatch(/StaleWhileRevalidate/);
  });

  test("is built with skipWaiting/clientsClaim disabled", async ({ request }) => {
    const swSource = await (await request.get("/sw.js")).text();
    // Minified as `skipWaiting:!1`/`clientsClaim:!1`; matched loosely
    // (`!1` or the literal `false`) so a minifier/config change doesn't
    // silently break this check instead of failing it.
    expect(swSource).toMatch(/skipWaiting:\s*(!1|false)/);
    expect(swSource).toMatch(/clientsClaim:\s*(!1|false)/);
  });
});
