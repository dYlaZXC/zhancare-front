"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { Plus, Archive, Pencil, Tag } from "lucide-react";
import { KPICard } from "../dashboardUI";
import { SubscriptionPlanFormModal, SubscriptionPlan } from "./SubscriptionPlanFormModal";

const PLAN_TYPE_LABEL: Record<string, string> = {
  session: "По занятиям", duration: "По дням", hybrid: "Комбинированный",
};

export default function SubscriptionPlansView() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [services, setServices] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<SubscriptionPlan | null | false>(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, servicesRes] = await Promise.all([
        api.get("/subscriptions/plans/"),
        api.get("/diagnostics/services/"),
      ]);
      setPlans(plansRes.data.results || plansRes.data);
      const svc = servicesRes.data.results || servicesRes.data;
      setServices(svc.map((s: any) => ({ id: s.id, name: s.name })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const archive = async (plan: SubscriptionPlan) => {
    await api.post(`/subscriptions/plans/${plan.id}/archive/`);
    load();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Загрузка...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Тарифы</h1>
          <p className="text-gray-600">Тарифы абонементов вашей клиники</p>
        </div>
        <button
          onClick={() => setModal(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
        >
          <Plus className="w-4 h-4" /> Создать тариф
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KPICard label="Всего тарифов" value={String(plans.length)} icon={Tag} color="#ec4899" />
        <KPICard label="Активных" value={String(plans.filter(p => p.is_active).length)} icon={Tag} color="#10b981" />
        <KPICard label="Архивных" value={String(plans.filter(p => !p.is_active).length)} icon={Archive} color="#9ca3af" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Название", "Тип", "Стоимость", "Статус", ""].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-900">{plan.name}</td>
                <td className="px-6 py-3 text-gray-500">{PLAN_TYPE_LABEL[plan.plan_type]}</td>
                <td className="px-6 py-3 text-gray-900">{plan.price} {plan.currency}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${plan.is_active ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-100"}`}>
                    {plan.is_active ? "Активен" : "Архив"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => setModal(plan)} className="text-gray-400 hover:text-blue-600 mr-2">
                    <Pencil className="w-4 h-4" />
                  </button>
                  {plan.is_active && (
                    <button onClick={() => archive(plan)} className="text-gray-400 hover:text-red-500">
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">Тарифов пока нет</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== false && (
        <SubscriptionPlanFormModal
          initial={modal}
          services={services}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}
