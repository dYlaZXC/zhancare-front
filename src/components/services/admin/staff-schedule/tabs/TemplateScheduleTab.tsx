"use client";

import { DEFAULT_WEEKDAYS, CONSULTATION_TYPES } from "../types/scheduleTypes";
import type { DaySchedule, ConsultationType } from "../types/scheduleTypes";
import { TYPE_META } from "../utils/typeDisplay";

// ── TemplateScheduleTab ("Постоянное") — reads/writes the weekly DoctorSchedule
// pattern. Date-specific DoctorAvailability entries (DateScheduleTab) still
// take priority over this at display/slot time; this tab only edits the
// recurring weekday template.

export function TemplateScheduleTab({
  scheduleType,
  onScheduleTypeChange,
  getCurrentSchedule,
  getScheduleConflict,
  getConflictDays,
  onToggleDay,
  onUpdateDayTime,
}: {
  scheduleType: ConsultationType;
  onScheduleTypeChange: (t: ConsultationType) => void;
  getCurrentSchedule: (type: ConsultationType) => Record<string, DaySchedule>;
  getScheduleConflict: (type: ConsultationType, day: string) => boolean;
  getConflictDays: (type: ConsultationType) => string[];
  onToggleDay: (type: ConsultationType, day: string) => void;
  onUpdateDayTime: (type: ConsultationType, day: string, field: "start" | "end", value: string) => void;
}) {
  const current = TYPE_META[scheduleType];
  const otherTypes = CONSULTATION_TYPES.filter((t) => t !== scheduleType);

  return (
    <>
      {/* Consultation type tab switcher */}
      <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200">
        {CONSULTATION_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const isSelected = scheduleType === type;
          const enabledCount = Object.values(getCurrentSchedule(type)).filter((d) => d.enabled).length;
          const conflictCount = getConflictDays(type).length;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onScheduleTypeChange(type)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                isSelected ? meta.active : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{meta.fullLabel}</span>
              {enabledCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    isSelected ? meta.badgeActive : meta.badgeInactive
                  }`}
                >
                  {enabledCount}
                </span>
              )}
              {conflictCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold">
                  ⚠ {conflictCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule Days */}
      <div className={`space-y-3 p-4 rounded-2xl ${current.bgSoft}`}>
        <p className={`text-sm font-medium mb-2 ${current.text}`}>
          Настройте расписание для формата «{current.fullLabel}»
        </p>
        {DEFAULT_WEEKDAYS.map((day) => {
          const currentDaySchedule = getCurrentSchedule(scheduleType);
          const hasConflict = getScheduleConflict(scheduleType, day.value);
          // Among the other two types, show info for whichever has hours set
          // on this day (there's normally at most one, since overlapping
          // configuration across types on the same day is itself a conflict).
          const otherWithHours = otherTypes
            .map((t) => ({ type: t, sched: getCurrentSchedule(t)[day.value] }))
            .find((o) => o.sched?.enabled);
          const otherTime = otherWithHours
            ? `${otherWithHours.sched.start} - ${otherWithHours.sched.end}`
            : "";

          return (
            <div
              key={day.value}
              className={`rounded-xl border-2 p-4 transition-all bg-white ${
                hasConflict
                  ? "border-red-500 bg-red-50"
                  : currentDaySchedule[day.value]?.enabled
                  ? `${current.border} ${current.bg}`
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onToggleDay(scheduleType, day.value)}
                  className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all font-semibold text-sm ${
                    hasConflict
                      ? "border-red-500 bg-red-500 text-white"
                      : currentDaySchedule[day.value]?.enabled
                      ? `${current.border} ${current.active}`
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
                  {otherWithHours && !currentDaySchedule[day.value]?.enabled && (
                    <p className={`text-xs mt-1 ${TYPE_META[otherWithHours.type].text}`}>
                      {TYPE_META[otherWithHours.type].emoji} {TYPE_META[otherWithHours.type].fullLabel}: {otherTime}
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
                        onChange={(e) => onUpdateDayTime(scheduleType, day.value, "start", e.target.value)}
                        step="900"
                        className={`w-32 px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors text-sm ${
                          hasConflict ? "border-red-300 focus:border-red-500" : `border-gray-300 ${current.focusBorder}`
                        }`}
                      />
                    </div>
                    <div className="text-gray-400 pt-5">—</div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">До</label>
                      <input
                        type="time"
                        value={currentDaySchedule[day.value]?.end || "18:00"}
                        onChange={(e) => onUpdateDayTime(scheduleType, day.value, "end", e.target.value)}
                        step="900"
                        className={`w-32 px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors text-sm ${
                          hasConflict ? "border-red-300 focus:border-red-500" : `border-gray-300 ${current.focusBorder}`
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
              {hasConflict && (
                <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-500 rounded">
                  <p className="text-xs text-red-800 font-semibold">
                    ⚠️ Конфликт времени! {otherWithHours ? TYPE_META[otherWithHours.type].fullLabel : "Другой формат"} расписание:{" "}
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
      {getConflictDays(scheduleType).length > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
          <p className="text-sm text-red-800 font-bold">
            ⛔ Обнаружены конфликты расписания! ({getConflictDays(scheduleType).length} дней)
          </p>
          <p className="text-xs text-red-700 mt-1">
            Исправьте конфликты перед сохранением.
          </p>
        </div>
      )}
    </>
  );
}
