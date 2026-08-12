"use client";

import { CheckCircle, Home, Loader2, RotateCcw, Video } from "lucide-react";
import { formatWeekLabel, isCurrentWeekPlanner } from "../utils/dateHelpers";

// ── DateScheduleTab ("По датам") — reads/writes DoctorAvailability rows ────────
// Date-specific entries always take priority over the weekly template; this
// tab surfaces that via the "из шаблона" label and the save/reset actions.

export function DateScheduleTab({
  plannerWeekStart,
  plannerConsultationType,
  plannerDays,
  plannerOtherDays,
  plannerLoading,
  plannerConflictCount,
  getPlannerDayConflict,
  onTypeChange,
  onWeekNav,
  onUpdateDay,
  onSaveDay,
  onDeleteDay,
}: {
  plannerWeekStart: string;
  plannerConsultationType: "online" | "offline";
  plannerDays: any[];
  plannerOtherDays: any[];
  plannerLoading: boolean;
  plannerConflictCount: number;
  getPlannerDayConflict: (index: number) => { hasConflict: boolean; otherTime: string };
  onTypeChange: (cType: "online" | "offline") => void;
  onWeekNav: (offset: number) => void;
  onUpdateDay: (index: number, changes: Partial<any>) => void;
  onSaveDay: (day: any) => void;
  onDeleteDay: (day: any) => void;
}) {
  return (
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
          onClick={() => onTypeChange("online")}
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
          onClick={() => onTypeChange("offline")}
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
          onClick={() => onWeekNav(-1)}
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
          onClick={() => onWeekNav(1)}
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
                      onUpdateDay(i, {
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
                          onUpdateDay(i, { start_time: e.target.value })
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
                          onUpdateDay(i, { end_time: e.target.value })
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
                      onClick={() => onSaveDay(day)}
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
                        onClick={() => onDeleteDay(day)}
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
  );
}
