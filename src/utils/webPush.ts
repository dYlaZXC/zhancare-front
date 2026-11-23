"use client";

/**
 * Web Push subscription for this device. Works in:
 *  - Android: Chrome / Samsung Internet, browser tab or installed app;
 *  - iPhone/iPad: iOS 16.4+, ONLY from the app added to the home screen
 *    (Safari tabs have no PushManager);
 *  - desktop Chrome / Edge / Firefox / Safari.
 * The service worker exists only in production builds (see
 * ServiceWorkerProvider.tsx), so in `next dev` this reports "unsupported".
 */
import { api } from "@/utils/api";

export type PushState =
  | "loading"
  | "unsupported"
  | "ios-needs-install"
  | "server-disabled"
  | "denied"
  | "off"
  | "on";

let publicKeyPromise: Promise<string | null> | null = null;

function getPublicKey(): Promise<string | null> {
  if (!publicKeyPromise) {
    publicKeyPromise = api
      .get("/notifications/push/config/")
      .then((r) => (r.data?.enabled ? (r.data.public_key as string) : null))
      .catch(() => {
        publicKeyPromise = null;
        return null;
      });
  }
  return publicKeyPromise;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function browserSupportsPush(): boolean {
  return typeof window !== "undefined" &&
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  if (reg.active) return reg;
  // Freshly installed worker: wait (briefly) until it's active.
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
  ]);
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function sameKey(sub: PushSubscription, key: Uint8Array): boolean {
  const current = sub.options?.applicationServerKey;
  if (!current) return true; // browser doesn't expose it — assume ok
  const a = new Uint8Array(current);
  return a.length === key.length && a.every((b, i) => b === key[i]);
}

async function sendToServer(sub: PushSubscription) {
  const json = sub.toJSON();
  await api.post("/notifications/push/subscribe/", { endpoint: json.endpoint, keys: json.keys });
}

/** Current state for this device; re-registers an existing subscription for the logged-in user. */
export async function getPushState(): Promise<PushState> {
  if (!browserSupportsPush()) return isIOS() && !isStandalone() ? "ios-needs-install" : "unsupported";
  const key = await getPublicKey();
  if (!key) return "server-disabled";
  if (Notification.permission === "denied") return "denied";
  const reg = await getRegistration();
  if (!reg) return "unsupported";
  const sub = await reg.pushManager.getSubscription();
  if (!sub || Notification.permission !== "granted") return "off";
  // Keeps the server row pointed at whoever is logged in on this device
  // now, and recovers after the browser rotated the endpoint.
  sendToServer(sub).catch(() => {});
  return "on";
}

/** Must be called from a click/tap (iOS requires a user gesture). */
export async function enablePush(): Promise<PushState> {
  const keyB64 = await getPublicKey();
  if (!keyB64) return "server-disabled";
  const permission = await Notification.requestPermission();
  if (permission === "denied") return "denied";
  if (permission !== "granted") return "off";

  const reg = await getRegistration();
  if (!reg) return "unsupported";
  const key = urlBase64ToUint8Array(keyB64);
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub, key)) {
    await sub.unsubscribe();
    sub = null;
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await sendToServer(sub);
  return "on";
}

export async function disablePush(): Promise<PushState> {
  const reg = await getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api.post("/notifications/push/unsubscribe/", { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe().catch(() => false);
  }
  return "off";
}

export async function sendTestPush(): Promise<number> {
  const r = await api.post("/notifications/push/test/");
  return r.data?.delivered ?? 0;
}

/**
 * On logout: stop this device from receiving the previous user's
 * notifications. Best-effort and time-boxed so logout never hangs.
 */
export async function unregisterPushOnLogout(): Promise<void> {
  if (!browserSupportsPush()) return;
  await Promise.race([
    disablePush().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
}
