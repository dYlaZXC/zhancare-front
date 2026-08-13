"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { Calendar, Loader2, RotateCcw, History } from "lucide-react";

import type {
  StaffScheduleModalProps,
  StaffMemberMin,
  DaySchedule,
  WeeklySchedules,
} from "./staff-schedule/types/scheduleTypes";
import { DEFAULT_WEEKDAYS, emptyWeek } from "./staff-schedule/types/scheduleTypes";
import { getCurrentMondayStr, addDays, formatWeekLabel } from "./staff-schedule/utils/dateHelpers";
import { buildDefaultWeek } from "./staff-schedule/utils/dateHelpers";
import {
  buildWeeklySchedulesFromMember,
  buildSchedulesArray,
  timeRangesOverlap,
} from "./staff-schedule/utils/scheduleTransforms";
import { DateScheduleTab } from "./staff-schedule/tabs/DateScheduleTab";
import { TemplateScheduleTab } from "./staff-schedule/tabs/TemplateScheduleTab";
import { ScheduleHistoryTab } from "./staff-schedule/tabs/ScheduleHistoryTab";

// ── Main Component ─────────────────────────────────────────────────────────────
// Shell: owns tab selection, the selected member, open/close, and coordinates
// saving. Each tab's own body (and the domain it reads/writes — DoctorAvailability
// for "schedule", DoctorSchedule for "template") lives in staff-schedule/tabs/.

export default function StaffScheduleModal({
  isOpen,
  member,
  onClose,
  onSaved,
}: StaffScheduleModalProps) {
  // ── Modal-exclusive state ────────────────────────────────────────────────────
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleModalTab, setScheduleModalTab] = useState<"schedule" | "template" | "history">("schedule");
  const [scheduleHistory, setScheduleHistory] = useState<any[]>([]);
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  // Template-tab weekday pattern state
  const [scheduleType, setScheduleType] = useState<"online" | "offline">("online");
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedules>({});

  // Planner (schedule-by-date) state
  const [plannerWeekStart, setPlannerWeekStart] = useState<string>("");
  const [plannerConsultationType, setPlannerConsultationType] = useState<"online" | "offline">("online");
  const [plannerDays, setPlannerDays] = useState<any[]>([]);
  const [plannerOtherDays, setPlannerOtherDays] = useState<any[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerSaving, setPlannerSaving] = useState(false);
  const [plannerDirty, setPlannerDirty] = useState(false);

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchScheduleHistory = useCallback(async (memberId: number) => {
    try {
      const { data } = await api.get(`/staff/${memberId}/schedule-history/`);
      setScheduleHistory(data);
    } catch {
      setScheduleHistory([]);
    }
  }, []);

  const fetchPlannerWeek = useCallback(
    async (memberId: number, weekStart: string, cType: string) => {
      setPlannerLoading(true);
      const otherType = cType === "online" ? "offline" : "online";
      try {
        const [mainRes, otherRes] = await Promise.allSettled([
          api.get(`/staff/${memberId}/availability/`, {
            params: { week_start: weekStart, consultation_type: cType },
          }),
          api.get(`/staff/${memberId}/availability/`, {
            params: { week_start: weekStart, consultation_type: otherType },
          }),
        ]);
        const mainData = mainRes.status === "fulfilled" ? mainRes.value.data : [];
        const otherData = otherRes.status === "fulfilled" ? otherRes.value.data : [];
        setPlannerDays(mainData.length > 0 ? mainData : buildDefaultWeek(weekStart));
        setPlannerOtherDays(otherData);
        setPlannerDirty(false);
      } catch {
        setPlannerDays(buildDefaultWeek(weekStart));
        setPlannerOtherDays([]);
        setPlannerDirty(false);
      } finally {
        setPlannerLoading(false);
      }
    },
    []
  );

  // ── Initialize on open ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !member) return;

    // Reset all state
    setScheduleModalTab("schedule");
    setScheduleHistory([]);
    setScheduleType("online");
    setCurrentWeekIndex(0);
    setPlannerConsultationType("online");
    setPlannerDirty(false);

    const monday = getCurrentMondayStr();
    setPlannerWeekStart(monday);

    setScheduleLoading(true);
    api
      .get(`/staff/${member.id}/`)
      .then((response) => {
        const fresh: StaffMemberMin = response.data;
        setWeeklySchedules(buildWeeklySchedulesFromMember(fresh));
      })
      .catch(() => {
        setWeeklySchedules(buildWeeklySchedulesFromMember(member));
      })
      .finally(() => {
        setScheduleLoading(false);
        setScheduleModalTab("schedule");
        fetchPlannerWeek(member.id, monday, "online");
        fetchScheduleHistory(member.id);
      });
  }, [isOpen, member, fetchPlannerWeek, fetchScheduleHistory]);

  // ── Conflict detection helpers ────────────────────────────────────────────────

  const getPlannerDayConflict = useCallback(
    (dayIndex: number): { hasConflict: boolean; otherTime: string } => {
      const current = plannerDays[dayIndex];
      const other = plannerOtherDays[dayIndex];
      if (!current || !other) return { hasConflict: false, otherTime: "" };
      if (current.is_day_off || other.is_day_off) return { hasConflict: false, otherTime: "" };
      const cs = current.start_time,
        ce = current.end_time;
      const os = other.start_time,
        oe = other.end_time;
      if (!cs || !ce || !os || !oe) return { hasConflict: false, otherTime: "" };
      const overlap = timeRangesOverlap(cs, ce, os, oe);
      return { hasConflict: overlap, otherTime: `${os} – ${oe}` };
    },
    [plannerDays, plannerOtherDays]
  );

  const plannerConflictCount = useMemo(
    () => plannerDays.filter((_, i) => getPlannerDayConflict(i).hasConflict).length,
    [plannerDays, getPlannerDayConflict]
  );

  // ── Template-tab: schedule accessors ─────────────────────────────────────────

  const getWeekStartDate = useCallback(
    (weekOffset: number): string => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dow = today.getDay();
      today.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
      today.setDate(today.getDate() + weekOffset * 7);
      return today.toLocaleDateString("sv-SE");
    },
    []
  );

  const getCurrentOnlineSchedule = useCallback((): Record<string, DaySchedule> => {
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    return weeklySchedules[weekStartDate]?.online ?? emptyWeek().online;
  }, [weeklySchedules, currentWeekIndex, getWeekStartDate]);

  const getCurrentOfflineSchedule = useCallback((): Record<string, DaySchedule> => {
    const weekStartDate = getWeekStartDate(currentWeekIndex);
    return weeklySchedules[weekStartDate]?.offline ?? emptyWeek().offline;
  }, [weeklySchedules, currentWeekIndex, getWeekStartDate]);

  const getScheduleConflict = useCallback(
    (day: string): boolean => {
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      const weekSchedule = weeklySchedules[weekStartDate];
      if (!weekSchedule) return false;
      const on = weekSchedule.online[day];
      const off = weekSchedule.offline[day];
      if (on?.enabled && off?.enabled) {
        return timeRangesOverlap(on.start, on.end, off.start, off.end);
      }
      return false;
    },
    [weeklySchedules, currentWeekIndex, getWeekStartDate]
  );

  const getConflictDays = useCallback((): string[] => {
    return DEFAULT_WEEKDAYS.filter((d) => getScheduleConflict(d.value)).map((d) => d.value);
  }, [getScheduleConflict]);

  // ── Template-tab: toggle/update helpers ──────────────────────────────────────

  const toggleOnlineDay = useCallback(
    (day: string) => {
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      setWeeklySchedules((prev) => {
        const cur = prev[weekStartDate] ?? emptyWeek();
        return {
          ...prev,
          [weekStartDate]: {
            ...cur,
            online: {
              ...cur.online,
              [day]: { ...cur.online[day], enabled: !cur.online[day]?.enabled },
            },
          },
        };
      });
    },
    [currentWeekIndex, getWeekStartDate]
  );

  const toggleOfflineDay = useCallback(
    (day: string) => {
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      setWeeklySchedules((prev) => {
        const cur = prev[weekStartDate] ?? emptyWeek();
        return {
          ...prev,
          [weekStartDate]: {
            ...cur,
            offline: {
              ...cur.offline,
              [day]: { ...cur.offline[day], enabled: !cur.offline[day]?.enabled },
            },
          },
        };
      });
    },
    [currentWeekIndex, getWeekStartDate]
  );

  const makeAdjustTime =
    (field: "start" | "end") =>
    (currentDay: DaySchedule, value: string): { start: string; end: string } => {
      let newStart = field === "start" ? value : currentDay.start;
      let newEnd = field === "end" ? value : currentDay.end;
      const toMin = (t: string) => parseInt(t.split(":")[0]) * 60 + parseInt(t.split(":")[1]);
      const sm = toMin(newStart);
      const em = toMin(newEnd);
      if (em < sm && em > 360) {
        if (field === "end") {
          const adj = em - 60;
          if (adj >= 0) {
            newStart = `${String(Math.floor(adj / 60)).padStart(2, "0")}:${String(adj % 60).padStart(2, "0")}`;
            toast.info(`⏰ Время начала автоматически изменено на ${newStart}`);
          } else {
            const adjE = sm + 60;
            newEnd = `${String(Math.floor((adjE / 60) % 24)).padStart(2, "0")}:${String(adjE % 60).padStart(2, "0")}`;
            toast.info(`⏰ Время окончания автоматически изменено на ${newEnd}`);
          }
        } else {
          const adjE = sm + 60;
          newEnd = `${String(Math.floor((adjE / 60) % 24)).padStart(2, "0")}:${String(adjE % 60).padStart(2, "0")}`;
          toast.info(`⏰ Время окончания автоматически изменено на ${newEnd}`);
        }
      }
      return { start: newStart, end: newEnd };
    };

  const updateOnlineDayTime = useCallback(
    (day: string, field: "start" | "end", value: string) => {
      const adjust = makeAdjustTime(field);
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      setWeeklySchedules((prev) => {
        const cur = prev[weekStartDate] ?? emptyWeek();
        const adjusted = adjust(cur.online[day], value);
        return {
          ...prev,
          [weekStartDate]: {
            ...cur,
            online: { ...cur.online, [day]: { ...cur.online[day], ...adjusted } },
          },
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentWeekIndex, getWeekStartDate]
  );

  const updateOfflineDayTime = useCallback(
    (day: string, field: "start" | "end", value: string) => {
      const adjust = makeAdjustTime(field);
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      setWeeklySchedules((prev) => {
        const cur = prev[weekStartDate] ?? emptyWeek();
        const adjusted = adjust(cur.offline[day], value);
        return {
          ...prev,
          [weekStartDate]: {
            ...cur,
            offline: { ...cur.offline, [day]: { ...cur.offline[day], ...adjusted } },
          },
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentWeekIndex, getWeekStartDate]
  );

  // ── Template-tab: save schedule ───────────────────────────────────────────────

  const handleSaveSchedule = async () => {
    if (!member) return;
    const conflictDays = getConflictDays();
    if (conflictDays.length > 0) {
      toast.error(
        `⛔ Обнаружены конфликты расписания на ${conflictDays.length} ${
          conflictDays.length === 1 ? "день" : "дней"
        }. Исправьте конфликты перед сохранением.`
      );
      return;
    }
    setScheduleLoading(true);
    try {
      await api.patch(`/staff/${member.id}/`, {
        schedules: buildSchedulesArray(weeklySchedules),
      });
      toast.success("Расписание успешно обновлено!");
      onSaved?.();
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Не удалось обновить расписание";
      toast.error(errorMessage);
    } finally {
      setScheduleLoading(false);
    }
  };

  // ── Planner handlers ──────────────────────────────────────────────────────────

  const updatePlannerDay = (index: number, changes: Partial<any>) => {
    setPlannerDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...changes } : d)));
    setPlannerDirty(true);
  };

  const handlePlannerWeekNav = async (offset: number) => {
    if (!member) return;
    if (plannerConflictCount > 0) {
      toast.error(
        `⛔ Исправьте ${plannerConflictCount} ${
          plannerConflictCount === 1 ? "конфликт" : "конфликта"
        } расписания перед переходом на другую неделю`
      );
      return;
    }
    if (plannerDirty && plannerDays.length > 0) {
      try {
        await Promise.all(
          plannerDays.map((day) =>
            api.post(`/staff/${member.id}/availability/`, {
              date: day.date,
              consultation_type: plannerConsultationType,
              is_day_off: day.is_day_off,
              start_time: day.is_day_off ? null : day.start_time || "09:00",
              end_time: day.is_day_off ? null : day.end_time || "18:00",
              note: day.note || "",
            })
          )
        );
        toast.success("Неделя сохранена автоматически");
      } catch {
        /* silent */
      }
    }
    const newWeek = addDays(plannerWeekStart, offset * 7);
    setPlannerWeekStart(newWeek);
    fetchPlannerWeek(member.id, newWeek, plannerConsultationType);
  };

  const handlePlannerTypeChange = async (cType: "online" | "offline") => {
    if (!member || cType === plannerConsultationType) return;
    if (plannerConflictCount > 0) {
      toast.error(
        `⛔ Исправьте ${plannerConflictCount} ${
          plannerConflictCount === 1 ? "конфликт" : "конфликта"
        } расписания перед переключением типа`
      );
      return;
    }
    if (plannerDirty && plannerDays.length > 0) {
      try {
        await Promise.all(
          plannerDays.map((day) =>
            api.post(`/staff/${member.id}/availability/`, {
              date: day.date,
              consultation_type: plannerConsultationType,
              is_day_off: day.is_day_off,
              start_time: day.is_day_off ? null : day.start_time || "09:00",
              end_time: day.is_day_off ? null : day.end_time || "18:00",
              note: day.note || "",
            })
          )
        );
      } catch {
        /* silent */
      }
    }
    setPlannerConsultationType(cType);
    fetchPlannerWeek(member.id, plannerWeekStart, cType);
  };

  const handleSavePlannerDay = async (day: any) => {
    if (!member) return;
    const idx = plannerDays.findIndex((d) => d.date === day.date);
    if (idx >= 0 && getPlannerDayConflict(idx).hasConflict) {
      toast.error("⛔ Конфликт времени с другим типом расписания. Исправьте время перед сохранением.");
      return;
    }
    try {
      if (day.is_day_off) {
        await api.post(`/staff/${member.id}/availability/`, {
          date: day.date,
          consultation_type: plannerConsultationType,
          is_day_off: true,
          note: day.note || "",
        });
      } else {
        await api.post(`/staff/${member.id}/availability/`, {
          date: day.date,
          consultation_type: plannerConsultationType,
          is_day_off: false,
          start_time: day.start_time || "09:00",
          end_time: day.end_time || "18:00",
          note: day.note || "",
        });
      }
      await fetchPlannerWeek(member.id, plannerWeekStart, plannerConsultationType);
      await fetchScheduleHistory(member.id);
      toast.success("Сохранено");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Ошибка сохранения");
    }
  };

  const handleDeletePlannerDay = async (day: any) => {
    if (!member || !day.avail_id) return;
    try {
      await api.delete(`/staff/${member.id}/availability/${day.avail_id}/`);
      await fetchPlannerWeek(member.id, plannerWeekStart, plannerConsultationType);
      toast.success("Сброшено к шаблону");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleCopyWeek = async () => {
    if (!member) return;
    const nextWeek = addDays(plannerWeekStart, 7);
    if (!confirm(`Скопировать расписание на неделю ${formatWeekLabel(nextWeek)}?`)) return;
    try {
      await api.post(`/staff/${member.id}/availability/copy-week/`, {
        src_week_start: plannerWeekStart,
        dst_week_start: nextWeek,
        consultation_type: plannerConsultationType,
      });
      toast.success(`Неделя скопирована на ${formatWeekLabel(nextWeek)}`);
    } catch {
      toast.error("Ошибка копирования");
    }
  };

  const handleSaveEntireWeek = async () => {
    if (!member) return;
    if (plannerConflictCount > 0) {
      toast.error(
        `⛔ Невозможно сохранить — ${plannerConflictCount} ${
          plannerConflictCount === 1 ? "день с конфликтом" : "дней с конфликтами"
        }. Исправьте пересечения времени.`
      );
      return;
    }
    setPlannerSaving(true);
    try {
      await Promise.all(
        plannerDays.map((day) =>
          api.post(`/staff/${member.id}/availability/`, {
            date: day.date,
            consultation_type: plannerConsultationType,
            is_day_off: day.is_day_off,
            start_time: day.is_day_off ? null : day.start_time || "09:00",
            end_time: day.is_day_off ? null : day.end_time || "18:00",
            note: day.note || "",
          })
        )
      );
      await fetchPlannerWeek(member.id, plannerWeekStart, plannerConsultationType);
      await fetchScheduleHistory(member.id);
      setPlannerDirty(false);
      onSaved?.();
      toast.success("Неделя сохранена");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Ошибка сохранения");
    } finally {
      setPlannerSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!isOpen || !member) return null;

  return (
    <AnimatePresence>
      {isOpen && member && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => setMouseDownTarget(e.target)}
          onClick={(e) => {
            if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) {
              onClose();
            }
            setMouseDownTarget(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {scheduleModalTab === "template" ? "Постоянное расписание" : "Расписание"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {member.first_name} {member.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="sticky top-[81px] z-10 bg-white flex border-b border-gray-100">
              {[
                { key: "schedule", label: "По датам", icon: <Calendar className="w-4 h-4" /> },
                {
                  key: "template",
                  label: "Постоянное",
                  icon: <RotateCcw className="w-4 h-4" />,
                },
                { key: "history", label: "История", icon: <History className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setScheduleModalTab(tab.key as any)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                    scheduleModalTab === tab.key
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">

              {scheduleModalTab === "schedule" && (
                <DateScheduleTab
                  plannerWeekStart={plannerWeekStart}
                  plannerConsultationType={plannerConsultationType}
                  plannerDays={plannerDays}
                  plannerOtherDays={plannerOtherDays}
                  plannerLoading={plannerLoading}
                  plannerConflictCount={plannerConflictCount}
                  getPlannerDayConflict={getPlannerDayConflict}
                  onTypeChange={handlePlannerTypeChange}
                  onWeekNav={handlePlannerWeekNav}
                  onUpdateDay={updatePlannerDay}
                  onSaveDay={handleSavePlannerDay}
                  onDeleteDay={handleDeletePlannerDay}
                />
              )}

              {scheduleLoading && scheduleModalTab === "template" && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              )}
              {!scheduleLoading && scheduleModalTab === "template" && (
                <TemplateScheduleTab
                  scheduleType={scheduleType}
                  onScheduleTypeChange={setScheduleType}
                  getCurrentOnlineSchedule={getCurrentOnlineSchedule}
                  getCurrentOfflineSchedule={getCurrentOfflineSchedule}
                  getScheduleConflict={getScheduleConflict}
                  getConflictDays={getConflictDays}
                  onToggleOnlineDay={toggleOnlineDay}
                  onToggleOfflineDay={toggleOfflineDay}
                  onUpdateOnlineDayTime={updateOnlineDayTime}
                  onUpdateOfflineDayTime={updateOfflineDayTime}
                />
              )}

              {!scheduleLoading && scheduleModalTab === "history" && (
                <ScheduleHistoryTab history={scheduleHistory} />
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-5 rounded-b-3xl flex gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={scheduleLoading}
                className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Закрыть
              </button>
              {scheduleModalTab === "template" && (
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={scheduleLoading || getConflictDays().length > 0}
                  className="flex-1 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {scheduleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      Сохранить постоянное
                    </>
                  )}
                </button>
              )}
              {scheduleModalTab === "schedule" && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyWeek}
                    className="px-4 py-3 rounded-2xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-sm flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Копировать
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEntireWeek}
                    disabled={plannerSaving || plannerLoading || plannerConflictCount > 0}
                    title={
                      plannerConflictCount > 0
                        ? `Конфликты в ${plannerConflictCount} ${
                            plannerConflictCount === 1 ? "дне" : "днях"
                          } — исправьте перед сохранением`
                        : undefined
                    }
                    className={`flex-1 px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-white ${
                      plannerConflictCount > 0
                        ? "bg-red-400 cursor-not-allowed opacity-70"
                        : plannerDirty
                        ? "bg-amber-500 hover:bg-amber-600 hover:shadow-xl"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl"
                    }`}
                  >
                    {plannerSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Сохранение...
                      </>
                    ) : plannerConflictCount > 0 ? (
                      <>
                        <span className="text-base">⛔</span>{" "}
                        {plannerConflictCount}{" "}
                        {plannerConflictCount === 1 ? "конфликт" : "конфликта"}
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5" />
                        Сохранить
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
