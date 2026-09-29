"use client";

export const WEEKDAYS = [
  { value: "monday",    labelRu: "Понедельник", labelShort: "Пн" },
  { value: "tuesday",   labelRu: "Вторник",     labelShort: "Вт" },
  { value: "wednesday", labelRu: "Среда",       labelShort: "Ср" },
  { value: "thursday",  labelRu: "Четверг",     labelShort: "Чт" },
  { value: "friday",    labelRu: "Пятница",     labelShort: "Пт" },
  { value: "saturday",  labelRu: "Суббота",     labelShort: "Сб" },
  { value: "sunday",    labelRu: "Воскресенье", labelShort: "Вс" },
];

export const DEFAULT_WEEKLY_SCHEDULE: Record<string, { enabled: boolean; start: string; end: string }> = {
  monday:    { enabled: false, start: "09:00", end: "18:00" },
  tuesday:   { enabled: false, start: "09:00", end: "18:00" },
  wednesday: { enabled: false, start: "09:00", end: "18:00" },
  thursday:  { enabled: false, start: "09:00", end: "18:00" },
  friday:    { enabled: false, start: "09:00", end: "18:00" },
  saturday:  { enabled: false, start: "10:00", end: "14:00" },
  sunday:    { enabled: false, start: "10:00", end: "14:00" },
};

// Matches the weekday convention the backend uses everywhere (0=Monday..6=Sunday)
const DAY_TO_WEEKDAY: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};
const WEEKDAY_TO_DAY: Record<number, string> = {
  0: "monday", 1: "tuesday", 2: "wednesday", 3: "thursday", 4: "friday", 5: "saturday", 6: "sunday",
};

export interface CategoryScheduleRow {
  weekday: number;
  enabled: boolean;
  start_time: string | null;
  end_time: string | null;
}

export function rowsToWeeklyMap(rows: CategoryScheduleRow[]): Record<string, { enabled: boolean; start: string; end: string }> {
  const map = { ...DEFAULT_WEEKLY_SCHEDULE };
  for (const row of rows) {
    const day = WEEKDAY_TO_DAY[row.weekday];
    if (day && row.enabled && row.start_time && row.end_time) {
      map[day] = { enabled: true, start: row.start_time, end: row.end_time };
    }
  }
  return map;
}

export function weeklyMapToSchedules(
  weeklySchedule: Record<string, { enabled: boolean; start: string; end: string }>
): Array<{ weekday: number; start_time: string; end_time: string; is_active: boolean }> {
  return Object.entries(weeklySchedule)
    .filter(([, cfg]) => cfg.enabled)
    .map(([day, cfg]) => ({
      weekday: DAY_TO_WEEKDAY[day],
      start_time: cfg.start,
      end_time: cfg.end,
      is_active: true,
    }));
}

export type WeeklySchedule = Record<string, { enabled: boolean; start: string; end: string }>;

/**
 * The seven day rows (toggle + start/end time) of a category's weekly hours —
 * shared by the standalone "Расписание категории" modal and the category
 * form, so the hours are edited the same way in both places.
 */
export function CategoryWeeklyEditor({
  value, onChange,
}: {
  value: WeeklySchedule;
  onChange: (next: WeeklySchedule) => void;
}) {
  const weeklySchedule = value;
  const setWeeklySchedule = (fn: (ws: WeeklySchedule) => WeeklySchedule) => onChange(fn(value));
  return (
    <div className="space-y-2">
              {WEEKDAYS.map(day => {
        const daySchedule = weeklySchedule[day.value] ?? DEFAULT_WEEKLY_SCHEDULE[day.value];
        const enabled = daySchedule.enabled;
        return (
          <div key={day.value}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
              enabled ? 'border-[#3772FF]/25 bg-blue-50/50' : 'border-gray-100 bg-gray-50/60'
            }`}>
            <button type="button"
              onClick={() => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, enabled: !enabled } }))}
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-all text-xs font-bold ${
                enabled ? 'text-white shadow-md' : 'text-gray-400'
              }`}
              style={enabled ? { background: 'linear-gradient(135deg, #3772FF, #6366f1)' } : { background: '#f3f4f6' }}>
              {day.labelShort}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-1 ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>{day.labelRu}</p>
              {enabled ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="time" value={daySchedule.start}
                    onChange={e => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, start: e.target.value } }))}
                    step="900"
                    className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                  <span className="text-gray-400 text-xs font-bold">—</span>
                  <input type="time" value={daySchedule.end}
                    onChange={e => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, end: e.target.value } }))}
                    step="900"
                    className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                </div>
              ) : (
                <p className="text-[11px] text-gray-400">выходной</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
