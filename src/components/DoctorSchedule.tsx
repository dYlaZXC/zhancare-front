"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Calendar,
  RotateCcw,
  History,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { CONSULTATION_TYPES } from "./services/admin/staff-schedule/types/scheduleTypes";
import type { ConsultationType } from "./services/admin/staff-schedule/types/scheduleTypes";
import { TYPE_META } from "./services/admin/staff-schedule/utils/typeDisplay";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "schedule" | "template" | "history";

interface PlannerDay {
  date: string;
  avail_id: number | null;
  is_day_off: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string;
  source: "availability" | "template" | "empty";
}

interface TemplateEntry {
  id?: number;
  consultation_type: ConsultationType;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface HistoryEntry {
  id: number;
  entity_type: string;
  action: "create" | "update" | "delete";
  changed_at: string;
  changed_by_name: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];
const WEEKDAY_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function getMondayISO(d = new Date()): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toLocaleDateString("sv-SE");
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

function formatWeekLabel(mondayStr: string): string {
  const start = new Date(mondayStr + "T00:00:00");
  const end = new Date(mondayStr + "T00:00:00");
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return `${fmt(start)} — ${fmt(end)}`;
}

function isCurrentWeek(mondayStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(mondayStr + "T00:00:00");
  sunday.setDate(sunday.getDate() + 6);
  return today >= monday && today <= sunday;
}

function buildDefaultWeek(weekStart: string): PlannerDay[] {
  return Array.from({ length: 7 }, (_, i) => {
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
      source: "empty" as const,
    };
  });
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMinutes(s1) < timeToMinutes(e2) && timeToMinutes(s2) < timeToMinutes(e1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoctorSchedule() {
  const { user } = useAuth();

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>("schedule");

  // ── "По датам" tab state ──
  const [plannerWeekStart, setPlannerWeekStart] = useState<string>(() =>
    getMondayISO()
  );
  const [plannerType, setPlannerType] = useState<ConsultationType>("online");
  const [plannerDays, setPlannerDays] = useState<PlannerDay[]>([]);
  // Keyed by the OTHER two types (not the currently-selected one).
  const [plannerDaysOtherByType, setPlannerDaysOtherByType] = useState<Partial<Record<ConsultationType, PlannerDay[]>>>({});
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerSaving, setPlannerSaving] = useState(false);
  const [plannerDirty, setPlannerDirty] = useState(false);

  // ── "Постоянное" tab state (declared here so plannerConflictDates can use it) ──
  const [templateData, setTemplateData] = useState<TemplateEntry[]>([]);
  const [templateType, setTemplateType] = useState<ConsultationType>("online");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);

  // ── Conflict detection ─────────────────────────────────────────────────────
  // Checks plannerType's day against BOTH other types — a doctor with e.g.
  // online and mixed overlapping on the same day/time is just as much a
  // conflict as online vs offline was before mixed existed.
  const otherPlannerTypes = useMemo(
    () => CONSULTATION_TYPES.filter((t) => t !== plannerType),
    [plannerType]
  );

  const plannerConflictDates = useMemo(() => {
    const conflicting = new Set<string>();
    plannerDays.forEach((day) => {
      if (day.is_day_off || !day.start_time || !day.end_time) return;

      for (const otherType of otherPlannerTypes) {
        // 1. Check explicit availability for the other type on this date
        const otherDays = plannerDaysOtherByType[otherType] ?? [];
        const other = otherDays.find((o) => o.date === day.date);
        if (other && !other.is_day_off && other.start_time && other.end_time) {
          if (timesOverlap(day.start_time, day.end_time, other.start_time, other.end_time)) {
            conflicting.add(day.date);
            continue;
          }
        }

        // 2. Fallback: check recurring template for the other type on the same weekday
        const weekday = new Date(day.date + "T00:00:00").getDay(); // JS: 0=Sun,1=Mon…
        const tpl = templateData.find(
          (t) => t.consultation_type === otherType && t.weekday === weekday && t.is_active
        );
        if (tpl && tpl.start_time && tpl.end_time) {
          if (timesOverlap(day.start_time, day.end_time, tpl.start_time, tpl.end_time)) {
            conflicting.add(day.date);
          }
        }
      }
    });
    return conflicting;
  }, [plannerDays, plannerDaysOtherByType, templateData, otherPlannerTypes]);

  // Weekdays where any TWO active template types overlap in time — generalizes
  // the old online-vs-offline-only check to all pairs among up to 3 types.
  const getTemplateConflictWeekdays = useCallback((): number[] => {
    return [1, 2, 3, 4, 5, 6, 0].filter((wd) => {
      const active = CONSULTATION_TYPES
        .map((t) => templateData.find((row) => row.weekday === wd && row.consultation_type === t))
        .filter((row): row is TemplateEntry => !!row?.is_active && !!row.start_time && !!row.end_time);
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          if (timesOverlap(active[i].start_time!, active[i].end_time!, active[j].start_time!, active[j].end_time!)) {
            return true;
          }
        }
      }
      return false;
    });
  }, [templateData]);

  // ── "История" tab state ──
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 10;

  // ── Load week ──────────────────────────────────────────────────────────────
  const fetchWeek = useCallback(
    async (weekStart: string, cType: ConsultationType) => {
      setPlannerLoading(true);
      const otherTypes = CONSULTATION_TYPES.filter((t) => t !== cType);
      try {
        const [{ data }, ...otherResults] = await Promise.all([
          api.get("/user-profile/availability/", {
            params: { week_start: weekStart, consultation_type: cType },
          }),
          ...otherTypes.map((t) =>
            api
              .get("/user-profile/availability/", {
                params: { week_start: weekStart, consultation_type: t },
              })
              .catch(() => ({ data: [] }))
          ),
        ]);
        setPlannerDays(
          Array.isArray(data) && data.length > 0 ? data : buildDefaultWeek(weekStart)
        );
        const otherByType: Partial<Record<ConsultationType, PlannerDay[]>> = {};
        otherTypes.forEach((t, i) => {
          const dataOther = otherResults[i].data;
          otherByType[t] = Array.isArray(dataOther) && dataOther.length > 0 ? dataOther : buildDefaultWeek(weekStart);
        });
        setPlannerDaysOtherByType(otherByType);
        setPlannerDirty(false);
      } catch {
        setPlannerDays(buildDefaultWeek(weekStart));
        setPlannerDaysOtherByType({});
        setPlannerDirty(false);
      } finally {
        setPlannerLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab === "schedule") {
      fetchWeek(plannerWeekStart, plannerType);
      // Also load template so conflict detection can fall back to recurring schedule
      if (templateData.length === 0) fetchTemplate();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load template ──────────────────────────────────────────────────────────
  const fetchTemplate = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const { data } = await api.get("/user-profile/schedule/");
      setTemplateData(Array.isArray(data) ? data : []);
    } catch {
      setTemplateData([]);
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "template") {
      fetchTemplate();
    }
  }, [activeTab, fetchTemplate]);

  // ── Load history ───────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get("/user-profile/schedule-history/");
      setHistoryData(Array.isArray(data) ? data : []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
      setHistoryPage(1);
    }
  }, [activeTab, fetchHistory]);

  if (!user) return null;

  // ── Week navigation ────────────────────────────────────────────────────────
  const handleWeekNav = async (offset: number) => {
    if (plannerConflictDates.size > 0) {
      toast.error(`⛔ Исправьте ${plannerConflictDates.size} ${plannerConflictDates.size === 1 ? "конфликт" : "конфликта"} расписания перед переходом на другую неделю`);
      return;
    }
    if (plannerDirty && plannerDays.length > 0) {
      try {
        await Promise.all(
          plannerDays.map((day) =>
            api.post("/user-profile/availability/", {
              date: day.date,
              consultation_type: plannerType,
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
    fetchWeek(newWeek, plannerType);
  };

  const handleTypeChange = async (cType: ConsultationType) => {
    if (cType === plannerType) return;
    if (plannerConflictDates.size > 0) {
      toast.error(`⛔ Исправьте ${plannerConflictDates.size} ${plannerConflictDates.size === 1 ? "конфликт" : "конфликта"} расписания перед переключением типа`);
      return;
    }
    if (plannerDirty && plannerDays.length > 0) {
      try {
        await Promise.all(
          plannerDays.map((day) =>
            api.post("/user-profile/availability/", {
              date: day.date,
              consultation_type: plannerType,
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
    setPlannerType(cType);
    fetchWeek(plannerWeekStart, cType);
  };

  const updateDay = (index: number, changes: Partial<PlannerDay>) => {
    setPlannerDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...changes } : d))
    );
    setPlannerDirty(true);
  };

  const handleSaveDay = async (day: PlannerDay) => {
    if (plannerConflictDates.has(day.date)) {
      const conflictingType = otherPlannerTypes.find((t) => {
        const other = plannerDaysOtherByType[t]?.find((o) => o.date === day.date);
        return other && !other.is_day_off && other.start_time && other.end_time
          && day.start_time && day.end_time
          && timesOverlap(day.start_time, day.end_time, other.start_time, other.end_time);
      });
      const other = conflictingType ? plannerDaysOtherByType[conflictingType]?.find((o) => o.date === day.date) : undefined;
      const otherLabel = conflictingType ? TYPE_META[conflictingType].shortLabel : "другим форматом";
      toast.error(`Время пересекается с расписанием «${otherLabel}» (${other?.start_time}–${other?.end_time}). Измените время.`);
      return;
    }
    try {
      await api.post("/user-profile/availability/", {
        date: day.date,
        consultation_type: plannerType,
        is_day_off: day.is_day_off,
        start_time: day.is_day_off ? null : day.start_time || "09:00",
        end_time: day.is_day_off ? null : day.end_time || "18:00",
        note: day.note || "",
      });
      await fetchWeek(plannerWeekStart, plannerType);
      toast.success("Сохранено");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleResetDay = async (day: PlannerDay) => {
    if (!day.avail_id) return;
    try {
      await api.delete(`/user-profile/availability/${day.avail_id}/`);
      await fetchWeek(plannerWeekStart, plannerType);
      toast.success("Сброшено к шаблону");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleSaveWeek = async () => {
    if (plannerConflictDates.size > 0) {
      const conflictLabels = plannerDays
        .filter((d) => plannerConflictDates.has(d.date))
        .map((d) => {
          const dt = new Date(d.date + "T00:00:00");
          return dt.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
        });
      toast.error(
        `Видео и в клинике пересекаются: ${conflictLabels.join(", ")}. Измените время, чтобы они не совпадали.`,
        { autoClose: 6000 }
      );
      return;
    }
    setPlannerSaving(true);
    try {
      await Promise.all(
        plannerDays.map((day) =>
          api.post("/user-profile/availability/", {
            date: day.date,
            consultation_type: plannerType,
            is_day_off: day.is_day_off,
            start_time: day.is_day_off ? null : day.start_time || "09:00",
            end_time: day.is_day_off ? null : day.end_time || "18:00",
            note: day.note || "",
          })
        )
      );
      await fetchWeek(plannerWeekStart, plannerType);
      setPlannerDirty(false);
      toast.success("Неделя сохранена");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setPlannerSaving(false);
    }
  };

  const handleCopyWeek = async () => {
    const nextWeek = addDays(plannerWeekStart, 7);
    if (!confirm(`Скопировать расписание на ${formatWeekLabel(nextWeek)}?`))
      return;
    try {
      await api.post("/user-profile/availability/copy-week/", {
        src_week_start: plannerWeekStart,
        dst_week_start: nextWeek,
        consultation_type: plannerType,
      });
      toast.success(`Неделя скопирована на ${formatWeekLabel(nextWeek)}`);
    } catch {
      toast.error("Ошибка копирования");
    }
  };

  // ── Template helpers ───────────────────────────────────────────────────────
  const getTemplateCell = (weekday: number): TemplateEntry => {
    const found = templateData.find(
      (t) =>
        t.weekday === weekday && t.consultation_type === templateType
    );
    return (
      found || {
        consultation_type: templateType,
        weekday,
        start_time: "09:00",
        end_time: "18:00",
        is_active: false,
      }
    );
  };

  const updateTemplateCell = (
    weekday: number,
    patch: Partial<TemplateEntry>
  ) => {
    setTemplateData((prev) => {
      const idx = prev.findIndex(
        (t) => t.weekday === weekday && t.consultation_type === templateType
      );
      if (idx === -1) {
        return [
          ...prev,
          {
            consultation_type: templateType,
            weekday,
            start_time: "09:00",
            end_time: "18:00",
            is_active: false,
            ...patch,
          },
        ];
      }
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      return updated;
    });
  };

  const handleSaveTemplate = async () => {
    const conflictDays = getTemplateConflictWeekdays();
    if (conflictDays.length > 0) {
      const names = conflictDays.map((wd) => WEEKDAY_LABELS[wd]).join(", ");
      toast.error(`Форматы пересекаются: ${names}. Измените время.`, { autoClose: 6000 });
      return;
    }
    setTemplateSaving(true);
    try {
      const { data } = await api.post("/user-profile/schedule/", templateData);
      setTemplateData(Array.isArray(data) ? data : []);
      toast.success("Шаблон сохранён");
    } catch {
      toast.error("Ошибка сохранения шаблона");
    } finally {
      setTemplateSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
          Мое расписание
        </h1>
        <p className="text-gray-600">
          Управление расписанием и просмотр истории изменений
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100">
        {(
          [
            { key: "schedule", label: "По датам", Icon: Calendar },
            { key: "template", label: "Постоянное", Icon: RotateCcw },
            { key: "history", label: "История", Icon: History },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB: По датам ═══════════════════ */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          {/* Consultation type toggle */}
          <div className={`flex rounded-2xl overflow-hidden border-2 bg-white transition-colors ${plannerConflictDates.size > 0 ? "border-red-200" : "border-gray-200"}`}>
            {CONSULTATION_TYPES.map((type) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              const isSelected = plannerType === type;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  title={plannerConflictDates.size > 0 && !isSelected ? "Исправьте конфликты перед переключением" : undefined}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                    isSelected ? meta.active :
                    plannerConflictDates.size > 0 ? "text-red-400 bg-red-50 cursor-not-allowed" :
                    "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {meta.shortLabel}
                  {plannerConflictDates.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold">
                      ⚠ {plannerConflictDates.size}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Global conflict banner */}
          {plannerConflictDates.size > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
              <p className="text-sm text-red-800 font-bold">
                ⛔ Обнаружены конфликты расписания! ({plannerConflictDates.size} дней)
              </p>
              <p className="text-xs text-red-700 mt-1">Исправьте конфликты перед сохранением.</p>
            </div>
          )}

          {/* Week navigation */}
          <div className={`flex items-center justify-between border-2 rounded-2xl px-4 py-3 transition-colors ${plannerConflictDates.size > 0 ? "bg-red-50 border-red-200" : "bg-indigo-50 border-indigo-100"}`}>
            <button
              onClick={() => handleWeekNav(-1)}
              disabled={plannerConflictDates.size > 0}
              title={plannerConflictDates.size > 0 ? "Исправьте конфликты перед переходом" : undefined}
              className={`p-2 rounded-lg border transition-all ${plannerConflictDates.size > 0 ? "bg-red-100 border-red-200 text-red-300 cursor-not-allowed" : "bg-white hover:bg-indigo-100 text-indigo-600 border-indigo-200"}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 flex-wrap justify-center">
              <span className="text-base">📅</span>
              {formatWeekLabel(plannerWeekStart)}
              {isCurrentWeek(plannerWeekStart) && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Текущая</span>
              )}
              {plannerDirty && plannerConflictDates.size === 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Изменено</span>
              )}
              {plannerConflictDates.size > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">⚠ {plannerConflictDates.size} конфл.</span>
              )}
            </div>
            <button
              onClick={() => handleWeekNav(1)}
              disabled={plannerConflictDates.size > 0}
              title={plannerConflictDates.size > 0 ? "Исправьте конфликты перед переходом" : undefined}
              className={`p-2 rounded-lg border transition-all ${plannerConflictDates.size > 0 ? "bg-red-100 border-red-200 text-red-300 cursor-not-allowed" : "bg-white hover:bg-indigo-100 text-indigo-600 border-indigo-200"}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day rows */}
          {plannerLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {plannerDays.map((day, i) => {
                const d = new Date(day.date + "T00:00:00");
                const dayName = WEEKDAY_LABELS[d.getDay()];
                const dayShort = WEEKDAY_SHORT[d.getDay()];
                const dateLabel = d.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                });
                const isFromAvail = day.source === "availability";
                const isOff = day.is_day_off;
                const hasConflict = plannerConflictDates.has(day.date);
                // For each OTHER type, resolve its hours on this day — explicit
                // date override first, falling back to its weekly template.
                const weekdayJs = new Date(day.date + "T00:00:00").getDay();
                const otherSources = otherPlannerTypes
                  .map((t) => {
                    const otherDay = plannerDaysOtherByType[t]?.find((o) => o.date === day.date);
                    const tpl = templateData.find(
                      (tp) => tp.consultation_type === t && tp.weekday === weekdayJs && tp.is_active
                    );
                    const source =
                      otherDay && !otherDay.is_day_off && otherDay.start_time && otherDay.end_time
                        ? { start: otherDay.start_time, end: otherDay.end_time, fromTemplate: false }
                        : tpl && tpl.start_time && tpl.end_time
                        ? { start: tpl.start_time, end: tpl.end_time, fromTemplate: true }
                        : null;
                    return { type: t, source };
                  })
                  .filter((o): o is { type: ConsultationType; source: { start: string; end: string; fromTemplate: boolean } } => !!o.source);
                const conflictingOther =
                  hasConflict && day.start_time && day.end_time
                    ? otherSources.find((o) => timesOverlap(day.start_time!, day.end_time!, o.source.start, o.source.end))
                    : undefined;

                return (
                  <div
                    key={day.date}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      hasConflict
                        ? "border-red-500 bg-red-50"
                        : isOff
                        ? "border-gray-200 bg-gray-50"
                        : `${TYPE_META[plannerType].border} ${TYPE_META[plannerType].bg}`
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Day toggle button */}
                      <button
                        onClick={() =>
                          updateDay(i, {
                            is_day_off: !isOff,
                            ...(!isOff
                              ? {}
                              : {
                                  start_time: "09:00",
                                  end_time: "18:00",
                                }),
                          })
                        }
                        className={`flex-shrink-0 w-11 h-11 rounded-xl border-2 font-semibold text-xs transition-all ${
                          isOff
                            ? "border-gray-300 bg-white text-gray-400"
                            : isFromAvail
                            ? `${TYPE_META[plannerType].border} ${TYPE_META[plannerType].active}`
                            : "border-gray-300 bg-white text-gray-500"
                        }`}
                      >
                        {dayShort}
                      </button>

                      {/* Day name + date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">
                            {dayName}
                          </span>
                          <span className="text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                            {dateLabel}
                          </span>
                          {day.source === "template" && (
                            <span className="text-xs text-gray-400 italic">
                              из шаблона
                            </span>
                          )}
                        </div>
                        {isOff && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Выходной
                          </p>
                        )}
                      </div>

                      {/* Conflict badge in row */}
                      {hasConflict && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                          ⚠ Конфликт
                        </span>
                      )}

                      {/* Time pickers */}
                      {!isOff && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="time"
                            value={day.start_time || "09:00"}
                            step="900"
                            onChange={(e) =>
                              updateDay(i, { start_time: e.target.value })
                            }
                            className={`w-28 px-2 py-1.5 rounded-lg border-2 focus:outline-none text-sm ${
                              hasConflict
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-indigo-400"
                            }`}
                          />
                          <span className="text-gray-300">—</span>
                          <input
                            type="time"
                            value={day.end_time || "18:00"}
                            step="900"
                            onChange={(e) =>
                              updateDay(i, { end_time: e.target.value })
                            }
                            className={`w-28 px-2 py-1.5 rounded-lg border-2 focus:outline-none text-sm ${
                              hasConflict
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-indigo-400"
                            }`}
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveDay(day)}
                          disabled={hasConflict}
                          className={`p-1.5 rounded-lg transition-colors ${hasConflict ? "bg-red-100 text-red-300 cursor-not-allowed" : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"}`}
                          title={hasConflict ? "Исправьте конфликт времени" : "Сохранить"}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        {isFromAvail && (
                          <button
                            onClick={() => handleResetDay(day)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                            title="Сброс к шаблону"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline conflict warning block */}
                    {hasConflict && conflictingOther && (
                      <div className="mt-2 p-3 bg-red-100 border-l-4 border-red-500 rounded">
                        <p className="text-xs text-red-800 font-semibold">
                          ⚠️ Конфликт времени! {TYPE_META[conflictingOther.type].fullLabel} расписание: {conflictingOther.source.start} — {conflictingOther.source.end}
                          {conflictingOther.source.fromTemplate && " (шаблон)"}
                        </p>
                        <p className="text-xs text-red-700 mt-1">Измените время или отключите один из графиков</p>
                      </div>
                    )}

                    {/* Show other types' hours as info on non-conflicting active days */}
                    {!hasConflict && !isOff && otherSources.map(({ type, source }) => (
                      <p key={type} className={`text-xs mt-1 ${TYPE_META[type].text}`}>
                        {TYPE_META[type].emoji} {TYPE_META[type].fullLabel}: {source.start} — {source.end}
                        {source.fromTemplate && " (шаблон)"}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer buttons */}
          {!plannerLoading && (
            <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
              <button
                onClick={handleCopyWeek}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Копировать на след. неделю
              </button>
              <button
                onClick={handleSaveWeek}
                disabled={plannerSaving || plannerConflictDates.size > 0}
                title={plannerConflictDates.size > 0 ? `Исправьте ${plannerConflictDates.size} конфликта перед сохранением` : undefined}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all ${
                  plannerConflictDates.size > 0
                    ? "bg-red-400 cursor-not-allowed opacity-70"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl active:scale-95"
                }`}
              >
                {plannerSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : plannerConflictDates.size > 0 ? (
                  <><span>⛔</span> {plannerConflictDates.size} {plannerConflictDates.size === 1 ? "конфликт" : "конфликта"}</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Сохранить неделю</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: Постоянное ═══════════════════ */}
      {activeTab === "template" && (
        <div className="space-y-4">
          {/* Consultation type toggle with conflict badges */}
          {(() => {
            const tplConflictCount = getTemplateConflictWeekdays().length;
            return (
              <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 bg-white">
                {CONSULTATION_TYPES.map((type) => {
                  const meta = TYPE_META[type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setTemplateType(type)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                        templateType === type ? meta.active : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {meta.fullLabel}
                      {tplConflictCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold">⚠ {tplConflictCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <p className={`text-sm font-medium ${TYPE_META[templateType].text}`}>
            Шаблон повторяется каждую неделю. Конкретные даты из вкладки «По датам» имеют приоритет.
          </p>

          {templateLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
                const cell = getTemplateCell(weekday);
                const isActive = cell.is_active;
                const otherTemplateTypes = CONSULTATION_TYPES.filter((t) => t !== templateType);
                const conflictingOtherCell = isActive && cell.start_time && cell.end_time
                  ? otherTemplateTypes
                      .map((t) => ({ type: t, cell: templateData.find((row) => row.weekday === weekday && row.consultation_type === t) }))
                      .find(({ cell: otherCell }) =>
                        !!otherCell?.is_active && !!otherCell.start_time && !!otherCell.end_time &&
                        timesOverlap(cell.start_time!, cell.end_time!, otherCell.start_time, otherCell.end_time)
                      )
                  : undefined;
                const templateConflict = !!conflictingOtherCell;
                return (
                  <div
                    key={weekday}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      templateConflict
                        ? "border-red-500 bg-red-50"
                        : isActive
                        ? `${TYPE_META[templateType].border} ${TYPE_META[templateType].bg}`
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() =>
                          updateTemplateCell(weekday, { is_active: !isActive })
                        }
                        className={`flex-shrink-0 w-11 h-11 rounded-xl border-2 font-semibold text-xs transition-all ${
                          isActive
                            ? `${TYPE_META[templateType].border} ${TYPE_META[templateType].active}`
                            : "border-gray-300 bg-white text-gray-400"
                        }`}
                      >
                        {WEEKDAY_SHORT[weekday]}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800">
                          {WEEKDAY_LABELS[weekday]}
                        </span>
                        {!isActive && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Выходной
                          </p>
                        )}
                      </div>

                      {templateConflict && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                          ⚠ Конфликт
                        </span>
                      )}

                      {isActive && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="time"
                            value={cell.start_time || "09:00"}
                            step="900"
                            onChange={(e) =>
                              updateTemplateCell(weekday, {
                                start_time: e.target.value,
                              })
                            }
                            className={`w-28 px-2 py-1.5 rounded-lg border-2 focus:outline-none text-sm ${
                              templateConflict
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-indigo-400"
                            }`}
                          />
                          <span className="text-gray-300">—</span>
                          <input
                            type="time"
                            value={cell.end_time || "18:00"}
                            step="900"
                            onChange={(e) =>
                              updateTemplateCell(weekday, {
                                end_time: e.target.value,
                              })
                            }
                            className={`w-28 px-2 py-1.5 rounded-lg border-2 focus:outline-none text-sm ${
                              templateConflict
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-indigo-400"
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Inline conflict block for template */}
                    {conflictingOtherCell?.cell && (
                      <div className="mt-2 p-3 bg-red-100 border-l-4 border-red-500 rounded">
                        <p className="text-xs text-red-800 font-semibold">
                          ⚠️ Конфликт времени! {TYPE_META[conflictingOtherCell.type].fullLabel} расписание: {conflictingOtherCell.cell.start_time} — {conflictingOtherCell.cell.end_time}
                        </p>
                        <p className="text-xs text-red-700 mt-1">Измените время или отключите один из графиков</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Template global conflict banner */}
          {!templateLoading && (() => {
            const tplConflictCount = getTemplateConflictWeekdays().length;
            return tplConflictCount > 0 ? (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <p className="text-sm text-red-800 font-bold">⛔ Обнаружены конфликты расписания! ({tplConflictCount} дней)</p>
                <p className="text-xs text-red-700 mt-1">Исправьте конфликты перед сохранением.</p>
              </div>
            ) : null;
          })()}

          {!templateLoading && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveTemplate}
                disabled={templateSaving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-60"
              >
                {templateSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Сохранить шаблон
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: История ═══════════════════ */}
      {activeTab === "history" && (() => {
          const WEEKDAYS_RU = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
          const CONS_TYPE_RU: Record<string, string> = { online: "Видеоконсультация", offline: "Приём в клинике", mixed: "Гибкий формат" };

          const formatFieldValue = (key: string, val: unknown): string => {
            if (val === null || val === undefined) return "—";
            if (key === "date") {
              const d = new Date(String(val) + "T00:00:00");
              return d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            }
            if (key === "weekday") return WEEKDAYS_RU[Number(val)] ?? String(val);
            if (key === "is_day_off") return val ? "Выходной" : "Рабочий день";
            if (key === "is_active") return val ? "Включено" : "Отключено";
            if (key === "consultation_type") return CONS_TYPE_RU[String(val)] ?? String(val);
            if ((key === "start_time" || key === "end_time") && val) return String(val);
            return String(val);
          };

          const FIELD_LABELS: Record<string, string> = {
            date: "Дата",
            start_time: "Начало",
            end_time: "Конец",
            is_day_off: "Статус дня",
            is_active: "Активность",
            weekday: "День недели",
            consultation_type: "Тип",
            note: "Заметка",
          };

          const RELEVANT_KEYS = ["date","weekday","consultation_type","is_day_off","is_active","start_time","end_time","note"];

          const buildSummary = (entry: HistoryEntry): string => {
            const after = entry.after || {};
            const before = entry.before || {};
            const data = entry.action === "delete" ? before : after;

            if (entry.entity_type === "availability" && data.date) {
              const d = new Date(String(data.date) + "T00:00:00");
              const dateStr = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
              const type = data.consultation_type ? ` · ${CONS_TYPE_RU[String(data.consultation_type)] ?? ""}` : "";
              if (data.is_day_off) return `${dateStr}${type} — выходной`;
              if (data.start_time && data.end_time) return `${dateStr}${type} · ${String(data.start_time)} – ${String(data.end_time)}`;
              return dateStr + type;
            }
            if (entry.entity_type === "base" && data.weekday !== undefined) {
              const wd = WEEKDAYS_RU[Number(data.weekday)] ?? "";
              const type = data.consultation_type ? ` · ${CONS_TYPE_RU[String(data.consultation_type)] ?? ""}` : "";
              if (!data.is_active) return `${wd}${type} — отключён`;
              if (data.start_time && data.end_time) return `${wd}${type} · ${String(data.start_time)} – ${String(data.end_time)}`;
              return wd + type;
            }
            return "";
          };

          const ACTION_CONFIG = {
            create: { label: "Добавлено", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" },
            update: { label: "Изменено",  dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200",       bar: "bg-blue-500" },
            delete: { label: "Удалено",   dot: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-200",           bar: "bg-red-500" },
          };
          const ENTITY_CONFIG: Record<string, { label: string; icon: string }> = {
            availability: { label: "По датам",    icon: "📅" },
            base:         { label: "Шаблон",      icon: "🔄" },
            exception:    { label: "Исключение",  icon: "⚡" },
          };

          const totalPages = Math.ceil(historyData.length / HISTORY_PER_PAGE);
          const pagedHistory = historyData.slice(
            (historyPage - 1) * HISTORY_PER_PAGE,
            historyPage * HISTORY_PER_PAGE
          );

          return (
            <div className="space-y-3">
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">История изменений пуста</p>
                  <p className="text-xs text-gray-300 mt-1">Здесь появятся все правки расписания</p>
                </div>
              ) : (
                pagedHistory.map((entry) => {
                  const ac = ACTION_CONFIG[entry.action as keyof typeof ACTION_CONFIG] ?? ACTION_CONFIG.update;
                  const ec = ENTITY_CONFIG[entry.entity_type] ?? { label: entry.entity_type, icon: "📋" };
                  const summary = buildSummary(entry);
                  const changedAt = new Date(entry.changed_at).toLocaleString("ru-RU", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  });

                  const changedFields = entry.before && entry.after
                    ? RELEVANT_KEYS.filter(k =>
                        String((entry.before as any)[k] ?? "") !== String((entry.after as any)[k] ?? "") &&
                        ((entry.before as any)[k] !== undefined || (entry.after as any)[k] !== undefined)
                      )
                    : RELEVANT_KEYS.filter(k =>
                        entry.action === "delete"
                          ? (entry.before as any)?.[k] !== undefined
                          : (entry.after as any)?.[k] !== undefined
                      );

                  return (
                    <div key={entry.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {/* Color accent bar */}
                      <div className={`h-1 w-full ${ac.bar}`} />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Action dot */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${ac.bar} bg-opacity-10`}
                              style={{ background: ac.bar.includes("emerald") ? "#ecfdf5" : ac.bar.includes("red") ? "#fef2f2" : "#eff6ff" }}>
                              <span className={`w-2.5 h-2.5 rounded-full ${ac.dot}`} style={{ display: "block" }} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${ac.badge}`}>{ac.label}</span>
                                <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                                  {ec.icon} {ec.label}
                                </span>
                              </div>
                              {summary && (
                                <p className="text-sm font-semibold text-gray-800 mt-1.5 leading-snug">{summary}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-400 whitespace-nowrap">{changedAt}</p>
                            {entry.changed_by_name && (
                              <p className="text-xs text-gray-500 mt-0.5 font-medium">{entry.changed_by_name}</p>
                            )}
                          </div>
                        </div>

                        {/* Changes grid */}
                        {changedFields.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                            {changedFields.map((key) => {
                              const beforeVal = (entry.before as any)?.[key];
                              const afterVal = (entry.after as any)?.[key];
                              const label = FIELD_LABELS[key] ?? key;
                              const isDelete = entry.action === "delete";
                              const isCreate = entry.action === "create";

                              return (
                                <div key={key} className="flex items-center gap-3">
                                  <span className="text-xs font-semibold text-gray-400 w-24 flex-shrink-0">{label}</span>
                                  {isDelete ? (
                                    <span className="text-xs text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 line-through">
                                      {formatFieldValue(key, beforeVal)}
                                    </span>
                                  ) : isCreate ? (
                                    <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                      {formatFieldValue(key, afterVal)}
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200 line-through">
                                        {formatFieldValue(key, beforeVal)}
                                      </span>
                                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                      <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                        {formatFieldValue(key, afterVal)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Pagination */}
              {!historyLoading && totalPages > 1 && (
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm">
                  <span className="text-xs text-gray-400">
                    {(historyPage - 1) * HISTORY_PER_PAGE + 1}–{Math.min(historyPage * HISTORY_PER_PAGE, historyData.length)} из {historyData.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - historyPage) <= 1) {
                        return (
                          <button
                            key={page}
                            onClick={() => setHistoryPage(page)}
                            className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all border ${
                              page === historyPage
                                ? "text-white border-indigo-600 bg-indigo-600 shadow-md"
                                : "border-gray-200 text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === 2 && historyPage > 3) {
                        return <span key={page} className="text-gray-300 text-xs px-1">···</span>;
                      } else if (page === totalPages - 1 && historyPage < totalPages - 2) {
                        return <span key={page} className="text-gray-300 text-xs px-1">···</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                      disabled={historyPage === totalPages}
                      className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}
