"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Users, Stethoscope, CalendarCheck,
  RefreshCw, Activity,
  Star, Award, Target, Repeat,
  Wallet, HandCoins, FlaskConical, Video, Home,
} from "lucide-react";
import { BRAND, BLUE, COLORS, SectionTitle, ChartTip, KPICard } from "./dashboardUI";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportData {
  revenue_report: {
    total_revenue: number;
    clinic_revenue: number;
    doctor_revenue: number;
    monthly_revenue: { month: string; revenue: number }[];
    revenue_by_service: { service: string; revenue: number; count: number; clinic_revenue?: number; doctor_revenue?: number }[];
  };
  consultation_report: {
    total_consultations: number;
    by_status: { status: string; count: number }[];
    by_doctor: { doctor_name: string; consultations: number }[];
    by_specialization: { specialization: string; count: number }[];
    completion_rate: number;
    cancellation_rate: number;
    avg_duration_min: number | null;
  };
  appointment_report: {
    total_appointments: number;
    by_status: { status: string; count: number }[];
    by_nurse: { nurse_name: string; appointments: number }[];
  };
  patient_report: {
    total_patients: number;
    new_patients_monthly: { month: string; count: number }[];
    by_age_group: { age_group: string; count: number }[];
  };
  growth_metrics: {
    consultations_change: number | null;
    appointments_change: number | null;
    revenue_change: number | null;
    new_patients_change: number | null;
    new_patients_current: number;
  };
  funnel: { stage: string; count: number; rate: number }[];
  peak_hours: { hour: number; count: number }[];
  weekday_distribution: { day: string; count: number }[];
  daily_trend: { date: string; count: number }[];
  doctor_performance: {
    doctor_id: number;
    doctor_name: string;
    specialization: string;
    total: number;
    completed: number;
    cancelled: number;
    completion_rate: number;
    cancellation_rate: number;
  }[];
  patient_retention: {
    total_unique: number;
    repeat: number;
    one_time: number;
    retention_rate: number;
  };
}

interface ClinicStats {
  total_doctors: number;
  total_nurses: number;
  total_patients: number;
  active_consultations: number;
  completed_consultations_today: number;
  pending_appointments: number;
  total_revenue_month: number;
  average_rating: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtKZT(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₸`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} тыс ₸`;
  return `${n} ₸`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PeakHeatmap({ data }: { data: { hour: number; count: number }[] }) {
  const map: Record<number, number> = {};
  data.forEach(d => { map[d.hour] = d.count; });
  const maxVal = Math.max(...data.map(d => d.count), 1);

  const cell = (count: number) => {
    const r = count / maxVal;
    if (r === 0) return { bg: "bg-gray-100", text: "text-gray-300" };
    if (r < 0.2) return { bg: "bg-blue-100", text: "text-blue-600" };
    if (r < 0.4) return { bg: "bg-blue-200", text: "text-blue-700" };
    if (r < 0.6) return { bg: "bg-blue-400", text: "text-white" };
    if (r < 0.8) return { bg: "bg-blue-500", text: "text-white" };
    return { bg: "bg-blue-700", text: "text-white" };
  };

  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 24 }, (_, h) => {
          const count = map[h] ?? 0;
          const { bg, text } = cell(count);
          return (
            <div key={h} title={`${String(h).padStart(2, "0")}:00 — ${count}`}
              className={`${bg} rounded-lg flex flex-col items-center justify-center py-2.5 cursor-default transition-transform hover:scale-105`}
            >
              <span className={`text-[10px] font-bold ${text}`}>{count > 0 ? count : ""}</span>
              <span className="text-[9px] text-gray-400 mt-0.5">{String(h).padStart(2, "0")}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-gray-400 mr-1">Меньше</span>
        {["bg-gray-100", "bg-blue-100", "bg-blue-200", "bg-blue-400", "bg-blue-500", "bg-blue-700"].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span className="text-[10px] text-gray-400 ml-1">Больше</span>
      </div>
    </div>
  );
}

function Funnel({ funnel }: { funnel: { stage: string; count: number; rate: number }[] }) {
  const max = Math.max(...funnel.map(f => f.count), 1);
  const pal = ["#3772ff", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"];
  return (
    <div className="space-y-2.5">
      {funnel.map((f, i) => (
        <div key={f.stage} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 text-right flex-shrink-0">{f.stage}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
            <div className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700"
              style={{ width: `${Math.max((f.count / max) * 100, f.count > 0 ? 6 : 0)}%`, background: pal[i % pal.length] }}>
              {f.count > 0 && <span className="text-white text-[11px] font-bold">{f.count}</span>}
            </div>
          </div>
          <span className="text-xs font-bold text-gray-700 w-11 flex-shrink-0 text-right">{f.rate}%</span>
        </div>
      ))}
    </div>
  );
}

function DoctorBoard({ doctors }: { doctors: ReportData["doctor_performance"] }) {
  const MEDALS = ["from-amber-400 to-orange-400", "from-gray-300 to-gray-400", "from-amber-600 to-amber-700"];
  return (
    <div className="space-y-1">
      {doctors.slice(0, 10).map((d, i) => (
        <div key={d.doctor_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          {i < 3
            ? <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${MEDALS[i]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-[10px] font-black">{i + 1}</span>
              </div>
            : <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">{i + 1}</span>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{d.doctor_name}</p>
            <p className="text-[10px] text-gray-400 truncate">{d.specialization}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-black text-gray-900">{d.total}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">{d.completion_rate}% ✓</p>
          </div>
          <div className="w-14 flex-shrink-0">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${d.completion_rate}%`, background: BLUE }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReportsView({ user }: { user: any }) {
  const today = new Date().toISOString().split("T")[0];
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [startDate, setStartDate] = useState(yearStart);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<ReportData | null>(null);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [reportRes, statsRes] = await Promise.all([
        api.get(`/reports/?start=${startDate}&end=${endDate}`),
        api.get("/clinic-stats/"),
      ]);
      setData(reportRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl animate-pulse" style={{ background: BRAND }} />
        <p className="text-gray-500 font-medium animate-pulse">Загрузка аналитики...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-12">

      {/* Date range + refresh */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" />
        <span className="text-gray-300 text-sm">—</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none transition-colors" />
        <button onClick={() => fetchAll(true)}
          className="p-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors" title="Обновить">
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Консультации" value={data.consultation_report.total_consultations.toLocaleString("ru-RU")}
          sub={`${data.consultation_report.completion_rate}% завершено`}
          icon={Stethoscope} change={data.growth_metrics.consultations_change} color="#3772ff" />
        <KPICard label="Выезды на дом" value={data.appointment_report.total_appointments.toLocaleString("ru-RU")}
          icon={CalendarCheck} change={data.growth_metrics.appointments_change} color="#8b5cf6" />
        <KPICard label="Выручка" value={fmtKZT(data.revenue_report.total_revenue)}
          icon={TrendingUp} change={data.growth_metrics.revenue_change} color="#10b981" />
        <KPICard label="Пациентов" value={data.patient_report.total_patients.toLocaleString("ru-RU")}
          sub={`+${data.growth_metrics.new_patients_current} новых`}
          icon={Users} change={data.growth_metrics.new_patients_change} color="#f59e0b" />
        <KPICard label="Конверсия" value={`${data.consultation_report.completion_rate}%`}
          sub="завершённых" icon={Target} color="#06b6d4" />
        <KPICard label="Удержание" value={`${data.patient_retention.retention_rate}%`}
          sub={`${data.patient_retention.repeat} повторных`} icon={Repeat} color="#ec4899" />
      </div>

      {/* Live stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { label: "Врачей", value: stats.total_doctors, icon: Stethoscope, color: "#3772ff" },
            { label: "Медсестёр", value: stats.total_nurses, icon: Award, color: "#8b5cf6" },
            { label: "Активных сейчас", value: stats.active_consultations, icon: Activity, color: "#10b981" },
            { label: "Рейтинг клиники", value: stats.average_rating ? `${stats.average_rating.toFixed(1)} ★` : "—", icon: Star, color: "#f59e0b" },
          ] as const).map(item => (
            <KPICard key={item.label} label={item.label} value={String(item.value)} icon={item.icon} color={item.color} />
          ))}
        </div>
      )}

      {/* Revenue + Daily Trend */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <SectionTitle>Выручка по месяцам</SectionTitle>
          {data.revenue_report.monthly_revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.revenue_report.monthly_revenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="#eef1f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => fmtKZT(v)} width={70} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} formatter={(v: any) => fmtKZT(Number(v))} />
                <Area type="monotone" dataKey="revenue" name="Выручка" stroke={BLUE} strokeWidth={3}
                  fill="url(#revGrad)" dot={{ r: 4, fill: "#fff", stroke: BLUE, strokeWidth: 2.5 }}
                  activeDot={{ r: 6, fill: BLUE, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Нет данных по выручке</div>
          )}
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <SectionTitle>Консультации по дням</SectionTitle>
          {data.daily_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.daily_trend}>
                <defs>
                  <linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="#eef1f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="count" name="Консультаций" stroke="#8b5cf6" strokeWidth={2.5}
                  fill="url(#dayGrad)" dot={false} activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
          )}
        </div>
      </div>

      {/* Money flow: clinic vs doctor split, broken down by revenue source */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
        <SectionTitle>Структура доходов</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <Wallet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-lg font-black text-gray-900">{fmtKZT(data.revenue_report.clinic_revenue)}</p>
              <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wide">Доход клиники</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
            <HandCoins className="w-5 h-5 text-violet-600 flex-shrink-0" />
            <div>
              <p className="text-lg font-black text-gray-900">{fmtKZT(data.revenue_report.doctor_revenue)}</p>
              <p className="text-[10px] text-violet-700 font-semibold uppercase tracking-wide">Выплаты врачам</p>
            </div>
          </div>
        </div>

        {data.revenue_report.revenue_by_service.length > 0 ? (
          <div className="space-y-2.5">
            {data.revenue_report.revenue_by_service.map(item => {
              const Icon = item.service.includes('онлайн') ? Video : item.service.includes('оффлайн') ? Stethoscope
                : item.service.includes('Диагностика') ? FlaskConical : Home;
              const hasSplit = item.clinic_revenue != null && item.doctor_revenue != null;
              const clinicPct = hasSplit && item.revenue > 0 ? Math.round((item.clinic_revenue! / item.revenue) * 100) : 100;
              return (
                <div key={item.service} className="rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">{item.service}</span>
                      <span className="text-xs text-gray-400">· {item.count}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{fmtKZT(item.revenue)}</span>
                  </div>
                  {hasSplit && item.doctor_revenue! > 0 && (
                    <>
                      <div className="h-1.5 w-full rounded-full bg-violet-100 overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: `${clinicPct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                        <span>Клиника: {fmtKZT(item.clinic_revenue!)}</span>
                        <span>Врач: {fmtKZT(item.doctor_revenue!)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400 text-sm">Нет данных по доходам за этот период</div>
        )}
      </div>

      {/* Funnel + Weekday */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <SectionTitle>Воронка консультаций</SectionTitle>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Отмена / пропуск</p>
              <p className="text-xl font-black text-red-500">{data.consultation_report.cancellation_rate}%</p>
            </div>
          </div>
          <Funnel funnel={data.funnel} />
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <SectionTitle>Нагрузка по дням недели</SectionTitle>
          {data.weekday_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.weekday_distribution} barSize={28}>
                <defs>
                  <linearGradient id="weekdayGradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b8bff" />
                    <stop offset="100%" stopColor={BLUE} />
                  </linearGradient>
                  <linearGradient id="weekdayGradAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="#eef1f6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" name="Консультаций" radius={[8, 8, 0, 0]}>
                  {data.weekday_distribution.map((_, i) => (
                    <Cell key={i} fill={i >= 5 ? "url(#weekdayGradAmber)" : "url(#weekdayGradBlue)"} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#6b7280' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
          )}
        </div>
      </div>

      {/* Peak Hours */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Тепловая карта активности (часы)</SectionTitle>
          {data.peak_hours.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              Пик: {data.peak_hours.reduce((a, b) => b.count > a.count ? b : a, data.peak_hours[0])?.hour}:00
            </span>
          )}
        </div>
        {data.peak_hours.length > 0
          ? <PeakHeatmap data={data.peak_hours} />
          : <div className="h-20 flex items-center justify-center text-gray-400 text-sm">Нет данных о часах</div>
        }
      </div>

      {/* Doctor Leaderboard + Specializations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <SectionTitle>Рейтинг врачей</SectionTitle>
          {data.doctor_performance.length > 0
            ? <DoctorBoard doctors={data.doctor_performance} />
            : <p className="text-gray-400 text-sm text-center py-8">Нет данных</p>
          }
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <SectionTitle>По специализациям</SectionTitle>
          {data.consultation_report.by_specialization.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.consultation_report.by_specialization.slice(0, 8)}
                layout="vertical" barSize={16} margin={{ left: 10, right: 24 }}>
                <defs>
                  <linearGradient id="specGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5b8bff" />
                    <stop offset="100%" stopColor={BLUE} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="#eef1f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="specialization" tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 500 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" name="Консультаций" fill="url(#specGrad)" radius={[0, 8, 8, 0]}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
          )}
        </div>
      </div>

      {/* Patient Retention + Age */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <SectionTitle>Удержание пациентов</SectionTitle>
          <div className="flex items-center gap-6">
            <div className="relative w-36 h-36 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="retentionGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#5b8bff" />
                      <stop offset="100%" stopColor={BLUE} />
                    </linearGradient>
                  </defs>
                  <Pie data={[
                    { name: "Повторные", value: data.patient_retention.repeat },
                    { name: "Разовые", value: data.patient_retention.one_time },
                  ]} cx="50%" cy="50%" innerRadius={44} outerRadius={62}
                    dataKey="value" startAngle={90} endAngle={-270}
                    paddingAngle={data.patient_retention.one_time > 0 ? 3 : 0} cornerRadius={8}
                    stroke="#fff" strokeWidth={2}>
                    <Cell fill="url(#retentionGrad)" />
                    <Cell fill="#eef1f6" />
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-gray-900">{data.patient_retention.retention_rate}%</span>
                <span className="text-[10px] text-gray-400">возврат</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { label: "Уникальных", value: data.patient_retention.total_unique, dot: "bg-gray-300" },
                { label: "Повторных", value: data.patient_retention.repeat, dot: "bg-blue-500" },
                { label: "Разовых", value: data.patient_retention.one_time, dot: "bg-gray-200" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <SectionTitle>Возрастные группы пациентов</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.patient_report.by_age_group} barSize={32}>
              <CartesianGrid strokeDasharray="4 8" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="age_group" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" name="Пациентов" radius={[8, 8, 0, 0]}>
                {data.patient_report.by_age_group.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#6b7280' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statuses */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[
          { title: "Статусы консультаций", data: data.consultation_report.by_status },
          { title: "Статусы выездов", data: data.appointment_report.by_status },
        ].map(section => (
          <div key={section.title} className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
            <SectionTitle>{section.title}</SectionTitle>
            <div className="flex items-center gap-4">
              <div className="w-36 h-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={section.data} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="count"
                      paddingAngle={section.data.length > 1 ? 3 : 0} cornerRadius={6} stroke="#fff" strokeWidth={2}>
                      {section.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {section.data.map((s, i) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-600">{s.status}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Patients Trend */}
      {data.patient_report.new_patients_monthly.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
          <SectionTitle>Прирост пациентов по месяцам</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.patient_report.new_patients_monthly}>
              <CartesianGrid strokeDasharray="4 8" stroke="#eef1f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="count" name="Новых пациентов" stroke="#10b981"
                strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: "#10b981", strokeWidth: 2.5 }}
                activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
