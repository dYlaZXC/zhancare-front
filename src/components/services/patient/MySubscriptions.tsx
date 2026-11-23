"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { IdCard } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Ожидает оплаты", active: "Активен", frozen: "Заморожен",
  expired: "Истёк", completed: "Завершён", cancelled: "Отменён",
};
const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-600 bg-emerald-50", frozen: "text-blue-600 bg-blue-50",
  pending_payment: "text-amber-600 bg-amber-50", expired: "text-gray-400 bg-gray-100",
  completed: "text-gray-400 bg-gray-100", cancelled: "text-red-500 bg-red-50",
};
const TXN_LABEL: Record<string, string> = {
  reserve: "Резервирование", release: "Освобождение резерва", consume: "Списание",
  restore: "Восстановление", adjustment: "Корректировка",
};

export default function MySubscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/subscriptions/patient-subscriptions/");
      setSubs(data.results || data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-8 text-center text-gray-400">Загрузка...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Мои абонементы</h1>
        <p className="text-gray-600">Баланс, статус и история посещений</p>
      </div>

      {subs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
          У вас пока нет абонементов. Обратитесь в клинику для оформления.
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map(s => {
            const balanceLabel = s.sessions_total != null
              ? `${s.available_sessions} из ${s.sessions_total} занятий`
              : s.day_package_total != null
                ? `${s.available_days} из ${s.day_package_total} дней`
                : s.valid_until ? `до ${new Date(s.valid_until).toLocaleDateString("ru-RU")}` : "без ограничения";
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fdf2f8" }}>
                      <IdCard className="w-5 h-5" style={{ color: "#ec4899" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.plan_name_snapshot}</p>
                      <p className="text-xs text-gray-400">Куплен {new Date(s.purchased_at).toLocaleDateString("ru-RU")}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">Остаток: <span className="font-semibold">{balanceLabel}</span></p>
                <button
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="text-xs font-semibold text-blue-600"
                >
                  {expanded === s.id ? "Скрыть историю" : "Показать историю"}
                </button>
                {expanded === s.id && (
                  <div className="mt-3 space-y-1.5">
                    {(s.transactions || []).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-gray-50">
                        <span className="text-gray-700">{TXN_LABEL[t.transaction_type]}</span>
                        <span className="text-gray-400">{new Date(t.created_at).toLocaleString("ru-RU")}</span>
                      </div>
                    ))}
                    {(!s.transactions || s.transactions.length === 0) && (
                      <p className="text-xs text-gray-400 text-center py-2">Операций пока нет</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
