"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { Loader2, Search, Users, CreditCard, AlertTriangle, ClipboardList } from "lucide-react";

import type { DashboardData, TreatmentPlan } from "./types";
import { formatMoney } from "./types";
import { PlanEditor } from "./PlanEditor";
import { OverviewCharts } from "./OverviewCharts";

type Tab = "overview" | "by_patient" | "by_month";

const TAB_LABELS: Record<Tab, string> = {
  overview: "Обзор",
  by_patient: "По пациентам",
  by_month: "По месяцам",
};

const MONTH_LABELS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function formatMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return `${MONTH_LABELS[m - 1]} ${y}`;
}

export function TreatmentPlansView({ user }: { user: any }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPatientPlans, setEditingPatientPlans] = useState<TreatmentPlan | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (appliedSearch) params.search = appliedSearch;
      const { data } = await api.get("/treatment-plans/dashboard/", { params });
      setData(data);
    } catch {
      toast.error("Не удалось загрузить планы лечения");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, appliedSearch]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const reset = () => { setDateFrom(""); setDateTo(""); setSearch(""); setAppliedSearch(""); };

  const openPatientPlans = async (patientId: number) => {
    try {
      const { data } = await api.get("/treatment-plans/", { params: { patient_id: patientId } });
      const list: TreatmentPlan[] = Array.isArray(data) ? data : (data?.results ?? []);
      const activePlan = list.find(p => p.status === "active") ?? list[0];
      if (!activePlan) { toast.info("У пациента нет планов"); return; }
      setEditingPatientPlans(activePlan);
      setShowEditor(true);
    } catch {
      toast.error("Не удалось открыть план");
    }
  };

  const overview = data?.overview;

  const statCards = [
    { label: "Всего пациентов", value: overview?.total_patients ?? 0, color: "#3772ff", bg: "#eaf1ff", Icon: Users },
    { label: "С долгами", value: overview?.with_debt ?? 0, color: "#ef4444", bg: "#fee2e2", Icon: CreditCard },
    { label: "С пропусками", value: overview?.with_no_show ?? 0, color: "#f59e0b", bg: "#fef3c7", Icon: AlertTriangle },
  ];

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Планы лечения</h1>
            <p className="text-gray-600">Статистика и аналитика планов лечения пациентов</p>
          </div>
        </div>

        <div className="flex items-end gap-3 mb-5 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">От</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">До</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none" />
          </div>
          <button onClick={() => setAppliedSearch(search)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#3772ff" }}>
            Применить
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border-2 border-gray-200 hover:bg-gray-50 transition-colors">
            Сбросить
          </button>
        </div>

        <div className="flex items-center gap-1.5 mb-5">
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
              }`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "by_patient" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3" style={{ backgroundColor: s.bg }}>
                <s.Icon className="w-6 h-6 flex-shrink-0" style={{ color: s.color }} />
                <div>
                  <p className="text-sm text-gray-600 mb-0.5">{s.label}</p>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === "by_patient" && (
          <div className="relative mb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Поиск по имени пациента или телефону..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") setAppliedSearch(search); }}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : tab === "overview" ? (
        data ? <OverviewCharts data={data} /> : null
      ) : tab === "by_patient" ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Детализация по пациентам</p>
            <p className="text-xs text-gray-400">Всего: {data?.by_patient.length ?? 0}</p>
          </div>
          {(data?.by_patient.length ?? 0) === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">Планов пока нет</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-2.5 font-semibold">Пациент</th>
                    <th className="px-3 py-2.5 font-semibold">Услуг</th>
                    <th className="px-3 py-2.5 font-semibold">Выполнено</th>
                    <th className="px-3 py-2.5 font-semibold">Не пришёл</th>
                    <th className="px-3 py-2.5 font-semibold">Сумма планов</th>
                    <th className="px-3 py-2.5 font-semibold">Оплачено</th>
                    <th className="px-5 py-2.5 font-semibold">К доплате</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.by_patient.map(row => (
                    <tr key={row.patient_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => openPatientPlans(row.patient_id)}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{row.patient_name}</p>
                        {row.patient_phone && <p className="text-xs text-gray-400">{row.patient_phone}</p>}
                      </td>
                      <td className="px-3 py-3 text-gray-700">{row.plans_count}</td>
                      <td className="px-3 py-3 text-emerald-600 font-medium">{row.items_completed} ({row.completed_pct.toFixed(1)}%)</td>
                      <td className="px-3 py-3 text-red-500 font-medium">{row.items_no_show} ({row.no_show_pct.toFixed(1)}%)</td>
                      <td className="px-3 py-3 text-gray-700">{formatMoney(row.sum_planned)}</td>
                      <td className="px-3 py-3 text-emerald-600">{formatMoney(row.sum_paid)}</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: Number(row.sum_owed) > 0 ? "#ef4444" : "#10b981" }}>
                        {formatMoney(row.sum_owed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Статистика по месяцам</p>
          </div>
          {(data?.by_month.length ?? 0) === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">Данных пока нет</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-2.5 font-semibold">Месяц</th>
                    <th className="px-3 py-2.5 font-semibold">Создано планов</th>
                    <th className="px-3 py-2.5 font-semibold">Выполнено</th>
                    <th className="px-3 py-2.5 font-semibold">Не пришли</th>
                    <th className="px-3 py-2.5 font-semibold">Сумма планов</th>
                    <th className="px-3 py-2.5 font-semibold">Получено оплат</th>
                    <th className="px-3 py-2.5 font-semibold">% выполнения</th>
                    <th className="px-5 py-2.5 font-semibold">% собираемости</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.by_month.map(row => (
                    <tr key={row.month} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-gray-800">{formatMonth(row.month)}</td>
                      <td className="px-3 py-3 text-gray-700">{row.items_total}</td>
                      <td className="px-3 py-3 text-emerald-600 font-medium">{row.items_completed}</td>
                      <td className="px-3 py-3 text-red-500 font-medium">{row.items_no_show}</td>
                      <td className="px-3 py-3 text-gray-700">{formatMoney(row.sum_planned)}</td>
                      <td className="px-3 py-3 text-emerald-600">{formatMoney(row.sum_paid)}</td>
                      <td className="px-3 py-3 text-gray-700">{row.completed_pct.toFixed(1)}%</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: row.collection_pct >= 70 ? "#10b981" : "#ef4444" }}>
                        {row.collection_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showEditor && editingPatientPlans && (
        <PlanEditor
          initialPlan={editingPatientPlans}
          onClose={() => setShowEditor(false)}
          onSaved={fetchDashboard}
        />
      )}
    </div>
  );
}

export default TreatmentPlansView;
