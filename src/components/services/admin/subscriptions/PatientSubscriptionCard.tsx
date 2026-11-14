"use client";

import { useState } from "react";
import { X, Snowflake, Play, CalendarPlus } from "lucide-react";
import { api } from "@/utils/api";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Ожидает оплаты", active: "Активен", frozen: "Заморожен",
  expired: "Истёк", completed: "Завершён", cancelled: "Отменён",
};
const TXN_LABEL: Record<string, string> = {
  reserve: "Резервирование", release: "Освобождение резерва", consume: "Списание",
  restore: "Восстановление", adjustment: "Корректировка",
};

export function PatientSubscriptionCard({ subscription, onClose, onUpdated }: { subscription: any; onClose: () => void; onUpdated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onUpdated();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось выполнить действие");
    } finally {
      setBusy(false);
    }
  };

  const balanceLabel = subscription.sessions_total != null
    ? `${subscription.available_sessions} из ${subscription.sessions_total} занятий`
    : subscription.day_package_total != null
      ? `${subscription.available_days} из ${subscription.day_package_total} дней`
      : subscription.valid_until ? `до ${new Date(subscription.valid_until).toLocaleDateString("ru-RU")}` : "без ограничения";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#1e263e" }}>{subscription.plan_name_snapshot}</h2>
            <p className="text-sm text-gray-500">{subscription.patient_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Статус</p>
            <p className="text-sm font-semibold text-gray-900">{STATUS_LABEL[subscription.status]}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Остаток</p>
            <p className="text-sm font-semibold text-gray-900">{balanceLabel}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Оплачено</p>
            <p className="text-sm font-semibold text-gray-900">{subscription.amount_paid} {subscription.currency_snapshot}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Задолженность</p>
            <p className="text-sm font-semibold text-gray-900">{subscription.amount_due} {subscription.currency_snapshot}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {subscription.status === "active" && subscription.allow_freeze_snapshot && (
            <button
              disabled={busy}
              onClick={() => run(() => api.post(`/subscriptions/patient-subscriptions/${subscription.id}/freeze/`, {}))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Snowflake className="w-3.5 h-3.5" /> Заморозить
            </button>
          )}
          {subscription.status === "frozen" && (
            <button
              disabled={busy}
              onClick={() => run(() => api.post(`/subscriptions/patient-subscriptions/${subscription.id}/unfreeze/`, {}))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Play className="w-3.5 h-3.5" /> Разморозить
            </button>
          )}
          {subscription.valid_until && (
            <button
              disabled={busy}
              onClick={() => run(() => api.post(`/subscriptions/patient-subscriptions/${subscription.id}/extend/`, { days: 7 }))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <CalendarPlus className="w-3.5 h-3.5" /> +7 дней
            </button>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">История операций</p>
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {(subscription.transactions || []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-gray-50">
              <span className="text-gray-700">{TXN_LABEL[t.transaction_type]}</span>
              <span className="text-gray-400 text-xs">{new Date(t.created_at).toLocaleString("ru-RU")}</span>
            </div>
          ))}
          {(!subscription.transactions || subscription.transactions.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">Операций пока нет</p>
          )}
        </div>
      </div>
    </div>
  );
}
