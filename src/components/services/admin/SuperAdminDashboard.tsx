"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { api } from "@/utils/api";
import {
  Building2, Users, UserCheck, Activity, TrendingUp,
  RefreshCw, Wifi, Star, Calendar, ChevronRight,
} from "lucide-react";

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

const KPI_CARDS = (s: Stats) => [
  { label: "Клиник", value: s.total_clinics, icon: Building2, color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  { label: "Врачей всего", value: s.total_doctors, icon: Users, color: "#3772ff", bg: "rgba(55,114,255,0.12)" },
  { label: "Онлайн сейчас", value: s.online_doctors, icon: Wifi, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { label: "Пациентов", value: s.total_patients, icon: UserCheck, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { label: "Консультаций сегодня", value: s.completed_consultations_today, icon: Activity, color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  { label: "Доход за месяц", value: `${(s.total_revenue_month / 1000).toFixed(0)}K ₸`, icon: TrendingUp, color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
];

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return (
    <div className="p-8 text-center text-gray-400">Не удалось загрузить данные</div>
  );

  const pieData = Object.entries(stats.consultation_status_distribution).map(([k, v]) => ({
    name: STATUS_LABELS[k], value: v,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen" style={{ background: "linear-gradient(135deg, #0e121d 0%, #131928 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Платформа ZhanCare.AI</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Обновлено: {lastUpdated ? lastUpdated.toLocaleTimeString("ru-RU") : "—"} · автообновление 30с
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_CARDS(stats).map((card) => (
          <div key={card.label} className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-400 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 7-day trend */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-semibold text-white mb-4">Консультации за 7 дней</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.analytics_data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="gConsult" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3772ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3772ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f1f5f9", fontSize: 12 }}
                cursor={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <Area type="monotone" dataKey="consultations" name="Всего" stroke="#3772ff" strokeWidth={2} fill="url(#gConsult)" />
              <Area type="monotone" dataKey="completed_consultations" name="Завершено" stroke="#10b981" strokeWidth={2} fill="url(#gDone)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-semibold text-white mb-4">Статусы консультаций</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f1f5f9", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[i] }} />
                  {d.name}
                </span>
                <span className="text-white font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue bar */}
      <div className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-sm font-semibold text-white mb-4">Выручка по дням (₸)</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={stats.analytics_data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f1f5f9", fontSize: 12 }}
              formatter={(v: number) => [`${v.toLocaleString()} ₸`, "Выручка"]}
            />
            <Bar dataKey="revenue" name="Выручка" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Clinics breakdown table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-semibold text-white">Клиники платформы</p>
          <a href="/admin/clinics" className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
            Управление <ChevronRight size={12} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Клиника", "Город", "Врачей", "Онлайн", "Сегодня", "Активных", "Рейтинг"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.clinics_breakdown.map((c, i) => (
                <tr key={c.id}
                  className="transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: i < stats.clinics_breakdown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {c.logo
                        ? <img src={c.logo} alt="" className="w-7 h-7 rounded-lg object-cover" />
                        : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: "linear-gradient(135deg, #3772ff, #a855f7)" }}>
                            {c.name[0]}
                          </div>
                      }
                      <span className="text-white font-medium text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.city ?? "—"}</td>
                  <td className="px-4 py-3 text-white">{c.doctors}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {c.online_doctors}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">{c.consultations_today}</td>
                  <td className="px-4 py-3">
                    {c.active_consultations > 0
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-300" style={{ background: "rgba(55,114,255,0.15)" }}>{c.active_consultations}</span>
                      : <span className="text-gray-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                      <Star size={11} />
                      {c.rating > 0 ? c.rating.toFixed(1) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.clinics_breakdown.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">Клиник не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
