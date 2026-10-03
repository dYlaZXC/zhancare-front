"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import {
  FlaskConical, Scan, HeartPulse, Brain, Bone, Eye, Baby, Microscope,
  User, Phone, Stethoscope, Building2,
  Search, Loader2, CalendarDays, UserCheck, CalendarPlus,
  Sparkles, FileText,
} from "lucide-react";
import ScheduleReferralModal from "../modals/ScheduleReferralModal";

interface Referral {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  service_id: number | null;
  service_name: string;
  category: string;
  clinic_id: number | null;
  clinic_name: string;
  appointment_time: string | null;
  status: string;
  notes: string;
  doctor_name: string;
  doctor_specialization: string;
  responsible_doctor_name: string;
  source: "manual" | "ai";
  source_type: string | null;
  source_id: number | null;
  original_text: string;
}

// Two mutually exclusive views, chosen server-side via `view` (see
// common/views/admin.py::get_referrals) — 'awaiting' only ever returns
// status='awaiting_schedule' rows (hence one fixed badge), 'booked' returns
// everything with a real appointment_time, which can be any of these four.
const AWAITING_SCHEDULE_BADGE = { label: 'Ожидает записи', bg: '#f5f3ff', text: '#7c3aed', dot: '#a855f7' };
const BOOKED_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  scheduled:   { label: 'Запланировано', bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  confirmed:   { label: 'Подтверждено',  bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e' },
  in_progress: { label: 'В процессе',    bg: '#fefce8', text: '#ca8a04', dot: '#eab308' },
  completed:   { label: 'Завершено',     bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
};

// Matches DiagnosticsAppointment.CATEGORY_CHOICES on the backend — one
// accent color + icon per category, purely cosmetic (falls back to a plain
// flask for anything unset/unrecognized, e.g. free-text services).
const CATEGORY_STYLE: Record<string, { icon: typeof FlaskConical; gradient: string }> = {
  lab:     { icon: FlaskConical, gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
  imaging: { icon: Scan,         gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)' },
  cardio:  { icon: HeartPulse,   gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' },
  neuro:   { icon: Brain,        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  ortho:   { icon: Bone,         gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  ophtha:  { icon: Eye,          gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' },
  peds:    { icon: Baby,         gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  micro:   { icon: Microscope,   gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
};
const DEFAULT_CATEGORY_STYLE = { icon: FlaskConical, gradient: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' };

function plural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'е';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'я';
  return 'й';
}

export function ReferralsContent() {
  const [view, setView] = useState<'awaiting' | 'booked'>('awaiting');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [schedulingReferral, setSchedulingReferral] = useState<Referral | null>(null);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { view };
      if (search)       params.search    = search;
      if (dateFrom)     params.date_from = dateFrom;
      if (dateTo)       params.date_to   = dateTo;
      const { data } = await api.get('/schedule/referrals/', { params });
      setReferrals(data.results ?? []);
    } catch {
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }, [view, search, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(fetchReferrals, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchReferrals]);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return {
      day: d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
      year: d.getFullYear(),
      time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const handleScheduled = (updated: any) => {
    // A just-scheduled referral is no longer awaiting a booking — remove it
    // rather than updating it in place, so it disappears from the
    // 'awaiting' list immediately instead of lingering (with its new time
    // shown) until the next refetch. It now belongs under the 'booked' tab.
    setReferrals(prev => prev.filter(r => r.id !== updated.id));
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── View toggle ── */}
      <div className="inline-flex self-start p-1 rounded-2xl bg-gray-100 gap-1">
        <button
          type="button"
          onClick={() => setView('awaiting')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === 'awaiting' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ожидают записи
        </button>
        <button
          type="button"
          onClick={() => setView('booked')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === 'booked' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Уже записаны
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по пациенту, услуге..."
            className="w-full pl-11 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-2xl bg-white focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm border-2 border-gray-200 rounded-2xl px-3 py-2.5 bg-white focus:border-blue-500 focus:outline-none transition-colors" />
          <span className="text-gray-300 text-xs">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm border-2 border-gray-200 rounded-2xl px-3 py-2.5 bg-white focus:border-blue-500 focus:outline-none transition-colors" />
        </div>
      </div>

      {/* ── Count ── */}
      {!loading && (
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          {referrals.length} направлени{plural(referrals.length)}
        </p>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <FlaskConical className="w-10 h-10 opacity-25" />
          <p className="text-sm">Направлений не найдено</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {referrals.map(r => {
            const sc = view === 'awaiting'
              ? AWAITING_SCHEDULE_BADGE
              : (BOOKED_STATUS_CONFIG[r.status] ?? { label: r.status, bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' });
            const scheduled = r.appointment_time ? fmt(r.appointment_time) : null;
            const cat = CATEGORY_STYLE[r.category] ?? DEFAULT_CATEGORY_STYLE;
            const CatIcon = cat.icon;
            // original_text is frozen AI-extraction context, never the primary
            // label — only shown when it actually adds information beyond
            // the (possibly doctor-edited) service_name.
            const showOriginalText = r.source === 'ai' && r.original_text && r.original_text !== r.service_name;
            return (
              <div key={r.id}
                className="rounded-3xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all bg-white shadow-sm hover:shadow-md">
                <div className="flex items-stretch gap-4">

                  {/* Category icon tile */}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 self-center"
                    style={{ background: cat.gradient }}>
                    <CatIcon className="w-7 h-7 text-white" />
                  </div>

                  <div className="w-px bg-gray-100 flex-shrink-0" />

                  {/* Main content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800">{r.service_name}</h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: sc.bg, color: sc.text }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot }} />
                        {sc.label}
                      </span>
                      {r.source === 'ai' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600">
                          <Sparkles className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                      {!r.service_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                          Услуга клиники: не сопоставлена
                        </span>
                      )}
                    </div>

                    {showOriginalText && (
                      <p className="flex items-start gap-1.5 text-xs text-gray-400 italic -mt-1.5">
                        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        Из исходного текста: «{r.original_text}»
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{r.patient_name}</span>
                      </span>
                      {r.patient_phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {r.patient_phone}
                        </span>
                      )}
                      {r.clinic_name && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {r.clinic_name}
                        </span>
                      )}
                    </div>

                    {(r.doctor_name || r.responsible_doctor_name) && (
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                        {r.doctor_name && (
                          <span className="inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                            <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-3 h-3 text-white" />
                            </span>
                            <span className="text-[10px] font-semibold text-blue-400">Направил:</span>
                            <span className="text-xs font-bold text-blue-700">
                              {r.doctor_name}{r.doctor_specialization && <span className="font-medium text-blue-500"> · {r.doctor_specialization}</span>}
                            </span>
                          </span>
                        )}
                        {r.responsible_doctor_name && (
                          <span className="inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                            <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                              <UserCheck className="w-3 h-3 text-white" />
                            </span>
                            <span className="text-[10px] font-semibold text-indigo-400">Исполнитель:</span>
                            <span className="text-xs font-bold text-indigo-700">{r.responsible_doctor_name}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {r.notes && (
                      <p className="text-xs text-gray-400 italic truncate pt-3 border-t border-gray-100">"{r.notes}"</p>
                    )}
                  </div>

                  <div className="w-px bg-gray-100 flex-shrink-0" />

                  {/* 'awaiting' rows never have a time yet (see
                      get_referrals) — offer to book; 'booked' rows always
                      do — show it read-only instead. */}
                  <div className="text-right flex-shrink-0 pl-2 self-center">
                    {view === 'booked' && scheduled ? (
                      <>
                        <p className="text-xl font-black text-gray-800 leading-tight capitalize">{scheduled.day}</p>
                        <p className="text-xs text-gray-400">{scheduled.year}</p>
                        <p className="text-sm font-bold text-blue-600 mt-1">{scheduled.time}</p>
                      </>
                    ) : (
                      <button
                        onClick={() => setSchedulingReferral(r)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        Записать
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {schedulingReferral && (
        <ScheduleReferralModal
          referral={{
            id: schedulingReferral.id,
            service_name: schedulingReferral.service_name,
            service_id: schedulingReferral.service_id,
            clinic_id: schedulingReferral.clinic_id,
            patient_id: schedulingReferral.patient_id,
            original_text: schedulingReferral.original_text,
          }}
          onScheduled={handleScheduled}
          onClose={() => setSchedulingReferral(null)}
        />
      )}
    </div>
  );
}
