"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { IdCard, Wallet, Users, CalendarCheck } from "lucide-react";
import { KPICard, SectionTitle } from "../dashboardUI";

interface InstructorLoadRow {
  instructor__id: number;
  instructor__first_name: string;
  instructor__last_name: string;
  sessions_count: number;
}

interface Analytics {
  active_subscriptions: number;
  sold_subscriptions: number;
  revenue: number;
  completed_sessions: number;
  instructor_load: InstructorLoadRow[];
}

function fmtKZT(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₸`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} тыс ₸`;
  return `${n} ₸`;
}

export default function SubscriptionsOverview() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/subscriptions/analytics/");
      setData(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось загрузить аналитику");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Загрузка...</div>;
  }
  if (error || !data) {
    return <div className="p-8 text-center text-gray-400">{error || "Нет данных"}</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Абонементы</h1>
        <p className="text-gray-600">Обзор продаж, занятий и загрузки инструкторов</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Активных абонементов" value={String(data.active_subscriptions)} icon={IdCard} color="#ec4899" />
        <KPICard label="Продано всего" value={String(data.sold_subscriptions)} icon={Wallet} color="#3772ff" />
        <KPICard label="Выручка" value={fmtKZT(data.revenue)} icon={Users} color="#10b981" />
        <KPICard label="Проведено занятий" value={String(data.completed_sessions)} icon={CalendarCheck} color="#f59e0b" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle>Загрузка инструкторов</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Инструктор", "Занятий проведено"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.instructor_load.map(row => (
                <tr key={row.instructor__id} className="border-b border-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {row.instructor__first_name} {row.instructor__last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{row.sessions_count}</td>
                </tr>
              ))}
              {data.instructor_load.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400 text-sm">Пока нет завершённых занятий</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
