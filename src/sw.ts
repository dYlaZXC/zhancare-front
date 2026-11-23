/**
 * ZhanCare.AI service worker (PWA 2.0, Этап 1).
 *
 * Deliberately conservative: this file does NOT import Serwist's
 * `defaultCache` (from "@serwist/next/worker"). That preset uses
 * NetworkFirst for pages, RSC payloads and `/api/*`, which still WRITES
 * every successful response into Cache Storage — i.e. it would put
 * authenticated HTML, RSC payloads and medical/personal API responses in
 * the cache even though the network is tried first. That is exactly what
 * the approved cache policy forbids ("Никаких медицинских данных в Cache
 * Storage").
 *
 * Instead, only a short, explicit allowlist of same-origin, content-hashed
 * or otherwise non-personalized static assets is registered below. Every
 * route NOT listed here (every page, every RSC request, every `/api/*`
 * call, patient images, payment pages, LiveKit/Deepgram requests, …) has
 * no matching route at all, so Serwist's router never calls
 * `respondWith()` for it and the browser performs its normal, uncached
 * network fetch — true NetworkOnly by construction, not by a strategy
 * that still has to be trusted to behave.
 *
 * Precaching (self.__SW_MANIFEST below) only ever contains the webpack
 * client build's own emitted assets (JS/CSS/media under /_next/static/) —
 * verified by inspecting the built public/sw.js: no page HTML, RSC or API
 * route ever ends up in it, since those aren't part of that asset graph in
 * the first place. next.config.mjs additionally excludes imported
 * marketing images/video from it (see the `exclude` option there) so a
 * first install doesn't have to pull the whole landing page's media.
 */
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  Serwist,
} from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Controlled update, not an automatic one: a waiting worker stays
  // waiting until the page explicitly asks it to skip (see
  // ServiceWorkerProvider.tsx), so an update is never forced mid-visit —
  // e.g. not in the middle of an active video consultation.
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: false,
  runtimeCaching: [
    {
      // Content-hashed Next.js build output — safe to cache aggressively,
      // a new release ships under new hashed filenames.
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "zc-static-build",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: ONE_YEAR_SECONDS }),
        ],
      }),
    },
    {
      // Public, non-personalized icons/app-shell images shipped in /public.
      matcher: ({ sameOrigin, url }) =>
        sameOrigin &&
        (url.pathname.startsWith("/icons/") ||
          url.pathname === "/apple-touch-icon.png" ||
          url.pathname === "/favicon.ico"),
      handler: new CacheFirst({
        cacheName: "zc-static-icons",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_YEAR_SECONDS }),
        ],
      }),
    },
    {
      // Self-hosted webfonts (next/font output lives under /_next/static
      // already and is covered above; this also covers any font served
      // directly from /public).
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && /\.(woff2?|eot|ttf|otf)$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "zc-static-fonts",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: ONE_YEAR_SECONDS }),
        ],
      }),
    },
    // No further entries. Everything else — pages, RSC, /api/*, payments,
    // patient images/documents, LiveKit/Deepgram requests, cross-origin
    // calls — is left unmatched and therefore never intercepted.
  ],
});

serwist.addEventListeners();

/*
 * Web Push — system notifications on Android (Chrome / installed app) and
 * iPhone (iOS 16.4+, app added to the home screen). Payload format is set
 * by the backend (common/services/push.py): {title, body, url, tag}.
 * Only the notification text travels through the push service; nothing is
 * cached.
 */
type PushPayload = { title?: string; body?: string; url?: string; tag?: string | null };

self.addEventListener("push", (event) => {
  let data: PushPayload = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  // iOS/Chrome require every push to display a notification.
  event.waitUntil(
    self.registration.showNotification(data.title || "ZhanCare", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      tag: data.tag || undefined,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        try {
          await existing.navigate(target);
          return;
        } catch {
          // Uncontrolled client (first visit before the SW took over) can't
          // be navigated from here — fall through and open a window.
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
