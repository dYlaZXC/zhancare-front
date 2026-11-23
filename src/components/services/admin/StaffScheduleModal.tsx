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
  ConsultationType,
  DoctorRoomAssignmentRow,
  DoctorRoomOverrideRow,
  AvailableRoom,
} from "./staff-schedule/types/scheduleTypes";
import { DEFAULT_WEEKDAYS, emptyWeek, CONSULTATION_TYPES } from "./staff-schedule/types/scheduleTypes";
import { getCurrentMondayStr, getMondayOfWeekContaining, addDays, formatWeekLabel } from "./staff-schedule/utils/dateHelpers";
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
  initialConsultationType,
  initialDate,
}: StaffScheduleModalProps) {
  // ── Modal-exclusive state ────────────────────────────────────────────────────
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleModalTab, setScheduleModalTab] = useState<"schedule" | "template" | "history">("schedule");
  const [scheduleHistory, setScheduleHistory] = useState<any[]>([]);
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  // Template-tab weekday pattern state
  const [scheduleType, setScheduleType] = useState<ConsultationType>("online");
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedules>({});

  // Planner (schedule-by-date) state
  const [plannerWeekStart, setPlannerWeekStart] = useState<string>("");
  const [plannerConsultationType, setPlannerConsultationType] = useState<ConsultationType>("online");
  const [plannerDays, setPlannerDays] = useState<any[]>([]);
  // Keyed by the OTHER two types (not the currently-selected one) — used to
  // detect/display conflicts against whichever of them has hours set.
  const [plannerOtherDaysByType, setPlannerOtherDaysByType] = useState<Partial<Record<ConsultationType, any[]>>>({});
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerSaving, setPlannerSaving] = useState(false);
  const [plannerDirty, setPlannerDirty] = useState(false);

  // Гибкое расписание кабинетов — doctor-centric weekly room assignments
  // (Постоянное) + date-specific overrides (По датам). roomAssignments/
  // availableRooms don't depend on which week is showing (fetched once on
  // open); roomOverrides is inherently week-scoped and refetched whenever
  // plannerWeekStart changes, mirroring how plannerDays itself already
  // refetches on week navigation.
  const [roomAssignments, setRoomAssignments] = useState<DoctorRoomAssignmentRow[]>([]);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [roomOverrides, setRoomOverrides] = useState<DoctorRoomOverrideRow[]>([]);
  // Uncommitted room-band drafts/edits from TemplateScheduleTab's "Кабинеты"
  // rows — lives here (not in that tab) so handleSaveSchedule can flush them
  // before saving, and so closing the modal with something still pending can
  // warn instead of silently discarding it (see both uses below).
  const [newBandByWeekday, setNewBandByWeekday] = useState<Record<number, { roomId: number | null; startTime: string; endTime: string }>>({});
  const [editsByBandId, setEditsByBandId] = useState<Record<number, { roomId?: number | null; startTime?: string; endTime?: string }>>({});

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
    async (memberId: number, weekStart: string, cType: ConsultationType) => {
      setPlannerLoading(true);
      const otherTypes = CONSULTATION_TYPES.filter((t) => t !== cType);
      try {
        const [mainRes, ...otherRes] = await Promise.allSettled([
          api.get(`/staff/${memberId}/availability/`, {
            params: { week_start: weekStart, consultation_type: cType },
          }),
          ...otherTypes.map((t) =>
            api.get(`/staff/${memberId}/availability/`, {
              params: { week_start: weekStart, consultation_type: t },
            })
          ),
        ]);
        const mainData = mainRes.status === "fulfilled" ? mainRes.value.data : [];
        const otherByType: Partial<Record<ConsultationType, any[]>> = {};
        otherTypes.forEach((t, i) => {
          const r = otherRes[i];
          otherByType[t] = r.status === "fulfilled" ? r.value.data : [];
        });
        const resolvedMainData = mainData.length > 0 ? mainData : buildDefaultWeek(weekStart);
        setPlannerDays(resolvedMainData);
        setPlannerOtherDaysByType(otherByType);
        setPlannerDirty(false);
        return { mainData: resolvedMainData, otherByType };
      } catch {
        setPlannerDays(buildDefaultWeek(weekStart));
        setPlannerOtherDaysByType({});
        setPlannerDirty(false);
        return { mainData: buildDefaultWeek(weekStart), otherByType: {} as Partial<Record<ConsultationType, any[]>> };
      } finally {
        setPlannerLoading(false);
      }
    },
    []
  );

  const fetchRoomAssignments = useCallback(async (memberId: number) => {
    try {
      const { data } = await api.get(`/staff/${memberId}/room-assignments/`);
      setRoomAssignments(data?.assignments ?? []);
      setAvailableRooms(data?.available_rooms ?? []);
    } catch {
      setRoomAssignments([]);
      setAvailableRooms([]);
    }
  }, []);

  const fetchRoomOverrides = useCallback(async (memberId: number, weekStart: string) => {
    try {
      const { data } = await api.get(`/staff/${memberId}/room-overrides/`, {
        params: { week_start: weekStart },
      });
      setRoomOverrides(Array.isArray(data) ? data : []);
    } catch {
      setRoomOverrides([]);
    }
  }, []);

  // ── Initialize on open ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !member) return;

    // Reset all state
    const startType = initialConsultationType ?? "online";
    setScheduleModalTab("schedule");
    setScheduleHistory([]);
    setScheduleType(startType);
    setCurrentWeekIndex(0);
    setPlannerConsultationType(startType);
    setPlannerDirty(false);
    setNewBandByWeekday({});
    setEditsByBandId({});

    const monday = initialDate ? getMondayOfWeekContaining(initialDate) : getCurrentMondayStr();
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
        fetchScheduleHistory(member.id);
        fetchRoomAssignments(member.id);

        fetchPlannerWeek(member.id, monday, startType).then(({ mainData, otherByType }) => {
          if (!initialConsultationType) return;
          // A caller-supplied hint (e.g. "открой Кабинеты, они точно не на
          // Онлайн") only knows Кабинеты live on SOME non-online tab — it
          // can't know whether THIS doctor's real hours are under "offline"
          // or "mixed" specifically. Checked against the actual per-day
          // records this exact fetch just returned, NOT a summary flag:
          // GET /staff/{id}/'s has_offline_availability is TRUE even when a
          // doctor has ONLY "mixed" hours (mixed satisfies both offline and
          // online demand by design — see _get_availability_types_this_week),
          // so it can't tell "does the offline TAB show real hours" from "is
          // this doctor bookable as offline via mixed" — confirmed with real
          // data where a doctor has an EXPLICIT day-off record for "offline"
          // and genuine hours only under "mixed" on the very same dates.
          const isAllDayOff = (days: any[] | undefined) =>
            !days || days.length === 0 || days.every((d) => d.is_day_off);
          if (!isAllDayOff(mainData)) return;
          const fallback: ConsultationType = startType === "offline" ? "mixed" : "offline";
          const fallbackDays = otherByType[fallback];
          if (!fallbackDays || isAllDayOff(fallbackDays)) return;
          // The fallback type's week was already fetched as part of this
          // SAME batch (fetchPlannerWeek always fetches all three types
          // together, for conflict-checking) — swap in place, no extra
          // request needed.
          setScheduleType(fallback);
          setPlannerConsultationType(fallback);
          setPlannerDays(fallbackDays);
          setPlannerOtherDaysByType((prev) => {
            const rest = { ...otherByType };
            delete rest[fallback];
            return { ...rest, [startType]: mainData };
          });
        });
      });
    // Deliberately keyed on member?.id, not the `member` object itself — the
    // caller (StaffManagement.tsx) rebuilds `member` as a new object on every
    // render (an inline `{...scheduleMember, ...}` spread), including on its
    // own unrelated 60s activity-poll re-renders. Depending on the object
    // reference made this effect re-fire mid-edit while the modal was still
    // open for the SAME doctor — silently resetting the active tab back to
    // "online", clearing plannerDirty, and refetching over whatever the
    // admin was mid-typing. Re-run only when the modal opens or a genuinely
    // different doctor is selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, member?.id, fetchPlannerWeek, fetchScheduleHistory, fetchRoomAssignments]);

  // roomOverrides is inherently week-scoped (GET .../room-overrides/?week_start=)
  // and the date tab supports navigating weeks (handlePlannerWeekNav) — refetch
  // whenever plannerWeekStart changes, exactly like plannerDays itself does.
  useEffect(() => {
    if (!isOpen || !member || !plannerWeekStart) return;
    fetchRoomOverrides(member.id, plannerWeekStart);
  }, [isOpen, member?.id, plannerWeekStart, fetchRoomOverrides]);

  // ── Conflict detection helpers ────────────────────────────────────────────────

  const getPlannerDayConflict = useCallback(
    (dayIndex: number): { hasConflict: boolean; otherType?: ConsultationType; otherTime: string } => {
      const current = plannerDays[dayIndex];
      if (!current || current.is_day_off) return { hasConflict: false, otherTime: "" };
      const cs = current.start_time,
        ce = current.end_time;
      if (!cs || !ce) return { hasConflict: false, otherTime: "" };

      for (const [type, days] of Object.entries(plannerOtherDaysByType) as [ConsultationType, any[]][]) {
        const other = days?.[dayIndex];
        if (!other || other.is_day_off) continue;
        const os = other.start_time,
          oe = other.end_time;
        if (!os || !oe) continue;
        if (timeRangesOverlap(cs, ce, os, oe)) {
          return { hasConflict: true, otherType: type, otherTime: `${os} – ${oe}` };
        }
      }
      return { hasConflict: false, otherTime: "" };
    },
    [plannerDays, plannerOtherDaysByType]
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

  const getCurrentSchedule = useCallback(
    (type: ConsultationType): Record<string, DaySchedule> => {
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      return weeklySchedules[weekStartDate]?.[type] ?? emptyWeek()[type];
    },
    [weeklySchedules, currentWeekIndex, getWeekStartDate]
  );

  // Checks `type`'s day against BOTH other types — a doctor with e.g. online
  // and mixed overlapping on the same day/time is just as much a conflict as
  // online vs offline was before mixed existed.
  const getScheduleConflict = useCallback(
    (type: ConsultationType, day: string): boolean => {
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      const weekSchedule = weeklySchedules[weekStartDate];
      if (!weekSchedule) return false;
      const current = weekSchedule[type][day];
      if (!current?.enabled) return false;
      return CONSULTATION_TYPES.filter((t) => t !== type).some((otherType) => {
        const other = weekSchedule[otherType][day];
        return other?.enabled && timeRangesOverlap(current.start, current.end, other.start, other.end);
      });
    },
    [weeklySchedules, currentWeekIndex, getWeekStartDate]
  );

  const getConflictDays = useCallback(
    (type: ConsultationType): string[] => {
      return DEFAULT_WEEKDAYS.filter((d) => getScheduleConflict(type, d.value)).map((d) => d.value);
    },
    [getScheduleConflict]
  );

  // ── Template-tab: toggle/update helpers ──────────────────────────────────────

  const toggleScheduleDay = useCallback(
    (type: ConsultationType, day: string) => {
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      setWeeklySchedules((prev) => {
        const cur = prev[weekStartDate] ?? emptyWeek();
        return {
          ...prev,
          [weekStartDate]: {
            ...cur,
            [type]: {
              ...cur[type],
              [day]: { ...cur[type][day], enabled: !cur[type][day]?.enabled },
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

  const updateScheduleDayTime = useCallback(
    (type: ConsultationType, day: string, field: "start" | "end", value: string) => {
      const adjust = makeAdjustTime(field);
      const weekStartDate = getWeekStartDate(currentWeekIndex);
      setWeeklySchedules((prev) => {
        const cur = prev[weekStartDate] ?? emptyWeek();
        const adjusted = adjust(cur[type][day], value);
        return {
          ...prev,
          [weekStartDate]: {
            ...cur,
            [type]: { ...cur[type], [day]: { ...cur[type][day], ...adjusted } },
          },
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentWeekIndex, getWeekStartDate]
  );

  // ── Template-tab: save schedule ───────────────────────────────────────────────

  // True once anything in the Кабинеты rows has been touched but not yet
  // committed via that row's own checkmark — an edit to an existing band is
  // always meaningful (something real is changing), but a freshly-opened
  // "+ Добавить интервал" draft only counts once a room has actually been
  // picked, matching flushPendingRoomBands below (an empty draft is "opened
  // then abandoned," not "forgot to save").
  const hasPendingRoomChanges =
    Object.keys(editsByBandId).length > 0 ||
    Object.values(newBandByWeekday).some((d) => d.roomId !== null);

  // Commits every still-pending Кабинеты row the same way its own checkmark
  // would — called from handleSaveSchedule so "Сохранить постоянное" (the
  // one big, obvious button) actually persists a room the admin just set,
  // instead of silently dropping it the moment the modal closes right after.
  const flushPendingRoomBands = async () => {
    for (const [idStr, edits] of Object.entries(editsByBandId)) {
      const id = Number(idStr);
      const patch: { room_id?: number | null; start_time?: string; end_time?: string } = {};
      if (edits.roomId !== undefined) patch.room_id = edits.roomId;
      if (edits.startTime !== undefined) patch.start_time = edits.startTime;
      if (edits.endTime !== undefined) patch.end_time = edits.endTime;
      await handleUpdateRoomBand(id, patch);
    }
    for (const [weekdayStr, draft] of Object.entries(newBandByWeekday)) {
      if (draft.roomId === null) continue; // opened but never filled in — nothing to save
      await handleAddRoomBand(Number(weekdayStr), draft.roomId, draft.startTime, draft.endTime);
    }
    setEditsByBandId({});
    setNewBandByWeekday({});
  };

  const handleSaveSchedule = async () => {
    if (!member) return;
    // Saving writes all three types at once (buildSchedulesArray), so check
    // conflicts across all of them, not just whichever tab is active.
    const conflictDays = Array.from(new Set(CONSULTATION_TYPES.flatMap((t) => getConflictDays(t))));
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
      if (hasPendingRoomChanges) {
        // Each individual call already toasts its own error and throws on
        // failure (see handleAddRoomBand/handleUpdateRoomBand above) — on
        // failure, stop here rather than also saving the schedule, so the
        // admin notices and can fix the room before retrying.
        await flushPendingRoomBands();
      }
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

  const handlePlannerTypeChange = async (cType: ConsultationType) => {
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

  // ── Гибкое расписание кабинетов handlers ──────────────────────────────────────

  const handleAddRoomBand = async (weekday: number, roomId: number | null, startTime: string, endTime: string) => {
    if (!member) return;
    try {
      const { data } = await api.post(`/staff/${member.id}/room-assignments/`, {
        room_id: roomId, weekday, start_time: startTime, end_time: endTime,
      });
      setRoomAssignments((prev) => [...prev, data]);
      toast.success("Кабинет назначен");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Не удалось назначить кабинет");
      throw e;
    }
  };

  const handleUpdateRoomBand = async (
    id: number,
    changes: { room_id?: number | null; start_time?: string; end_time?: string }
  ) => {
    if (!member) return;
    try {
      const { data } = await api.patch(`/staff/${member.id}/room-assignments/${id}/`, changes);
      setRoomAssignments((prev) => prev.map((a) => (a.id === id ? data : a)));
      toast.success("Сохранено");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Не удалось сохранить");
      throw e;
    }
  };

  const handleDeleteRoomBand = async (id: number) => {
    if (!member) return;
    try {
      await api.delete(`/staff/${member.id}/room-assignments/${id}/`);
      setRoomAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Удалено");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Не удалось удалить");
      throw e;
    }
  };

  const handleAddRoomOverride = async (date: string, roomId: number | null, startTime: string, endTime: string) => {
    if (!member) return;
    try {
      const { data } = await api.post(`/staff/${member.id}/room-overrides/`, {
        date, room_id: roomId, start_time: startTime, end_time: endTime,
      });
      setRoomOverrides((prev) => [...prev, data]);
      toast.success("Переопределение добавлено");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Не удалось добавить переопределение");
      throw e;
    }
  };

  const handleUpdateRoomOverride = async (
    id: number,
    changes: { room_id?: number | null; start_time?: string; end_time?: string }
  ) => {
    if (!member) return;
    try {
      const { data } = await api.patch(`/staff/${member.id}/room-overrides/${id}/`, changes);
      setRoomOverrides((prev) => prev.map((o) => (o.id === id ? data : o)));
      toast.success("Сохранено");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Не удалось сохранить");
      throw e;
    }
  };

  const handleDeleteRoomOverride = async (id: number) => {
    if (!member) return;
    try {
      await api.delete(`/staff/${member.id}/room-overrides/${id}/`);
      setRoomOverrides((prev) => prev.filter((o) => o.id !== id));
      toast.success("Удалено");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Не удалось удалить");
      throw e;
    }
  };

  // Closing (X, backdrop, "Закрыть") used to silently discard an in-progress
  // Кабинеты row with zero warning — this is the other half of the
  // "doctors aren't saved in rooms" bug: filling in a room and expecting
  // either Save button to catch it. hasPendingRoomChanges only looks at the
  // Постоянное tab's state, but is checked regardless of which tab is
  // active since switching tabs doesn't clear it.
  const handleRequestClose = () => {
    if (
      hasPendingRoomChanges &&
      !window.confirm("Есть несохранённый кабинет — изменения будут потеряны. Закрыть без сохранения?")
    ) {
      return;
    }
    onClose();
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
              handleRequestClose();
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
                onClick={handleRequestClose}
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
                  plannerOtherDaysByType={plannerOtherDaysByType}
                  plannerLoading={plannerLoading}
                  plannerConflictCount={plannerConflictCount}
                  getPlannerDayConflict={getPlannerDayConflict}
                  onTypeChange={handlePlannerTypeChange}
                  onWeekNav={handlePlannerWeekNav}
                  onUpdateDay={updatePlannerDay}
                  onSaveDay={handleSavePlannerDay}
                  onDeleteDay={handleDeletePlannerDay}
                  roomOverrides={roomOverrides}
                  availableRooms={availableRooms}
                  onAddRoomOverride={handleAddRoomOverride}
                  onUpdateRoomOverride={handleUpdateRoomOverride}
                  onDeleteRoomOverride={handleDeleteRoomOverride}
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
                  getCurrentSchedule={getCurrentSchedule}
                  getScheduleConflict={getScheduleConflict}
                  getConflictDays={getConflictDays}
                  onToggleDay={toggleScheduleDay}
                  onUpdateDayTime={updateScheduleDayTime}
                  roomAssignments={roomAssignments}
                  availableRooms={availableRooms}
                  onAddRoomBand={handleAddRoomBand}
                  onUpdateRoomBand={handleUpdateRoomBand}
                  onDeleteRoomBand={handleDeleteRoomBand}
                  newBandByWeekday={newBandByWeekday}
                  setNewBandByWeekday={setNewBandByWeekday}
                  editsByBandId={editsByBandId}
                  setEditsByBandId={setEditsByBandId}
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
                onClick={handleRequestClose}
                disabled={scheduleLoading}
                className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Закрыть
              </button>
              {scheduleModalTab === "template" && (
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={scheduleLoading || CONSULTATION_TYPES.some((t) => getConflictDays(t).length > 0)}
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
