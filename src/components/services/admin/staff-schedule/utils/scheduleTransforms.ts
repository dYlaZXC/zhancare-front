import { getCurrentMondayStr } from "./dateHelpers";
import type { StaffMemberMin, WeeklySchedules, DaySchedule } from "../types/scheduleTypes";
import { WEEKDAY_TO_NAME, emptyWeek } from "../types/scheduleTypes";

export const buildWeeklySchedulesFromMember = (member: StaffMemberMin): WeeklySchedules => {
  const weekStartDate = getCurrentMondayStr();
  const week = emptyWeek();
  const rows = member.schedules || [];
  for (const row of rows) {
    const dayName = WEEKDAY_TO_NAME[row.weekday];
    if (dayName && (row.consultation_type === "online" || row.consultation_type === "offline")) {
      (week[row.consultation_type] as Record<string, DaySchedule>)[dayName] = {
        start: row.start_time.slice(0, 5),
        end: row.end_time.slice(0, 5),
        enabled: row.is_active,
      };
    }
  }
  return { [weekStartDate]: week };
};

// Build schedules array for saving (template tab)
export const buildSchedulesArray = (
  weeklySchedules: WeeklySchedules
): Array<{
  consultation_type: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}> => {
  const DAY_TO_WEEKDAY: Record<string, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  const merged = new Map<
    string,
    { consultation_type: string; weekday: number; start_time: string; end_time: string; is_active: boolean }
  >();
  const sortedEntries = Object.entries(weeklySchedules).sort(([a], [b]) => a.localeCompare(b));
  for (const [, weekEntry] of sortedEntries) {
    for (const type of ["online", "offline"] as const) {
      const dayMap = weekEntry[type];
      if (!dayMap) continue;
      for (const [day, cfg] of Object.entries(dayMap)) {
        const weekday = DAY_TO_WEEKDAY[day] ?? 0;
        const key = `${type}-${weekday}`;
        if (cfg.enabled) {
          merged.set(key, {
            consultation_type: type,
            weekday,
            start_time: cfg.start,
            end_time: cfg.end,
            is_active: true,
          });
        }
      }
    }
  }
  return Array.from(merged.values());
};

export const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const s1 = toMin(start1),
    e1 = toMin(end1),
    s2 = toMin(start2),
    e2 = toMin(end2);
  const ae1 = e1 < s1 ? e1 + 1440 : e1;
  const ae2 = e2 < s2 ? e2 + 1440 : e2;
  return s1 < ae2 && s2 < ae1;
};
