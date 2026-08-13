"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import {
  X, Loader2, CheckCircle2, Save, CalendarDays, ChevronLeft, ChevronRight,
  RotateCcw, Users,
} from "lucide-react";
import type { Service } from "../types/serviceTypes";

const WEEKDAYS = [
  { value: "monday",    labelRu: "Понедельник", labelShort: "Пн" },
  { value: "tuesday",   labelRu: "Вторник",     labelShort: "Вт" },
  { value: "wednesday", labelRu: "Среда",       labelShort: "Ср" },
  { value: "thursday",  labelRu: "Четверг",     labelShort: "Чт" },
  { value: "friday",    labelRu: "Пятница",     labelShort: "Пт" },
  { value: "saturday",  labelRu: "Суббота",     labelShort: "Сб" },
  { value: "sunday",    labelRu: "Воскресенье", labelShort: "Вс" },
];

const DEFAULT_WEEKLY_SCHEDULE: Record<string, { enabled: boolean; start: string; end: string }> = {
  monday:    { enabled: false, start: "09:00", end: "18:00" },
  tuesday:   { enabled: false, start: "09:00", end: "18:00" },
  wednesday: { enabled: false, start: "09:00", end: "18:00" },
  thursday:  { enabled: false, start: "09:00", end: "18:00" },
  friday:    { enabled: false, start: "09:00", end: "18:00" },
  saturday:  { enabled: false, start: "10:00", end: "14:00" },
  sunday:    { enabled: false, start: "10:00", end: "14:00" },
};

// Matches the weekday convention used by DoctorSchedule on the backend (0=Monday..6=Sunday)
const DAY_TO_WEEKDAY: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};
const WEEKDAY_TO_DAY: Record<number, string> = {
  0: "monday", 1: "tuesday", 2: "wednesday", 3: "thursday", 4: "friday", 5: "saturday", 6: "sunday",
};

function schedulesToWeeklyMap(
  schedules: Service["schedules"]
): Record<string, { enabled: boolean; start: string; end: string }> {
  const map = { ...DEFAULT_WEEKLY_SCHEDULE };
  for (const row of schedules ?? []) {
    const day = WEEKDAY_TO_DAY[row.weekday];
    if (day) map[day] = { enabled: true, start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5) };
  }
  return map;
}

function weeklyMapToSchedules(
  weeklySchedule: Record<string, { enabled: boolean; start: string; end: string }>
): Array<{ weekday: number; start_time: string; end_time: string; is_active: boolean }> {
  return Object.entries(weeklySchedule)
    .filter(([, cfg]) => cfg.enabled)
    .map(([day, cfg]) => ({
      weekday: DAY_TO_WEEKDAY[day],
      start_time: cfg.start,
      end_time: cfg.end,
      is_active: true,
    }));
}

interface DayAvailability {
  id: number | null;
  date: string; // YYYY-MM-DD
  weekday: number; // 0=Mon..6=Sun
  is_day_off: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string;
  source: 'availability' | 'template' | 'empty';
}

function getMonday(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

const MONTHS_SHORT_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DAYS_FULL_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const DAYS_SHORT_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function ServiceScheduleModal({
  service, onClose, onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (updated: Service) => void;
}) {
  const [tab, setTab] = useState<'dates' | 'template'>('dates');
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  // --- Template tab ---
  const [weeklySchedule, setWeeklySchedule] = useState(DEFAULT_WEEKLY_SCHEDULE);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // --- Dates tab ---
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [localDays, setLocalDays] = useState<DayAvailability[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const [savingWeek, setSavingWeek] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!service) return;
    setWeeklySchedule(schedulesToWeeklyMap(service.schedules));
    setWeekStart(getMonday(new Date()));
    setTab('dates');
  }, [service]);

  useEffect(() => {
    if (!service || tab !== 'dates') return;
    let cancelled = false;
    const ws = weekStart.toLocaleDateString('sv-SE');
    setLoadingDates(true);
    api.get(`/diagnostics/services/${service.id}/availability/?week_start=${ws}`)
      .then(res => { if (!cancelled) setLocalDays(res.data); })
      .catch(() => { if (!cancelled) toast.error('Не удалось загрузить расписание'); })
      .finally(() => { if (!cancelled) setLoadingDates(false); });
    return () => { cancelled = true; };
  }, [service?.id, weekStart, tab]);

  if (!service) return null;

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const res = await api.patch(`/diagnostics/services/${service.id}/`, {
        schedules: weeklyMapToSchedules(weeklySchedule),
      });
      toast.success('Шаблон сохранён');
      onSaved(res.data);
    } catch {
      toast.error('Не удалось сохранить шаблон');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSaveDay = async (day: DayAvailability) => {
    setSavingDay(day.date);
    try {
      const res = await api.post(`/diagnostics/services/${service.id}/availability/`, {
        date: day.date,
        is_day_off: day.is_day_off,
        start_time: day.is_day_off ? null : (day.start_time ?? '09:00'),
        end_time:   day.is_day_off ? null : (day.end_time   ?? '18:00'),
        note: '',
      });
      setLocalDays(prev => prev.map(d =>
        d.date === day.date ? { ...res.data, source: 'availability' as const } : d
      ));
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSavingDay(null);
    }
  };

  const handleSaveWeek = async () => {
    setSavingWeek(true);
    try {
      for (const day of localDays) {
        await api.post(`/diagnostics/services/${service.id}/availability/`, {
          date: day.date,
          is_day_off: day.is_day_off,
          start_time: day.is_day_off ? null : (day.start_time ?? '09:00'),
          end_time:   day.is_day_off ? null : (day.end_time   ?? '18:00'),
          note: '',
        });
      }
      const ws = weekStart.toLocaleDateString('sv-SE');
      const res = await api.get(`/diagnostics/services/${service.id}/availability/?week_start=${ws}`);
      setLocalDays(res.data);
      toast.success('Расписание недели сохранено');
    } catch {
      toast.error('Не удалось сохранить неделю');
    } finally {
      setSavingWeek(false);
    }
  };

  const handleCopyWeek = async () => {
    setCopying(true);
    try {
      const from = weekStart.toLocaleDateString('sv-SE');
      const nextWeek = new Date(weekStart);
      nextWeek.setDate(weekStart.getDate() + 7);
      const to = nextWeek.toLocaleDateString('sv-SE');
      const res = await api.post(`/diagnostics/services/${service.id}/availability/copy-week/`, { from, to });
      toast.success(`Скопировано ${res.data.copied} дней на следующую неделю`);
    } catch {
      toast.error('Не удалось скопировать');
    } finally {
      setCopying(false);
    }
  };

  const handleResetDay = async (day: DayAvailability) => {
    if (!day.id) return;
    try {
      await api.delete(`/diagnostics/services/${service.id}/availability/${day.id}/`);
      const ws = weekStart.toLocaleDateString('sv-SE');
      const res = await api.get(`/diagnostics/services/${service.id}/availability/?week_start=${ws}`);
      setLocalDays(res.data);
    } catch {
      toast.error('Не удалось сбросить');
    }
  };

  const goWeek = (delta: number) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta * 7);
      return next;
    });
  };

  const updateDay = (date: string, changes: Partial<DayAvailability>) => {
    setLocalDays(prev => prev.map(d => d.date === date ? { ...d, ...changes } : d));
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const fmtD = (d: Date) => `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
  const weekLabel = `${fmtD(weekStart)} — ${fmtD(weekEnd)}`;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isCurrentWeek = weekStart.toDateString() === getMonday(new Date()).toDateString();

  const TABS = [
    { key: 'dates' as const,    label: 'По датам',    Icon: CalendarDays },
    { key: 'template' as const, label: 'Постоянное',  Icon: RotateCcw },
  ];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onMouseDown={e => setMouseDownTarget(e.target)}
        onClick={e => {
          if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) onClose();
          setMouseDownTarget(null);
        }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[610px] max-h-[90vh] flex flex-col">

          {/* ── Header ── */}
          <div className="px-7 py-5 flex items-center gap-4 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3772FF, #6366f1)' }}>
              <CalendarDays size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-gray-900">Расписание</h3>
              <p className="text-xs text-gray-400 truncate">{service.name}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* ── Underline tabs ── */}
          <div className="border-b border-gray-100 flex-shrink-0">
            <div className="flex px-7">
              {TABS.map(({ key, label, Icon }) => (
                <button key={key} type="button" onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 py-3 mr-7 text-sm font-bold border-b-2 transition-all ${
                    tab === key
                      ? 'border-[#3772FF] text-[#3772FF]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── DATES TAB ── */}
          {tab === 'dates' && (
            <div className="flex-1 overflow-y-auto">
              {/* Week navigator */}
              <div className="px-6 py-4 flex items-center gap-3">
                <button type="button" onClick={() => goWeek(-1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
                  <ChevronLeft size={14} className="text-gray-600" />
                </button>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <CalendarDays size={14} className="text-[#3772FF] flex-shrink-0" />
                  <span className="text-sm font-bold text-gray-800">{weekLabel}</span>
                  {isCurrentWeek && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Текущая
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => goWeek(1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
                  <ChevronRight size={14} className="text-gray-600" />
                </button>
              </div>

              {loadingDates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#3772FF]" />
                </div>
              ) : (
                <div className="px-5 pb-5 space-y-2">
                  {localDays.map(day => {
                    const isToday = day.date === todayStr;
                    const isSavingThis = savingDay === day.date;
                    const hasEntry = day.source === 'availability';
                    const working = !day.is_day_off;
                    const dayNum = parseInt(day.date.slice(8), 10);
                    const monthIdx = parseInt(day.date.slice(5, 7), 10) - 1;

                    return (
                      <div key={day.date}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                          working
                            ? hasEntry
                              ? 'border-[#3772FF]/25 bg-blue-50/50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50/60'
                        }`}>

                        {/* Day pill */}
                        <button type="button"
                          onClick={() => updateDay(day.date, {
                            is_day_off: !day.is_day_off,
                            start_time: day.start_time ?? '09:00',
                            end_time:   day.end_time   ?? '18:00',
                          })}
                          title={working ? 'Отметить как выходной' : 'Отметить как рабочий'}
                          className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-all ${
                            working ? 'text-white shadow-md' : 'bg-gray-150 text-gray-400 border border-gray-200'
                          }`}
                          style={working ? { background: 'linear-gradient(135deg, #3772FF, #6366f1)' } : { background: '#f3f4f6' }}>
                          <span className="text-[10px] font-bold leading-none">{DAYS_SHORT_RU[day.weekday]}</span>
                          <span className="text-[17px] font-black leading-tight">{dayNum}</span>
                        </button>

                        {/* Info block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-sm font-bold ${working ? 'text-gray-800' : 'text-gray-400'}`}>
                              {DAYS_FULL_RU[day.weekday]}
                            </span>
                            <span className={`text-xs ${working ? 'text-gray-400' : 'text-gray-300'}`}>
                              {dayNum} {MONTHS_SHORT_RU[monthIdx]}.
                            </span>
                            {isToday && (
                              <span className="text-[9px] font-bold bg-[#3772FF]/10 text-[#3772FF] px-1.5 py-0.5 rounded-full">
                                Сегодня
                              </span>
                            )}
                          </div>

                          {working ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <input type="time" value={day.start_time ?? '09:00'}
                                onChange={e => updateDay(day.date, { start_time: e.target.value })}
                                step="900"
                                className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                              <span className="text-gray-400 text-xs font-bold">—</span>
                              <input type="time" value={day.end_time ?? '18:00'}
                                onChange={e => updateDay(day.date, { end_time: e.target.value })}
                                step="900"
                                className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                              {hasEntry && (
                                <span className="text-[10px] text-[#3772FF] font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#3772FF] inline-block flex-shrink-0" />
                                  Сохранено
                                </span>
                              )}
                              {!hasEntry && day.source === 'template' && (
                                <span className="text-[10px] text-gray-400 italic">из шаблона</span>
                              )}
                              {service.capacity_per_slot && (
                                <span className="text-[10px] text-[#3772FF]/60 font-semibold flex items-center gap-1">
                                  <Users size={10} /> {service.capacity_per_slot}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400">
                              {day.source === 'template' ? 'шаблон — выключен' : 'выходной'}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button type="button" onClick={() => handleSaveDay(day)} disabled={!!savingDay || savingWeek}
                            title="Сохранить день"
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 ${
                              isSavingThis ? 'bg-[#3772FF]/10' : 'bg-[#3772FF] hover:bg-[#2a5ce0] shadow-sm'
                            }`}>
                            {isSavingThis
                              ? <Loader2 size={13} className="animate-spin text-[#3772FF]" />
                              : <CheckCircle2 size={14} className="text-white" />
                            }
                          </button>
                          {hasEntry && (
                            <button type="button" onClick={() => handleResetDay(day)}
                              title="Сбросить к шаблону"
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                              <RotateCcw size={12} className="text-gray-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TEMPLATE TAB ── */}
          {tab === 'template' && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {service.capacity_per_slot && (
                <div className="flex items-center gap-2 px-1 pb-2 text-xs text-[#3772FF]/70 font-semibold">
                  <Users size={12} />
                  Лимит: {service.capacity_per_slot} {service.capacity_per_slot === 1 ? 'пациент' : service.capacity_per_slot < 5 ? 'пациента' : 'пациентов'} на слот
                </div>
              )}
              {WEEKDAYS.map(day => {
                const daySchedule = weeklySchedule[day.value] ?? DEFAULT_WEEKLY_SCHEDULE[day.value];
                const enabled = daySchedule.enabled;
                return (
                  <div key={day.value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                      enabled ? 'border-[#3772FF]/25 bg-blue-50/50' : 'border-gray-100 bg-gray-50/60'
                    }`}>
                    <button type="button"
                      onClick={() => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, enabled: !enabled } }))}
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-all text-xs font-bold ${
                        enabled ? 'text-white shadow-md' : 'text-gray-400'
                      }`}
                      style={enabled ? { background: 'linear-gradient(135deg, #3772FF, #6366f1)' } : { background: '#f3f4f6' }}>
                      {day.labelShort}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold mb-1 ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>{day.labelRu}</p>
                      {enabled ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="time" value={daySchedule.start}
                            onChange={e => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, start: e.target.value } }))}
                            step="900"
                            className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                          <span className="text-gray-400 text-xs font-bold">—</span>
                          <input type="time" value={daySchedule.end}
                            onChange={e => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, end: e.target.value } }))}
                            step="900"
                            className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                          {service.capacity_per_slot && (
                            <span className="text-[10px] text-[#3772FF]/60 font-semibold flex items-center gap-1">
                              <Users size={10} /> {service.capacity_per_slot}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400">выходной</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2.5 flex-shrink-0">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              Закрыть
            </button>

            {tab === 'dates' && (
              <>
                <button onClick={handleCopyWeek} disabled={copying}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all">
                  {copying ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  Копировать
                </button>
                <button onClick={handleSaveWeek} disabled={savingWeek || loadingDates}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #3772FF, #6366f1)' }}>
                  {savingWeek ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
                  Сохранить
                </button>
              </>
            )}

            {tab === 'template' && (
              <button onClick={handleSaveTemplate} disabled={savingTemplate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #3772FF, #6366f1)' }}>
                {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Сохранить шаблон
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
