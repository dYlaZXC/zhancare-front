"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Calendar,
  RotateCcw,
  History,
  Video,
  Home,
  CheckCircle,
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConsultationType = "online" | "offline";
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
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerSaving, setPlannerSaving] = useState(false);
  const [plannerDirty, setPlannerDirty] = useState(false);

  // ── "Постоянное" tab state ──
  const [templateData, setTemplateData] = useState<TemplateEntry[]>([]);
  const [templateType, setTemplateType] = useState<ConsultationType>("online");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);

  // ── "История" tab state ──
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Load week ──────────────────────────────────────────────────────────────
  const fetchWeek = useCallback(
    async (weekStart: string, cType: ConsultationType) => {
      setPlannerLoading(true);
      try {
        const { data } = await api.get("/user-profile/availability/", {
          params: { week_start: weekStart, consultation_type: cType },
        });
        setPlannerDays(
          Array.isArray(data) && data.length > 0
            ? data
            : buildDefaultWeek(weekStart)
        );
        setPlannerDirty(false);
      } catch {
        setPlannerDays(buildDefaultWeek(weekStart));
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
    }
  }, [activeTab, fetchHistory]);

  if (!user) return null;

  // ── Week navigation ────────────────────────────────────────────────────────
  const handleWeekNav = async (offset: number) => {
    // Auto-save dirty week
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
      toast.success("Неделя скопирована");
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
      {/* Header Banner */}
      <div
        className="relative rounded-3xl shadow-2xl p-8 text-white overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3772ff 0%, #29358f 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="relative flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Мое расписание</h1>
            <p className="text-blue-100">
              Управление расписанием и просмотр истории изменений
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5">
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === key
                ? "text-white shadow-md"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            style={
              activeTab === key
                ? {
                    background:
                      "linear-gradient(135deg, #3772ff 0%, #29358f 100%)",
                  }
                : {}
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB: По датам ═══════════════════ */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          {/* Online / Offline toggle */}
          <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 bg-white">
            <button
              onClick={() => handleTypeChange("online")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                plannerType === "online"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Video className="w-4 h-4" /> Онлайн
            </button>
            <button
              onClick={() => handleTypeChange("offline")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                plannerType === "offline"
                  ? "bg-purple-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Home className="w-4 h-4" /> Оффлайн
            </button>
          </div>

          {/* Week navigation */}
          <div className="flex items-center justify-between bg-indigo-50 border-2 border-indigo-100 rounded-2xl px-4 py-3">
            <button
              onClick={() => handleWeekNav(-1)}
              className="p-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <span className="text-base">📅</span>
              {formatWeekLabel(plannerWeekStart)}
              {isCurrentWeek(plannerWeekStart) && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Текущая
                </span>
              )}
              {plannerDirty && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  Изменено
                </span>
              )}
            </div>
            <button
              onClick={() => handleWeekNav(1)}
              className="p-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition-all"
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

                return (
                  <div
                    key={day.date}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      isOff
                        ? "border-gray-200 bg-gray-50"
                        : plannerType === "online"
                        ? "border-blue-300 bg-blue-50"
                        : "border-purple-300 bg-purple-50"
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
                            ? plannerType === "online"
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-purple-500 bg-purple-500 text-white"
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
                            className="w-28 px-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm"
                          />
                          <span className="text-gray-300">—</span>
                          <input
                            type="time"
                            value={day.end_time || "18:00"}
                            step="900"
                            onChange={(e) =>
                              updateDay(i, { end_time: e.target.value })
                            }
                            className="w-28 px-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm"
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveDay(day)}
                          className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors"
                          title="Сохранить"
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
                disabled={plannerSaving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, #3772ff 0%, #29358f 100%)",
                }}
              >
                {plannerSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Сохранить неделю
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: Постоянное ═══════════════════ */}
      {activeTab === "template" && (
        <div className="space-y-4">
          {/* Online / Offline toggle */}
          <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 bg-white">
            <button
              onClick={() => setTemplateType("online")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                templateType === "online"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Video className="w-4 h-4" /> Онлайн
            </button>
            <button
              onClick={() => setTemplateType("offline")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                templateType === "offline"
                  ? "bg-purple-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Home className="w-4 h-4" /> Оффлайн
            </button>
          </div>

          <p className={`text-sm font-medium ${templateType === "online" ? "text-blue-600" : "text-purple-600"}`}>
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
                return (
                  <div
                    key={weekday}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      isActive
                        ? templateType === "online"
                          ? "border-blue-300 bg-blue-50"
                          : "border-purple-300 bg-purple-50"
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
                            ? templateType === "online"
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-purple-500 bg-purple-500 text-white"
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
                            className="w-28 px-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm"
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
                            className="w-28 px-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!templateLoading && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveTemplate}
                disabled={templateSaving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, #3772ff 0%, #29358f 100%)",
                }}
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
      {activeTab === "history" && (
        <div className="space-y-3">
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            </div>
          ) : historyData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">История изменений пуста</p>
            </div>
          ) : (
            historyData.map((entry) => {
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
                entry.entity_type === "base"
                  ? "Шаблон"
                  : entry.entity_type === "availability"
                  ? "По датам"
                  : "Исключение";
              const changedAt = new Date(entry.changed_at).toLocaleString(
                "ru-RU",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border-2 ${actionColor}`}
                >
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${actionColor}`}
                      >
                        {actionLabel}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entityLabel}
                      </span>
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
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          До
                        </p>
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
                              <span className="text-gray-400">{k}:</span>{" "}
                              {String(v)}
                            </p>
                          ))}
                      </div>
                    )}
                    {entry.after && (
                      <div className="bg-white/60 rounded-lg p-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          После
                        </p>
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
                              <span className="text-gray-400">{k}:</span>{" "}
                              {String(v)}
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
  );
}
