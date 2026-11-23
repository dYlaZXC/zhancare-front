"use client";

import { motion } from "framer-motion";
import {
  Activity, Stethoscope, Home, TrendingUp, Calendar, Loader2,
  Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { CalendarCard } from "@/components/services/profile/CalendarCard";
import ConsultationChart from "@/components/services/profile/ConsultationChart";
import { useProfileData } from "@/components/services/profile/useProfileData";

export default function PatientActivityDashboard() {
  const { consultations, appointments, consultationTrendData, loading } = useProfileData();

  const now = new Date();
  const thisMonth = (items: { date: string }[]) =>
    items.filter(({ date }) => {
      const d = new Date(date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

  const consultThisMonth = thisMonth(
    consultations.map((c) => ({ date: c.created_at }))
  );
  const appointsThisMonth = thisMonth(
    appointments.map((a) => ({ date: a.appointment_time }))
  );

  const stats = [
    {
      label: "Консультации",
      value: loading ? "—" : consultations.length,
      icon: Stethoscope,
      accent: "#3772ff",
      bg: "linear-gradient(135deg, #ebf1ff, #d6e4ff)",
    },
    {
      label: "Домашних визитов",
      value: loading ? "—" : appointments.length,
      icon: Home,
      accent: "#10b981",
      bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
    },
    {
      label: "В этом месяце",
      value: loading ? "—" : consultThisMonth + appointsThisMonth,
      icon: Calendar,
      accent: "#f59e0b",
      bg: "linear-gradient(135deg, #fef3c7, #fde68a)",
    },
    {
      label: "Всего событий",
      value: loading ? "—" : consultations.length + appointments.length,
      icon: TrendingUp,
      accent: "#8b5cf6",
      bg: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
    },
  ];

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === "cancelled") return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertCircle className="w-4 h-4 text-amber-400" />;
  };

  const statusLabel: Record<string, string> = {
    completed: "Завершён",
    cancelled: "Отменён",
    pending: "Ожидает",
    ongoing: "В процессе",
  };

  const recentConsultations = [...consultations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime())
    .slice(0, 5);

  return (
    <div className="w-full space-y-6">

      {/* ── HERO BANNER ── */}
      <div className="relative rounded-3xl overflow-hidden px-8 py-7"
           style={{ background: "linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30"
               style={{ background: "radial-gradient(circle, #3772ff, transparent)" }} />
          <div className="absolute -bottom-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-20"
               style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
          <svg className="absolute right-0 top-0 h-full opacity-5" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid-activity" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#grid-activity)" />
          </svg>
        </div>
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20"
               style={{ background: "rgba(55,114,255,0.3)" }}>
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Активность</h1>
            <p className="text-blue-200/70 text-sm mt-0.5">
              Ваши консультации, домашние визиты и события
            </p>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, accent, bg }) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full rounded-r-full"
                 style={{ background: accent }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                 style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <p className="text-2xl font-black text-gray-800">{value}</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── CALENDAR + CHART ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <CalendarCard />
        </div>

        <div className="lg:col-span-2 relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full rounded-r-full"
               style={{ background: "linear-gradient(to bottom, #3772ff, #6048f5)" }} />
          <div className="px-6 pt-5 pb-2 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #ebf1ff, #d6e4ff)" }}>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Динамика консультаций</h3>
              <p className="text-[11px] text-gray-400">По датам обращений</p>
            </div>
          </div>
          <div className="px-4 py-2">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : consultationTrendData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-300">
                <TrendingUp className="w-10 h-10" />
                <span className="text-sm font-medium text-gray-400">Данных пока нет</span>
              </div>
            ) : (
              <ConsultationChart data={consultationTrendData} />
            )}
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent consultations */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full rounded-r-full"
               style={{ background: "linear-gradient(to bottom, #3772ff, #6048f5)" }} />
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #ebf1ff, #d6e4ff)" }}>
              <Stethoscope className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Последние консультации</h3>
              <p className="text-[11px] text-gray-400">{consultations.length} всего</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              </div>
            ) : recentConsultations.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-gray-300">
                <Stethoscope className="w-8 h-8" />
                <span className="text-sm text-gray-400">Консультаций нет</span>
              </div>
            ) : (
              recentConsultations.map((c) => (
                <div key={c.id} className="px-6 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {c.doctor_first_name} {c.doctor_last_name}
                    </p>
                    {c.doctor_specialty && (
                      <p className="text-[11px] text-gray-400 truncate">{c.doctor_specialty}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(c.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent home appointments */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full rounded-r-full"
               style={{ background: "linear-gradient(to bottom, #10b981, #059669)" }} />
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
              <Home className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Домашние визиты</h3>
              <p className="text-[11px] text-gray-400">{appointments.length} всего</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-gray-300">
                <Home className="w-8 h-8" />
                <span className="text-sm text-gray-400">Визитов нет</span>
              </div>
            ) : (
              recentAppointments.map((a) => (
                <div key={a.id} className="px-6 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Home className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.doctor_name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {statusIcon(a.status)}
                      <span className="text-[11px] text-gray-400">
                        {statusLabel[a.status] ?? a.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(a.appointment_time).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
