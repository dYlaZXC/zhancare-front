"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import {
  Search, Loader2, CalendarDays, AlertCircle, Clock,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  FlaskConical, ScanLine, Heart, Brain, Bone, Eye, Baby, Microscope,
  ClipboardList, Stethoscope, Plus,
} from "lucide-react";
import AssignDiagnosticsModal from "../modals/AssignDiagnosticsModal";

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
  appointment_count: number;
}

interface DiagnosticsEvent {
  id: string;
  type: string;
  service_name?: string;
  category?: string;
  date: string;
  time: string;
  duration: number;
  patient_name: string;
  status: string;
}

interface ServicesScheduleContentProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  events: DiagnosticsEvent[];
  onAddClick: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
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

function getCategoryIcon(icon: string): React.ElementType {
  return ICON_MAP[icon] ?? ClipboardList;
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function ServicesScheduleContent({
  selectedDate,
  onDateChange,
  events,
  onAddClick,
}: ServicesScheduleContentProps) {
  const [services, setServices] = useState<ServiceDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNoSchedule, setShowNoSchedule] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());
  const [nearestSlots, setNearestSlots] = useState<Record<number, { date: string; start: string } | null>>({});

  // Slot-click modal state (mirrors DoctorsScheduleContent pattern)
  const [assignModal, setAssignModal] = useState<{
    service: ServiceDay;
    slot: { start: string; end: string } | null;
    allSlots: { start: string; end: string }[];
  } | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      // Use the services-day endpoint — respects По датам > Постоянное priority
      const res = await api.get('/diagnostics/services/services-day/', { params: { date: selectedDate } });
      const svcs: Array<{
        id: number; name: string; category: string; category_label: string;
        duration_minutes: number; capacity_per_slot: number | null;
        icon: string; color: string;
        schedule: { start_time: string; end_time: string; source: string } | null;
      }> = res.data.results ?? res.data;

      const mapped: ServiceDay[] = svcs.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        category_label: s.category_label,
        duration_minutes: s.duration_minutes,
        capacity_per_slot: s.capacity_per_slot,
        icon: s.icon,
        color: s.color,
        schedule: s.schedule ? { start_time: s.schedule.start_time, end_time: s.schedule.end_time } : null,
        appointment_count: 0,
      }));

      setServices(mapped);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const toggleService = (id: number) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSlotClick = (service: ServiceDay, slot: { start: string; end: string }, allSlots: { start: string; end: string }[]) => {
    setAssignModal({ service, slot, allSlots });
  };

  const handleAddClick = (service: ServiceDay, allSlots: { start: string; end: string }[]) => {
    setAssignModal({ service, slot: null, allSlots });
  };

  // Week strip
  const getWeekStrip = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    const jsDay = d.getDay();
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  };

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const weekDays = getWeekStrip();

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category_label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const withSchedule = filtered.filter(s => s.schedule !== null);
  const withoutSchedule = filtered.filter(s => s.schedule === null);

  const bookedEventsForService = (name: string): DiagnosticsEvent[] =>
    events.filter(e => e.type === 'diagnostics' && e.service_name === name && e.date === selectedDate);

  // Generate available slots. For today, slots that already started are dropped —
  // mirrors the "current <= now" cutoff in diagnostics/views.py's available_slots,
  // so admins see the same "nothing left today" state patients get when booking.
  const generateSlots = (s: ServiceDay) => {
    if (!s.schedule) return [];
    const { start_time, end_time } = s.schedule;
    const dur = s.duration_minutes;
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const now = new Date();
    const nowMinutes = selectedDate === todayStr ? now.getHours() * 60 + now.getMinutes() : -1;
    const slots: { start: string; end: string }[] = [];
    while (cur + dur <= end) {
      if (cur > nowMinutes) {
        slots.push({ start: fmt(cur), end: fmt(cur + dur) });
      }
      cur += dur;
    }
    return slots;
  };

  // Lazily fetch "next opening" for expanded services that have nothing left
  // on the selected day — avoids a scan-ahead request for every service up front.
  useEffect(() => {
    const idsNeedingNearest = services
      .filter(s => expandedServices.has(s.id) && !(s.id in nearestSlots))
      .filter(s => generateSlots(s).length === 0)
      .map(s => s.id);

    idsNeedingNearest.forEach(async id => {
      try {
        const res = await api.get(`/diagnostics/services/${id}/nearest-slot/`);
        setNearestSlots(prev => ({ ...prev, [id]: res.data.slot }));
      } catch {
        setNearestSlots(prev => ({ ...prev, [id]: null }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedServices, services, selectedDate]);

  const MONTHS_SHORT_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  const formatNearestSlotLabel = (slot: { date: string; start: string }) => {
    if (slot.date === todayStr) return `Сегодня, ${slot.start}`;
    const tomorrow = new Date(todayStr + 'T00:00:00');
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (slot.date === tomorrow.toLocaleDateString('sv-SE')) return `Завтра, ${slot.start}`;
    const d = new Date(slot.date + 'T00:00:00');
    return `${d.getDate()} ${MONTHS_SHORT_RU[d.getMonth()]}, ${slot.start}`;
  };

  const shiftWeek = (direction: 'prev' | 'next') => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    onDateChange(d.toLocaleDateString('sv-SE'));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Week strip */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => shiftWeek('prev')} title="Предыдущая неделя"
            className="flex-shrink-0 p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {weekDays.map((day, i) => {
            const ds = day.toLocaleDateString('sv-SE');
            const isSelected = ds === selectedDate;
            const isToday = ds === todayStr;
            return (
              <button key={ds} onClick={() => onDateChange(ds)}
                className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'text-white shadow-md border-transparent'
                    : isToday
                    ? 'bg-blue-50 text-blue-600 border-blue-300'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                style={isSelected ? { background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' } : undefined}>
                <span className="text-[10px] font-medium mb-0.5 opacity-80">{DAY_NAMES[i]}</span>
                <span className="text-sm font-bold">{day.getDate()}</span>
                {isToday && (
                  <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-blue-500'}`}>
                    Сегодня
                  </span>
                )}
              </button>
            );
          })}
          <button type="button" onClick={() => shiftWeek('next')} title="Следующая неделя"
            className="flex-shrink-0 p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Поиск услуги..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
        </div>
      </div>

      {/* No-schedule banner */}
      {!loading && withoutSchedule.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
          <button onClick={() => setShowNoSchedule(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-amber-100/60 transition-colors">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-800">
                {withoutSchedule.length}{' '}
                {withoutSchedule.length === 1 ? 'услуга не работает' : 'услуг не работают'}{' '}
                в этот день
              </span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 text-xs font-medium flex-shrink-0">
              <span>{showNoSchedule ? 'Скрыть' : 'Показать'}</span>
              {showNoSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {showNoSchedule && (
            <div className="px-5 pb-5 pt-1 border-t border-amber-200">
              <div className="flex flex-wrap gap-2 mt-3">
                {withoutSchedule.map(s => {
                  const Icon = getCategoryIcon(s.icon);
                  return (
                    <div key={s.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-gray-200 rounded-xl">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${s.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.category_label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
            <span className="text-base font-medium text-gray-500">Загрузка...</span>
          </div>
        ) : withSchedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {searchQuery ? 'Услуги не найдены' : 'Нет работающих услуг в этот день'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {withSchedule.map(s => {
              const Icon = getCategoryIcon(s.icon);
              const slots = generateSlots(s);
              const bookedEvents = bookedEventsForService(s.name);
              const booked = bookedEvents.length;
              const isExpanded = expandedServices.has(s.id);
              const cap = s.capacity_per_slot;
              const fillRatio = cap && slots.length > 0
                ? booked / (slots.length * cap)
                : slots.length > 0 ? booked / slots.length : -1;

              // Slots that still have capacity left
              const freeSlots = slots.filter(slot => {
                const bookedAtTime = bookedEvents.filter(e => e.time === slot.start).length;
                return cap === null || bookedAtTime < cap;
              });

              const statusDot =
                fillRatio === -1 ? 'bg-gray-300'
                : fillRatio >= 1 ? 'bg-red-500'
                : fillRatio > 0.7 ? 'bg-amber-400'
                : 'bg-emerald-500';

              return (
                <div key={s.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  {/* Row */}
                  <button onClick={() => toggleService(s.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors text-left">

                    {/* Icon avatar + status dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${s.color}cc, ${s.color})` }}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusDot}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 truncate">{s.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                          style={{ background: s.color }}>
                          {s.category_label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {s.schedule && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {s.schedule.start_time.slice(0, 5)} — {s.schedule.end_time.slice(0, 5)}
                          </span>
                        )}
                        <span>{s.duration_minutes} мин</span>
                        {cap && <span className="text-blue-500 font-semibold">{cap} на слот</span>}
                      </div>
                    </div>

                    {/* Slots summary */}
                    <div className="flex-shrink-0 text-right">
                      {slots.length > 0 ? (
                        <>
                          <p className="text-sm font-bold text-gray-800">{slots.length}</p>
                          <p className="text-[10px] text-gray-400">слотов</p>
                        </>
                      ) : (
                        <p className="text-[10px] text-gray-400">нет слотов</p>
                      )}
                    </div>

                    {/* Expand chevron */}
                    <div className="flex-shrink-0 text-gray-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded: booked events + free slots */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-gray-50 space-y-4">
                      {slots.length === 0 && bookedEvents.length === 0 ? (
                        <div className="py-3 text-center">
                          <p className="text-xs text-gray-400 italic">Нет слотов в этот день</p>
                          {nearestSlots[s.id] === undefined ? (
                            <p className="text-xs text-gray-300 mt-1">Проверяем ближайший слот…</p>
                          ) : nearestSlots[s.id] ? (
                            <button type="button"
                              onClick={() => onDateChange(nearestSlots[s.id]!.date)}
                              className="text-xs text-[#3772FF] font-semibold mt-1.5 flex items-center justify-center gap-1.5 mx-auto hover:underline">
                              <Clock className="w-3 h-3" />
                              Ближайший слот: {formatNearestSlotLabel(nearestSlots[s.id]!)}
                            </button>
                          ) : (
                            <p className="text-xs text-gray-300 mt-1">Открытых слотов в ближайшие 14 дней нет</p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Booked appointments */}
                          {bookedEvents.length > 0 && (
                            <div className="pt-3">
                              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Записи</p>
                              <div className="flex flex-col gap-2">
                                {bookedEvents.map(event => {
                                  const initials = event.patient_name
                                    .split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
                                  return (
                                    <div key={event.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5">
                                      <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-sm"
                                        style={{ background: `linear-gradient(135deg, ${s.color}cc, ${s.color})` }}>
                                        <span className="text-[11px] font-black leading-tight">{event.time}</span>
                                        <span className="text-[8px] opacity-80 mt-0.5">{event.duration}мин</span>
                                      </div>
                                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {initials}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate">{event.patient_name}</p>
                                        <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5 ${
                                          event.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                                          : event.status === 'cancelled' ? 'bg-red-100 text-red-600'
                                          : event.status === 'in_progress' ? 'bg-amber-100 text-amber-700'
                                          : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {event.status === 'completed' ? 'Выполнено'
                                           : event.status === 'cancelled' ? 'Отменено'
                                           : event.status === 'in_progress' ? 'В процессе'
                                           : 'Запланировано'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Free slots */}
                          {freeSlots.length > 0 && (
                            <div className={bookedEvents.length > 0 ? '' : 'pt-3'}>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Свободные слоты</p>
                              <div className="flex flex-wrap gap-2">
                                {freeSlots.map(slot => (
                                  <button key={slot.start} type="button"
                                    onClick={() => handleSlotClick(s, slot, freeSlots)}
                                    className="flex flex-col items-center justify-center px-3 py-2 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-500 hover:border-emerald-500 transition-all group">
                                    <span className="text-xs font-black text-emerald-700 group-hover:text-white leading-tight">{slot.start}</span>
                                    <span className="text-[9px] text-emerald-400 group-hover:text-emerald-100">{slot.end}</span>
                                  </button>
                                ))}
                                <button type="button" onClick={() => handleAddClick(s, freeSlots)}
                                  className="flex flex-col items-center justify-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-[9px] text-gray-400 mt-0.5">Добавить</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {assignModal && (
        <AssignDiagnosticsModal
          isOpen={!!assignModal}
          onClose={() => setAssignModal(null)}
          serviceId={assignModal.service.id}
          serviceName={assignModal.service.name}
          serviceCategoryLabel={assignModal.service.category_label}
          serviceColor={assignModal.service.color}
          serviceIcon={assignModal.service.icon}
          slot={assignModal.slot}
          allSlots={assignModal.allSlots}
          date={selectedDate}
          onAssigned={() => {
            setAssignModal(null);
            fetchServices();
          }}
        />
      )}
    </div>
  );
}
