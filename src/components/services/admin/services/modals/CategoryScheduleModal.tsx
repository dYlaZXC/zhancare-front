"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Loader2, Save, CalendarDays } from "lucide-react";
import type { ServiceCategory } from "../types/serviceTypes";

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

// Matches the weekday convention the backend uses everywhere (0=Monday..6=Sunday)
const DAY_TO_WEEKDAY: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};
const WEEKDAY_TO_DAY: Record<number, string> = {
  0: "monday", 1: "tuesday", 2: "wednesday", 3: "thursday", 4: "friday", 5: "saturday", 6: "sunday",
};

interface CategoryScheduleRow {
  weekday: number;
  enabled: boolean;
  start_time: string | null;
  end_time: string | null;
}

function rowsToWeeklyMap(rows: CategoryScheduleRow[]): Record<string, { enabled: boolean; start: string; end: string }> {
  const map = { ...DEFAULT_WEEKLY_SCHEDULE };
  for (const row of rows) {
    const day = WEEKDAY_TO_DAY[row.weekday];
    if (day && row.enabled && row.start_time && row.end_time) {
      map[day] = { enabled: true, start: row.start_time, end: row.end_time };
    }
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

/**
 * Category-wide weekly schedule — a fallback baseline every service inside
 * this category inherits automatically UNLESS it has its own weekly template
 * or a date-specific override (see diagnostics/services.py's resolve_schedule
 * priority chain: date override > service's own template > category
 * template > nothing). Deliberately weekly-only, no "По датам" tab like
 * ServiceScheduleModal has — a category-level date override wasn't asked
 * for and would be a second, separate layer of complexity on top of the
 * per-service one that already exists; a service that genuinely needs a
 * one-off exception on a specific date already has its own "По датам" tab
 * for exactly that.
 */
export function CategoryScheduleModal({
  category, onClose, onSaved,
}: {
  category: ServiceCategory | null;
  onClose: () => void;
  /** Fired after a successful save, so the caller can refresh anything
   * derived from it (the category card's weekday chips). */
  onSaved?: () => void;
}) {
  const [weeklySchedule, setWeeklySchedule] = useState(DEFAULT_WEEKLY_SCHEDULE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    api.get(`/diagnostics/categories/${category.id}/schedule/`)
      .then(res => setWeeklySchedule(rowsToWeeklyMap(res.data)))
      .catch(() => toast.error("Не удалось загрузить расписание категории"))
      .finally(() => setLoading(false));
  }, [category]);

  if (!category) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/diagnostics/categories/${category.id}/schedule/`, {
        schedules: weeklyMapToSchedules(weeklySchedule),
      });
      toast.success("Расписание категории сохранено");
      onSaved?.();
      onClose();
    } catch {
      toast.error("Не удалось сохранить расписание категории");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col">

          <div className="px-7 py-5 flex items-center gap-4 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}cc)` }}>
              <CalendarDays size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-gray-900">Расписание категории</h3>
              <p className="text-xs text-gray-400 truncate">{category.name}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <p className="px-7 pb-3 text-xs text-gray-400 flex-shrink-0 leading-relaxed">
            Общее расписание для всех услуг этой категории. Применяется только к услугам, у которых
            нет своего собственного расписания — если для услуги отдельно настроено расписание
            (вкладка «Расписание» самой услуги), оно остаётся в приоритете.
          </p>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#3772FF]" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2">
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

          <div className="px-6 py-4 border-t border-gray-100 flex gap-2.5 flex-shrink-0">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              Закрыть
            </button>
            <button onClick={handleSave} disabled={saving || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shadow-md transition-all"
              style={{ background: 'linear-gradient(135deg, #3772FF, #6366f1)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Сохранить
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CategoryScheduleModal;
