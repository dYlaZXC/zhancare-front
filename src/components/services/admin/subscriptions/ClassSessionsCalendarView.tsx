"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import {
  Calendar as CalendarIcon,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Users,
  Users2,
} from "lucide-react";
import { getWeekDays, toLocalDateStr, formatDate } from "../schedule/utils/calendarUtils";
import { CreateClassSessionModal } from "./CreateClassSessionModal";
import { ClassSessionGenerateModal } from "./ClassSessionGenerateModal";
import { ClassSessionDetailModal } from "./ClassSessionDetailModal";
import { AddParticipantModal } from "./AddParticipantModal";

type ViewMode = "week" | "month" | "day";

const STATUS: Record<string, { label: string; cls: string; bar: string }> = {
  scheduled: { label: "Запланировано", cls: "text-blue-600 bg-blue-50", bar: "#3772ff" },
  in_progress: { label: "Идёт", cls: "text-amber-600 bg-amber-50", bar: "#f59e0b" },
  completed: { label: "Завершено", cls: "text-emerald-600 bg-emerald-50", bar: "#10b981" },
  cancelled: { label: "Отменено", cls: "text-red-500 bg-red-50", bar: "#ef4444" },
};
const statusOf = (s: string) => STATUS[s] || { label: s, cls: "text-gray-600 bg-gray-100", bar: "#9ca3af" };

const WEEKDAYS = [
  { full: "Понедельник", short: "Пн" },
  { full: "Вторник", short: "Вт" },
  { full: "Среда", short: "Ср" },
  { full: "Четверг", short: "Чт" },
  { full: "Пятница", short: "Пт" },
  { full: "Суббота", short: "Сб" },
  { full: "Воскресенье", short: "Вс" },
];

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const dateKeyOf = (iso: string) => toLocalDateStr(new Date(iso));
const instructorsOf = (s: any) => (s.instructors || []).map((i: any) => i.instructor_name).join(", ");

// The 42-day (6-week) grid the month view renders, Monday-first.
function getMonthGrid(currentDate: Date): Date[][] {
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const start = new Date(first);
  const dow = first.getDay();
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      return date;
    })
  );
}

function SessionCard({ s, onClick, compact }: { s: any; onClick: () => void; compact?: boolean }) {
  const st = statusOf(s.status);
  const full = s.capacity && s.booked_count >= s.capacity;
  return (
    <motion.div
      whileHover={{ y: -1, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}
      initial={{ boxShadow: "0 0 0 0 rgb(0 0 0 / 0)" }}
      onClick={onClick}
      className={`rounded-xl border cursor-pointer overflow-hidden bg-white ${s.status === "cancelled" ? "opacity-60" : ""}`}
      style={{ borderColor: "#f9a8d4" }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: st.bar }} />
      <div className={compact ? "p-2" : "p-2.5 md:p-3"}>
        <div className={`flex items-center justify-between gap-1 ${compact ? "mb-1" : "mb-1.5"}`}>
          <div className="flex items-center gap-1 min-w-0">
            <div className={`${compact ? "w-5 h-5" : "w-6 h-6"} rounded-lg flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: "#fce7f3" }}>
              <Users2 className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} style={{ color: "#db2777" }} />
            </div>
            <span className={`${compact ? "text-xs" : "text-xs md:text-sm"} font-bold`} style={{ color: "#db2777" }}>
              {timeOf(s.starts_at)}
            </span>
          </div>
          <span className={`flex items-center gap-0.5 text-[10px] font-bold flex-shrink-0 ${full ? "text-red-500" : "text-gray-500"}`}>
            <Users className="w-3 h-3" /> {s.booked_count}/{s.capacity}
          </span>
        </div>
        <p className={`${compact ? "text-[11px]" : "text-xs md:text-sm"} font-semibold truncate`} style={{ color: "#1e263e" }}>
          {s.service_name}
        </p>
        {instructorsOf(s) && <p className="text-[10px] text-gray-400 truncate mt-0.5">{instructorsOf(s)}</p>}
      </div>
    </motion.div>
  );
}

export default function ClassSessionsCalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createDate, setCreateDate] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [addingParticipant, setAddingParticipant] = useState(false);

  const currentKey = toLocalDateStr(currentDate);
  const todayKey = toLocalDateStr(new Date());

  // Visible date range for the current view — what we ask the API for.
  const [rangeFrom, rangeTo] = useMemo(() => {
    if (viewMode === "day") return [currentKey, currentKey];
    if (viewMode === "week") {
      const days = getWeekDays(currentDate);
      return [toLocalDateStr(days[0]), toLocalDateStr(days[6])];
    }
    const grid = getMonthGrid(currentDate);
    return [toLocalDateStr(grid[0][0]), toLocalDateStr(grid[5][6])];
  }, [viewMode, currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/subscriptions/class-sessions/", {
        params: { date_from: rangeFrom, date_to: rangeTo },
      });
      setSessions(data.results || data);
    } catch (err: any) {
      console.error("Failed to load class sessions:", err);
      setError(err.response?.data?.error || err.message || "Не удалось загрузить занятия");
    } finally {
      setLoading(false);
    }
  }, [rangeFrom, rangeTo]);

  useEffect(() => { load(); }, [load]);

  const byDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of sessions) (map[dateKeyOf(s.starts_at)] ||= []).push(s);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return map;
  }, [sessions]);
  const sessionsOn = (key: string) => byDate[key] || [];

  const openDetail = async (id: number) => {
    try {
      const { data } = await api.get(`/subscriptions/class-sessions/${id}/`);
      setDetail(data);
    } catch (err) {
      console.error("Failed to load class session:", err);
    }
  };
  const reloadDetail = async () => {
    if (detail) await openDetail(detail.id);
    load();
  };

  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir, 1);
    setCurrentDate(d);
  };

  const openDay = (key: string) => {
    setCurrentDate(new Date(key + "T00:00:00"));
    setViewMode("day");
  };

  const rangeLabel = (() => {
    if (viewMode === "day")
      return currentDate.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    if (viewMode === "week") {
      const days = getWeekDays(currentDate);
      return `${formatDate(days[0])} - ${formatDate(days[6])}`;
    }
    return currentDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  })();

  // ─── Week ────────────────────────────────────────────────────────────────
  const renderWeek = () => {
    const days = getWeekDays(currentDate);
    const keys = days.map(toLocalDateStr);
    const selected = keys.includes(currentKey) ? currentKey : keys.includes(todayKey) ? todayKey : keys[0];
    const selectedDay = days[keys.indexOf(selected)];
    const selectedSessions = sessionsOn(selected);

    return (
      <>
        {/* Compact: day-picker strip + single-day list (below xl) */}
        <div className="xl:hidden flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex gap-1.5">
            {days.map((day, i) => {
              const key = keys[i];
              const isSel = key === selected;
              const count = sessionsOn(key).length;
              return (
                <button
                  key={key}
                  onClick={() => setCurrentDate(day)}
                  className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl border transition-all ${
                    isSel
                      ? "text-white border-transparent shadow-md"
                      : key === todayKey
                      ? "bg-blue-50 text-blue-600 border-blue-300"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                  style={isSel ? { background: "linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)" } : undefined}
                >
                  <span className={`text-[9px] sm:text-[10px] font-semibold uppercase ${isSel ? "opacity-80" : "opacity-50"}`}>
                    {WEEKDAYS[i].short}
                  </span>
                  <span className="text-sm sm:text-base font-bold mt-0.5">{day.getDate()}</span>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${count > 0 ? "opacity-100" : "opacity-0"} ${isSel ? "bg-white" : "bg-pink-500"}`} />
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-gray-800 capitalize">
              {selectedDay.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <button
              onClick={() => setCreateDate(selected)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors text-xs text-gray-500 hover:text-blue-600"
            >
              <Plus className="w-3 h-3" /> Занятие
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {selectedSessions.length > 0 ? (
              selectedSessions.map((s) => <SessionCard key={s.id} s={s} onClick={() => openDetail(s.id)} />)
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-300 select-none py-12">
                <CalendarIcon className="w-14 h-14 opacity-30" />
                <p className="text-sm font-medium">Нет занятий на этот день</p>
              </div>
            )}
          </div>
        </div>

        {/* Full: 7 columns (xl+) */}
        <div className="hidden xl:grid flex-1 min-h-0 grid-cols-7 gap-3">
          {days.map((day, i) => {
            const key = keys[i];
            const isToday = key === todayKey;
            const list = sessionsOn(key);
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-3 border-2 flex flex-col min-h-0 ${isToday ? "border-blue-500 bg-blue-50/30" : "border-gray-200 bg-white"}`}
              >
                <div className="flex-shrink-0 mb-3 pb-2 border-b-2 border-gray-200">
                  <button type="button" onClick={() => openDay(key)} className="block w-full text-left group">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">{WEEKDAYS[i].short}</div>
                    <div className={`text-xl font-bold mt-0.5 group-hover:underline ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                      {day.getDate()}
                    </div>
                  </button>
                  <button
                    onClick={() => setCreateDate(key)}
                    className="mt-1.5 w-full py-1 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 text-[10px] text-gray-600 hover:text-blue-600"
                  >
                    <Plus className="w-3 h-3" /> Добавить
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5">
                  {list.length > 0 ? (
                    list.map((s) => <SessionCard key={s.id} s={s} compact onClick={() => openDetail(s.id)} />)
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-300 select-none py-8">
                      <CalendarIcon className="w-8 h-8 opacity-40" />
                      <p className="text-[10px] font-medium">Нет занятий</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </>
    );
  };

  // ─── Month ───────────────────────────────────────────────────────────────
  const renderMonth = () => {
    const month = currentDate.getMonth();
    const grid = getMonthGrid(currentDate);
    return (
      <div className="flex flex-col">
        <div className="grid grid-cols-7 border-b-2 border-gray-300 bg-gray-50 rounded-t-2xl md:rounded-t-3xl">
          {WEEKDAYS.map((d) => (
            <div key={d.full} className="p-1.5 md:p-4 text-center text-[10px] md:text-sm font-bold text-gray-700">
              <span className="hidden md:inline">{d.full}</span>
              <span className="md:hidden">{d.short}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-rows-6 bg-white rounded-b-2xl md:rounded-b-3xl border-2 border-gray-200">
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
              {week.map((date) => {
                const key = toLocalDateStr(date);
                const list = sessionsOn(key);
                const isToday = key === todayKey;
                const inMonth = date.getMonth() === month;
                return (
                  <div
                    key={key}
                    onClick={() => openDay(key)}
                    className={`border-r border-gray-200 last:border-r-0 p-1 md:p-2 min-h-[80px] md:min-h-[120px] cursor-pointer hover:bg-blue-50/30 transition-colors ${
                      !inMonth ? "bg-gray-50/50" : "bg-white"
                    } ${isToday ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-semibold ${
                            isToday ? "bg-blue-600 text-white" : inMonth ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {list.length > 0 && (
                          <span className="inline-flex items-center justify-center h-4 md:h-5 px-1 md:px-1.5 rounded-full text-[9px] md:text-[10px] font-bold bg-pink-50 text-pink-600">
                            {list.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCreateDate(key); }}
                        className="p-0.5 md:p-1 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Создать занятие"
                      >
                        <Plus className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1">
                      {list.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          onClick={(e) => { e.stopPropagation(); openDetail(s.id); }}
                          className={`flex items-center gap-1 px-1 md:px-1.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[9px] md:text-[11px] font-semibold hover:shadow-sm transition-shadow ${
                            s.status === "cancelled" ? "line-through opacity-60" : ""
                          }`}
                          style={{ backgroundColor: "#fce7f3", color: "#db2777" }}
                          title={`${timeOf(s.starts_at)} ${s.service_name} · ${s.booked_count}/${s.capacity}`}
                        >
                          <span className="font-bold flex-shrink-0">{timeOf(s.starts_at)}</span>
                          <span className="hidden md:inline truncate opacity-90">{s.service_name}</span>
                        </div>
                      ))}
                      {list.length > 3 && (
                        <div className="text-[10px] md:text-xs text-gray-500 font-medium pl-0.5 md:pl-1">+{list.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Day ─────────────────────────────────────────────────────────────────
  const renderDay = () => {
    const list = sessionsOn(currentKey);
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          На этот день занятий не запланировано
          <div className="mt-4">
            <button
              onClick={() => setCreateDate(currentKey)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors text-xs text-gray-500 hover:text-blue-600"
            >
              <Plus className="w-3 h-3" /> Создать занятие
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-2 overflow-y-auto">
        {list.map((s) => {
          const st = statusOf(s.status);
          return (
            <button
              key={s.id}
              onClick={() => openDetail(s.id)}
              className="w-full flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 md:px-5 py-4 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="text-center w-14 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{timeOf(s.starts_at)}</p>
                  {s.ends_at && <p className="text-[10px] text-gray-400">{timeOf(s.ends_at)}</p>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.service_name}</p>
                  <p className="text-xs text-gray-400 truncate">{instructorsOf(s)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                  <Users className="w-3.5 h-3.5" /> {s.booked_count}/{s.capacity}
                </span>
                <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="mb-3 md:mb-6">
        <div className="flex items-center justify-between gap-2 mb-3 md:mb-5">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight truncate" style={{ color: "#1e263e" }}>
              Групповые занятия
            </h1>
            <p className="hidden sm:block text-xs md:text-sm text-gray-500 mt-0.5 truncate">
              Расписание занятий по абонементам, участники и посещаемость
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 px-2.5 md:px-4 py-2 md:py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all whitespace-nowrap shadow-sm"
            >
              <CalendarRange className="w-4 h-4" />
              <span className="hidden sm:inline">Сгенерировать</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateDate(viewMode === "day" ? currentKey : todayKey)}
              className="flex items-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)" }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Создать занятие</span>
              <span className="sm:hidden">Создать</span>
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0">
            {([["week", "Неделя"], ["month", "Месяц"], ["day", "День"]] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  viewMode === mode ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-xl text-white whitespace-nowrap flex-shrink-0"
              style={{ backgroundColor: "#3772ff" }}
            >
              Сегодня
            </motion.button>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white flex-1 min-w-0">
              <motion.button whileHover={{ backgroundColor: "#f3f4f6" }} whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)} className="p-2 flex-shrink-0">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </motion.button>
              <div className="flex items-center gap-1.5 px-2 py-2 min-w-0 font-semibold text-xs md:text-sm border-x border-gray-200 truncate" style={{ color: "#1e263e" }}>
                <CalendarIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="capitalize truncate">{rangeLabel}</span>
              </div>
              <motion.button whileHover={{ backgroundColor: "#f3f4f6" }} whileTap={{ scale: 0.95 }} onClick={() => navigate(1)} className="p-2 flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: "#3772ff" }} />
          <span className="text-lg font-medium text-gray-600">Загрузка занятий...</span>
        </div>
      ) : error ? (
        <div className="rounded-3xl p-6 flex items-center gap-4 border-2 mb-8" style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", borderColor: "#fbbf24" }}>
          <AlertCircle className="w-7 h-7 text-amber-700 flex-shrink-0" />
          <p className="text-amber-800 text-sm">{error}</p>
        </div>
      ) : (
        <div className={`relative flex flex-col ${viewMode === "month" ? "flex-1 overflow-y-auto" : "flex-1 min-h-0"} ${loading ? "opacity-60 pointer-events-none" : ""}`}>
          {viewMode === "week" && renderWeek()}
          {viewMode === "month" && renderMonth()}
          {viewMode === "day" && renderDay()}
        </div>
      )}

      {createDate && (
        <CreateClassSessionModal
          defaultDate={createDate}
          onClose={() => setCreateDate(null)}
          onCreated={() => { setCreateDate(null); load(); }}
        />
      )}
      {showGenerate && (
        <ClassSessionGenerateModal onClose={() => setShowGenerate(false)} onGenerated={load} />
      )}
      {detail && (
        <>
          <ClassSessionDetailModal
            session={detail}
            onClose={() => setDetail(null)}
            onUpdated={reloadDetail}
            onAddParticipant={() => setAddingParticipant(true)}
          />
          {addingParticipant && (
            <AddParticipantModal
              classSessionId={detail.id}
              onClose={() => setAddingParticipant(false)}
              onAdded={() => { setAddingParticipant(false); reloadDetail(); }}
            />
          )}
        </>
      )}
    </div>
  );
}
