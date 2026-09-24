"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import type { ConsultationType, DoctorSlot } from "../types/addEventTypes";

const MENU_WIDTH = 320;
const MENU_MAX_HEIGHT = 420;

interface MenuPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const mondayOf = (d: Date) => {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
};

/**
 * Replaces the native <input type="date"> with a proper dropdown calendar —
 * and, once a doctor/nurse is selected, colors in which days they actually
 * work. Previously the admin had no way to know that before picking a date
 * and then hitting "У выбранного доктора нет рабочих часов на эту дату" in
 * the time picker below; now the calendar itself shows it up front.
 *
 * Clicking a day doesn't just set the date and close, either — when the
 * caller passes `slots`/`onTimeChange` (i.e. a doctor is selected), the
 * panel switches in place to that day's real slot list, computed by the
 * SAME slot-generation logic the standalone time picker already uses (the
 * caller just hands it down — this component never re-derives it), so date
 * AND time get picked in one continuous flow instead of two separate
 * dropdowns. Skipped entirely for diagnostics (no `onTimeChange` passed),
 * where date and time are independent concepts.
 *
 * Portaled to <body> with manually computed fixed positioning (same pattern
 * as ConsultationTemplatePicker/SearchSelect) so it's never clipped by this
 * modal's own scroll container.
 */
export function DateCalendarPicker({
  value,
  onChange,
  doctorId,
  consultationType,
  slots,
  loadingSlots = false,
  time,
  onTimeChange,
}: {
  value: string;
  onChange: (val: string) => void;
  /** Selected doctor/nurse id — availability shading is skipped entirely without one. */
  doctorId?: string;
  consultationType: ConsultationType;
  /** This doctor's slots for whichever date is currently selected (`value`) —
   * only meaningful together with `onTimeChange`; already reflects the
   * chosen date by the time it updates, since `onChange` above is what
   * drives the caller's own fetch. */
  slots?: DoctorSlot[];
  loadingSlots?: boolean;
  time?: string;
  /** Presence of this callback is what turns on the inline slot-preview
   * step after picking a day — omit it (diagnostics) to keep the old
   * pick-a-date-and-close behavior. */
  onTimeChange?: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPosition | null>(null);
  // Set once a day is clicked (only when slot-preview is enabled) — while
  // set, the panel shows that day's slots instead of the month grid.
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // Set of "YYYY-MM-DD" dates this doctor genuinely works, for whichever
  // month is currently displayed — everything else renders as a day off
  // (or simply unknown, visually the same: nothing to click for here).
  const [workingDays, setWorkingDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Keyed by doctor+type+month — re-opening a month already browsed this
  // session (very common: open, glance, close, reopen) shouldn't re-fire
  // up to 12 requests again.
  const cacheRef = useRef<Map<string, Set<string>>>(new Map());

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(MENU_WIDTH, vw - 16);
    const left = Math.max(8, Math.min(r.left, vw - width - 8));
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    if (below < 340 && above > below) {
      setPos({ left, width, bottom: vh - r.top + 6, maxHeight: Math.min(MENU_MAX_HEIGHT, above) });
    } else {
      setPos({ left, width, top: r.bottom + 6, maxHeight: Math.min(MENU_MAX_HEIGHT, Math.max(240, below)) });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Jump back to wherever `value` currently is every time the panel opens —
  // otherwise it'd stay stuck on a month the admin browsed away from and
  // then closed without picking, on the NEXT unrelated open.
  useEffect(() => {
    if (!open) return;
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setPreviewDate(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fetch this doctor's real per-day availability for every week the
  // visible month grid touches. Same dual (exact type + "mixed" fallback)
  // query the time picker's own slot generation already relies on — an
  // explicit exact-type row always wins over "mixed" when both exist for a
  // date (see staff/doctors-day precedence), so it's resolved the same way
  // here, per date, rather than trusting either query alone.
  useEffect(() => {
    if (!open || !doctorId) { setWorkingDays(new Set()); return; }
    const scheduleType = (consultationType === 'home' || consultationType === 'diagnostics') ? 'offline' : consultationType;
    const monthKey = `${doctorId}|${scheduleType}|${viewMonth.getFullYear()}-${viewMonth.getMonth()}`;
    const cached = cacheRef.current.get(monthKey);
    if (cached) { setWorkingDays(cached); return; }

    const startDate = mondayOf(viewMonth);
    const mondays: string[] = [];
    for (let w = 0; w < 6; w++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + w * 7);
      mondays.push(toLocalDateStr(d));
    }

    let cancelled = false;
    setLoading(true);
    Promise.all(
      mondays.map((monday) =>
        Promise.all([
          api.get(`/staff/${doctorId}/availability/`, { params: { week_start: monday, consultation_type: scheduleType } })
            .then((r) => r.data as any[]).catch(() => []),
          api.get(`/staff/${doctorId}/availability/`, { params: { week_start: monday, consultation_type: 'mixed' } })
            .then((r) => r.data as any[]).catch(() => []),
        ])
      )
    ).then((weeks) => {
      if (cancelled) return;
      const working = new Set<string>();
      // source === 'empty' is this endpoint's own synthetic filler for "no
      // real row at all for this date+type" (always returns 7 days a week
      // regardless) — it must NOT be treated as a genuine exact-type
      // override, or an exact query with zero real data would always "win"
      // over a perfectly real, working "mixed" entry and every day would
      // wrongly show as a day off. Confirmed against real data: a doctor
      // with only "mixed" hours configured returns source: 'empty' for the
      // exact online/offline queries on those same dates.
      const isReal = (e: any) => e.source && e.source !== 'empty';
      for (const [exactDays, mixedDays] of weeks) {
        const exactByDate = new Map<string, any>(exactDays.filter(isReal).map((e) => [e.date, e]));
        const mixedByDate = new Map<string, any>(mixedDays.filter(isReal).map((e) => [e.date, e]));
        const dates = new Set<string>([...exactByDate.keys(), ...mixedByDate.keys()]);
        for (const date of dates) {
          const entry = exactByDate.get(date) ?? mixedByDate.get(date);
          if (entry && !entry.is_day_off && entry.start_time) working.add(date);
        }
      }
      cacheRef.current.set(monthKey, working);
      setWorkingDays(working);
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, doctorId, consultationType, viewMonth]);

  const todayStr = toLocalDateStr(new Date());

  const weeks = (() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const startDate = mondayOf(new Date(year, month, 1));
    const result: Date[][] = [];
    let cur = new Date(startDate);
    for (let w = 0; w < 6; w++) {
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      result.push(days);
    }
    return result;
  })();

  const label = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })
    : 'Выберите дату';

  const canPreviewSlots = !!doctorId && !!onTimeChange;

  const select = (d: Date) => {
    const ds = toLocalDateStr(d);
    onChange(ds);
    if (canPreviewSlots) {
      setPreviewDate(ds);
    } else {
      setOpen(false);
    }
  };

  const pickSlot = (slotStart: string) => {
    onTimeChange?.(slotStart);
    setOpen(false);
  };

  // Slots reflect whichever date the caller's own state currently holds —
  // only trust them once that's caught up with what was just clicked here
  // (otherwise, for one render, they're still last date's slots).
  const showingSlotsFor = previewDate && previewDate === value ? previewDate : null;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 cursor-pointer transition-colors bg-white ${open ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <CalendarIcon className={`w-4 h-4 flex-shrink-0 ${value ? 'text-blue-500' : 'text-gray-400'}`} />
        <span className={`flex-1 text-sm capitalize ${value ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>{label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: pos.left,
            width: pos.width,
            ...(pos.top != null ? { top: pos.top } : { bottom: pos.bottom }),
            maxHeight: pos.maxHeight,
            zIndex: 9999,
          }}
          className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl overflow-hidden flex flex-col"
        >
          {previewDate ? (
            <>
              {/* Slot preview for the day just clicked — same idea as the
                  standalone time picker's dropdown, folded into this same
                  panel so date + time happen in one flow. */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDate(null)}
                  className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
                  title="Назад к календарю"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-gray-800 capitalize truncate">
                  {new Date(previewDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}
                </span>
              </div>

              <div className="p-3 overflow-y-auto">
                {!showingSlotsFor || loadingSlots ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Загрузка слотов...
                  </div>
                ) : !slots || slots.length === 0 ? (
                  <div className="px-3 py-4 rounded-xl border-2 border-amber-200 bg-amber-50 text-sm text-amber-700 text-center">
                    ⚠️ Нет рабочих часов на эту дату
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {slots.map((slot) => {
                      const isSelected = slot.start === time;
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          disabled={slot.busy}
                          onClick={() => pickSlot(slot.start)}
                          className={`group relative flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${
                            isSelected
                              ? 'text-white shadow-sm'
                              : slot.busy
                              ? 'bg-gray-50 border border-gray-100 cursor-not-allowed'
                              : 'bg-emerald-50 border border-emerald-200 hover:bg-[linear-gradient(135deg,#3772ff_0%,#2c5bcc_100%)] hover:border-transparent cursor-pointer'
                          }`}
                          style={isSelected ? { background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' } : undefined}
                        >
                          <span className={`text-[11px] font-black leading-tight ${isSelected ? 'text-white' : slot.busy ? 'text-gray-300 line-through' : 'text-emerald-700 group-hover:text-white'}`}>{slot.start}</span>
                          <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : slot.busy ? 'text-gray-300' : 'text-emerald-500 group-hover:text-blue-100'}`}>{slot.busy ? 'занято' : `– ${slot.end}`}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
          <>
          {/* Month nav */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-gray-800 capitalize">
              {viewMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Legend — only meaningful once a doctor is selected */}
          {doctorId && (
            <div className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-50 flex-shrink-0">
              {loading ? (
                <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Загрузка расписания...
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><div className="w-2 h-2 rounded-full bg-emerald-400" />Работает</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><div className="w-2 h-2 rounded-full bg-gray-300" />Выходной</span>
                </>
              )}
            </div>
          )}

          <div className="p-2.5 overflow-y-auto">
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map((n) => (
                <div key={n} className="text-center text-[10px] font-bold text-gray-400 py-1">{n}</div>
              ))}
            </div>
            {weeks.map((days, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
                {days.map((d) => {
                  const ds = toLocalDateStr(d);
                  const inMonth = d.getMonth() === viewMonth.getMonth();
                  const isSelected = ds === value;
                  const isToday = ds === todayStr;
                  const isWorking = doctorId ? workingDays.has(ds) : false;
                  return (
                    <button
                      key={ds}
                      type="button"
                      onClick={() => select(d)}
                      className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'text-white shadow-sm'
                          : !inMonth
                          ? 'text-gray-300 hover:bg-gray-50'
                          : isToday
                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      style={isSelected ? { background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' } : undefined}
                    >
                      {d.getDate()}
                      {doctorId && !loading && (
                        <span className={`w-1 h-1 rounded-full mt-0.5 ${isWorking ? (isSelected ? 'bg-white' : 'bg-emerald-400') : 'bg-transparent'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => select(new Date())}
            className="flex-shrink-0 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-t border-gray-100 transition-colors"
          >
            Сегодня
          </button>
          </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

export default DateCalendarPicker;
