"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Share, Smartphone } from "lucide-react";
import { toast } from "react-toastify";
import { PushState, disablePush, enablePush, getPushState, sendTestPush } from "@/utils/webPush";

/**
 * "Уведомления на телефоне" block for the notifications dropdown: lets the
 * user turn on system (push) notifications for THIS device. Hidden where
 * push can't work at all (dev build, server not configured, old browser).
 */
export function PushNotificationsToggle() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getPushState().then((s) => alive && setState(s)).catch(() => alive && setState("unsupported"));
    return () => { alive = false; };
  }, []);

  if (state === "loading" || state === "unsupported" || state === "server-disabled") return null;

  const run = async (fn: () => Promise<PushState>) => {
    setBusy(true);
    try {
      const next = await fn();
      setState(next);
      if (next === "on") toast.success("Уведомления на этом устройстве включены");
      if (next === "denied") toast.warning("Уведомления запрещены в настройках браузера");
    } catch {
      toast.error("Не удалось включить уведомления");
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const n = await sendTestPush();
      if (n > 0) toast.info("Тестовое уведомление отправлено");
      else toast.warning("Устройство не найдено — выключите и включите уведомления заново");
    } catch {
      toast.error("Не удалось отправить тест");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
      {state === "off" && (
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
          <p className="text-xs text-gray-700 flex-1 leading-snug">Получать уведомления на это устройство, даже когда сайт закрыт</p>
          <button
            onClick={() => run(enablePush)}
            disabled={busy}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
          >
            Включить
          </button>
        </div>
      )}

      {state === "on" && (
        <div className="flex items-center gap-3">
          <BellRing className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs text-gray-700 flex-1">Уведомления на этом устройстве включены</p>
          <button onClick={test} disabled={busy} className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60">
            Тест
          </button>
          <button onClick={() => run(disablePush)} disabled={busy} className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-60">
            Выкл.
          </button>
        </div>
      )}

      {state === "denied" && (
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-snug">
            Уведомления запрещены. Разрешите их для zhan.care в настройках браузера или телефона.
          </p>
        </div>
      )}

      {state === "ios-needs-install" && (
        <div className="flex items-start gap-3">
          <Share className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-snug">
            Чтобы получать уведомления на iPhone, нажмите <b>«Поделиться»</b> → <b>«На экран „Домой“»</b> и откройте
            ZhanCare с главного экрана (iOS 16.4+).
          </p>
        </div>
      )}
    </div>
  );
}
