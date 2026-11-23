"use client";

import { useEffect, useState } from "react";
import { ListCheck, HeartHandshake, Users, LineChart, Bot, MessageCircle, Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/utils/api";

type NavKey = "tasks" | "path_of_patient" | "management" | "analytics" | "ai_agents" | "messengers";

type NavState = Record<NavKey, boolean>;

type RowStatus = "idle" | "saving" | "error";

const NAV_META: Record<NavKey, { label: string; icon: typeof ListCheck }> = {
  tasks: { label: "Задачи", icon: ListCheck },
  path_of_patient: { label: "Путь пациента", icon: HeartHandshake },
  management: { label: "Управление", icon: Users },
  analytics: { label: "Аналитика", icon: LineChart },
  ai_agents: { label: "AI Агенты", icon: Bot },
  messengers: { label: "Мессенджеры", icon: MessageCircle },
};

const NAV_KEYS = Object.keys(NAV_META) as NavKey[];

export default function ClinicNavigationPanel({ clinicId }: { clinicId: number }) {
  const [nav, setNav] = useState<NavState | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowStatus, setRowStatus] = useState<Record<NavKey, RowStatus>>(
    Object.fromEntries(NAV_KEYS.map((k) => [k, "idle"])) as Record<NavKey, RowStatus>
  );
  const [rowError, setRowError] = useState<Record<NavKey, string | null>>(
    Object.fromEntries(NAV_KEYS.map((k) => [k, null])) as Record<NavKey, string | null>
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/clinics/${clinicId}/navigation/`)
      .then((res) => {
        if (!cancelled) setNav(res.data);
      })
      .catch(() => {
        if (!cancelled) setNav(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  const toggle = async (key: NavKey) => {
    if (!nav) return;
    const nextValue = !nav[key];

    setRowStatus((prev) => ({ ...prev, [key]: "saving" }));
    setRowError((prev) => ({ ...prev, [key]: null }));

    try {
      const res = await api.patch(`/clinics/${clinicId}/navigation/`, { [key]: nextValue });
      setNav(res.data);
      setRowStatus((prev) => ({ ...prev, [key]: "idle" }));
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setRowError((prev) => ({
        ...prev,
        [key]: anyErr?.response?.data?.message || "Не удалось сохранить",
      }));
      setRowStatus((prev) => ({ ...prev, [key]: "error" }));
      try {
        const fresh = await api.get(`/clinics/${clinicId}/navigation/`);
        setNav(fresh.data);
      } catch {
        // keep showing the pre-click state already in `nav`
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!nav) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <AlertTriangle className="w-4 h-4" />
        Не удалось загрузить настройки сайдбара
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Разделы в сайдбаре клиники</label>
      <p className="text-xs text-gray-400 mb-2">
        Скрывает пункт меню для админов этой клиники — не ограничивает доступ к странице напрямую по ссылке.
      </p>
      <div className="space-y-2">
        {NAV_KEYS.map((key) => {
          const meta = NAV_META[key];
          const enabled = nav[key];
          const status = rowStatus[key];
          const Icon = meta.icon;

          return (
            <div
              key={key}
              className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">{meta.label}</div>
                  {status === "error" && (
                    <div className="text-xs text-red-600">{rowError[key] || "Не удалось сохранить"}</div>
                  )}
                </div>
              </div>

              {status === "saving" ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-label={`${meta.label}: ${enabled ? "скрыть" : "показать"}`}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    enabled ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
