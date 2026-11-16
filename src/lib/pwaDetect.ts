// Shared by BottomNavBar.tsx and StandaloneWelcomeGate.tsx so both agree on
// exactly the same "installed PWA, on a phone" condition — if they drifted,
// the bottom nav's "Войти" tab and the welcome gate's own login buttons
// could end up showing at the same time on the homepage.
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// Fired by StandaloneWelcomeGate when "Продолжить без входа" is clicked.
// BottomNavBar listens for it to show up immediately — the two components
// aren't parent/child, so a sessionStorage write alone wouldn't be noticed
// by the already-mounted BottomNavBar until something else re-ran its effect.
export const STANDALONE_GATE_DISMISSED_EVENT = "zhancare:standalone-gate-dismissed";
