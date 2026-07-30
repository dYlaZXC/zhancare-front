"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import {
  Calendar,
  Loader2,
  Video,
  Home,
  RotateCcw,
  History,
  CheckCircle,
  Clock,
  Ban,
  Trash2,
  Plus,
} from "lucide-react";

import ScheduleTypeSelector from "./schedule/components/ScheduleTypeSelector";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StaffMemberMin {
  id: number;
  first_name: string;
  last_name: string;
  schedule_type?: string;
  schedules?: Array<{
    id?: number;
    consultation_type: "online" | "offline";
    weekday: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;
}

export interface StaffScheduleModalProps {
  isOpen: boolean;
  member: StaffMemberMin | null;
  onClose: () => void;
  onSaved?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type DaySchedule = { start: string; end: string; enabled: boolean };
type WeekSchedule = {
  online: Record<string, DaySchedule>;
  offline: Record<string, DaySchedule>;
};
type WeeklySchedules = Record<string, WeekSchedule>;

const DEFAULT_WEEKDAYS = [
  { value: "monday", labelRu: "Понедельник", labelShort: "Пн", dayIndex: 1 },
  { value: "tuesday", labelRu: "Вторник", labelShort: "Вт", dayIndex: 2 },
  { value: "wednesday", labelRu: "Среда", labelShort: "Ср", dayIndex: 3 },
  { value: "thursday", labelRu: "Четверг", labelShort: "Чт", dayIndex: 4 },
  { value: "friday", labelRu: "Пятница", labelShort: "Пт", dayIndex: 5 },
  { value: "saturday", labelRu: "Суббота", labelShort: "Сб", dayIndex: 6 },
  { value: "sunday", labelRu: "Воскресенье", labelShort: "Вс", dayIndex: 0 },
];

const WEEKDAY_TO_NAME: Record<number, string> = {
  0: "monday",
  1: "tuesday",
  2: "wednesday",
  3: "thursday",
  4: "friday",
  5: "saturday",
  6: "sunday",
};

const makeDay = (start: string, end: string, enabled = false): DaySchedule => ({
  start,
  end,
  enabled,
});

const emptyWeek = (): WeekSchedule => ({
  online: {
    monday: makeDay("09:00", "18:00"),
    tuesday: makeDay("09:00", "18:00"),
    wednesday: makeDay("09:00", "18:00"),
    thursday: makeDay("09:00", "18:00"),
    friday: makeDay("09:00", "18:00"),
    saturday: makeDay("10:00", "14:00"),
    sunday: makeDay("10:00", "14:00"),
  },
  offline: {
    monday: makeDay("09:00", "18:00"),
    tuesday: makeDay("09:00", "18:00"),
    wednesday: makeDay("09:00", "18:00"),
    thursday: makeDay("09:00", "18:00"),
    friday: makeDay("09:00", "18:00"),
    saturday: makeDay("10:00", "14:00"),
    sunday: makeDay("10:00", "14:00"),
  },
});

const getCurrentMondayStr = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dow = now.getDay();
  now.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
  return now.toLocaleDateString("sv-SE");
};

const buildWeeklySchedulesFromMember = (member: StaffMemberMin): WeeklySchedules => {
  const weekStartDate = getCurrentMondayStr();
  const week = emptyWeek();
  const rows = member.schedules || [];
  for (const row of rows) {
    const dayName = WEEKDAY_TO_NAME[row.weekday];
    if (dayName && (row.consultation_type === "online" || row.consultation_type === "offline")) {
      (week[row.consultation_type] as Record<string, DaySchedule>)[dayName] = {
        start: row.start_time.slice(0, 5),
        end: row.end_time.slice(0, 5),
        enabled: row.is_active,
      };
    }
  }
  return { [weekStartDate]: week };
};

const buildEmptyWeeklySchedules = (): WeeklySchedules => ({
  [getCurrentMondayStr()]: emptyWeek(),
});

// Build schedules array for saving (template tab)
const buildSchedulesArray = (
  weeklySchedules: WeeklySchedules
): Array<{
  consultation_type: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}> => {
  const DAY_TO_WEEKDAY: Record<string, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  const merged = new Map<
    string,
    { consultation_type: string; weekday: number; start_time: string; end_time: string; is_active: boolean }
  >();
  const sortedEntries = Object.entries(weeklySchedules).sort(([a], [b]) => a.localeCompare(b));
  for (const [, weekEntry] of sortedEntries) {
    for (const type of ["online", "offline"] as const) {
      const dayMap = weekEntry[type];
      if (!dayMap) continue;
      for (const [day, cfg] of Object.entries(dayMap)) {
        const weekday = DAY_TO_WEEKDAY[day] ?? 0;
        const key = `${type}-${weekday}`;
        if (cfg.enabled) {
          merged.set(key, {
            consultation_type: type,
            weekday,
            start_time: cfg.start,
            end_time: cfg.end,
            is_active: true,
          });
        }
      }
    }
  }
  return Array.from(merged.values());
};

// Planner helpers
const getMondayOf = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toLocaleDateString("sv-SE");
};

const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
};

const formatWeekLabel = (mondayStr: string): string => {
  const start = new Date(mondayStr + "T00:00:00");
  const end = new Date(mondayStr + "T00:00:00");
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return `${fmt(start)} — ${fmt(end)}`;
};

const isCurrentWeekPlanner = (mondayStr: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(mondayStr + "T00:00:00");
  sunday.setDate(sunday.getDate() + 6);
  return today >= monday && today <= sunday;
};

const buildDefaultWeek = (weekStart: string): any[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    return {
      date: d.toLocaleDateString("sv-SE"),
      avail_id: null,
      is_day_off: isWeekend,
      start_time: isWeekend ? null : "09:00",
      end_time: isWeekend ? null : "18:00",
      note: "",
      source: "empty",
    };
  });

// ── Main Component ─────────────────────────────────────────────────────────────

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

  // Schedule type for template tab (mirrors formData.schedule_type in parent)
  const [scheduleTypeMode, setScheduleTypeMode] = useState<"weekly" | "constant">("weekly");

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

  // Overrides (legacy, hidden behind `false &&` in template tab)
  const [overrides, setOverrides] = useState<any[]>([]);
  const [overrideForm, setOverrideForm] = useState({
    date: "",
    consultation_type: "online",
    is_day_off: false,
    start_time: "09:00",
    end_time: "18:00",
    note: "",
  });
  const [overrideSaving, setOverrideSaving] = useState(false);

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchOverrides = useCallback(async (memberId: number) => {
    try {
      const { data } = await api.get(`/staff/${memberId}/schedule-overrides/`);
      setOverrides(data);
    } catch {
      setOverrides([]);
    }
  }, []);

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
    setOverrides([]);
    setScheduleHistory([]);
    setOverrideForm({
      date: "",
      consultation_type: "online",
      is_day_off: false,
      start_time: "09:00",
      end_time: "18:00",
      note: "",
    });
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
        setScheduleTypeMode((fresh.schedule_type || "weekly") as "weekly" | "constant");
        setWeeklySchedules(buildWeeklySchedulesFromMember(fresh));
      })
      .catch(() => {
        setScheduleTypeMode((member.schedule_type || "weekly") as "weekly" | "constant");
        setWeeklySchedules(buildWeeklySchedulesFromMember(member));
      })
      .finally(() => {
        setScheduleLoading(false);
        setScheduleModalTab("schedule");
        fetchPlannerWeek(member.id, monday, "online");
        fetchOverrides(member.id);
        fetchScheduleHistory(member.id);
      });
  }, [isOpen, member, fetchPlannerWeek, fetchOverrides, fetchScheduleHistory]);

  // ── Conflict detection helpers ────────────────────────────────────────────────

  const timeRangesOverlap = useCallback(
    (start1: string, end1: string, start2: string, end2: string): boolean => {
      const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const s1 = toMin(start1),
        e1 = toMin(end1),
        s2 = toMin(start2),
        e2 = toMin(end2);
      const ae1 = e1 < s1 ? e1 + 1440 : e1;
      const ae2 = e2 < s2 ? e2 + 1440 : e2;
      return s1 < ae2 && s2 < ae1;
    },
    []
  );

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
    [plannerDays, plannerOtherDays, timeRangesOverlap]
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

  const getDateForDay = useCallback(
    (dayIndex: number): string => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dow = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
      const weekStart = new Date(monday);
      weekStart.setDate(monday.getDate() + currentWeekIndex * 7);
      const target = new Date(weekStart);
      const offsetFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
      target.setDate(weekStart.getDate() + offsetFromMonday);
      const day = target.getDate();
      const month = target.toLocaleDateString("ru-RU", { month: "long" });
      return `${day} ${month}`;
    },
    [currentWeekIndex]
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
    [weeklySchedules, currentWeekIndex, getWeekStartDate, timeRangesOverlap]
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
        schedule_type: scheduleTypeMode,
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

  // ── Overrides ─────────────────────────────────────────────────────────────────

  const handleSaveOverride = async () => {
    if (!member) return;
    if (!overrideForm.date) {
      alert("Выберите дату");
      return;
    }
    if (!overrideForm.is_day_off && (!overrideForm.start_time || !overrideForm.end_time)) {
      alert("Укажите время");
      return;
    }
    setOverrideSaving(true);
    try {
      await api.post(`/staff/${member.id}/schedule-overrides/`, {
        ...overrideForm,
        start_time: overrideForm.is_day_off ? null : overrideForm.start_time,
        end_time: overrideForm.is_day_off ? null : overrideForm.end_time,
      });
      await fetchOverrides(member.id);
      await fetchScheduleHistory(member.id);
      setOverrideForm({
        date: "",
        consultation_type: "online",
        is_day_off: false,
        start_time: "09:00",
        end_time: "18:00",
        note: "",
      });
    } catch (e: any) {
      alert(e?.response?.data?.error || "Ошибка сохранения");
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleDeleteOverride = async (overrideId: number) => {
    if (!member) return;
    try {
      await api.delete(`/staff/${member.id}/schedule-overrides/${overrideId}/`);
      setOverrides((prev) => prev.filter((o) => o.id !== overrideId));
      await fetchScheduleHistory(member.id);
    } catch {
      alert("Ошибка удаления");
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

              {/* ── PLANNER TAB (schedule by date) ── */}
              {scheduleModalTab === "schedule" && (
                <div className="space-y-4">
                  {/* Consultation type toggle */}
                  <div
                    className={`flex rounded-2xl overflow-hidden border-2 transition-colors ${
                      plannerConflictCount > 0 && plannerConsultationType !== "online"
                        ? "border-red-200"
                        : "border-gray-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlannerTypeChange("online")}
                      title={
                        plannerConflictCount > 0 && plannerConsultationType !== "online"
                          ? "Исправьте конфликты перед переключением"
                          : undefined
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                        plannerConsultationType === "online"
                          ? "bg-blue-500 text-white"
                          : plannerConflictCount > 0
                          ? "text-red-400 bg-red-50 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Video className="w-4 h-4" /> Онлайн
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlannerTypeChange("offline")}
                      title={
                        plannerConflictCount > 0 && plannerConsultationType !== "offline"
                          ? "Исправьте конфликты перед переключением"
                          : undefined
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                        plannerConsultationType === "offline"
                          ? "bg-purple-500 text-white"
                          : plannerConflictCount > 0
                          ? "text-red-400 bg-red-50 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Home className="w-4 h-4" /> Оффлайн
                    </button>
                  </div>

                  {/* Week nav */}
                  <div
                    className={`flex items-center justify-between border-2 rounded-2xl px-4 py-3 transition-colors ${
                      plannerConflictCount > 0
                        ? "bg-red-50 border-red-200"
                        : "bg-indigo-50 border-indigo-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlannerWeekNav(-1)}
                      disabled={plannerConflictCount > 0}
                      title={
                        plannerConflictCount > 0
                          ? "Исправьте конфликты перед переходом"
                          : undefined
                      }
                      className={`p-2 rounded-lg border transition-all ${
                        plannerConflictCount > 0
                          ? "bg-red-100 border-red-200 text-red-300 cursor-not-allowed"
                          : "bg-white hover:bg-indigo-100 text-indigo-600 border-indigo-200"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <span className="text-base">📅</span>
                      {plannerWeekStart ? formatWeekLabel(plannerWeekStart) : "..."}
                      {plannerWeekStart && isCurrentWeekPlanner(plannerWeekStart) && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          Текущая
                        </span>
                      )}
                      {plannerConflictCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                          ⚠ {plannerConflictCount} конфл.
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlannerWeekNav(1)}
                      disabled={plannerConflictCount > 0}
                      title={
                        plannerConflictCount > 0
                          ? "Исправьте конфликты перед переходом"
                          : undefined
                      }
                      className={`p-2 rounded-lg border transition-all ${
                        plannerConflictCount > 0
                          ? "bg-red-100 border-red-200 text-red-300 cursor-not-allowed"
                          : "bg-white hover:bg-indigo-100 text-indigo-600 border-indigo-200"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Conflict banner */}
                  {!plannerLoading && plannerConflictCount > 0 && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border-2 border-red-300 rounded-2xl">
                      <span className="text-lg flex-shrink-0">⛔</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-700">
                          {plannerConflictCount === 1
                            ? "1 конфликт расписания"
                            : `${plannerConflictCount} конфликта расписания`}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          Онлайн и оффлайн расписание пересекаются по времени. Исправьте конфликты
                          — переключение вкладок и сохранение заблокированы.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Days */}
                  {plannerLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plannerDays.map((day, i) => {
                        const d = new Date(day.date + "T00:00:00");
                        const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
                        const fullNames = [
                          "Воскресенье",
                          "Понедельник",
                          "Вторник",
                          "Среда",
                          "Четверг",
                          "Пятница",
                          "Суббота",
                        ];
                        const dateLabel = d.toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        });
                        const isFromAvail = day.source === "availability";
                        const isOff = day.is_day_off;
                        const { hasConflict, otherTime } = getPlannerDayConflict(i);
                        const otherTypeName =
                          plannerConsultationType === "online" ? "Приём в клинике" : "Видеоконсультация";
                        return (
                          <div
                            key={day.date}
                            className={`rounded-xl border-2 p-3 transition-all ${
                              hasConflict
                                ? "border-red-400 bg-red-50"
                                : isOff
                                ? "border-gray-200 bg-gray-50"
                                : plannerConsultationType === "online"
                                ? "border-blue-400 bg-blue-50"
                                : "border-purple-400 bg-purple-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Day toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nowOff = !isOff;
                                  updatePlannerDay(i, {
                                    is_day_off: nowOff,
                                    ...(!nowOff
                                      ? {
                                          start_time: day.start_time || "09:00",
                                          end_time: day.end_time || "18:00",
                                        }
                                      : {}),
                                  });
                                }}
                                className={`flex-shrink-0 w-11 h-11 rounded-xl border-2 font-semibold text-xs transition-all ${
                                  hasConflict
                                    ? "border-red-500 bg-red-500 text-white"
                                    : isOff
                                    ? "border-gray-300 bg-white text-gray-400"
                                    : isFromAvail
                                    ? plannerConsultationType === "online"
                                      ? "border-blue-500 bg-blue-500 text-white"
                                      : "border-purple-500 bg-purple-500 text-white"
                                    : "border-gray-300 bg-white text-gray-500"
                                }`}
                              >
                                {dayNames[d.getDay()]}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-800">
                                    {fullNames[d.getDay()]}
                                  </span>
                                  <span className="text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                                    {dateLabel}
                                  </span>
                                  {day.source === "template" && (
                                    <span className="text-xs text-gray-300 italic">из шаблона</span>
                                  )}
                                  {hasConflict && (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded-full">
                                      ⚠ Конфликт
                                    </span>
                                  )}
                                </div>
                                {isOff && (
                                  <p className="text-xs text-gray-400 mt-0.5">Выходной</p>
                                )}
                                {hasConflict && (
                                  <p className="text-xs text-red-600 mt-0.5 font-medium">
                                    {otherTypeName}: {otherTime} — пересечение времени
                                  </p>
                                )}
                                {!isOff &&
                                  !hasConflict &&
                                  plannerOtherDays[i] &&
                                  !plannerOtherDays[i].is_day_off &&
                                  plannerOtherDays[i].start_time && (
                                    <p
                                      className={`text-xs mt-0.5 ${
                                        plannerConsultationType === "online"
                                          ? "text-purple-500"
                                          : "text-blue-500"
                                      }`}
                                    >
                                      {otherTypeName}: {plannerOtherDays[i].start_time} –{" "}
                                      {plannerOtherDays[i].end_time}
                                    </p>
                                  )}
                              </div>
                              {!isOff && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={day.start_time || "09:00"}
                                    step="900"
                                    onChange={(e) =>
                                      updatePlannerDay(i, { start_time: e.target.value })
                                    }
                                    className={`w-28 px-2 py-1.5 rounded-lg border-2 focus:outline-none text-sm transition-colors ${
                                      hasConflict
                                        ? "border-red-300 focus:border-red-500 bg-white"
                                        : "border-gray-200 focus:border-indigo-400"
                                    }`}
                                  />
                                  <span className="text-gray-300">—</span>
                                  <input
                                    type="time"
                                    value={day.end_time || "18:00"}
                                    step="900"
                                    onChange={(e) =>
                                      updatePlannerDay(i, { end_time: e.target.value })
                                    }
                                    className={`w-28 px-2 py-1.5 rounded-lg border-2 focus:outline-none text-sm transition-colors ${
                                      hasConflict
                                        ? "border-red-300 focus:border-red-500 bg-white"
                                        : "border-gray-200 focus:border-indigo-400"
                                    }`}
                                  />
                                </div>
                              )}
                              {/* Action buttons */}
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSavePlannerDay(day)}
                                  disabled={hasConflict}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    hasConflict
                                      ? "bg-red-100 text-red-300 cursor-not-allowed"
                                      : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                                  }`}
                                  title={hasConflict ? "Исправьте конфликт времени" : "Сохранить"}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                {isFromAvail && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePlannerDay(day)}
                                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Сброс к шаблону"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TEMPLATE TAB (weekday pattern) ── */}
              {scheduleLoading && scheduleModalTab === "template" && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              )}
              {!scheduleLoading && scheduleModalTab === "template" && (
                <>
                  {/* Schedule Type */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-blue-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Тип расписания <span className="text-red-500">*</span>
                    </label>
                    <ScheduleTypeSelector
                      scheduleType={scheduleTypeMode}
                      onChange={(type) => {
                        setScheduleTypeMode(type);
                        if (type === (member?.schedule_type || "weekly")) {
                          setWeeklySchedules(buildWeeklySchedulesFromMember(member!));
                        } else {
                          setWeeklySchedules(buildEmptyWeeklySchedules());
                        }
                        setCurrentWeekIndex(0);
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-3">
                      💡 <strong>Недельное:</strong> разное расписание для каждого дня.{" "}
                      <strong>Постоянное:</strong> одинаковое расписание каждый день.
                    </p>
                  </div>

                  {/* Week Navigation - only for weekly schedule */}
                  {scheduleTypeMode === "weekly" && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border-2 border-indigo-100">
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const currentWeekMonday = new Date(today);
                        const dayOfWeek = currentWeekMonday.getDay();
                        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                        currentWeekMonday.setDate(currentWeekMonday.getDate() + daysToMonday);
                        const displayedWeekStart = new Date(currentWeekMonday);
                        displayedWeekStart.setDate(
                          currentWeekMonday.getDate() + currentWeekIndex * 7
                        );
                        const displayedWeekEnd = new Date(displayedWeekStart);
                        displayedWeekEnd.setDate(displayedWeekStart.getDate() + 6);
                        displayedWeekEnd.setHours(23, 59, 59, 999);
                        const formatDate = (date: Date) =>
                          date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
                        const isCurrentWeek =
                          today >= displayedWeekStart && today <= displayedWeekEnd;
                        return (
                          <div className="flex items-center justify-between gap-4">
                            <button
                              type="button"
                              onClick={() => setCurrentWeekIndex(currentWeekIndex - 1)}
                              className="p-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all"
                              title="Предыдущая неделя"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">📅</span>
                              <span className="font-bold text-gray-800">
                                {formatDate(displayedWeekStart)} — {formatDate(displayedWeekEnd)}
                              </span>
                              {isCurrentWeek && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                  Текущая
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setCurrentWeekIndex(currentWeekIndex + 1)}
                              className="p-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all"
                              title="Следующая неделя"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Online/Offline Tab Switcher */}
                  <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200">
                    <button
                      type="button"
                      onClick={() => setScheduleType("online")}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                        scheduleType === "online"
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span>Видеоконсультация</span>
                      {Object.values(getCurrentOnlineSchedule()).filter((d) => d.enabled).length >
                        0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            scheduleType === "online"
                              ? "bg-blue-600 text-white"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {Object.values(getCurrentOnlineSchedule()).filter((d) => d.enabled).length}
                        </span>
                      )}
                      {getConflictDays().length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold">
                          ⚠ {getConflictDays().length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType("offline")}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                        scheduleType === "offline"
                          ? "bg-purple-500 text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Home className="w-5 h-5" />
                      <span>Приём в клинике</span>
                      {Object.values(getCurrentOfflineSchedule()).filter((d) => d.enabled).length >
                        0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            scheduleType === "offline"
                              ? "bg-purple-600 text-white"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {
                            Object.values(getCurrentOfflineSchedule()).filter((d) => d.enabled)
                              .length
                          }
                        </span>
                      )}
                      {getConflictDays().length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold">
                          ⚠ {getConflictDays().length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Schedule Days */}
                  <div
                    className={`space-y-3 p-4 rounded-2xl ${
                      scheduleType === "online" ? "bg-blue-50/40" : "bg-purple-50/40"
                    }`}
                  >
                    {scheduleType === "online" ? (
                      <p className="text-sm text-blue-700 font-medium mb-2">
                        Настройте расписание для онлайн приемов
                      </p>
                    ) : (
                      <p className="text-sm text-purple-700 font-medium mb-2">
                        Настройте расписание для оффлайн приемов
                      </p>
                    )}
                    {DEFAULT_WEEKDAYS.map((day) => {
                      const currentOnlineSchedule = getCurrentOnlineSchedule();
                      const currentOfflineSchedule = getCurrentOfflineSchedule();
                      const hasConflict = getScheduleConflict(day.value);
                      const isOnline = scheduleType === "online";
                      const currentDaySchedule = isOnline
                        ? currentOnlineSchedule
                        : currentOfflineSchedule;
                      const otherSchedule = isOnline
                        ? currentOfflineSchedule
                        : currentOnlineSchedule;
                      const otherEnabled = otherSchedule[day.value]?.enabled;
                      const otherTime = otherEnabled
                        ? `${otherSchedule[day.value]?.start} - ${otherSchedule[day.value]?.end}`
                        : "";

                      return (
                        <div
                          key={day.value}
                          className={`rounded-xl border-2 p-4 transition-all bg-white ${
                            hasConflict
                              ? "border-red-500 bg-red-50"
                              : currentDaySchedule[day.value]?.enabled
                              ? isOnline
                                ? "border-blue-500 bg-blue-50"
                                : "border-purple-500 bg-purple-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() =>
                                isOnline
                                  ? toggleOnlineDay(day.value)
                                  : toggleOfflineDay(day.value)
                              }
                              className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all font-semibold text-sm ${
                                hasConflict
                                  ? "border-red-500 bg-red-500 text-white"
                                  : currentDaySchedule[day.value]?.enabled
                                  ? isOnline
                                    ? "border-blue-500 bg-blue-500 text-white"
                                    : "border-purple-500 bg-purple-500 text-white"
                                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                              }`}
                              title={day.labelRu}
                            >
                              {day.labelShort}
                            </button>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-700">
                                {day.labelRu}
                                {scheduleTypeMode === "weekly" && (
                                  <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    {getDateForDay(day.dayIndex)}
                                  </span>
                                )}
                              </p>
                              {otherEnabled && !currentDaySchedule[day.value]?.enabled && (
                                <p
                                  className={`text-xs mt-1 ${
                                    isOnline ? "text-purple-600" : "text-blue-600"
                                  }`}
                                >
                                  {isOnline ? "🏠 Оффлайн:" : "📱 Онлайн:"} {otherTime}
                                </p>
                              )}
                            </div>
                            {currentDaySchedule[day.value]?.enabled && (
                              <div className="flex items-center gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">С</label>
                                  <input
                                    type="time"
                                    value={currentDaySchedule[day.value]?.start || "09:00"}
                                    onChange={(e) =>
                                      isOnline
                                        ? updateOnlineDayTime(day.value, "start", e.target.value)
                                        : updateOfflineDayTime(day.value, "start", e.target.value)
                                    }
                                    step="900"
                                    className={`w-32 px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors text-sm ${
                                      hasConflict
                                        ? "border-red-300 focus:border-red-500"
                                        : isOnline
                                        ? "border-gray-300 focus:border-blue-500"
                                        : "border-gray-300 focus:border-purple-500"
                                    }`}
                                  />
                                </div>
                                <div className="text-gray-400 pt-5">—</div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">До</label>
                                  <input
                                    type="time"
                                    value={currentDaySchedule[day.value]?.end || "18:00"}
                                    onChange={(e) =>
                                      isOnline
                                        ? updateOnlineDayTime(day.value, "end", e.target.value)
                                        : updateOfflineDayTime(day.value, "end", e.target.value)
                                    }
                                    step="900"
                                    className={`w-32 px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors text-sm ${
                                      hasConflict
                                        ? "border-red-300 focus:border-red-500"
                                        : isOnline
                                        ? "border-gray-300 focus:border-blue-500"
                                        : "border-gray-300 focus:border-purple-500"
                                    }`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          {hasConflict && (
                            <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-500 rounded">
                              <p className="text-xs text-red-800 font-semibold">
                                ⚠️ Конфликт времени! {isOnline ? "Приём в клинике" : "Видеоконсультация"} расписание:{" "}
                                {otherTime}
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Измените время или отключите один из графиков
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Conflict warning */}
                  {getConflictDays().length > 0 && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                      <p className="text-sm text-red-800 font-bold">
                        ⛔ Обнаружены конфликты расписания! ({getConflictDays().length} дней)
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Исправьте конфликты перед сохранением.
                      </p>
                    </div>
                  )}

                  {/* Overrides section (hidden) */}
                  {false && (
                    <div className="space-y-6">
                      {/* Add Override Form */}
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 space-y-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-amber-600" />
                          Добавить исключение
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Дата
                            </label>
                            <input
                              type="date"
                              value={overrideForm.date}
                              onChange={(e) =>
                                setOverrideForm((f) => ({ ...f, date: e.target.value }))
                              }
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Тип
                            </label>
                            <select
                              value={overrideForm.consultation_type}
                              onChange={(e) =>
                                setOverrideForm((f) => ({
                                  ...f,
                                  consultation_type: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                            >
                              <option value="online">Видеоконсультация</option>
                              <option value="offline">Приём в клинике</option>
                            </select>
                          </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <div
                            onClick={() =>
                              setOverrideForm((f) => ({ ...f, is_day_off: !f.is_day_off }))
                            }
                            className={`w-10 h-6 rounded-full transition-colors relative ${
                              overrideForm.is_day_off ? "bg-red-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                overrideForm.is_day_off ? "left-5" : "left-1"
                              }`}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Выходной день</span>
                        </label>
                        {!overrideForm.is_day_off && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Начало
                              </label>
                              <input
                                type="time"
                                value={overrideForm.start_time}
                                onChange={(e) =>
                                  setOverrideForm((f) => ({ ...f, start_time: e.target.value }))
                                }
                                step="900"
                                className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Конец
                              </label>
                              <input
                                type="time"
                                value={overrideForm.end_time}
                                onChange={(e) =>
                                  setOverrideForm((f) => ({ ...f, end_time: e.target.value }))
                                }
                                step="900"
                                className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Примечание (необязательно)
                          </label>
                          <input
                            type="text"
                            value={overrideForm.note}
                            onChange={(e) =>
                              setOverrideForm((f) => ({ ...f, note: e.target.value }))
                            }
                            placeholder="Например: командировка, отпуск..."
                            className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveOverride}
                          disabled={overrideSaving || !overrideForm.date}
                          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {overrideSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Сохранить исключение
                        </button>
                      </div>

                      {/* Existing Overrides List */}
                      {overrides.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Ban className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Исключений нет</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Существующие исключения
                          </p>
                          {overrides.map((ov) => (
                            <div
                              key={ov.id}
                              className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                                ov.is_day_off
                                  ? "border-red-200 bg-red-50"
                                  : "border-amber-200 bg-amber-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {ov.is_day_off ? (
                                  <Ban className="w-4 h-4 text-red-500" />
                                ) : (
                                  <Clock className="w-4 h-4 text-amber-600" />
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {new Date(ov.date + "T00:00:00").toLocaleDateString("ru-RU", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                    <span
                                      className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                                        ov.consultation_type === "online"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-purple-100 text-purple-700"
                                      }`}
                                    >
                                      {ov.consultation_type === "online" ? "Видеоконсультация" : "Приём в клинике"}
                                    </span>
                                  </p>
                                  <p
                                    className={`text-xs mt-0.5 ${
                                      ov.is_day_off ? "text-red-600" : "text-amber-700"
                                    }`}
                                  >
                                    {ov.is_day_off
                                      ? "Выходной"
                                      : `${ov.start_time?.slice(0, 5)} — ${ov.end_time?.slice(0, 5)}`}
                                    {ov.note && (
                                      <span className="ml-2 text-gray-500">· {ov.note}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteOverride(ov.id)}
                                className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── HISTORY TAB ── */}
              {!scheduleLoading && scheduleModalTab === "history" && (
                <div className="space-y-3">
                  {scheduleHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">История изменений пуста</p>
                    </div>
                  ) : (
                    scheduleHistory.map((entry: any) => {
                      const actionColor =
                        entry.action === "create"
                          ? "text-green-600 bg-green-50 border-green-200"
                          : entry.action === "delete"
                          ? "text-red-600 bg-red-50 border-red-200"
                          : "text-blue-600 bg-blue-50 border-blue-200";
                      const actionLabel =
                        entry.action === "create"
                          ? "Создано"
                          : entry.action === "delete"
                          ? "Удалено"
                          : "Изменено";
                      const entityLabel =
                        entry.entity_type === "base" ? "Базовое расписание" : "Исключение";
                      const changedAt = new Date(entry.changed_at).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <div key={entry.id} className={`p-4 rounded-xl border-2 ${actionColor}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${actionColor}`}
                              >
                                {actionLabel}
                              </span>
                              <span className="text-xs text-gray-500">{entityLabel}</span>
                            </div>
                            <span className="text-xs text-gray-400">{changedAt}</span>
                          </div>
                          {entry.changed_by_name && (
                            <p className="text-xs text-gray-500 mb-2">
                              Изменил: {entry.changed_by_name}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {entry.before && (
                              <div className="bg-white/60 rounded-lg p-2">
                                <p className="text-xs font-semibold text-gray-500 mb-1">До</p>
                                {Object.entries(entry.before)
                                  .filter(([k]) =>
                                    [
                                      "start_time",
                                      "end_time",
                                      "is_day_off",
                                      "is_active",
                                      "weekday",
                                      "date",
                                    ].includes(k)
                                  )
                                  .map(([k, v]) => (
                                    <p key={k} className="text-xs text-gray-700">
                                      <span className="text-gray-400">{k}:</span> {String(v)}
                                    </p>
                                  ))}
                              </div>
                            )}
                            {entry.after && (
                              <div className="bg-white/60 rounded-lg p-2">
                                <p className="text-xs font-semibold text-gray-500 mb-1">После</p>
                                {Object.entries(entry.after)
                                  .filter(([k]) =>
                                    [
                                      "start_time",
                                      "end_time",
                                      "is_day_off",
                                      "is_active",
                                      "weekday",
                                      "date",
                                    ].includes(k)
                                  )
                                  .map(([k, v]) => (
                                    <p key={k} className="text-xs text-gray-700">
                                      <span className="text-gray-400">{k}:</span> {String(v)}
                                    </p>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
