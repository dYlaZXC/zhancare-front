"use client";

import { useEffect, useRef, useState } from "react";

// Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set — mirrors
// the backend's own "not configured yet" branch (common/utils/turnstile.py's
// verify_turnstile_token treats a blank TURNSTILE_SECRET_KEY as "feature
// disabled", not "always reject"). Once a real site key is set here AND a
// matching secret key is set on the backend, this starts actually gating
// send-phone-code/send-email-code/send-login-code/forgot-password — no
// other code changes needed on either side.
const SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile script"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

interface TurnstileWidgetProps {
  /** Called with a fresh token on success, and with null on expiry/error
   * (the parent should treat null as "don't submit yet, wait for a new
   * token" — Cloudflare tokens are single-use and expire after ~5 minutes). */
  onToken: (token: string | null) => void;
}

/**
 * Managed-mode Turnstile widget — mounted on the IDENTIFIER-entry screen of
 * each send-code flow (RegisterForm's phone step, LoginOtpForm's confirm
 * step, ForgotPasswordForm's identifier step), never on the code-entry
 * screen. A new token is required per submit/resend; call resetToken() (via
 * a ref) after every send attempt so the next one gets a fresh token instead
 * of replaying an already-consumed one.
 */
export default function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY || failed) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
