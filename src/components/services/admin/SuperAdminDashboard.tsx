"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { api } from "@/utils/api";
import {
  Building2, Users, UserCheck, Activity, TrendingUp,
  RefreshCw, Wifi, Star, ChevronRight,
} from "lucide-react";
import { BRAND, BLUE, SectionTitle, ChartTip, KPICard } from "./dashboardUI";

interface User { id: number; email: string; first_name: string; last_name: string; }

interface ClinicRow {
  id: number; name: string; city: string | null;
  doctors: number; online_doctors: number;
  consultations_today: number; active_consultations: number;
  rating: number; logo: string | null;
}

interface Stats {
  total_clinics: number; total_doctors: number; total_nurses: number;
  total_patients: number; online_doctors: number;
  active_consultations: number; completed_consultations_today: number;
  pending_appointments: number; total_revenue_month: number;
  average_rating: number;
  analytics_data: { day: string; consultations: number; completed_consultations: number; revenue: number; new_patients: number }[];
  consultation_status_distribution: { pending: number; in_progress: number; completed: number; cancelled: number };
  clinics_breakdown: ClinicRow[];
}

function fmtKZT(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₸`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} тыс ₸`;
  return `${n} ₸`;
}

const STATUS_COLORS = ["#f59e0b", "#3772ff", "#10b981", "#ef4444"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает", in_progress: "В процессе", completed: "Завершено", cancelled: "Отменено",
};

export default function SuperAdminDashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get("/clinic-stats/");
      setStats(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // auto-refresh every 30 sec
  useEffect(() => {
    const t = setInterval(() => load(true), 30_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl animate-pulse" style={{ background: BRAND }} />
        <p className="text-gray-500 font-medium animate-pulse">Загрузка панели...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-8 text-center text-gray-400">Не удалось загрузить данные</div>;
  }

  const pieData = Object.entries(stats.consultation_status_distribution).map(([k, v]) => ({
    name: STATUS_LABELS[k], value: v,
  }));

  return (
    <div className="space-y-6 pb-12">

      {/* Header, same plain-light pattern as TasksView/ClinicManagement */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Платформа ZhanCare.AI</h1>
          <p className="text-gray-600">
            Обновлено: {lastUpdated ? lastUpdated.toLocaleTimeString("ru-RU") : "—"} · автообновление 30с
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Обновить
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Клиник" value={String(stats.total_clinics)} icon={Building2} color="#8b5cf6" />
        <KPICard label="Врачей всего" value={String(stats.total_doctors)} icon={Users} color={BLUE} />
        <KPICard label="Онлайн сейчас" value={String(stats.online_doctors)} icon={Wifi} color="#10b981" />
        <KPICard label="Пациентов" value={String(stats.total_patients)} icon={UserCheck} color="#f59e0b" />
        <KPICard label="Консультаций сегодня" value={String(stats.completed_consultations_today)} icon={Activity} color="#ec4899" />
        <KPICard label="Доход за месяц" value={fmtKZT(stats.total_revenue_month)} icon={TrendingUp} color="#06b6d4" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* 7-day trend */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle>Консультации за 7 дней</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.analytics_data}>
              <defs>
                <linearGradient id="gConsult" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="consultations" name="Всего" stroke={BLUE} strokeWidth={2.5} fill="url(#gConsult)" />
              <Area type="monotone" dataKey="completed_consultations" name="Завершено" stroke="#10b981" strokeWidth={2.5} fill="url(#gDone)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle>Статусы консультаций</SectionTitle>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[i] }} />
                  {d.name}
                </span>
                <span className="text-gray-900 font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle>Выручка по дням (₸)</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={stats.analytics_data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtKZT(v)} width={70} />
            <Tooltip content={<ChartTip />} formatter={(v: any) => fmtKZT(Number(v))} />
            <Bar dataKey="revenue" name="Выручка" fill="#8b5cf6" fillOpacity={0.85} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Clinics breakdown table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <SectionTitle>Клиники платформы</SectionTitle>
          <a href="/admin/clinics" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Управление <ChevronRight size={12} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Клиника", "Город", "Врачей", "Онлайн", "Сегодня", "Активных", "Рейтинг"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.clinics_breakdown.map((c, i) => (
                <tr key={c.id}
                  className="transition-colors hover:bg-gray-50"
                  style={{ borderBottom: i < stats.clinics_breakdown.length - 1 ? "1px solid #f3f4f6" : "none" }}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      {c.logo
                        ? <img src={c.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: BRAND }}>
                            {c.name[0]}
                          </div>
                      }
                      <span className="text-gray-900 font-bold text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{c.city ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-900 font-medium">{c.doctors}</td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {c.online_doctors}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-900 font-medium">{c.consultations_today}</td>
                  <td className="px-6 py-3">
                    {c.active_consultations > 0
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-blue-600 bg-blue-50">{c.active_consultations}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star size={11} />
                      {c.rating > 0 ? c.rating.toFixed(1) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.clinics_breakdown.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">Клиник не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
