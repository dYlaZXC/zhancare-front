import type { FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Logs in as each seeded test role via the real login endpoint and writes a
 * Playwright storageState fixture per role. The app itself reads auth out of
 * localStorage (access_token/refresh_token/user), but src/middleware.ts
 * gates every /admin/* request server-side on a separate `zha_auth` cookie
 * that AuthContext only sets client-side once it has already hydrated from
 * localStorage (see src/context/AuthContext.tsx). Without that cookie in the
 * fixture, the very first navigation to a protected route 302s to /login,
 * which then bounces to /profile once it sets the cookie — losing whatever
 * deep link was requested. Setting the cookie here too means specs can
 * navigate straight to their target route.
 *
 * Credentials come from zhancare-back's `manage.py seed_test_data` — see
 * common/management/commands/seed_test_data.py. The CI workflow runs that
 * command before Playwright; for local runs, run it yourself against your
 * local backend first.
 */
const BACKEND_URL = process.env.E2E_BACKEND_URL ?? "http://localhost:8000/api/v1";
const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? "http://localhost:3000";
const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? "Admin1234!";

const ROLES = {
  "clinic-admin": "clinic.admin@zhancare.test",
  "super-admin": "superadmin@zhancare.test",
} as const;

const AUTH_DIR = path.join(__dirname, ".auth");

async function loginAndSaveState(email: string, outFile: string) {
  const res = await fetch(`${BACKEND_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: SEED_PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `e2e global-setup: login failed for ${email} (${res.status}). ` +
        `Is the backend up at ${BACKEND_URL} and seeded via 'manage.py seed_test_data'? Body: ${body}`
    );
  }

  const data = await res.json();
  const frontendHost = new URL(FRONTEND_URL).hostname;

  const storageState = {
    cookies: [
      {
        name: "zha_auth",
        value: "1",
        domain: frontendHost,
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        httpOnly: false,
        secure: false,
        sameSite: "Lax" as const,
      },
    ],
    origins: [
      {
        origin: FRONTEND_URL,
        localStorage: [
          { name: "access_token", value: data.access_token },
          { name: "refresh_token", value: data.refresh_token },
          { name: "user", value: JSON.stringify(data.user) },
        ],
      },
    ],
  };

  fs.writeFileSync(outFile, JSON.stringify(storageState, null, 2));
}

export default async function globalSetup(_config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await Promise.all(
    Object.entries(ROLES).map(([role, email]) =>
      loginAndSaveState(email, path.join(AUTH_DIR, `${role}.json`))
    )
  );
}
