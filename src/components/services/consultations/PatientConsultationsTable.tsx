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
  Navigation,
} from "lucide-react";
import AppointmentStatus from "../homeAppointments/AppointmentStatus";
import { useConsultationManager } from "./useConsultationManager";
import type { Consultation } from "@/types/consultation";
import { buildWhatsAppLink, consultationWhatsAppMessage } from "@/lib/whatsapp";
import { useLanguage } from "@/context/LanguageContext";

const TABLE_TEXT = {
  ru: {
    searchPlaceholder: "Поиск...", noOptionsFound: "Ничего не найдено",
    myRecords: "Мои записи", of: "из",
    statTotal: "Всего", statCompleted: "Завершено", statUpcoming: "Предстоит", statOngoing: "В процессе",
    searchDoctorSymptoms: "Врач, симптомы...",
    allStatuses: "Все статусы", allTypes: "Все типы",
    statusPending: "Ожидание", statusOngoing: "В процессе", statusCompleted: "Завершена",
    statusCancelled: "Отменена", statusMissed: "Пропущена", statusPlanned: "Запланирована", statusUnknown: "Неизвестно",
    homeStatusWaitingNurse: "Ожидает медсестру", homeStatusViewed: "Просматривают", homeStatusAccepted: "Принята ✓",
    homeStatusInProgress: "Медсестра в пути", homeStatusCompleted: "Визит завершён", homeStatusCancelled: "Отменена", homeStatusDefault: "Ожидает",
    typeVideo: "Видео", typeChat: "Чат", typePhone: "Телефон", typeOffline: "Приём в клинике", typeHome: "На дому",
    reset: "Сбросить",
    noConsultations: "Нет консультаций", noResults: "Нет результатов",
    consultationsWillAppear: "Ваши консультации будут отображаться здесь",
    tryOtherFilters: "Попробуйте изменить критерии фильтрации",
    colDateTime: "ДАТА / ВРЕМЯ", colDoctor: "ВРАЧ", colSpecialization: "СПЕЦИАЛИЗАЦИЯ", colType: "ТИП", colStatus: "СТАТУС", colActions: "ДЕЙСТВИЯ",
    colDate: "ДАТА",
    doctorLabel: "Врач", doctorNotAssigned: "Врач не назначен",
    generalPractice: "Общая практика", cardiology: "Кардиология", psychiatry: "Психиатрия", pediatric: "Педиатрия",
    track: "Отследить", details: "Детали",
    join: "Войти", waiting: "Ожидание", overdue: "просрочено", late: (m: number) => `опоздание ${m}м`, now: "сейчас",
    hoursMin: (h: number, m: number) => `${h}ч ${m}м`, min: (m: number) => `${m}м`,
    writeWhatsApp: "Написать в WhatsApp",
    connect: "Подключиться", through: (t: string) => `Через ${t}`,
    dateField: "Дата", typeField: "Тип",
    of2: "из",
    detailsTitle: "Детали записи",
    statusField: "Статус", clinic: "Клиника", complaints: "Жалобы / симптомы",
    close: "Закрыть",
    locale: "ru-RU",
  },
  kz: {
    searchPlaceholder: "Іздеу...", noOptionsFound: "Ештеңе табылмады",
    myRecords: "Менің жазбаларым", of: "ішінен",
    statTotal: "Барлығы", statCompleted: "Аяқталды", statUpcoming: "Алда", statOngoing: "Барысында",
    searchDoctorSymptoms: "Дәрігер, симптомдар...",
    allStatuses: "Барлық статустар", allTypes: "Барлық түрлер",
    statusPending: "Күтілуде", statusOngoing: "Барысында", statusCompleted: "Аяқталды",
    statusCancelled: "Болдырылмады", statusMissed: "Өтіп кетті", statusPlanned: "Жоспарланды", statusUnknown: "Белгісіз",
    homeStatusWaitingNurse: "Медбикені күтуде", homeStatusViewed: "Қарап жатыр", homeStatusAccepted: "Қабылданды ✓",
    homeStatusInProgress: "Медбике жолда", homeStatusCompleted: "Қабылдау аяқталды", homeStatusCancelled: "Болдырылмады", homeStatusDefault: "Күтуде",
    typeVideo: "Бейне", typeChat: "Чат", typePhone: "Телефон", typeOffline: "Приём в клинике", typeHome: "Үйде",
    reset: "Тазалау",
    noConsultations: "Кеңестер жоқ", noResults: "Нәтиже жоқ",
    consultationsWillAppear: "Кеңестеріңіз осында көрсетіледі",
    tryOtherFilters: "Сүзгі параметрлерін өзгертіп көріңіз",
    colDateTime: "КҮНІ / УАҚЫТЫ", colDoctor: "ДӘРІГЕР", colSpecialization: "МАМАНДЫҒЫ", colType: "ТҮРІ", colStatus: "СТАТУС", colActions: "ӘРЕКЕТТЕР",
    colDate: "КҮНІ",
    doctorLabel: "Дәрігер", doctorNotAssigned: "Дәрігер тағайындалмады",
    generalPractice: "Жалпы тәжірибе", cardiology: "Кардиология", psychiatry: "Психиатрия", pediatric: "Педиатрия",
    track: "Бақылау", details: "Толығырақ",
    join: "Кіру", waiting: "Күтуде", overdue: "мерзімі өтті", late: (m: number) => `${m}м кешігу`, now: "қазір",
    hoursMin: (h: number, m: number) => `${h}с ${m}м`, min: (m: number) => `${m}м`,
    writeWhatsApp: "WhatsApp-қа жазу",
    connect: "Қосылу", through: (t: string) => `${t} кейін`,
    dateField: "Күні", typeField: "Түрі",
    of2: "ішінен",
    detailsTitle: "Жазба мәліметтері",
    statusField: "Статус", clinic: "Клиника", complaints: "Шағымдар / симптомдар",
    close: "Жабу",
    locale: "kk-KZ",
  },
  en: {
    searchPlaceholder: "Search...", noOptionsFound: "Nothing found",
    myRecords: "My appointments", of: "of",
    statTotal: "Total", statCompleted: "Completed", statUpcoming: "Upcoming", statOngoing: "Ongoing",
    searchDoctorSymptoms: "Doctor, symptoms...",
    allStatuses: "All statuses", allTypes: "All types",
    statusPending: "Pending", statusOngoing: "Ongoing", statusCompleted: "Completed",
    statusCancelled: "Cancelled", statusMissed: "Missed", statusPlanned: "Scheduled", statusUnknown: "Unknown",
    homeStatusWaitingNurse: "Waiting for nurse", homeStatusViewed: "Being viewed", homeStatusAccepted: "Accepted ✓",
    homeStatusInProgress: "Nurse on the way", homeStatusCompleted: "Visit completed", homeStatusCancelled: "Cancelled", homeStatusDefault: "Waiting",
    typeVideo: "Video", typeChat: "Chat", typePhone: "Phone", typeOffline: "Offline", typeHome: "Home visit",
    reset: "Reset",
    noConsultations: "No consultations", noResults: "No results",
    consultationsWillAppear: "Your consultations will appear here",
    tryOtherFilters: "Try changing the filter criteria",
    colDateTime: "DATE / TIME", colDoctor: "DOCTOR", colSpecialization: "SPECIALTY", colType: "TYPE", colStatus: "STATUS", colActions: "ACTIONS",
    colDate: "DATE",
    doctorLabel: "Doctor", doctorNotAssigned: "Doctor not assigned",
    generalPractice: "General practice", cardiology: "Cardiology", psychiatry: "Psychiatry", pediatric: "Pediatrics",
    track: "Track", details: "Details",
    join: "Join", waiting: "Waiting", overdue: "overdue", late: (m: number) => `${m}m late`, now: "now",
    hoursMin: (h: number, m: number) => `${h}h ${m}m`, min: (m: number) => `${m}m`,
    writeWhatsApp: "Message on WhatsApp",
    connect: "Connect", through: (t: string) => `In ${t}`,
    dateField: "Date", typeField: "Type",
    of2: "of",
    detailsTitle: "Appointment details",
    statusField: "Status", clinic: "Clinic", complaints: "Complaints / symptoms",
    close: "Close",
    locale: "en-US",
  },
  uz: {
    searchPlaceholder: "Qidirish...", noOptionsFound: "Hech narsa topilmadi",
    myRecords: "Mening yozilishlarim", of: "dan",
    statTotal: "Jami", statCompleted: "Yakunlangan", statUpcoming: "Kutilmoqda", statOngoing: "Jarayonda",
    searchDoctorSymptoms: "Shifokor, simptomlar...",
    allStatuses: "Barcha statuslar", allTypes: "Barcha turlar",
    statusPending: "Kutilmoqda", statusOngoing: "Jarayonda", statusCompleted: "Yakunlangan",
    statusCancelled: "Bekor qilingan", statusMissed: "O'tkazib yuborilgan", statusPlanned: "Rejalashtirilgan", statusUnknown: "Noma'lum",
    homeStatusWaitingNurse: "Hamshirani kutmoqda", homeStatusViewed: "Ko'rib chiqilmoqda", homeStatusAccepted: "Qabul qilindi ✓",
    homeStatusInProgress: "Hamshira yo'lda", homeStatusCompleted: "Tashrif yakunlandi", homeStatusCancelled: "Bekor qilingan", homeStatusDefault: "Kutilmoqda",
    typeVideo: "Video", typeChat: "Chat", typePhone: "Telefon", typeOffline: "Oflayn", typeHome: "Uyga tashrif",
    reset: "Tozalash",
    noConsultations: "Konsultatsiyalar yo'q", noResults: "Natija topilmadi",
    consultationsWillAppear: "Konsultatsiyalaringiz shu yerda ko'rinadi",
    tryOtherFilters: "Filtr parametrlarini o'zgartirib ko'ring",
    colDateTime: "SANA / VAQT", colDoctor: "SHIFOKOR", colSpecialization: "MUTAXASSISLIK", colType: "TURI", colStatus: "STATUS", colActions: "AMALLAR",
    colDate: "SANA",
    doctorLabel: "Shifokor", doctorNotAssigned: "Shifokor tayinlanmagan",
    generalPractice: "Umumiy amaliyot", cardiology: "Kardiologiya", psychiatry: "Psixiatriya", pediatric: "Pediatriya",
    track: "Kuzatish", details: "Tafsilotlar",
    join: "Kirish", waiting: "Kutilmoqda", overdue: "muddati o'tgan", late: (m: number) => `${m}m kechikish`, now: "hozir",
    hoursMin: (h: number, m: number) => `${h}s ${m}m`, min: (m: number) => `${m}m`,
    writeWhatsApp: "WhatsApp orqali yozish",
    connect: "Ulanish", through: (t: string) => `${t} dan keyin`,
    dateField: "Sana", typeField: "Turi",
    of2: "dan",
    detailsTitle: "Yozilish tafsilotlari",
    statusField: "Status", clinic: "Klinika", complaints: "Shikoyatlar / simptomlar",
    close: "Yopish",
    locale: "uz-UZ",
  },
};

interface PatientConsultationsTableProps {
  consultations?: Consultation[];
  showFilters?: boolean;
}

type FilterStatus = "all" | "pending" | "ongoing" | "completed" | "cancelled" | "missed" | "planned" | "scheduled";
type FilterType = "all" | "video" | "chat" | "phone" | "offline" | "home";

interface SelectOption { value: string; label: string; icon?: React.ReactNode; color?: string; }

function CustomSelect({ value, onChange, options, placeholder, searchPlaceholder = "Search...", noOptionsLabel = "Nothing found" }: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsLabel?: string;
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
                placeholder={searchPlaceholder}
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
              <div className="px-4 py-3 text-sm text-gray-400 text-center">{noOptionsLabel}</div>
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
  const { language } = useLanguage();
  const tt = TABLE_TEXT[language as keyof typeof TABLE_TEXT] ?? TABLE_TEXT.ru;
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
  const [trackingConsultation, setTrackingConsultation] = useState<Consultation | null>(null);
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
      timeUntil = hours > 0 ? tt.hoursMin(hours, minutes) : tt.min(minutes);
    } else if (timeDiffMinutes < 0) {
      const minutesLate = Math.abs(timeDiffMinutes);
      timeUntil = minutesLate < 60 ? tt.late(minutesLate) : tt.overdue;
    } else {
      timeUntil = tt.now;
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

  const getStatusConfig = (status: string, type?: string) => {
    // Home appointment statuses
    if (type === "home") {
      switch (status) {
        // backend raw statuses
        case "scheduled":
        case "pending":
          return { label: tt.homeStatusWaitingNurse, icon: <Clock className="w-3.5 h-3.5" />, cls: "bg-amber-50 text-amber-600 border-amber-200" };
        case "viewed":
          return { label: tt.homeStatusViewed, icon: <Eye className="w-3.5 h-3.5" />, cls: "bg-blue-50 text-blue-600 border-blue-200" };
        case "assigned":
        case "accepted":
          return { label: tt.homeStatusAccepted, icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        case "in_progress":
          return { label: tt.homeStatusInProgress, icon: <Navigation className="w-3.5 h-3.5" />, cls: "bg-blue-50 text-blue-700 border-blue-200" };
        case "completed":
          return { label: tt.homeStatusCompleted, icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
        case "cancelled":
          return { label: tt.homeStatusCancelled, icon: <XCircle className="w-3.5 h-3.5" />, cls: "bg-red-50 text-red-600 border-red-200" };
        default:
          return { label: tt.homeStatusDefault, icon: <Clock className="w-3.5 h-3.5" />, cls: "bg-amber-50 text-amber-600 border-amber-200" };
      }
    }
    switch (status) {
      case "completed":
        return { label: tt.statusCompleted, icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "pending":
        return { label: tt.statusPending, icon: <Clock className="w-3.5 h-3.5" />, cls: "bg-blue-50 text-blue-600 border-blue-200" };
      case "ongoing":
        return { label: tt.statusOngoing, icon: <Activity className="w-3.5 h-3.5" />, cls: "bg-amber-50 text-amber-600 border-amber-200" };
      case "cancelled":
        return { label: tt.statusCancelled, icon: <XCircle className="w-3.5 h-3.5" />, cls: "bg-red-50 text-red-600 border-red-200" };
      case "missed":
        return { label: tt.statusMissed, icon: <XCircle className="w-3.5 h-3.5" />, cls: "bg-orange-50 text-orange-600 border-orange-200" };
      case "planned":
      case "scheduled":
        return { label: tt.statusPlanned, icon: <Calendar className="w-3.5 h-3.5" />, cls: "bg-violet-50 text-violet-600 border-violet-200" };
      default:
        return { label: tt.statusUnknown, icon: <Clock className="w-3.5 h-3.5" />, cls: "bg-gray-50 text-gray-500 border-gray-200" };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "video":   return { label: tt.typeVideo,    icon: <Video className="w-3.5 h-3.5" />,      cls: "bg-cyan-50 text-cyan-600 border-cyan-200" };
      case "chat":    return { label: tt.typeChat,      icon: <MessageSquare className="w-3.5 h-3.5" />, cls: "bg-indigo-50 text-indigo-600 border-indigo-200" };
      case "phone":   return { label: tt.typePhone,  icon: <Phone className="w-3.5 h-3.5" />,      cls: "bg-teal-50 text-teal-600 border-teal-200" };
      case "offline": return { label: tt.typeOffline,  icon: <MapPin className="w-3.5 h-3.5" />,     cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "home":    return { label: tt.typeHome,  icon: <Home className="w-3.5 h-3.5" />,       cls: "bg-orange-50 text-orange-600 border-orange-200" };
      default:        return { label: tt.typeVideo,    icon: <Video className="w-3.5 h-3.5" />,      cls: "bg-cyan-50 text-cyan-600 border-cyan-200" };
    }
  };

  const formatDate = (dateString: string) => {
    try { return new Date(dateString).toLocaleDateString(tt.locale, { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return dateString; }
  };

  const formatTime = (dateString: string) => {
    try { return new Date(dateString).toLocaleTimeString(tt.locale, { hour: '2-digit', minute: '2-digit' }); }
    catch { return dateString; }
  };

  const getSpecialization = (consultation: Consultation) => {
    if (consultation.doctor_type) return consultation.doctor_type;
    switch (consultation.consultation_type) {
      case 'general': return tt.generalPractice;
      case 'cardiology': return tt.cardiology;
      case 'psychiatry': return tt.psychiatry;
      case 'pediatric': return tt.pediatric;
      default: return '—';
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

    if (consultation.type === "home") {
      const isActive = consultation.status !== "completed" && consultation.status !== "cancelled";
      return (
        <div className="flex items-center gap-2">
          {consultation.nurse_name && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium truncate max-w-[120px]">{consultation.nurse_name}</span>
            </div>
          )}
          <button
            onClick={() => setTrackingConsultation(consultation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              isActive
                ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            {isActive ? tt.track : tt.details}
          </button>
        </div>
      );
    }

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
            <span>{tt.join}</span>
          </button>
        )}
        {isWaiting && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">{tt.waiting}</span>
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
              <span>{joinInfo.isReady ? tt.join : joinInfo.timeUntil}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{joinInfo.timeUntil || tt.overdue}</span>
            </div>
          )
        )}
        <a
          href={buildWhatsAppLink(consultationWhatsAppMessage({
            id: consultation.id,
            doctorName: consultation.doctor_first_name
              ? `${consultation.doctor_first_name} ${consultation.doctor_last_name ?? ""}`.trim()
              : undefined,
            scheduledAt: consultation.scheduled_at,
            meetingId: consultation.meeting_id,
          }))}
          target="_blank"
          rel="noopener noreferrer"
          title={tt.writeWhatsApp}
          className="p-2 text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl transition-all duration-200 flex items-center"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
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
    <div className="relative">

      {/* ── Single unified card: header + filters + table ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

        {/* Toolbar: title / stats / search / selects / refresh */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          {/* Row 1: icon + title + stat chips + refresh */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight">{tt.myRecords}</h3>
                <p className="text-xs text-gray-400">{filteredConsultations.length} {tt.of} {consultations.length}</p>
              </div>
            </div>

            {/* Stat chips */}
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {[
                { label: tt.statTotal, value: stats.total, bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600" },
                { label: tt.statCompleted, value: stats.completed, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
                { label: tt.statUpcoming, value: stats.upcoming, bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-600" },
                { label: tt.statOngoing, value: stats.ongoing, bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600" },
              ].map((s, i) => (
                <span key={i} className={`inline-flex items-center gap-1 ${s.bg} border ${s.border} rounded-lg px-2 py-0.5 text-xs font-semibold ${s.text}`}>
                  {s.value} <span className="font-normal text-gray-400">{s.label}</span>
                </span>
              ))}
            </div>

            {/* Reset + Refresh */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
              {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                <button
                  onClick={() => { setSearchTerm(""); setStatusFilter("all"); setTypeFilter("all"); }}
                  className="px-2.5 py-2 rounded-xl text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-100 transition-all"
                >
                  {tt.reset}
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

          {/* Row 2: filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={tt.searchDoctorSymptoms}
                  className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status select */}
              <div className="w-full sm:w-40 flex-shrink-0">
                <CustomSelect
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as FilterStatus)}
                  searchPlaceholder={tt.searchPlaceholder}
                  noOptionsLabel={tt.noOptionsFound}
                  options={[
                    { value: "all", label: tt.allStatuses },
                    { value: "pending",   label: tt.statusPending,      icon: <Clock className="w-3.5 h-3.5" />,       color: "text-blue-500" },
                    { value: "ongoing",   label: tt.statusOngoing,    icon: <Activity className="w-3.5 h-3.5" />,    color: "text-amber-500" },
                    { value: "completed", label: tt.statusCompleted,     icon: <CheckCircle2 className="w-3.5 h-3.5" />,color: "text-emerald-500" },
                    { value: "cancelled", label: tt.statusCancelled,      icon: <XCircle className="w-3.5 h-3.5" />,     color: "text-red-500" },
                    { value: "missed",    label: tt.statusMissed,     icon: <XCircle className="w-3.5 h-3.5" />,     color: "text-orange-500" },
                    { value: "planned",   label: tt.statusPlanned, icon: <Calendar className="w-3.5 h-3.5" />,    color: "text-violet-500" },
                  ]}
                />
              </div>

              {/* Type select */}
              <div className="w-full sm:w-36 flex-shrink-0">
                <CustomSelect
                  value={typeFilter}
                  onChange={(v) => setTypeFilter(v as FilterType)}
                  searchPlaceholder={tt.searchPlaceholder}
                  noOptionsLabel={tt.noOptionsFound}
                  options={[
                    { value: "all",     label: tt.allTypes },
                    { value: "video",   label: tt.typeVideo,   icon: <Video className="w-3.5 h-3.5" />,         color: "text-cyan-500" },
                    { value: "offline", label: tt.typeOffline, icon: <MapPin className="w-3.5 h-3.5" />,        color: "text-emerald-500" },
                    { value: "home",    label: tt.typeHome, icon: <Home className="w-3.5 h-3.5" />,          color: "text-orange-500" },
                    { value: "chat",    label: tt.typeChat,     icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-indigo-500" },
                    { value: "phone",   label: tt.typePhone, icon: <Phone className="w-3.5 h-3.5" />,         color: "text-teal-500" },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

      {/* ── Empty State ── */}
      {filteredConsultations.length === 0 && (
        <div className="relative bg-gray-50 border border-gray-200 rounded-3xl p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-violet-50/50" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-5 bg-blue-100 border border-blue-200 rounded-2xl">
              <Stethoscope className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {consultations.length === 0 ? tt.noConsultations : tt.noResults}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              {consultations.length === 0
                ? tt.consultationsWillAppear
                : tt.tryOtherFilters}
            </p>
          </div>
        </div>
      )}

      {/* ── Desktop Table — single grid so header and row columns are always aligned ── */}
      {filteredConsultations.length > 0 && (
        <div className="hidden xl:grid grid-cols-[1.3fr_1.7fr_1.1fr_1.4fr_1.1fr_1.2fr] overflow-hidden">
          {/* Header cells — row 1 of the grid */}
          {[tt.colDateTime, tt.colDoctor, tt.colSpecialization, tt.colType, tt.colStatus, tt.colActions].map((h, i) => (
            <div
              key={h}
              className={`py-3.5 px-5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase bg-gray-50 border-b border-gray-200 ${i > 0 ? "border-l border-gray-200" : ""}`}
            >
              {h}
            </div>
          ))}

          {/* Data cells — subsequent rows */}
          {visibleConsultations.map((consultation, idx) => {
            const status = getStatusConfig(consultation.status, consultation.type);
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

                {/* Doctor */}
                <div className={`flex items-center gap-3 px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <span className="text-white font-bold text-sm">{getInitial(consultation)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 leading-tight truncate">
                      {`${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || tt.doctorNotAssigned}
                    </div>
                    <div className="text-xs text-blue-500 font-medium mt-0.5">{tt.doctorLabel}</div>
                  </div>
                </div>

                {/* Specialization */}
                <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                  <div className="text-sm text-gray-700 font-medium">{getSpecialization(consultation)}</div>
                </div>

                {/* Type */}
                <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${type.cls}`}>
                    {type.icon}{type.label}
                  </span>
                </div>

                {/* Status */}
                <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${status.cls}`}>
                    {status.icon}{status.label}
                  </span>
                </div>

                {/* Actions */}
                <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                  {renderActions(consultation)}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Tablet View — single grid for perfect alignment ── */}
      {filteredConsultations.length > 0 && (
        <div className="hidden md:grid xl:hidden grid-cols-[1.3fr_1fr_1fr_1.7fr] overflow-hidden border-t border-gray-100">
          {[tt.colDoctor, tt.colDate, tt.colStatus, tt.colActions].map((h, i) => (
            <div key={h} className={`py-3.5 px-5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase bg-gray-50 border-b border-gray-200 ${i > 0 ? "border-l border-gray-200" : ""}`}>{h}</div>
          ))}
          {visibleConsultations.map((consultation, idx) => {
            const status = getStatusConfig(consultation.status, consultation.type);
            const grad = avatarGradients[idx % avatarGradients.length];
            const dateStr = consultation.scheduled_at || consultation.created_at;
            const timeStr = consultation.scheduled_at || consultation.started_at;
            const rowBorder = idx > 0 ? "border-t border-gray-100" : "";
            return (
              <React.Fragment key={`tab-${consultation.id}`}>
                <div className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                  <div className={`w-9 h-9 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-xs">{getInitial(consultation)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{`${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || tt.doctorNotAssigned}</div>
                    <div className="text-xs text-gray-400 truncate">{getSpecialization(consultation)}</div>
                  </div>
                </div>
                <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                  <div className="text-sm font-semibold text-gray-900">{dateStr ? formatDate(dateStr) : "—"}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{timeStr ? formatTime(timeStr) : "—"}</div>
                </div>
                <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${status.cls}`}>
                    {status.icon}<span className="hidden sm:inline">{status.label}</span>
                  </span>
                </div>
                <div className={`px-5 py-4 border-l border-gray-100 hover:bg-gray-50/70 transition-colors ${rowBorder}`}>{renderActions(consultation)}</div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Mobile Cards ── */}
      {filteredConsultations.length > 0 && (
        <div className="md:hidden space-y-3">
          {visibleConsultations.map((consultation, idx) => {
            const status = getStatusConfig(consultation.status, consultation.type);
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
                        {`${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || tt.doctorNotAssigned}
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
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{tt.dateField}</span>
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
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{tt.typeField}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${type.cls}`}>
                      {type.icon}
                      {type.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {consultation.type === "home" ? (
                    renderActions(consultation)
                  ) : (
                    <>
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
                          {joinInfo.isReady || isOngoing ? tt.connect : tt.through(joinInfo.timeUntil)}
                        </button>
                      )}
                      {!isOngoing && (!isScheduled || !joinInfo.canJoin) && (
                        <button
                          onClick={() => setDetailsConsultation(consultation)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors">
                          <Eye className="w-4 h-4" />
                          {tt.details}
                        </button>
                      )}
                      <button className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-400 rounded-xl transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </>
                  )}
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
            {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredConsultations.length)} {tt.of2} {filteredConsultations.length}
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

    </div>{/* end unified card */}

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
                  <h3 className="text-lg font-bold text-gray-900">{tt.detailsTitle}</h3>
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
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {tt.dateField}</p>
                  <p className="text-sm font-semibold text-gray-900">{dateStr ? formatDate(dateStr) : "—"}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{dateStr ? formatTime(dateStr) : "—"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">{tt.typeField}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${type.cls}`}>
                    {type.icon}{type.label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">{tt.statusField}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${status.cls}`}>
                    {status.icon}{status.label}
                  </span>
                </div>
                {c.clinic_name && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {tt.clinic}</p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{c.clinic_name}</p>
                    {c.clinic_address && <p className="text-xs text-gray-400 mt-0.5">{c.clinic_address}</p>}
                  </div>
                )}
              </div>

              {/* Symptoms */}
              {c.symptoms && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">{tt.complaints}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.symptoms}</p>
                </div>
              )}

              <button
                onClick={() => setDetailsConsultation(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
              >
                {tt.close}
              </button>
            </div>
          </div>
        );
      })(), document.body)}

    {/* Home appointment tracking modal — full-screen map style */}
    {trackingConsultation && typeof document !== "undefined" && createPortal(
      <div className="fixed inset-0 z-50">
        {/* Full-screen container */}
        <div className="absolute inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] sm:h-[88vh] sm:rounded-3xl bg-white overflow-hidden shadow-2xl flex flex-col">

          {/* Close button — floats top-right over map */}
          <button
            onClick={() => setTrackingConsultation(null)}
            className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-gray-600 hover:text-gray-900 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Map fills everything */}
          <div className="flex-1 relative overflow-hidden">
            <AppointmentStatus
              appointmentId={trackingConsultation.home_appointment_id ?? trackingConsultation.id}
              address={trackingConsultation.address || trackingConsultation.clinic_address || ""}
              latitude={trackingConsultation.latitude ?? null}
              longitude={trackingConsultation.longitude ?? null}
              onNewAppointment={() => setTrackingConsultation(null)}
            />
          </div>
        </div>

        {/* Dim backdrop only on desktop (mobile = full screen) */}
        <div
          className="hidden sm:block absolute inset-0 -z-10"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setTrackingConsultation(null)}
        />
      </div>,
      document.body
    )}
    </div>
  );
};

export default PatientConsultationsTable;
