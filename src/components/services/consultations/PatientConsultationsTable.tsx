"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  User,
  Video,
  MessageSquare,
  Phone,
  Filter,
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PhoneCall,
  Stethoscope,
  Sparkles,
  TrendingUp,
  Activity,
  MapPin,
  Home,
} from "lucide-react";
import { useConsultationManager } from "./useConsultationManager";
import type { Consultation } from "@/types/consultation";

interface PatientConsultationsTableProps {
  consultations?: Consultation[];
  showFilters?: boolean;
}

type FilterStatus = "all" | "pending" | "ongoing" | "completed" | "cancelled" | "missed" | "planned" | "scheduled";
type FilterType = "all" | "video" | "chat" | "phone" | "offline" | "home";

interface SelectOption { value: string; label: string; icon?: React.ReactNode; color?: string; }

function CustomSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  const filtered = options.filter(o =>
    o.value === "all" || o.label.toLowerCase().includes(query.toLowerCase())
  );

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all ${
          open ? "border-blue-400 ring-2 ring-blue-500/20 shadow-sm" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.icon && <span className={selected.color}>{selected.icon}</span>}
          <span className={selected?.value === "all" ? "text-gray-400" : "text-gray-800"}>
            {selected?.label || placeholder}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Ничего не найдено</div>
            ) : filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left ${
                  opt.value === value
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.icon && <span className={`flex-shrink-0 ${opt.value === value ? "text-blue-600" : opt.color || "text-gray-400"}`}>{opt.icon}</span>}
                {opt.label}
                {opt.value === value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PatientConsultationsTable: React.FC<PatientConsultationsTableProps> = ({
  consultations: propConsultations,
  showFilters = true,
}) => {
  const { consultations: hookConsultations, fetchConsultations } = useConsultationManager();
  const consultations = useMemo(() =>
    propConsultations || hookConsultations || [],
    [propConsultations, hookConsultations]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [detailsConsultation, setDetailsConsultation] = useState<Consultation | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const canJoinConsultation = (consultation: Consultation): { canJoin: boolean; timeUntil: string; isReady: boolean } => {
    refreshTrigger;
    if (!consultation.scheduled_at) return { canJoin: false, timeUntil: '', isReady: false };
    const now = new Date();
    let scheduledTimeString = consultation.scheduled_at;
    if (scheduledTimeString.endsWith('Z')) scheduledTimeString = scheduledTimeString.slice(0, -1);
    const scheduledTime = new Date(scheduledTimeString.replace('Z', ''));
    const timeDiffMs = scheduledTime.getTime() - now.getTime();
    const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
    const canJoin = timeDiffMinutes <= 10 && timeDiffMinutes >= -30;
    const isReady = timeDiffMinutes <= 0;
    let timeUntil = '';
    if (timeDiffMinutes > 0) {
      const hours = Math.floor(timeDiffMinutes / 60);
      const minutes = timeDiffMinutes % 60;
      timeUntil = hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
    } else if (timeDiffMinutes < 0) {
      const minutesLate = Math.abs(timeDiffMinutes);
      timeUntil = minutesLate < 60 ? `опоздание ${minutesLate}м` : 'просрочено';
    } else {
      timeUntil = 'сейчас';
    }
    return { canJoin, timeUntil, isReady };
  };

  const filteredConsultations = useMemo(() => {
    if (!Array.isArray(consultations)) return [];
    let filtered = consultations;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        const doctorName = `${c.doctor_first_name || ''} ${c.doctor_last_name || ''}`.trim();
        return doctorName.toLowerCase().includes(term) ||
          c.meeting_id?.toLowerCase().includes(term) ||
          c.symptoms?.toLowerCase().includes(term) ||
          c.consultation_type?.toLowerCase().includes(term);
      });
    }
    if (statusFilter !== "all") filtered = filtered.filter(c => c.status === statusFilter);
    if (typeFilter !== "all") filtered = filtered.filter(c => (c.type || "video") === typeFilter);
    return filtered;
  }, [consultations, searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleConsultations = filteredConsultations.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: consultations.length,
    completed: consultations.filter(c => c.status === 'completed').length,
    upcoming: consultations.filter(c => c.status === 'scheduled' || c.status === 'planned').length,
    ongoing: consultations.filter(c => c.status === 'ongoing').length,
  }), [consultations]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Завершена", icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "pending":
        return { label: "Ожидание", icon: <Clock className="w-3.5 h-3.5" />, cls: "bg-blue-50 text-blue-600 border-blue-200" };
      case "ongoing":
        return { label: "В процессе", icon: <Activity className="w-3.5 h-3.5" />, cls: "bg-amber-50 text-amber-600 border-amber-200" };
      case "cancelled":
        return { label: "Отменена", icon: <XCircle className="w-3.5 h-3.5" />, cls: "bg-red-50 text-red-600 border-red-200" };
      case "missed":
        return { label: "Пропущена", icon: <XCircle className="w-3.5 h-3.5" />, cls: "bg-orange-50 text-orange-600 border-orange-200" };
      case "planned":
      case "scheduled":
        return { label: "Запланирована", icon: <Calendar className="w-3.5 h-3.5" />, cls: "bg-violet-50 text-violet-600 border-violet-200" };
      default:
        return { label: "Неизвестно", icon: <Clock className="w-3.5 h-3.5" />, cls: "bg-gray-50 text-gray-500 border-gray-200" };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "video":   return { label: "Видео",    icon: <Video className="w-3.5 h-3.5" />,      cls: "bg-cyan-50 text-cyan-600 border-cyan-200" };
      case "chat":    return { label: "Чат",      icon: <MessageSquare className="w-3.5 h-3.5" />, cls: "bg-indigo-50 text-indigo-600 border-indigo-200" };
      case "phone":   return { label: "Телефон",  icon: <Phone className="w-3.5 h-3.5" />,      cls: "bg-teal-50 text-teal-600 border-teal-200" };
      case "offline": return { label: "Оффлайн",  icon: <MapPin className="w-3.5 h-3.5" />,     cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "home":    return { label: "На дому",  icon: <Home className="w-3.5 h-3.5" />,       cls: "bg-orange-50 text-orange-600 border-orange-200" };
      default:        return { label: "Видео",    icon: <Video className="w-3.5 h-3.5" />,      cls: "bg-cyan-50 text-cyan-600 border-cyan-200" };
    }
  };

  const formatDate = (dateString: string) => {
    try { return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return dateString; }
  };

  const formatTime = (dateString: string) => {
    try { return new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }
    catch { return dateString; }
  };

  const getSpecialization = (consultation: Consultation) => {
    if (consultation.doctor_type) return consultation.doctor_type;
    switch (consultation.consultation_type) {
      case 'general': return 'Общая практика';
      case 'cardiology': return 'Кардиология';
      case 'psychiatry': return 'Психиатрия';
      case 'pediatric': return 'Педиатрия';
      default: return 'Специализация';
    }
  };

  const getInitial = (consultation: Consultation) =>
    (consultation.doctor_first_name || "В").charAt(0).toUpperCase();

  const avatarGradients = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
  ];

  const renderActions = (consultation: Consultation) => {
    const joinInfo = canJoinConsultation(consultation);
    const isWaiting = consultation.status === 'pending';
    const isOngoing = consultation.status === 'ongoing';
    const isScheduled = consultation.status === 'scheduled' || consultation.status === 'planned' || consultation.status === 'confirmed';
    const isOffline = consultation.type === 'offline' || consultation.type === 'home';

    if (isOffline) {
      return (
        <div className="flex items-center gap-2">
          {consultation.clinic_address && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium truncate max-w-[160px]">{consultation.clinic_address}</span>
            </div>
          )}
          <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all duration-200">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {isOngoing && (
          <button
            onClick={() => window.location.href = `/video-call/patient?meetingId=${consultation.meeting_id}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:shadow-blue-500/40"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Войти</span>
          </button>
        )}
        {isWaiting && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">Ожидание</span>
          </div>
        )}
        {isScheduled && consultation.scheduled_at && (
          joinInfo.canJoin ? (
            <button
              onClick={() => window.location.href = `/video-call/patient?meetingId=${consultation.meeting_id}`}
              className={`flex items-center gap-1.5 px-3 py-2 text-white text-xs font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                joinInfo.isReady
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/20 hover:shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 hover:shadow-blue-500/40'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{joinInfo.isReady ? 'Войти' : joinInfo.timeUntil}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{joinInfo.timeUntil || 'просрочено'}</span>
            </div>
          )
        )}
        <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all duration-200">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="relative space-y-5 px-4 md:px-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-violet-100/40 rounded-full blur-[120px]" />
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Мои записи</h3>
            <p className="text-xs text-gray-500">{filteredConsultations.length} из {consultations.length} записей</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchConsultations()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="px-3.5 py-2 rounded-xl bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600">
            {filteredConsultations.length} / {consultations.length}
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Всего", value: stats.total, icon: <Stethoscope className="w-4 h-4" />, bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600", sub: "text-blue-400" },
          { label: "Завершено", value: stats.completed, icon: <CheckCircle2 className="w-4 h-4" />, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600", sub: "text-emerald-400" },
          { label: "Предстоит", value: stats.upcoming, icon: <Calendar className="w-4 h-4" />, bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-600", sub: "text-violet-400" },
          { label: "В процессе", value: stats.ongoing, icon: <Activity className="w-4 h-4" />, bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600", sub: "text-amber-400" },
        ].map((stat, i) => (
          <div key={i} className={`relative ${stat.bg} border ${stat.border} rounded-2xl p-4 shadow-sm overflow-hidden`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${stat.text} opacity-80`}>{stat.icon}</span>
              <TrendingUp className="w-3 h-3 text-gray-300" />
            </div>
            <div className={`text-2xl font-bold ${stat.text}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Фильтры
            </h4>
            <button
              onClick={() => { setSearchTerm(""); setStatusFilter("all"); setTypeFilter("all"); }}
              className="text-xs text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Сбросить
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Врач, симптомы..."
                  className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</label>
              <CustomSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as FilterStatus)}
                options={[
                  { value: "all", label: "Все статусы" },
                  { value: "pending", label: "Ожидание", icon: <Clock className="w-3.5 h-3.5" />, color: "text-blue-500" },
                  { value: "ongoing", label: "В процессе", icon: <Activity className="w-3.5 h-3.5" />, color: "text-amber-500" },
                  { value: "completed", label: "Завершена", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-500" },
                  { value: "cancelled", label: "Отменена", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-500" },
                  { value: "missed", label: "Пропущена", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-orange-500" },
                  { value: "planned", label: "Запланирована", icon: <Calendar className="w-3.5 h-3.5" />, color: "text-violet-500" },
                ]}
              />
            </div>
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</label>
              <CustomSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as FilterType)}
                options={[
                  { value: "all",     label: "Все типы" },
                  { value: "video",   label: "Видео",    icon: <Video className="w-3.5 h-3.5" />,         color: "text-cyan-500" },
                  { value: "offline", label: "Оффлайн",  icon: <MapPin className="w-3.5 h-3.5" />,        color: "text-emerald-500" },
                  { value: "home",    label: "На дому",  icon: <Home className="w-3.5 h-3.5" />,          color: "text-orange-500" },
                  { value: "chat",    label: "Чат",      icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-indigo-500" },
                  { value: "phone",   label: "Телефон",  icon: <Phone className="w-3.5 h-3.5" />,         color: "text-teal-500" },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {filteredConsultations.length === 0 && (
        <div className="relative bg-gray-50 border border-gray-200 rounded-3xl p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-violet-50/50" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-5 bg-blue-100 border border-blue-200 rounded-2xl">
              <Stethoscope className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {consultations.length === 0 ? "Нет консультаций" : "Нет результатов"}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              {consultations.length === 0
                ? "Ваши консультации будут отображаться здесь"
                : "Попробуйте изменить критерии фильтрации"}
            </p>
          </div>
        </div>
      )}

      {/* ── Desktop Table ── */}
      {filteredConsultations.length > 0 && (
        <div className="hidden xl:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-[1.2fr_1.6fr_1.2fr_0.8fr_1.1fr_1.3fr] border-b border-gray-200 divide-x divide-gray-200 bg-gray-50">
            {["ДАТА / ВРЕМЯ", "ВРАЧ", "СПЕЦИАЛИЗАЦИЯ", "ТИП", "СТАТУС", "ДЕЙСТВИЯ"].map((h) => (
              <div key={h} className="py-3.5 px-5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {visibleConsultations.map((consultation, idx) => {
              const status = getStatusConfig(consultation.status);
              const type = getTypeConfig(consultation.type || "video");
              const grad = avatarGradients[idx % avatarGradients.length];
              const dateStr = consultation.scheduled_at || consultation.created_at;
              const timeStr = consultation.scheduled_at || consultation.started_at;

              return (
                <div
                  key={consultation.id}
                  className="grid grid-cols-[1.2fr_1.6fr_1.2fr_0.8fr_1.1fr_1.3fr] items-center divide-x divide-gray-100 hover:bg-gray-50/70 transition-all duration-200 group"
                >
                  {/* Date/Time */}
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {dateStr ? formatDate(dateStr) : "—"}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {timeStr ? formatTime(timeStr) : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Doctor */}
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-white font-bold text-sm">{getInitial(consultation)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 leading-tight">
                        {`${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || "Врач не назначен"}
                      </div>
                      <div className="text-xs text-blue-500 font-medium mt-0.5">Врач</div>
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="px-5 py-4">
                    <div className="text-sm text-gray-700 font-medium">{getSpecialization(consultation)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Специальность</div>
                  </div>

                  {/* Type */}
                  <div className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${type.cls}`}>
                      {type.icon}
                      {type.label}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${status.cls}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4">{renderActions(consultation)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tablet View ── */}
      {filteredConsultations.length > 0 && (
        <div className="hidden md:block xl:hidden bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[1.6fr_1.2fr_1.1fr_1.2fr] border-b border-gray-200 divide-x divide-gray-200 bg-gray-50">
            {["ВРАЧ", "ДАТА", "СТАТУС", "ДЕЙСТВИЯ"].map((h) => (
              <div key={h} className="py-3.5 px-5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{h}</div>
            ))}
          </div>
          <div className="divide-y divide-gray-100">
            {visibleConsultations.map((consultation, idx) => {
              const status = getStatusConfig(consultation.status);
              const grad = avatarGradients[idx % avatarGradients.length];
              const dateStr = consultation.scheduled_at || consultation.created_at;
              const timeStr = consultation.scheduled_at || consultation.started_at;
              return (
                <div key={`tab-${consultation.id}`} className="grid grid-cols-[1.6fr_1.2fr_1.1fr_1.2fr] items-center divide-x divide-gray-100 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className={`w-9 h-9 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xs">{getInitial(consultation)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {`${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || "—"}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{getSpecialization(consultation)}</div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-sm font-semibold text-gray-900">{dateStr ? formatDate(dateStr) : "—"}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{timeStr ? formatTime(timeStr) : "—"}
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${status.cls}`}>
                      {status.icon}
                      <span className="hidden sm:inline">{status.label}</span>
                    </span>
                  </div>
                  <div className="px-5 py-4">{renderActions(consultation)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mobile Cards ── */}
      {filteredConsultations.length > 0 && (
        <div className="md:hidden space-y-3">
          {visibleConsultations.map((consultation, idx) => {
            const status = getStatusConfig(consultation.status);
            const type = getTypeConfig(consultation.type || "video");
            const grad = avatarGradients[idx % avatarGradients.length];
            const joinInfo = canJoinConsultation(consultation);
            const isOngoing = consultation.status === 'ongoing';
            const isScheduled = consultation.status === 'scheduled' || consultation.status === 'planned';
            const dateStr = consultation.scheduled_at || consultation.created_at;
            const timeStr = consultation.scheduled_at || consultation.started_at;

            return (
              <div key={`mob-${consultation.id}`} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-white font-bold text-sm">{getInitial(consultation)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">
                        {`${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || "Врач не назначен"}
                      </div>
                      <div className="text-xs text-blue-500 font-medium">{getSpecialization(consultation)}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex-shrink-0 ${status.cls}`}>
                    {status.icon}
                    <span className="hidden xs:inline">{status.label}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">Дата</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{dateStr ? formatDate(dateStr) : "—"}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {timeStr ? formatTime(timeStr) : "—"}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Video className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">Тип</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${type.cls}`}>
                      {type.icon}
                      {type.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(isOngoing || (isScheduled && joinInfo.canJoin)) && (
                    <button
                      onClick={() => window.location.href = `/video-call/patient?meetingId=${consultation.meeting_id}`}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl shadow-md transition-all ${
                        joinInfo.isReady || isOngoing
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      {joinInfo.isReady || isOngoing ? 'Подключиться' : `Через ${joinInfo.timeUntil}`}
                    </button>
                  )}
                  {!isOngoing && (!isScheduled || !joinInfo.canJoin) && (
                    <button
                      onClick={() => setDetailsConsultation(consultation)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors">
                      <Eye className="w-4 h-4" />
                      Детали
                    </button>
                  )}
                  <button className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-400 rounded-xl transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-4">
          <span className="text-xs text-gray-400">
            {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredConsultations.length)} из {filteredConsultations.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all border ${
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === 2 && currentPage > 3) {
                return <span key={page} className="text-gray-300 text-xs px-1">···</span>;
              } else if (page === totalPages - 1 && currentPage < totalPages - 2) {
                return <span key={page} className="text-gray-300 text-xs px-1">···</span>;
              }
              return null;
            })}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Details Modal (portal to body to escape stacking context) ── */}
      {detailsConsultation && typeof document !== 'undefined' && createPortal((() => {
        const c = detailsConsultation;
        const status = getStatusConfig(c.status);
        const type = getTypeConfig(c.type || "video");
        const dateStr = c.scheduled_at || c.created_at;
        const doctorName = `${c.doctor_first_name || ''} ${c.doctor_last_name || ''}`.trim() || "—";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailsConsultation(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Детали записи</h3>
                  <p className="text-xs text-gray-400 mt-0.5">#{c.id}</p>
                </div>
                <button onClick={() => setDetailsConsultation(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Doctor */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(c.doctor_first_name?.[0] || 'Д').toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{doctorName}</p>
                  <p className="text-xs text-gray-400">{getSpecialization(c)}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Дата</p>
                  <p className="text-sm font-semibold text-gray-900">{dateStr ? formatDate(dateStr) : "—"}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{dateStr ? formatTime(dateStr) : "—"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Тип</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${type.cls}`}>
                    {type.icon}{type.label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Статус</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${status.cls}`}>
                    {status.icon}{status.label}
                  </span>
                </div>
                {c.clinic_name && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Клиника</p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{c.clinic_name}</p>
                    {c.clinic_address && <p className="text-xs text-gray-400 mt-0.5">{c.clinic_address}</p>}
                  </div>
                )}
              </div>

              {/* Symptoms */}
              {c.symptoms && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Жалобы / симптомы</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.symptoms}</p>
                </div>
              )}

              <button
                onClick={() => setDetailsConsultation(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        );
      })(), document.body)}
    </div>
  );
};

export default PatientConsultationsTable;
