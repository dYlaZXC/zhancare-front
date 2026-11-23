"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Loader2, Save, CalendarDays } from "lucide-react";
import type { ServiceCategory } from "../types/serviceTypes";
import {
  CategoryWeeklyEditor, DEFAULT_WEEKLY_SCHEDULE, rowsToWeeklyMap, weeklyMapToSchedules,
} from "../components/CategoryWeeklyEditor";

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
            Общее расписание услуг вашей клиники в этой категории. Применяется только к услугам, у которых
            нет своего собственного расписания — если для услуги отдельно настроено расписание
            (вкладка «Расписание» самой услуги), оно остаётся в приоритете.
          </p>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#3772FF]" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2">
              <CategoryWeeklyEditor value={weeklySchedule} onChange={setWeeklySchedule} />
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
