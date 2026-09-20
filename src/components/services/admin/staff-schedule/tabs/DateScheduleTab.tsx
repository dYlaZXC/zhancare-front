"use client";

import { useState } from "react";
import { CheckCircle, Loader2, RotateCcw, Plus } from "lucide-react";
import { formatWeekLabel, isCurrentWeekPlanner } from "../utils/dateHelpers";
import { TYPE_META } from "../utils/typeDisplay";
import { CONSULTATION_TYPES } from "../types/scheduleTypes";
import type { ConsultationType, DoctorRoomOverrideRow, AvailableRoom } from "../types/scheduleTypes";
import { RoomBandRow } from "../components/RoomBandRow";

// ── DateScheduleTab ("По датам") — reads/writes DoctorAvailability rows ────────
// Date-specific entries always take priority over the weekly template; this
// tab surfaces that via the "из шаблона" label and the save/reset actions.
//
// When a date isn't a day-off and is offline/mixed, it also shows a
// "Кабинеты" sub-section — that date's DoctorRoomOverride bands, editable
// inline. Independent of the day's own start/end above (a room override
// can cover a narrower or entirely different window than the working
// hours) — this is the genuinely flexible, per-date-per-time layer on top
// of the recurring weekly template in TemplateScheduleTab.

export function DateScheduleTab({
  plannerWeekStart,
  plannerConsultationType,
  plannerDays,
  plannerOtherDaysByType,
  plannerLoading,
  plannerConflictCount,
  getPlannerDayConflict,
  onTypeChange,
  onWeekNav,
  onUpdateDay,
  onSaveDay,
  onDeleteDay,
  roomOverrides,
  availableRooms,
  onAddRoomOverride,
  onUpdateRoomOverride,
  onDeleteRoomOverride,
}: {
  plannerWeekStart: string;
  plannerConsultationType: ConsultationType;
  plannerDays: any[];
  plannerOtherDaysByType: Partial<Record<ConsultationType, any[]>>;
  plannerLoading: boolean;
  plannerConflictCount: number;
  getPlannerDayConflict: (index: number) => { hasConflict: boolean; otherType?: ConsultationType; otherTime: string };
  onTypeChange: (cType: ConsultationType) => void;
  onWeekNav: (offset: number) => void;
  onUpdateDay: (index: number, changes: Partial<any>) => void;
  onSaveDay: (day: any) => void;
  onDeleteDay: (day: any) => void;
  roomOverrides: DoctorRoomOverrideRow[];
  availableRooms: AvailableRoom[];
  onAddRoomOverride: (date: string, roomId: number | null, startTime: string, endTime: string) => Promise<void>;
  onUpdateRoomOverride: (id: number, changes: { room_id?: number | null; start_time?: string; end_time?: string }) => Promise<void>;
  onDeleteRoomOverride: (id: number) => Promise<void>;
}) {
  const current = TYPE_META[plannerConsultationType];
  const [newOverrideByDate, setNewOverrideByDate] = useState<Record<string, { roomId: number | null; startTime: string; endTime: string }>>({});
  const [editsByOverrideId, setEditsByOverrideId] = useState<Record<number, { roomId?: number | null; startTime?: string; endTime?: string }>>({});

  return (
    <div className="space-y-4">
      {/* Consultation type toggle */}
      <div
        className={`flex rounded-2xl overflow-hidden border-2 transition-colors ${
          plannerConflictCount > 0 ? "border-red-200" : "border-gray-200"
        }`}
      >
        {CONSULTATION_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const isSelected = plannerConsultationType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              title={
                plannerConflictCount > 0 && !isSelected
                  ? "Исправьте конфликты перед переключением"
                  : undefined
              }
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                isSelected
                  ? meta.active
                  : plannerConflictCount > 0
                  ? "text-red-400 bg-red-50 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" /> {meta.shortLabel}
            </button>
          );
        })}
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
              Расписания разных форматов (онлайн / оффлайн / смешанный) пересекаются по
              времени. Исправьте конфликты — переключение вкладок и сохранение заблокированы.
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
            const { hasConflict, otherType, otherTime } = getPlannerDayConflict(i);
            const conflictMeta = otherType ? TYPE_META[otherType] : null;

            // When there's no conflict, show an FYI line for each other type
            // that has hours set on this day — useful context, not a warning.
            const otherInfoLines = !isOff && !hasConflict
              ? CONSULTATION_TYPES.filter((t) => t !== plannerConsultationType)
                  .map((t) => ({ type: t, day: plannerOtherDaysByType[t]?.[i] }))
                  .filter((o) => o.day && !o.day.is_day_off && o.day.start_time)
              : [];

            return (
              <div
                key={day.date}
                className={`rounded-xl border-2 p-3 transition-all ${
                  hasConflict
                    ? "border-red-400 bg-red-50"
                    : isOff
                    ? "border-gray-200 bg-gray-50"
                    : `${current.border} ${current.bg}`
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
                        ? `${current.border} ${current.active}`
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
                    {hasConflict && conflictMeta && (
                      <p className="text-xs text-red-600 mt-0.5 font-medium">
                        {conflictMeta.fullLabel}: {otherTime} — пересечение времени
                      </p>
                    )}
                    {otherInfoLines.map(({ type, day: otherDay }) => (
                      <p key={type} className={`text-xs mt-0.5 ${TYPE_META[type].text}`}>
                        {TYPE_META[type].emoji} {TYPE_META[type].fullLabel}: {otherDay.start_time} –{" "}
                        {otherDay.end_time}
                      </p>
                    ))}
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

                {/* Кабинеты на эту дату — независимо от start/end этого дня выше,
                    И НЕЗАВИСИМО от is_day_off: DoctorRoomOverride resolves
                    regardless of what DoctorAvailability says for this date
                    (the two systems are architecturally separate — see
                    resolve_room_for_doctor), so a room already assigned
                    here must stay visible even when the day shows
                    "Выходной" in the online/offline/mixed sense. Hiding it
                    behind !isOff previously made already-saved room data
                    disappear from view entirely with no way to find it. */}
                {plannerConsultationType !== "online" && (() => {
                  const bands = roomOverrides.filter((o) => o.date === day.date);
                  const draft = newOverrideByDate[day.date];
                  return (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-1.5">
                      <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wide mb-1.5">Кабинеты</p>
                      {bands.map((o) => {
                        const edits = editsByOverrideId[o.id];
                        return (
                          <RoomBandRow
                            key={o.id}
                            roomId={edits?.roomId !== undefined ? edits.roomId : o.room_id}
                            startTime={edits?.startTime ?? o.start_time.slice(0, 5)}
                            endTime={edits?.endTime ?? o.end_time.slice(0, 5)}
                            availableRooms={availableRooms}
                            onChange={(changes) =>
                              setEditsByOverrideId((prev) => ({
                                ...prev,
                                [o.id]: { ...prev[o.id], ...changes },
                              }))
                            }
                            onCommit={async () => {
                              if (!edits) return;
                              const patch: { room_id?: number | null; start_time?: string; end_time?: string } = {};
                              if (edits.roomId !== undefined) patch.room_id = edits.roomId;
                              if (edits.startTime !== undefined) patch.start_time = edits.startTime;
                              if (edits.endTime !== undefined) patch.end_time = edits.endTime;
                              await onUpdateRoomOverride(o.id, patch);
                              setEditsByOverrideId((prev) => {
                                const next = { ...prev };
                                delete next[o.id];
                                return next;
                              });
                            }}
                            onDelete={() => onDeleteRoomOverride(o.id)}
                          />
                        );
                      })}
                      {draft ? (
                        <RoomBandRow
                          roomId={draft.roomId}
                          startTime={draft.startTime}
                          endTime={draft.endTime}
                          availableRooms={availableRooms}
                          isNew
                          onChange={(changes) =>
                            setNewOverrideByDate((prev) => ({
                              ...prev,
                              [day.date]: {
                                roomId: changes.roomId !== undefined ? changes.roomId : prev[day.date].roomId,
                                startTime: changes.startTime ?? prev[day.date].startTime,
                                endTime: changes.endTime ?? prev[day.date].endTime,
                              },
                            }))
                          }
                          onCommit={async () => {
                            await onAddRoomOverride(day.date, draft.roomId, draft.startTime, draft.endTime);
                            setNewOverrideByDate((prev) => {
                              const next = { ...prev };
                              delete next[day.date];
                              return next;
                            });
                          }}
                          onDelete={() =>
                            setNewOverrideByDate((prev) => {
                              const next = { ...prev };
                              delete next[day.date];
                              return next;
                            })
                          }
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setNewOverrideByDate((prev) => ({
                              ...prev,
                              [day.date]: { roomId: null, startTime: "09:00", endTime: "18:00" },
                            }))
                          }
                          className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors px-1 py-1"
                        >
                          <Plus size={13} /> Добавить интервал
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
