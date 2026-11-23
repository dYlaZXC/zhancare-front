"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, Bot, Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/utils/api";

type ModuleKey = "whatsapp" | "telegram" | "ai_agent";

type ModuleState = {
  configured: boolean;
  is_active: boolean;
  name: string | null;
};

type ModulesResponse = Record<ModuleKey, ModuleState>;

type RowStatus = "idle" | "saving" | "error";

const MODULE_META: Record<ModuleKey, { label: string; icon: typeof MessageCircle }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  telegram: { label: "Telegram", icon: Send },
  ai_agent: { label: "AI-агент", icon: Bot },
};

export default function ClinicModulesPanel({ clinicId }: { clinicId: number }) {
  const [modules, setModules] = useState<ModulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowStatus, setRowStatus] = useState<Record<ModuleKey, RowStatus>>({
    whatsapp: "idle",
    telegram: "idle",
    ai_agent: "idle",
  });
  const [rowError, setRowError] = useState<Record<ModuleKey, string | null>>({
    whatsapp: null,
    telegram: null,
    ai_agent: null,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/clinics/${clinicId}/modules/`)
      .then((res) => {
        if (!cancelled) setModules(res.data);
      })
      .catch(() => {
        if (!cancelled) setModules(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  const toggle = async (key: ModuleKey) => {
    if (!modules || !modules[key].configured) return;
    const nextActive = !modules[key].is_active;

    setRowStatus((prev) => ({ ...prev, [key]: "saving" }));
    setRowError((prev) => ({ ...prev, [key]: null }));

    try {
      const res = await api.patch(`/clinics/${clinicId}/modules/`, {
        [key]: { is_active: nextActive },
      });
      // Always sync to the server's returned state, never trust the
      // locally-toggled value as final.
      setModules(res.data);
      setRowStatus((prev) => ({ ...prev, [key]: "idle" }));
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setRowError((prev) => ({
        ...prev,
        [key]: anyErr?.response?.data?.message || "Не удалось сохранить",
      }));
      setRowStatus((prev) => ({ ...prev, [key]: "error" }));
      // Revert: re-fetch the real server state rather than guessing.
      try {
        const fresh = await api.get(`/clinics/${clinicId}/modules/`);
        setModules(fresh.data);
      } catch {
        // keep showing the pre-click state already in `modules`
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

  if (!modules) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <AlertTriangle className="w-4 h-4" />
        Не удалось загрузить статус модулей
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Модули</label>
      <div className="space-y-2">
        {(Object.keys(MODULE_META) as ModuleKey[]).map((key) => {
          const meta = MODULE_META[key];
          const mod = modules[key];
          const status = rowStatus[key];
          const Icon = meta.icon;

          let dot = "bg-gray-300";
          let statusText = "Не настроено";
          if (mod.configured) {
            dot = mod.is_active ? "bg-emerald-500" : "bg-red-500";
            statusText = mod.is_active ? "Включено" : "Отключено";
          }

          return (
            <div
              key={key}
              className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">{meta.label}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {status === "error" ? (
                      <span className="text-red-600">{rowError[key] || "Не удалось сохранить"}</span>
                    ) : (
                      <span>{statusText}</span>
                    )}
                  </div>
                </div>
              </div>

              {status === "saving" ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
              ) : (
                <button
                  type="button"
                  disabled={!mod.configured}
                  onClick={() => toggle(key)}
                  aria-label={`${meta.label}: ${mod.is_active ? "отключить" : "включить"}`}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    !mod.configured
                      ? "bg-gray-200 cursor-not-allowed"
                      : mod.is_active
                      ? "bg-emerald-500"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mod.is_active ? "translate-x-6" : "translate-x-1"
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
