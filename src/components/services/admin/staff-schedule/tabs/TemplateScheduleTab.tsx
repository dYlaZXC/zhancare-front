"use client";

import { Home, Video } from "lucide-react";
import { DEFAULT_WEEKDAYS } from "../types/scheduleTypes";
import type { DaySchedule } from "../types/scheduleTypes";

// ── TemplateScheduleTab ("Постоянное") — reads/writes the weekly DoctorSchedule
// pattern. Date-specific DoctorAvailability entries (DateScheduleTab) still
// take priority over this at display/slot time; this tab only edits the
// recurring weekday template.

export function TemplateScheduleTab({
  scheduleType,
  onScheduleTypeChange,
  getCurrentOnlineSchedule,
  getCurrentOfflineSchedule,
  getScheduleConflict,
  getConflictDays,
  onToggleOnlineDay,
  onToggleOfflineDay,
  onUpdateOnlineDayTime,
  onUpdateOfflineDayTime,
}: {
  scheduleType: "online" | "offline";
  onScheduleTypeChange: (t: "online" | "offline") => void;
  getCurrentOnlineSchedule: () => Record<string, DaySchedule>;
  getCurrentOfflineSchedule: () => Record<string, DaySchedule>;
  getScheduleConflict: (day: string) => boolean;
  getConflictDays: () => string[];
  onToggleOnlineDay: (day: string) => void;
  onToggleOfflineDay: (day: string) => void;
  onUpdateOnlineDayTime: (day: string, field: "start" | "end", value: string) => void;
  onUpdateOfflineDayTime: (day: string, field: "start" | "end", value: string) => void;
}) {
  return (
    <>
      {/* Online/Offline Tab Switcher */}
      <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200">
        <button
          type="button"
          onClick={() => onScheduleTypeChange("online")}
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
          onClick={() => onScheduleTypeChange("offline")}
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
                      ? onToggleOnlineDay(day.value)
                      : onToggleOfflineDay(day.value)
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
                            ? onUpdateOnlineDayTime(day.value, "start", e.target.value)
                            : onUpdateOfflineDayTime(day.value, "start", e.target.value)
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
                            ? onUpdateOnlineDayTime(day.value, "end", e.target.value)
                            : onUpdateOfflineDayTime(day.value, "end", e.target.value)
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
    </>
  );
}
