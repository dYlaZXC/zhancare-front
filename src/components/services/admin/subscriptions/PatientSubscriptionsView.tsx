"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { Plus, IdCard } from "lucide-react";
import { KPICard } from "../dashboardUI";
import { SellSubscriptionModal } from "./SellSubscriptionModal";
import { PatientSubscriptionCard } from "./PatientSubscriptionCard";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Ожидает оплаты", active: "Активен", frozen: "Заморожен",
  expired: "Истёк", completed: "Завершён", cancelled: "Отменён",
};
const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-600 bg-emerald-50", frozen: "text-blue-600 bg-blue-50",
  pending_payment: "text-amber-600 bg-amber-50", expired: "text-gray-400 bg-gray-100",
  completed: "text-gray-400 bg-gray-100", cancelled: "text-red-500 bg-red-50",
};

export default function PatientSubscriptionsView() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSell, setShowSell] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

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

  const activeCount = subs.filter(s => s.status === "active").length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Абонементы пациентов</h1>
          <p className="text-gray-600">Продажа и управление абонементами</p>
        </div>
        <button
          onClick={() => setShowSell(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
        >
          <Plus className="w-4 h-4" /> Продать абонемент
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KPICard label="Всего абонементов" value={String(subs.length)} icon={IdCard} color="#3772ff" />
        <KPICard label="Активных" value={String(activeCount)} icon={IdCard} color="#10b981" />
        <KPICard label="Замороженных" value={String(subs.filter(s => s.status === "frozen").length)} icon={IdCard} color="#f59e0b" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Пациент", "Тариф", "Остаток", "Статус", "Куплен"].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} onClick={() => setDetail(s)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-3 font-semibold text-gray-900">{s.patient_name}</td>
                <td className="px-6 py-3 text-gray-700">{s.plan_name_snapshot}</td>
                <td className="px-6 py-3 text-gray-500">
                  {s.sessions_total != null ? `${s.available_sessions}/${s.sessions_total}` : s.day_package_total != null ? `${s.available_days}/${s.day_package_total} дн.` : "—"}
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                </td>
                <td className="px-6 py-3 text-gray-400 text-xs">{new Date(s.purchased_at).toLocaleDateString("ru-RU")}</td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">Абонементов пока нет</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showSell && (
        <SellSubscriptionModal onClose={() => setShowSell(false)} onSold={() => { setShowSell(false); load(); }} />
      )}
      {detail && (
        <PatientSubscriptionCard subscription={detail} onClose={() => setDetail(null)} onUpdated={() => { load(); setDetail(null); }} />
      )}
    </div>
  );
}
