"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { PushNotificationsToggle } from "@/components/pwa/PushNotificationsToggle";

/**
 * Bell for patient / doctor / nurse cabinets: the user's own notifications
 * (/notifications/ is scoped to request.user for any role) plus the
 * "уведомления на этом устройстве" switch — the place to turn push on
 * later after answering "Нет" in PushPermissionPrompt.
 */
export function NotificationBell({ buttonClassName = "h-11 w-11" }: { buttonClassName?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useAdminNotifications();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
        className={`relative group flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200/50 backdrop-blur-sm ${buttonClassName}`}
        style={{ background: "linear-gradient(135deg, rgba(55, 114, 255, 0.05) 0%, rgba(41, 53, 143, 0.05) 100%)" }}
      >
        <FontAwesomeIcon icon={faBell} className="text-lg text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
               style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-40">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Уведомления</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Прочитать все
              </button>
            )}
          </div>
          <PushNotificationsToggle />
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8 px-4">Пока нет уведомлений</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markRead(n.id);
                    setOpen(false);
                    if (n.admin_task) router.push("/admin/tasks");
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-blue-50/40" : ""}`}
                >
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
