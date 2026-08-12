"use client";

import { History } from "lucide-react";

const HISTORY_FIELDS = ["start_time", "end_time", "is_day_off", "is_active", "weekday", "date"];

export function ScheduleHistoryTab({ history }: { history: any[] }) {
  return (
    <div className="space-y-3">
      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">История изменений пуста</p>
        </div>
      ) : (
        history.map((entry: any) => {
          const actionColor =
            entry.action === "create"
              ? "text-green-600 bg-green-50 border-green-200"
              : entry.action === "delete"
              ? "text-red-600 bg-red-50 border-red-200"
              : "text-blue-600 bg-blue-50 border-blue-200";
          const actionLabel =
            entry.action === "create"
              ? "Создано"
              : entry.action === "delete"
              ? "Удалено"
              : "Изменено";
          const entityLabel =
            entry.entity_type === "base" ? "Базовое расписание" : "Исключение";
          const changedAt = new Date(entry.changed_at).toLocaleString("ru-RU", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div key={entry.id} className={`p-4 rounded-xl border-2 ${actionColor}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${actionColor}`}
                  >
                    {actionLabel}
                  </span>
                  <span className="text-xs text-gray-500">{entityLabel}</span>
                </div>
                <span className="text-xs text-gray-400">{changedAt}</span>
              </div>
              {entry.changed_by_name && (
                <p className="text-xs text-gray-500 mb-2">
                  Изменил: {entry.changed_by_name}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {entry.before && (
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-xs font-semibold text-gray-500 mb-1">До</p>
                    {Object.entries(entry.before)
                      .filter(([k]) => HISTORY_FIELDS.includes(k))
                      .map(([k, v]) => (
                        <p key={k} className="text-xs text-gray-700">
                          <span className="text-gray-400">{k}:</span> {String(v)}
                        </p>
                      ))}
                  </div>
                )}
                {entry.after && (
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-xs font-semibold text-gray-500 mb-1">После</p>
                    {Object.entries(entry.after)
                      .filter(([k]) => HISTORY_FIELDS.includes(k))
                      .map(([k, v]) => (
                        <p key={k} className="text-xs text-gray-700">
                          <span className="text-gray-400">{k}:</span> {String(v)}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
