"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import {
  FlaskConical, User, Phone, Stethoscope, Building2,
  Clock, Search, ChevronDown, Loader2, CalendarDays, UserCheck,
} from "lucide-react";

interface Referral {
  id: number;
  patient_name: string;
  patient_phone: string;
  service_name: string;
  category: string;
  clinic_name: string;
  appointment_time: string;
  status: string;
  notes: string;
  doctor_name: string;
  doctor_specialization: string;
  responsible_doctor_name: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  scheduled:   { label: 'Запланировано', bg: '#eff6ff', text: '#2563eb',  dot: '#3b82f6' },
  confirmed:   { label: 'Подтверждено',  bg: '#f0fdf4', text: '#16a34a',  dot: '#22c55e' },
  in_progress: { label: 'В процессе',    bg: '#fefce8', text: '#ca8a04',  dot: '#eab308' },
  completed:   { label: 'Завершено',     bg: '#f0fdf4', text: '#15803d',  dot: '#22c55e' },
  cancelled:   { label: 'Отменено',      bg: '#fef2f2', text: '#dc2626',  dot: '#ef4444' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'scheduled',   label: 'Запланировано' },
  { value: 'confirmed',   label: 'Подтверждено'  },
  { value: 'in_progress', label: 'В процессе'    },
  { value: 'completed',   label: 'Завершено'     },
  { value: 'cancelled',   label: 'Отменено'      },
];

function plural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'е';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'я';
  return 'й';
}

export function ReferralsContent() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusDropdown, setStatusDropdown] = useState(false);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search)       params.search    = search;
      if (statusFilter) params.status    = statusFilter;
      if (dateFrom)     params.date_from = dateFrom;
      if (dateTo)       params.date_to   = dateTo;
      const { data } = await api.get('/schedule/referrals/', { params });
      setReferrals(data.results ?? []);
    } catch {
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(fetchReferrals, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchReferrals]);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
      year: d.getFullYear(),
      time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="flex flex-col gap-3">

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по пациенту, услуге..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <span className="text-gray-300 text-xs">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>

        <div className="relative">
          <button type="button" onClick={() => setStatusDropdown(v => !v)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
            {statusFilter ? (STATUS_CONFIG[statusFilter]?.label ?? statusFilter) : 'Все статусы'}
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${statusDropdown ? 'rotate-180' : ''}`} />
          </button>
          {statusDropdown && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-40">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { setStatusFilter(opt.value); setStatusDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${statusFilter === opt.value ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Count ── */}
      {!loading && (
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          {referrals.length} направлени{plural(referrals.length)}
        </p>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
          <FlaskConical className="w-9 h-9 opacity-25" />
          <p className="text-sm">Направлений не найдено</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
          {referrals.map(r => {
            const sc = STATUS_CONFIG[r.status] ?? { label: r.status, bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' };
            const { date, year, time } = fmt(r.appointment_time);
            return (
              <div key={r.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group">

                {/* Date column */}
                <div className="flex-shrink-0 w-14 text-center pt-0.5">
                  <p className="text-[13px] font-bold text-gray-800 leading-tight">{date}</p>
                  <p className="text-[10px] text-gray-400">{year}</p>
                  <p className="text-[11px] font-semibold text-blue-500 mt-0.5">{time}</p>
                </div>

                {/* Divider */}
                <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />

                {/* Main content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">

                  {/* Top row: service + status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{r.service_name}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: sc.bg, color: sc.text }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot }} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1">

                    {/* Patient */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="font-medium">{r.patient_name}</span>
                      {r.patient_phone && (
                        <span className="text-gray-400 flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" />{r.patient_phone}
                        </span>
                      )}
                    </div>

                    {/* Clinic */}
                    {r.clinic_name && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        {r.clinic_name}
                      </div>
                    )}
                  </div>

                  {/* Doctors row */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {r.doctor_name && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Stethoscope className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>Направил: <span className="font-medium text-gray-700">{r.doctor_name}</span>
                        {r.doctor_specialization && <span className="text-gray-400"> · {r.doctor_specialization}</span>}
                        </span>
                      </div>
                    )}
                    {r.responsible_doctor_name && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                        <UserCheck className="w-3 h-3 flex-shrink-0" />
                        <span>Ответственный: <span className="font-semibold">{r.responsible_doctor_name}</span></span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {r.notes && (
                    <p className="text-[11px] text-gray-400 italic truncate">"{r.notes}"</p>
                  )}
                </div>

                {/* Clinic icon accent */}
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center self-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <FlaskConical className="w-4 h-4 text-cyan-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
