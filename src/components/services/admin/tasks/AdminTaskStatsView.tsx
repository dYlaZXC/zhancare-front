"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { RefreshCw, ListChecks, CheckCircle2, AlertTriangle, Activity, Timer } from "lucide-react";
import { BLUE, SectionTitle, KPICard } from "../dashboardUI";
import type { AdminTaskStatsByAdmin } from "./types/taskTypes";

function fmtDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} мин`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} ч`;
  return `${(hours / 24).toFixed(1)} дн`;
}

export default function AdminTaskStatsView({ user }: { user: any }) {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = `${today.slice(0, 7)}-01`;

  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState<AdminTaskStatsByAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get(`/admin-tasks/by-admin/?start=${startDate}&end=${endDate}`);
      setRows(res.data.admins);
    } catch (err) {
      console.error("Admin task stats fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl animate-pulse" style={{ background: BLUE }} />
        <p className="text-gray-500 font-medium animate-pulse">Загрузка статистики...</p>
      </div>
    );
  }

  if (!rows) return null;

  const totals = rows.reduce((acc, r) => ({
    created: acc.created + r.created_count,
    completed: acc.completed + r.completed_count,
    overdue: acc.overdue + r.overdue_count,
    active: acc.active + r.active_now_count,
  }), { created: 0, completed: 0, overdue: 0, active: 0 });

  const sorted = [...rows].sort((a, b) => b.overdue_count - a.overdue_count || b.active_now_count - a.active_now_count);

  return (
    <div className="space-y-6 pb-12">

      {/* Date range + refresh */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" />
        <span className="text-gray-300 text-sm">—</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" />
        <button onClick={() => fetchStats(true)}
          className="p-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors" title="Обновить">
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="text-xs text-gray-400 -mt-4">
        «Создано» и «Выполнено» — за выбранный период. «Просрочено» и «В работе сейчас» — всегда текущее состояние, период на них не влияет.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Создано задач" value={totals.created.toLocaleString("ru-RU")} icon={ListChecks} color="#3772ff" />
        <KPICard label="Выполнено" value={totals.completed.toLocaleString("ru-RU")} icon={CheckCircle2} color="#10b981" />
        <KPICard label="Просрочено сейчас" value={totals.overdue.toLocaleString("ru-RU")} icon={AlertTriangle} color="#ef4444" />
        <KPICard label="В работе сейчас" value={totals.active.toLocaleString("ru-RU")} icon={Activity} color="#f59e0b" />
      </div>

      {/* Per-admin table */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-6">
        <SectionTitle>Нагрузка по админам</SectionTitle>
        {sorted.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Нет данных</div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400">
                  <th className="px-2 py-2 font-semibold">Админ</th>
                  <th className="px-2 py-2 font-semibold">Клиника</th>
                  <th className="px-2 py-2 font-semibold text-right">Создано</th>
                  <th className="px-2 py-2 font-semibold text-right">Выполнено</th>
                  <th className="px-2 py-2 font-semibold text-right">Просрочено</th>
                  <th className="px-2 py-2 font-semibold text-right">В работе</th>
                  <th className="px-2 py-2 font-semibold text-right">Среднее время</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.admin_id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-2 py-2.5 font-semibold text-gray-800">{r.admin_name || "—"}</td>
                    <td className="px-2 py-2.5 text-gray-500">{r.clinic_name ?? "—"}</td>
                    <td className="px-2 py-2.5 text-right text-gray-700">{r.created_count}</td>
                    <td className="px-2 py-2.5 text-right text-emerald-600 font-semibold">{r.completed_count}</td>
                    <td className={`px-2 py-2.5 text-right font-semibold ${r.overdue_count > 0 ? "text-red-500" : "text-gray-300"}`}>
                      {r.overdue_count}
                    </td>
                    <td className={`px-2 py-2.5 text-right font-semibold ${r.active_now_count > 0 ? "text-amber-600" : "text-gray-300"}`}>
                      {r.active_now_count}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Timer className="w-3 h-3 text-gray-300" />
                        {fmtDuration(r.avg_completion_minutes)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
