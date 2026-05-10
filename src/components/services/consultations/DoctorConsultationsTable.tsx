"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Video,
  MessageSquare,
  Phone,
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PhoneCall,
  Stethoscope,
  Activity,
  MapPin,
  Home,
  Check,
  Edit,
} from "lucide-react";
import { useConsultationManager } from "./useConsultationManager";
import type { Consultation } from "@/types/consultation";

interface DoctorConsultationsTableProps {
  consultations?: Consultation[];
  showFilters?: boolean;
  onAccept?: (meetingId: string) => void;
  onReject?: (meetingId: string) => void;
  onStatusChange?: (meetingId: string, newStatus: string) => void;
}

type FilterStatus = "all" | "pending" | "ongoing" | "completed" | "cancelled" | "missed" | "planned" | "scheduled";
type FilterType = "all" | "video" | "chat" | "phone";

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

// Status dropdown rendered via portal so it escapes grid overflow clipping
function StatusDropdown({
  consultation,
  onStatusChange,
}: {
  consultation: Consultation;
  onStatusChange?: (meetingId: string, newStatus: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const statuses = [
    { value: "pending",   label: "Ожидание",      icon: <Clock className="w-3.5 h-3.5" />,       cls: "bg-blue-50 text-blue-600 border-blue-200" },
    { value: "ongoing",   label: "В процессе",    icon: <Activity className="w-3.5 h-3.5" />,    cls: "bg-amber-50 text-amber-600 border-amber-200" },
    { value: "completed", label: "Завершена",     icon: <CheckCircle2 className="w-3.5 h-3.5" />,cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { value: "cancelled", label: "Отменена",      icon: <XCircle className="w-3.5 h-3.5" />,     cls: "bg-red-50 text-red-600 border-red-200" },
    { value: "missed",    label: "Пропущена",     icon: <XCircle className="w-3.5 h-3.5" />,     cls: "bg-orange-50 text-orange-600 border-orange-200" },
    { value: "planned",   label: "Запланирована", icon: <Calendar className="w-3.5 h-3.5" />,    cls: "bg-violet-50 text-violet-600 border-violet-200" },
    { value: "scheduled", label: "Запланирована", icon: <Calendar className="w-3.5 h-3.5" />,    cls: "bg-violet-50 text-violet-600 border-violet-200" },
  ];

  const current = statuses.find(s => s.value === consultation.status) ?? {
    label: "Неизвестно", icon: <Clock className="w-3.5 h-3.5" />, cls: "bg-gray-50 text-gray-500 border-gray-200"
  };

  const unique = statuses.filter(s => s.value !== "scheduled");

  return (
    <>
      <button
        ref={btnRef}
        onClick={onStatusChange ? handleOpen : undefined}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${current.cls} ${
          onStatusChange ? "hover:opacity-80 cursor-pointer" : "cursor-default"
        }`}
      >
        {current.icon}
        {current.label}
        {onStatusChange && <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden min-w-[200px]"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Edit className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Изменить статус</span>
            </div>
            <div className="py-1">
              {unique.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    onStatusChange!(consultation.meeting_id ?? "", s.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left ${
                    consultation.status === s.value
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className={s.cls.split(" ").find(c => c.startsWith("text-"))}>{s.icon}</span>
                  {s.label}
                  {consultation.status === s.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

const DoctorConsultationsTable: React.FC<DoctorConsultationsTableProps> = ({
  consultations: propConsultations,
  showFilters = true,
  onAccept,
  onReject,
  onStatusChange,
}) => {
  const { consultations: hookConsultations, fetchConsultations } = useConsultationManager();
  const consultations = useMemo(() =>
    propConsultations || hookConsultations || [],
    [propConsultations, hookConsultations]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
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
    if (!consultation.scheduled_at) return { canJoin: false, timeUntil: "", isReady: false };
    const now = new Date();
    let s = consultation.scheduled_at;
    if (s.endsWith("Z")) s = s.slice(0, -1);
    const scheduledTime = new Date(s);
    const diffMin = Math.floor((scheduledTime.getTime() - now.getTime()) / 60000);
    const canJoin = diffMin <= 10 && diffMin >= -30;
    const isReady = diffMin <= 0;
    let timeUntil = "";
    if (diffMin > 0) {
      const h = Math.floor(diffMin / 60), m = diffMin % 60;
      timeUntil = h > 0 ? `${h}ч ${m}м` : `${m}м`;
    } else if (diffMin < 0) {
      timeUntil = Math.abs(diffMin) < 60 ? `опоздание ${Math.abs(diffMin)}м` : "просрочено";
    } else {
      timeUntil = "сейчас";
    }
    return { canJoin, timeUntil, isReady };
  };

  const filteredConsultations = useMemo(() => {
    if (!Array.isArray(consultations)) return [];
    let filtered = consultations;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        const patientName = `${c.patient_first_name || ""} ${c.patient_last_name || ""}`.trim();
        return (
          patientName.toLowerCase().includes(term) ||
          c.patient_name?.toLowerCase().includes(term) ||
          c.patient_email?.toLowerCase().includes(term) ||
          c.symptoms?.toLowerCase().includes(term) ||
          c.meeting_id?.toLowerCase().includes(term)
        );
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

  const stats = useMemo(() => ({
    total: consultations.length,
    pending: consultations.filter(c => c.status === "pending").length,
    upcoming: consultations.filter(c => c.status === "scheduled" || c.status === "planned").length,
    ongoing: consultations.filter(c => c.status === "ongoing").length,
  }), [consultations]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":  return { label: "Завершена",     icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "pending":    return { label: "Ожидание",      icon: <Clock className="w-3.5 h-3.5" />,        cls: "bg-blue-50 text-blue-600 border-blue-200" };
      case "ongoing":    return { label: "В процессе",    icon: <Activity className="w-3.5 h-3.5" />,     cls: "bg-amber-50 text-amber-600 border-amber-200" };
      case "cancelled":  return { label: "Отменена",      icon: <XCircle className="w-3.5 h-3.5" />,      cls: "bg-red-50 text-red-600 border-red-200" };
      case "missed":     return { label: "Пропущена",     icon: <XCircle className="w-3.5 h-3.5" />,      cls: "bg-orange-50 text-orange-600 border-orange-200" };
      case "planned":
      case "scheduled":  return { label: "Запланирована", icon: <Calendar className="w-3.5 h-3.5" />,     cls: "bg-violet-50 text-violet-600 border-violet-200" };
      default:           return { label: "Неизвестно",    icon: <Clock className="w-3.5 h-3.5" />,        cls: "bg-gray-50 text-gray-500 border-gray-200" };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "video":   return { label: "Видео",    icon: <Video className="w-3.5 h-3.5" />,         cls: "bg-cyan-50 text-cyan-600 border-cyan-200" };
      case "chat":    return { label: "Чат",      icon: <MessageSquare className="w-3.5 h-3.5" />, cls: "bg-indigo-50 text-indigo-600 border-indigo-200" };
      case "phone":   return { label: "Телефон",  icon: <Phone className="w-3.5 h-3.5" />,         cls: "bg-teal-50 text-teal-600 border-teal-200" };
      case "offline": return { label: "Оффлайн",  icon: <MapPin className="w-3.5 h-3.5" />,        cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "home":    return { label: "На дому",  icon: <Home className="w-3.5 h-3.5" />,          cls: "bg-orange-50 text-orange-600 border-orange-200" };
      default:        return { label: "Видео",    icon: <Video className="w-3.5 h-3.5" />,         cls: "bg-cyan-50 text-cyan-600 border-cyan-200" };
    }
  };

  const formatDate = (s: string) => {
    try { return new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }); }
    catch { return s; }
  };

  const formatTime = (s: string) => {
    try { return new Date(s).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
    catch { return s; }
  };

  const getPatientName = (c: Consultation) =>
    c.patient_name ||
    `${c.patient_first_name || ""} ${c.patient_last_name || ""}`.trim() ||
    "Пациент не указан";

  const getPatientInitial = (c: Consultation) =>
    (c.patient_name || c.patient_first_name || "П").charAt(0).toUpperCase();

  const avatarGradients = [
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-cyan-500",
    "from-violet-400 to-purple-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-blue-500",
  ];

  const renderActions = (consultation: Consultation) => {
    const joinInfo = canJoinConsultation(consultation);
    const isPending = consultation.status === "pending";
    const isOngoing = consultation.status === "ongoing";
    const isScheduled = consultation.status === "scheduled" || consultation.status === "planned";

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {isPending && onAccept && (
          <button
            onClick={() => onAccept(consultation.meeting_id ?? "")}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Принять</span>
          </button>
        )}
        {isPending && onReject && (
          <button
            onClick={() => onReject(consultation.meeting_id ?? "")}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold rounded-xl transition-all duration-200"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Отклонить</span>
          </button>
        )}
        {isOngoing && (
          <button
            onClick={() => window.location.href = `/video-call/doctor?meetingId=${consultation.meeting_id ?? ""}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Войти</span>
          </button>
        )}
        {isScheduled && consultation.scheduled_at && (
          joinInfo.canJoin ? (
            <button
              onClick={() => window.location.href = `/video-call/doctor?meetingId=${consultation.meeting_id ?? ""}`}
              className={`flex items-center gap-1.5 px-3 py-2 text-white text-xs font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                joinInfo.isReady
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/20"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{joinInfo.isReady ? "Войти" : joinInfo.timeUntil}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{joinInfo.timeUntil || "просрочено"}</span>
            </div>
          )
        )}
        <button
          onClick={() => setDetailsConsultation(consultation)}
          className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all duration-200"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* ── Single unified card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4 border-b border-gray-100">
          {/* Left: icon + title + count */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">Мои приёмы</h3>
              <p className="text-xs text-gray-400">{filteredConsultations.length} из {consultations.length}</p>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Всего",      value: stats.total,    bg: "bg-blue-50",    border: "border-blue-100",    text: "text-blue-600" },
              { label: "Ожидают",    value: stats.pending,  bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-600" },
              { label: "Предстоит",  value: stats.upcoming, bg: "bg-violet-50",  border: "border-violet-100",  text: "text-violet-600" },
              { label: "В процессе", value: stats.ongoing,  bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
            ].map((s, i) => (
              <span key={i} className={`inline-flex items-center gap-1 ${s.bg} border ${s.border} rounded-lg px-2 py-0.5 text-xs font-semibold ${s.text}`}>
                {s.value} <span className="font-normal text-gray-400">{s.label}</span>
              </span>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          {showFilters && (
            <div className="relative flex-shrink-0 w-full md:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Пациент, симптомы..."
                className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Status select */}
          {showFilters && (
            <div className="flex-shrink-0 w-full md:w-40">
              <CustomSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as FilterStatus)}
                options={[
                  { value: "all",       label: "Все статусы" },
                  { value: "pending",   label: "Ожидание",      icon: <Clock className="w-3.5 h-3.5" />,        color: "text-blue-500" },
                  { value: "ongoing",   label: "В процессе",    icon: <Activity className="w-3.5 h-3.5" />,     color: "text-amber-500" },
                  { value: "completed", label: "Завершена",     icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-500" },
                  { value: "cancelled", label: "Отменена",      icon: <XCircle className="w-3.5 h-3.5" />,      color: "text-red-500" },
                  { value: "missed",    label: "Пропущена",     icon: <XCircle className="w-3.5 h-3.5" />,      color: "text-orange-500" },
                  { value: "planned",   label: "Запланирована", icon: <Calendar className="w-3.5 h-3.5" />,     color: "text-violet-500" },
                ]}
              />
            </div>
          )}

          {/* Type select */}
          {showFilters && (
            <div className="flex-shrink-0 w-full md:w-36">
              <CustomSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as FilterType)}
                options={[
                  { value: "all",   label: "Все типы" },
                  { value: "video", label: "Видео",   icon: <Video className="w-3.5 h-3.5" />,         color: "text-cyan-500" },
                  { value: "chat",  label: "Чат",     icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-indigo-500" },
                  { value: "phone", label: "Телефон", icon: <Phone className="w-3.5 h-3.5" />,         color: "text-teal-500" },
                ]}
              />
            </div>
          )}

          {/* Reset + Refresh */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); setTypeFilter("all"); }}
                className="px-2.5 py-2 rounded-xl text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-100 transition-all"
              >
                Сбросить
              </button>
            )}
            <button
              onClick={() => fetchConsultations()}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Empty State ── */}
        {filteredConsultations.length === 0 && (
          <div className="relative bg-gray-50 p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-violet-50/50" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-5 bg-blue-100 border border-blue-200 rounded-2xl">
                <Stethoscope className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {consultations.length === 0 ? "Нет приёмов" : "Нет результатов"}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {consultations.length === 0
                  ? "Записи пациентов будут отображаться здесь"
                  : "Попробуйте изменить критерии фильтрации"}
              </p>
            </div>
          </div>
        )}

        {/* ── Desktop Table — single grid ── */}
        {filteredConsultations.length > 0 && (
          <div className="hidden xl:grid grid-cols-[1.4fr_1.8fr_1fr_1.2fr_1.6fr] overflow-visible">
            {["ДАТА / ВРЕМЯ", "ПАЦИЕНТ", "ТИП", "СТАТУС", "ДЕЙСТВИЯ"].map((h, i) => (
              <div
                key={h}
                className={`py-3.5 px-5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase bg-gray-50 border-b border-gray-200 ${i > 0 ? "border-l border-gray-200" : ""}`}
              >
                {h}
              </div>
            ))}

            {visibleConsultations.map((consultation, idx) => {
              const type = getTypeConfig(consultation.type || "video");
              const grad = avatarGradients[idx % avatarGradients.length];
              const dateStr = consultation.scheduled_at || consultation.created_at;
              const timeStr = consultation.scheduled_at || consultation.started_at;
              const rowBorder = idx > 0 ? "border-t border-gray-100" : "";

              return (
                <React.Fragment key={consultation.id}>
                  {/* Date/Time */}
                  <div className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                    <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{dateStr ? formatDate(dateStr) : "—"}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {timeStr ? formatTime(timeStr) : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Patient */}
                  <div className={`flex items-center gap-3 px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                    <div className={`w-10 h-10 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-white font-bold text-sm">{getPatientInitial(consultation)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 leading-tight truncate">{getPatientName(consultation)}</div>
                      <div className="text-xs text-gray-400 font-medium mt-0.5 truncate">{consultation.patient_email || "—"}</div>
                    </div>
                  </div>

                  {/* Type */}
                  <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder} flex items-center`}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${type.cls}`}>
                      {type.icon}{type.label}
                    </span>
                  </div>

                  {/* Status — clickable dropdown if onStatusChange provided */}
                  <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder} flex items-center`}>
                    <StatusDropdown consultation={consultation} onStatusChange={onStatusChange} />
                  </div>

                  {/* Actions */}
                  <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder} flex items-center`}>
                    {renderActions(consultation)}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ── Tablet View — single grid ── */}
        {filteredConsultations.length > 0 && (
          <div className="hidden md:grid xl:hidden grid-cols-[1.8fr_1.2fr_1.1fr_1.4fr] overflow-visible border-t border-gray-100">
            {["ПАЦИЕНТ", "ДАТА", "СТАТУС", "ДЕЙСТВИЯ"].map((h, i) => (
              <div key={h} className={`py-3.5 px-5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase bg-gray-50 border-b border-gray-200 ${i > 0 ? "border-l border-gray-200" : ""}`}>{h}</div>
            ))}
            {visibleConsultations.map((consultation, idx) => {
              const grad = avatarGradients[idx % avatarGradients.length];
              const dateStr = consultation.scheduled_at || consultation.created_at;
              const timeStr = consultation.scheduled_at || consultation.started_at;
              const rowBorder = idx > 0 ? "border-t border-gray-100" : "";
              return (
                <React.Fragment key={`tab-${consultation.id}`}>
                  <div className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                    <div className={`w-9 h-9 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xs">{getPatientInitial(consultation)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{getPatientName(consultation)}</div>
                      <div className="text-xs text-gray-400 truncate">{consultation.patient_email || "—"}</div>
                    </div>
                  </div>
                  <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                    <div className="text-sm font-semibold text-gray-900">{dateStr ? formatDate(dateStr) : "—"}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{timeStr ? formatTime(timeStr) : "—"}</div>
                  </div>
                  <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder} flex items-center`}>
                    <StatusDropdown consultation={consultation} onStatusChange={onStatusChange} />
                  </div>
                  <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder} flex items-center`}>
                    {renderActions(consultation)}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ── Mobile Cards ── */}
        {filteredConsultations.length > 0 && (
          <div className="md:hidden space-y-3 p-4">
            {visibleConsultations.map((consultation, idx) => {
              const type = getTypeConfig(consultation.type || "video");
              const grad = avatarGradients[idx % avatarGradients.length];
              const joinInfo = canJoinConsultation(consultation);
              const isPending = consultation.status === "pending";
              const isOngoing = consultation.status === "ongoing";
              const isScheduled = consultation.status === "scheduled" || consultation.status === "planned";
              const dateStr = consultation.scheduled_at || consultation.created_at;
              const timeStr = consultation.scheduled_at || consultation.started_at;

              return (
                <div key={`mob-${consultation.id}`} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <span className="text-white font-bold text-sm">{getPatientInitial(consultation)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{getPatientName(consultation)}</div>
                        <div className="text-xs text-gray-400">{consultation.patient_email || "—"}</div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusDropdown consultation={consultation} onStatusChange={onStatusChange} />
                    </div>
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
                        {type.icon}{type.label}
                      </span>
                    </div>
                  </div>

                  {consultation.symptoms && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Симптомы</p>
                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{consultation.symptoms}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {isPending && onAccept && (
                      <button
                        onClick={() => onAccept(consultation.meeting_id ?? "")}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/20 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Принять
                      </button>
                    )}
                    {isPending && onReject && (
                      <button
                        onClick={() => onReject(consultation.meeting_id ?? "")}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Отклонить
                      </button>
                    )}
                    {(isOngoing || (isScheduled && joinInfo.canJoin)) && (
                      <button
                        onClick={() => window.location.href = `/video-call/doctor?meetingId=${consultation.meeting_id}`}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl shadow-md transition-all ${
                          joinInfo.isReady || isOngoing
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/20"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20"
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        {joinInfo.isReady || isOngoing ? "Подключиться" : `Через ${joinInfo.timeUntil}`}
                      </button>
                    )}
                    {!isPending && !isOngoing && (!isScheduled || !joinInfo.canJoin) && (
                      <button
                        onClick={() => setDetailsConsultation(consultation)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors"
                      >
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
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
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
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                          : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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

      </div>{/* end unified card */}

      {/* ── Details Modal ── */}
      {detailsConsultation && typeof document !== "undefined" && createPortal((() => {
        const c = detailsConsultation;
        const status = getStatusConfig(c.status);
        const type = getTypeConfig(c.type || "video");
        const dateStr = c.scheduled_at || c.created_at;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailsConsultation(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Детали приёма</h3>
                  <p className="text-xs text-gray-400 mt-0.5">#{c.id}</p>
                </div>
                <button onClick={() => setDetailsConsultation(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getPatientInitial(c)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{getPatientName(c)}</p>
                  <p className="text-xs text-gray-400">{c.patient_email || "Email не указан"}</p>
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
                {c.meeting_id && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">ID встречи</p>
                    <p className="text-xs font-mono text-gray-700 truncate">{c.meeting_id}</p>
                  </div>
                )}
              </div>

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

export default DoctorConsultationsTable;
