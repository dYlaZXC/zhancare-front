"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/utils/api";
import { websocketService } from "@/services/websocketService";
import { toast } from "react-toastify";
import {
  Search,
  Plus,
  Video,
  Home,
  MapPin,
  Clock,
  Stethoscope,
  FlaskConical,
  ScanLine,
  Heart,
  Brain,
  Bone,
  Eye,
  Baby,
  Microscope,
  ClipboardList,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ScheduleEvent } from "../types/scheduleTypes";
import StaffScheduleModal from "../../StaffScheduleModal";
import AssignConsultationModal from "../modals/AssignConsultationModal";
import AssignDiagnosticsModal from "../modals/AssignDiagnosticsModal";
import { getClinicToday, getClinicNowMinutes } from "../utils/scheduleUtils";
import { useBrand } from "@/context/BrandContext";

interface StaffDay {
  id: number;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'nurse';
  specialization?: string;
  preferred_consultation_duration?: number;
  room_number?: string | null;
  schedule: { source: string; start_time: string; end_time: string } | null;
  next_available: { date: string; start_time: string; end_time: string; source: string } | null;
}

interface ServiceDay {
  id: number;
  name: string;
  category: string;
  category_label: string;
  duration_minutes: number;
  capacity_per_slot: number | null;
  icon: string;
  color: string;
  schedule: { start_time: string; end_time: string } | null;
  // schedule_source='doctor' services have no single window (assigned
  // doctors can have disjoint hours) — real per-slot availability instead,
  // already accounting for each doctor's own AppointmentSlot conflicts.
  schedule_source: "own" | "doctor";
  doctor_slots: { start: string; end: string; available: number }[] | null;
  doctor_ids: number[];
  doctor_names: string[];
}

const SERVICE_ICON_MAP: Record<string, React.ElementType> = {
  'flask-conical': FlaskConical,
  'scan-line':     ScanLine,
  'heart':         Heart,
  'brain':         Brain,
  'bone':          Bone,
  'eye':           Eye,
  'baby':          Baby,
  'microscope':    Microscope,
  'clipboard-list': ClipboardList,
  'stethoscope':   Stethoscope,
};
const getServiceIcon = (icon: string): React.ElementType => SERVICE_ICON_MAP[icon] ?? ClipboardList;

/**
 * "Свободные врачи" tab inside DateDetailsDrawer — lets the admin check who's
 * actually free on the date they just clicked and book them right there,
 * without leaving the drawer to go find the separate "График врачей" top-nav
 * view and re-pick the date there. Deliberately reuses the exact same
 * /staff/doctors-day/ endpoint + AssignConsultationModal that view already
 * uses (rather than a parallel implementation), so the two surfaces can
 * never silently drift apart on what "free" means.
 *
 * `events` is the date-scoped list DateDetailsDrawer already receives from
 * ScheduleView (already filtered to this exact date, across every doctor) —
 * booking through this tab calls the same onBooked()/fetchSchedule() the
 * bookings tab uses, which flows back down through that same prop, so a
 * slot flips from free to busy here without a second, separate refetch.
 */
export function AvailableDoctorsTab({
  date,
  events,
  onBooked,
  onOpenFullForm,
  syncConsultationType = null,
}: {
  date: string;
  events: ScheduleEvent[];
  onBooked: () => void;
  /** This tab only ever creates online/offline consultations (see
   * AssignConsultationModal) — a home visit, diagnostics, or anything else
   * needs the full form instead. Omit to hide the shortcut entirely. */
  onOpenFullForm?: () => void;
  /** Nudges the toggle below to follow AddEventModal's own type when that's
   * also open — the admin can still flip it manually afterward, this just
   * keeps the two from starting out disagreeing. */
  syncConsultationType?: 'online' | 'offline' | 'home' | 'diagnostics' | null;
}) {
  const { clinicTimezone } = useBrand();
  const [staffDay, setStaffDay] = useState<StaffDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Three-way, not two: "В клинике" and "Вызов на дом" both resolve to the
  // same backend consultation_type ('offline' — see apiConsultationType
  // below, matching the exact convention AddEventModal itself uses for a
  // nurse's schedule), but they must never be shown mixed together in one
  // list — a doctor's in-clinic slot and a nurse's home-visit slot are
  // different bookings entirely. The role filter (roleFilter below) is
  // what actually keeps them apart; the consultation_type is just which
  // half of the (already fetched) staffDay response is relevant.
  const [viewMode, setViewMode] = useState<'online' | 'offline' | 'home' | 'diagnostics'>('online');
  useEffect(() => {
    if (syncConsultationType) setViewMode(syncConsultationType);
  }, [syncConsultationType]);
  const apiConsultationType = viewMode === 'online' ? 'online' : 'offline';
  const roleFilter: 'doctor' | 'nurse' = viewMode === 'home' ? 'nurse' : 'doctor';
  const [showNoSchedule, setShowNoSchedule] = useState(false);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<number>>(new Set());
  const [scheduleEditMember, setScheduleEditMember] = useState<{ id: number; first_name: string; last_name: string } | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [modalAvailableSlots, setModalAvailableSlots] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // "Диагностика" — services, not staff. Fetched from the exact same
  // services-day endpoint ServicesScheduleContent ("График услуг") already
  // uses, so the two surfaces can't drift on what "free" means, same
  // reasoning as staffDay above.
  const [servicesDay, setServicesDay] = useState<ServiceDay[]>([]);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());
  const [assignDiagModal, setAssignDiagModal] = useState<{
    service: ServiceDay;
    slot: { start: string; end: string } | null;
    allSlots: { start: string; end: string }[];
  } | null>(null);

  const fetchServicesDay = useCallback(() => {
    if (!date) return;
    setLoading(true);
    api.get('/diagnostics/services/services-day/', { params: { date } })
      .then(res => setServicesDay(res.data.results ?? res.data))
      .catch(() => toast.error("Не удалось загрузить доступность услуг на дату"))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    if (viewMode !== 'diagnostics') return;
    fetchServicesDay();
  }, [viewMode, fetchServicesDay]);

  const fetchStaffDay = useCallback(() => {
    if (!date) return;
    setLoading(true);
    api.get('/staff/doctors-day/', { params: { date, consultation_type: apiConsultationType } })
      .then(res => setStaffDay(res.data))
      .catch(() => toast.error("Не удалось загрузить доступность на дату"))
      .finally(() => setLoading(false));
    // Deliberately keyed on apiConsultationType, not viewMode — "В клинике"
    // and "Вызов на дом" share the same query (both 'offline'), so toggling
    // between them is instant, filtered client-side by role below, not a
    // second round-trip for data that's already in hand.
  }, [date, apiConsultationType]);

  useEffect(() => {
    if (viewMode === 'diagnostics') return;
    fetchStaffDay();
  }, [viewMode, fetchStaffDay]);

  // Live removal/return of a doctor or nurse the moment they toggle their own
  // status (DoctorHeader's dropdown) or an admin toggles it from the staff
  // list — refetches whichever of the two views is on screen, so a doctor
  // marked "Не работает" disappears from here without anyone refreshing the
  // page. The backend already broadcasts both events to every connected
  // client (common/views/profile.py); this tab just has to be listening.
  useEffect(() => {
    websocketService.connect().catch(() => {});
    const onChange = () => { fetchStaffDay(); fetchServicesDay(); };
    websocketService.on('doctor_availability_changed', onChange);
    websocketService.on('nurse_availability_changed', onChange);
    return () => {
      websocketService.off('doctor_availability_changed', onChange);
      websocketService.off('nurse_availability_changed', onChange);
    };
  }, [fetchStaffDay, fetchServicesDay]);

  const toggleDoctor = (id: number) => {
    setExpandedDoctors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Same slot-generation shape as DoctorsScheduleContent's own generateSlots —
  // duplicated deliberately rather than shared, to avoid touching that
  // already-shipped view while wiring up this new surface.
  const generateAllSlots = (member: StaffDay): any[] => {
    if (!member.schedule) return [];
    const { start_time, end_time } = member.schedule;
    if (!start_time || !end_time) return [];
    const duration = member.preferred_consultation_duration || 30;
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);
    let cur = startH * 60 + startM;
    let end = endH * 60 + endM;
    if (end <= cur) end += 24 * 60;

    const isToday = date === getClinicToday(clinicTimezone);
    const nowMinutes = isToday ? getClinicNowMinutes(clinicTimezone) : -1;
    const fmt = (mins: number) => {
      const m = mins % (24 * 60);
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    };

    const slots: any[] = [];
    while (cur + duration <= end) {
      if (isToday && cur <= nowMinutes) { cur += duration; continue; }
      const s = fmt(cur);
      const e = fmt(cur + duration);
      slots.push({ id: `gen_${s.replace(':', '')}`, start_time: s, end_time: e });
      cur += duration;
    }
    return slots;
  };

  const handleSlotClick = (staffId: number, slot: any, allSlots: any[]) => {
    setSelectedDoctor(staffId);
    setSelectedSlot(slot);
    setModalAvailableSlots(allSlots);
    setShowAssignModal(true);
  };

  const handleAddClick = (staffId: number, allSlots: any[]) => {
    setSelectedDoctor(staffId);
    setSelectedSlot(null);
    setModalAvailableSlots(allSlots);
    setShowAssignModal(true);
  };

  const toggleService = (id: number) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleServiceSlotClick = (service: ServiceDay, slot: { start: string; end: string }, allSlots: { start: string; end: string }[]) => {
    setAssignDiagModal({ service, slot, allSlots });
  };

  const handleServiceAddClick = (service: ServiceDay, allSlots: { start: string; end: string }[]) => {
    setAssignDiagModal({ service, slot: null, allSlots });
  };

  // Same shape as ServicesScheduleContent's own generateSlots — deliberately
  // duplicated rather than shared, to avoid touching that already-shipped
  // view while wiring up this new surface (same reasoning as staff above).
  const generateServiceSlots = (s: ServiceDay): { start: string; end: string }[] => {
    if (s.schedule_source === "doctor") {
      // Already-computed real slots — per-doctor conflicts and the
      // now-cutoff are handled backend-side.
      return (s.doctor_slots ?? []).filter(sl => sl.available > 0).map(sl => ({ start: sl.start, end: sl.end }));
    }
    if (!s.schedule) return [];
    const { start_time, end_time } = s.schedule;
    const dur = s.duration_minutes;
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const isToday = date === getClinicToday(clinicTimezone);
    const nowMinutes = isToday ? getClinicNowMinutes(clinicTimezone) : -1;
    const slots: { start: string; end: string }[] = [];
    while (cur + dur <= end) {
      if (cur > nowMinutes) slots.push({ start: fmt(cur), end: fmt(cur + dur) });
      cur += dur;
    }
    return slots;
  };

  const bookedEventsForService = (name: string) =>
    events.filter(e => e.type === 'diagnostics' && e.service_name === name);

  const filteredServices = servicesDay.filter(s => {
    const query = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(query) || s.category_label.toLowerCase().includes(query);
  });
  // A doctor-mode service "works" this day if at least one generated slot
  // is available — it never has a single `schedule` window to check.
  const serviceWorksToday = (s: ServiceDay) =>
    s.schedule_source === "doctor" ? !!s.doctor_slots?.some(sl => sl.available > 0) : s.schedule !== null;
  const servicesWithSchedule = filteredServices.filter(serviceWorksToday);
  const servicesWithoutSchedule = filteredServices.filter(s => !serviceWorksToday(s));

  const filteredStaff = staffDay.filter(member => {
    if (member.role !== roleFilter) return false;
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const specialization = member.specialization?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || specialization.includes(query);
  });

  const staffHasActivity = (member: StaffDay) =>
    member.schedule !== null || events.some(e => e.doctor_id === member.id);

  const withSchedule = filteredStaff.filter(m => staffHasActivity(m));
  const withoutSchedule = filteredStaff.filter(m => !staffHasActivity(m));

  const gradients = [
    ['#3772ff', '#2c5bcc'],
    ['#8b5cf6', '#7c3aed'],
    ['#f43f5e', '#e11d48'],
    ['#f59e0b', '#d97706'],
    ['#10b981', '#059669'],
    ['#06b6d4', '#0891b2'],
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Search + type toggle */}
      <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === 'diagnostics' ? "Поиск услуги, категории..." : "Поиск врача, медсестры, специализации..."}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('online')}
            title="Видеоконсультация"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'online' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Video className="w-3 h-3" />
            <span className="hidden lg:inline">Видео</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('offline')}
            title="Приём в клинике"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'offline' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Home className="w-3 h-3" />
            <span className="hidden lg:inline">В клинике</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('home')}
            title="Вызов на дом"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'home' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}
          >
            <MapPin className="w-3 h-3" />
            <span className="hidden lg:inline">На дом</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('diagnostics')}
            title="Диагностика"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'diagnostics' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500'}`}
          >
            <FlaskConical className="w-3 h-3" />
            <span className="hidden lg:inline">Диагностика</span>
          </button>
        </div>
      </div>

      {/* Escape hatch — every type is covered by the toggle above now, but
          this quick-book flow is deliberately lighter than the full form
          (no payment-type picker, no referring-doctor field for
          diagnostics, etc.) — anyone needing those still has one click
          back to it. */}
      {onOpenFullForm && (
        <button
          type="button"
          onClick={onOpenFullForm}
          className="flex-shrink-0 flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-b border-gray-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Открыть полную форму (оплата и другие настройки)
        </button>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Загрузка доступности...</span>
          </div>
        ) : viewMode === 'diagnostics' ? (
          filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FlaskConical className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold">
                {searchQuery ? 'Услуги не найдены' : 'Нет услуг'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* No-schedule banner */}
              {servicesWithoutSchedule.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
                  <button
                    onClick={() => setShowNoSchedule(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-amber-800">
                        {servicesWithoutSchedule.length}{' '}
                        {servicesWithoutSchedule.length === 1 ? 'услуга не работает' : 'услуг не работают'}{' '}
                        в этот день
                      </span>
                    </div>
                    {showNoSchedule ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
                  </button>
                  {showNoSchedule && (
                    <div className="px-4 pb-4 pt-1 border-t border-amber-200 flex flex-wrap gap-2">
                      {servicesWithoutSchedule.map(s => {
                        const Icon = getServiceIcon(s.icon);
                        return (
                          <div key={s.id} className="flex items-center gap-2 px-2.5 py-2 bg-white border border-gray-200 rounded-xl">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${s.color}cc, ${s.color})` }}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-gray-700 truncate">{s.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {servicesWithSchedule.map((s) => {
                const Icon = getServiceIcon(s.icon);
                const allSlots = generateServiceSlots(s);
                const bookedEvents = bookedEventsForService(s.name);
                const cap = s.capacity_per_slot;
                // Slots that still have capacity left — for schedule_source
                // 'doctor', allSlots is already only the available ones
                // (see generateServiceSlots), so this is a no-op there.
                const availableSlots = allSlots.filter(slot => {
                  const bookedAtTime = bookedEvents.filter(e => e.time?.substring(0, 5) === slot.start).length;
                  return cap === null || cap === undefined || bookedAtTime < cap;
                });
                const isExpanded = expandedServices.has(s.id);
                const totalSlots = bookedEvents.length + availableSlots.length;
                const fillRatio = totalSlots > 0 ? bookedEvents.length / totalSlots : -1;
                const statusColor = fillRatio === -1 ? 'bg-gray-300'
                  : fillRatio >= 1 ? 'bg-red-500'
                  : fillRatio > 0.7 ? 'bg-amber-400'
                  : 'bg-emerald-500';

                return (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleService(s.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleService(s.id); } }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${s.color}cc, ${s.color})` }}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 leading-tight truncate">{s.name}</span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md text-white flex-shrink-0" style={{ background: s.color }}>
                            {s.category_label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">{s.duration_minutes} мин</span>
                          {cap != null && <span className="text-[10px] font-semibold text-blue-500">· {cap} на слот</span>}
                          {s.schedule && (
                            <span className="text-[10px] font-semibold text-gray-400">
                              · {s.schedule.start_time.slice(0, 5)}–{s.schedule.end_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`hidden sm:flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${availableSlots.length > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${availableSlots.length > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {availableSlots.length} свободно
                      </span>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleServiceAddClick(s, availableSlots); }}
                        disabled={availableSlots.length === 0}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white rounded-xl flex-shrink-0 shadow-sm hover:shadow-md transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                        style={{ background: `linear-gradient(135deg, ${s.color}cc, ${s.color})` }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Запись</span>
                      </button>

                      <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/30">
                            {availableSlots.length === 0 ? (
                              <p className="text-xs text-gray-400 font-medium text-center py-3">Все слоты заняты на этот день</p>
                            ) : (
                              <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Свободные слоты</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {availableSlots.slice(0, 24).map((slot, i) => (
                                    <button
                                      key={i}
                                      onClick={() => handleServiceSlotClick(s, slot, availableSlots)}
                                      className="flex flex-col items-center justify-center px-2.5 py-1.5 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-500 hover:border-emerald-500 transition-all group"
                                    >
                                      <span className="text-xs font-black text-emerald-700 group-hover:text-white leading-tight">{slot.start}</span>
                                    </button>
                                  ))}
                                  {availableSlots.length > 24 && (
                                    <span className="flex items-center px-2.5 py-1.5 text-xs font-bold text-gray-400">
                                      +{availableSlots.length - 24} ещё
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Stethoscope className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold">
              {searchQuery ? 'Сотрудники не найдены' : 'Нет сотрудников'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* No-schedule banner */}
            {withoutSchedule.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
                <button
                  onClick={() => setShowNoSchedule(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-amber-800">
                      У {withoutSchedule.length}{' '}
                      {withoutSchedule.length === 1 ? 'сотрудника' : 'сотрудников'}{' '}
                      нет расписания на этот день
                    </span>
                  </div>
                  {showNoSchedule ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
                </button>
                {showNoSchedule && (
                  <div className="px-4 pb-4 pt-1 border-t border-amber-200 flex flex-wrap gap-2">
                    {withoutSchedule.map(member => {
                      const [cg1, cg2] = gradients[member.id % gradients.length];
                      return (
                        <div key={member.id} className="flex items-center gap-2 px-2.5 py-2 bg-white border border-gray-200 rounded-xl">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, ${cg1}, ${cg2})` }}>
                            {member.first_name?.[0] ?? "?"}{member.last_name?.[0] ?? "?"}
                          </div>
                          <p className="text-xs font-semibold text-gray-700 truncate">{member.first_name} {member.last_name}</p>
                          <button
                            onClick={() => setScheduleEditMember(member)}
                            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            <CalendarIcon className="w-3 h-3" />
                            Расписание
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {withSchedule.map((member) => {
              const bookedSlots = events.filter(e => e.doctor_id === member.id);
              const allSlots = generateAllSlots(member);
              const availableSlots = allSlots.filter(s => !bookedSlots.some(ev => ev.time?.substring(0, 5) === s.start_time));
              const nearestSlot = availableSlots[0] || null;
              const isNurse = member.role === 'nurse';
              const isExpanded = expandedDoctors.has(member.id);
              const hasSchedule = member.schedule !== null;
              const totalSlots = bookedSlots.length + availableSlots.length;
              const fillRatio = totalSlots > 0 ? bookedSlots.length / totalSlots : -1;
              const [g1, g2] = gradients[member.id % gradients.length];
              const statusColor = !hasSchedule ? 'bg-gray-300'
                : fillRatio === 1 ? 'bg-red-500'
                : fillRatio > 0.7 ? 'bg-amber-400'
                : 'bg-emerald-500';

              return (
                <div key={member.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleDoctor(member.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDoctor(member.id); } }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                      >
                        {member.first_name?.[0] ?? "?"}{member.last_name?.[0] ?? "?"}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 leading-tight truncate">{member.first_name} {member.last_name}</span>
                        {isNurse && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-600 flex-shrink-0">Медсестра</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {member.specialization && <span className="text-xs text-gray-400 truncate">{member.specialization}</span>}
                        {hasSchedule && (
                          <span className="text-[10px] font-semibold text-gray-400">
                            · {member.schedule!.start_time}–{member.schedule!.end_time}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`hidden sm:flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${availableSlots.length > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${availableSlots.length > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      {availableSlots.length} свободно
                    </span>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddClick(member.id, availableSlots); }}
                      disabled={availableSlots.length === 0}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white rounded-xl flex-shrink-0 shadow-sm hover:shadow-md transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                      style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Запись</span>
                    </button>

                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/30">
                          {!hasSchedule ? (
                            member.next_available ? (
                              <p className="text-xs text-amber-600 font-medium text-center py-3">
                                Ближайшее расписание: {(() => { const d = new Date(member.next_available!.date + 'T00:00:00'); return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); })()}, {member.next_available!.start_time}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 font-medium text-center py-3">Расписание не задано</p>
                            )
                          ) : availableSlots.length === 0 ? (
                            <p className="text-xs text-gray-400 font-medium text-center py-3">Все слоты заняты на этот день</p>
                          ) : (
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Свободные слоты</p>
                              <div className="flex flex-wrap gap-1.5">
                                {availableSlots.slice(0, 24).map((slot: any, i: number) => (
                                  <button
                                    key={i}
                                    onClick={() => handleSlotClick(member.id, slot, availableSlots)}
                                    className="flex flex-col items-center justify-center px-2.5 py-1.5 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-500 hover:border-emerald-500 transition-all group"
                                  >
                                    <span className="text-xs font-black text-emerald-700 group-hover:text-white leading-tight">{slot.start_time}</span>
                                  </button>
                                ))}
                                {availableSlots.length > 24 && (
                                  <span className="flex items-center px-2.5 py-1.5 text-xs font-bold text-gray-400">
                                    +{availableSlots.length - 24} ещё
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StaffScheduleModal
        isOpen={!!scheduleEditMember}
        member={scheduleEditMember}
        onClose={() => setScheduleEditMember(null)}
        onSaved={() => { setScheduleEditMember(null); onBooked(); }}
      />

      {showAssignModal && selectedDoctor && (
        <AssignConsultationModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDoctor(null);
            setSelectedSlot(null);
            setModalAvailableSlots([]);
          }}
          doctorId={selectedDoctor}
          doctorName={(() => { const d = staffDay.find(x => x.id === selectedDoctor); return d ? `${d.first_name} ${d.last_name}` : ''; })()}
          doctorSpecialization={staffDay.find(x => x.id === selectedDoctor)?.specialization}
          staffRole={staffDay.find(x => x.id === selectedDoctor)?.role}
          slot={selectedSlot}
          availableSlots={modalAvailableSlots}
          date={date}
          onAssigned={() => {
            setShowAssignModal(false);
            setModalAvailableSlots([]);
            onBooked();
          }}
        />
      )}

      {assignDiagModal && (
        <AssignDiagnosticsModal
          isOpen={!!assignDiagModal}
          onClose={() => setAssignDiagModal(null)}
          serviceId={assignDiagModal.service.id}
          serviceName={assignDiagModal.service.name}
          serviceCategoryLabel={assignDiagModal.service.category_label}
          serviceColor={assignDiagModal.service.color}
          serviceIcon={assignDiagModal.service.icon}
          serviceDoctorName={assignDiagModal.service.doctor_names.length > 0 ? assignDiagModal.service.doctor_names.join(", ") : null}
          slot={assignDiagModal.slot}
          allSlots={assignDiagModal.allSlots}
          date={date}
          onAssigned={() => {
            setAssignDiagModal(null);
            onBooked();
          }}
        />
      )}
    </div>
  );
}

export default AvailableDoctorsTab;
