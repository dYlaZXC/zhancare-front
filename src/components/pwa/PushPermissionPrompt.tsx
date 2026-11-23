"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Share } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { PushState, enablePush, getPushState } from "@/utils/webPush";

/**
 * Centered "Хотите получать уведомления?" modal for every logged-in user
 * whose device isn't subscribed yet. Our own soft prompt goes first and
 * the browser's permission dialog is only triggered by the "Да" tap: if
 * someone hits "Block" in the system dialog the browser never lets us ask
 * again, whereas our modal can come back later.
 */
const DISMISS_KEY = "zc_push_prompt_dismissed_at";
const ASK_AGAIN_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2500;
// Never interrupt a call, login or payment flow.
const SKIP_PATHS = ["/login", "/video", "/video-call", "/consultation", "/smart-consultation", "/telegram-auth", "/checkin"];

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < ASK_AGAIN_MS;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
}

export function PushPermissionPrompt() {
  const { user, loading, mustChangePassword } = useAuth();
  const pathname = usePathname() || "/";
  const [mode, setMode] = useState<"ask" | "ios" | null>(null);
  const [busy, setBusy] = useState(false);

  const skipPath = SKIP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (loading || !user || mustChangePassword || skipPath || recentlyDismissed()) return;
    let alive = true;
    const timer = setTimeout(async () => {
      let state: PushState;
      try { state = await getPushState(); } catch { return; }
      if (!alive) return;
      if (state === "off") setMode("ask");
      else if (state === "ios-needs-install") setMode("ios");
    }, SHOW_DELAY_MS);
    return () => { alive = false; clearTimeout(timer); };
  }, [user, loading, mustChangePassword, skipPath]);

  if (!mode || skipPath) return null;

  const close = () => { rememberDismiss(); setMode(null); };

  const decline = () => {
    close();
    toast.info("Включить уведомления можно в любой момент — через 🔔 колокольчик в кабинете");
  };

  const accept = async () => {
    setBusy(true);
    try {
      const state = await enablePush();
      if (state === "on") toast.success("Уведомления включены");
      else if (state === "denied") toast.warning("Уведомления запрещены — их можно разрешить в настройках телефона");
      if (state !== "on") rememberDismiss();
    } catch {
      toast.error("Не удалось включить уведомления");
      rememberDismiss();
    } finally {
      setBusy(false);
      setMode(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={mode === "ask" ? decline : close}
      >
        <motion.div
          className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
          initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog" aria-modal="true" aria-labelledby="push-prompt-title"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
               style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}>
            {mode === "ask" ? <BellRing className="h-8 w-8 text-white" /> : <Share className="h-8 w-8 text-white" />}
          </div>

          <h2 id="push-prompt-title" className="text-lg font-bold" style={{ color: "#1e263e" }}>
            Хотите получать уведомления?
          </h2>

          {mode === "ask" ? (
            <>
              <p className="mt-2 text-sm text-gray-500">
                Будем присылать важные уведомления ZhanCare — даже когда приложение закрыто.
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={decline} disabled={busy}
                        className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 disabled:opacity-60">
                  Нет
                </button>
                <button onClick={accept} disabled={busy}
                        className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}>
                  {busy ? "..." : "Да"}
                </button>
              </div>
              <p className="mt-3 text-[11px] text-gray-400">
                Это можно изменить в любой момент через 🔔 колокольчик в кабинете
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-500">
                На iPhone уведомления работают из приложения на главном экране: нажмите
                {" "}<b>«Поделиться»</b> → <b>«На экран „Домой“»</b> и откройте ZhanCare оттуда.
              </p>
              <button onClick={close}
                      className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}>
                Понятно
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
