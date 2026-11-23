import { test, expect, request } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";

/**
 * Regression coverage for the session-security audit: logout must revoke the
 * session on the server (not just clear local state), and that revocation
 * must be visible immediately — to a direct API call with the old access
 * token, to a second open tab, and to the browser's back button.
 *
 * Logs in via the real API (same approach as e2e/global-setup.ts) rather
 * than a baked storageState fixture, since each test here needs a *fresh*
 * session of its own — reusing one across tests would mean the first test
 * to log out invalidates the session the next test expects to still work.
 */

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? "http://localhost:8000/api/v1";
const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? "http://localhost:3000";
const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? "Admin1234!";
const PATIENT_EMAIL = "patient@zhancare.test";

// Sidebar.tsx's logout aria-label is localized (ru/kz/en/uz) and this app
// falls back to the browser's `navigator.language` when no language
// preference is saved yet — match either of the two labels we might see in
// a default Chromium profile (ru or en) rather than hardcoding one.
const LOGOUT_BUTTON = /Выйти из системы|Log out of the system/;

// Sidebar.tsx renders the logout button twice (desktop + collapsed/mobile
// variants, both mounted — only CSS hides one at the current viewport), so
// getByLabel() alone hits Playwright's strict-mode "multiple elements"
// check, and which one is DOM-first isn't stable across breakpoints. Narrow
// to whichever copy is actually visible.
const logoutButton = (page: Page) => page.getByLabel(LOGOUT_BUTTON).and(page.locator(":visible"));

async function loginViaApi(email: string) {
  const res = await fetch(`${BACKEND_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: SEED_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(
      `logout-session e2e: login failed for ${email} (${res.status}). ` +
        `Is the backend up at ${BACKEND_URL} and seeded via 'manage.py seed_test_data'? ${await res.text()}`
    );
  }
  return res.json() as Promise<{ access_token: string; refresh_token: string; user: unknown }>;
}

/** Revokes a session server-side via the real /auth/logout/ endpoint without
 * going through the browser — used to simulate "this session died on the
 * server" (expired/invalidated elsewhere) while the browser still has the
 * now-stale tokens sitting in localStorage, as opposed to the user clicking
 * logout themselves. */
async function revokeViaApi(data: { access_token: string; refresh_token: string }) {
  await fetch(`${BACKEND_URL}/auth/logout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.access_token}`,
    },
    body: JSON.stringify({ refresh_token: data.refresh_token }),
  });
}

/** Opens a new tab already authenticated as the given API login response —
 * mirrors what AuthContext.loginUser() writes to localStorage/cookies, so
 * the page hydrates as logged-in on first paint without going through the
 * login UI. */
async function openAuthenticatedTab(
  context: BrowserContext,
  data: { access_token: string; refresh_token: string; user: unknown }
): Promise<Page> {
  await context.addCookies([
    {
      name: "zha_auth",
      value: "1",
      domain: new URL(FRONTEND_URL).hostname,
      path: "/",
      expires: Math.floor(Date.now() / 1000) + 3600,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  await page.goto(FRONTEND_URL);
  await page.evaluate(
    ({ access, refresh, user }) => {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));
    },
    { access: data.access_token, refresh: data.refresh_token, user: data.user }
  );
  return page;
}

// Each test logs in fresh against the real /auth/login/ endpoint, which is
// throttled to 5/min per common.tests.LoginThrottleTests — run serially so
// three tests starting in parallel don't 429 each other.
test.describe.configure({ mode: "serial" });

test.describe("Logout / session revocation", () => {
  test("logout revokes the server session — the old access token is rejected afterwards", async ({
    context,
  }) => {
    const data = await loginViaApi(PATIENT_EMAIL);
    const oldAccessToken = data.access_token;
    const page = await openAuthenticatedTab(context, data);

    await page.goto("/patient/profile", { waitUntil: "load" });
    await expect(logoutButton(page)).toBeVisible({ timeout: 15_000 });

    await logoutButton(page).click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    // The token issued before logout must now be rejected server-side — not
    // merely absent from this browser's localStorage.
    const api = await request.newContext();
    const resp = await api.get(`${BACKEND_URL}/user-profile/profile/`, {
      headers: { Authorization: `Bearer ${oldAccessToken}` },
    });
    expect(resp.status()).toBe(401);
    await api.dispose();
  });

  test("logout in one tab signs a second open tab out too", async ({ context }) => {
    const data = await loginViaApi(PATIENT_EMAIL);
    const tab1 = await openAuthenticatedTab(context, data);
    await tab1.goto("/patient/profile", { waitUntil: "load" });
    await expect(logoutButton(tab1)).toBeVisible({ timeout: 15_000 });

    const tab2 = await context.newPage();
    await tab2.goto("/patient/profile", { waitUntil: "load" });
    await expect(logoutButton(tab2)).toBeVisible({ timeout: 15_000 });

    await logoutButton(tab1).click();
    await tab1.waitForURL(/\/login/, { timeout: 15_000 });

    // tab2 never clicked anything — AuthContext's `storage` listener (fired
    // natively by tab1's clearTokens() removing access_token) must drive it
    // to /login on its own.
    await tab2.waitForURL(/\/login/, { timeout: 15_000 });
  });

  test("back button after logout does not restore the patient cabinet", async ({ context }) => {
    const data = await loginViaApi(PATIENT_EMAIL);
    const page = await openAuthenticatedTab(context, data);

    await page.goto("/patient/profile", { waitUntil: "load" });
    await expect(logoutButton(page)).toBeVisible({ timeout: 15_000 });

    await logoutButton(page).click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    await page.goBack();

    // Whether the browser re-requests the page (middleware redirects back to
    // /login) or restores a frozen snapshot (bfcache), the authenticated
    // sidebar/logout control must not be visible again.
    await expect(logoutButton(page)).not.toBeVisible({ timeout: 5_000 });
  });

  test("a session revoked elsewhere (expired/invalidated) auto-logs-out to /login", async ({
    context,
  }) => {
    const data = await loginViaApi(PATIENT_EMAIL);
    // Simulate the session dying on its own (expiry, revoked from another
    // device, admin-forced logout, etc.) — NOT the user clicking logout in
    // this browser. The tokens below are now stale from this tab's point of
    // view, exactly like a long-idle tab whose refresh token finally expired.
    await revokeViaApi(data);

    const page = await openAuthenticatedTab(context, data);
    // AuthContext's init effect fetches /user-profile/profile/ with the
    // stale access token, gets 401, the interceptor's refresh attempt with
    // the revoked refresh token fails too, and dispatches `auth:logout` —
    // which must now redirect here (P1.1), not just blank out the sidebar.
    await page.goto("/patient/profile", { waitUntil: "load" });
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    // Must not leave the cabinet mounted waiting to be noticed.
    await expect(logoutButton(page)).not.toBeVisible();
  });
});
