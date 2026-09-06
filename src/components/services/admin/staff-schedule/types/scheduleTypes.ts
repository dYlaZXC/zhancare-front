export interface StaffMemberMin {
  id: number;
  first_name: string;
  last_name: string;
  schedules?: Array<{
    id?: number;
    consultation_type: "online" | "offline" | "mixed";
    weekday: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;
}

export interface StaffScheduleModalProps {
  isOpen: boolean;
  member: StaffMemberMin | null;
  onClose: () => void;
  onSaved?: () => void;
}

export type ConsultationType = "online" | "offline" | "mixed";
export const CONSULTATION_TYPES: readonly ConsultationType[] = ["online", "offline", "mixed"];

export type DaySchedule = { start: string; end: string; enabled: boolean };
export type WeekSchedule = {
  online: Record<string, DaySchedule>;
  offline: Record<string, DaySchedule>;
  mixed: Record<string, DaySchedule>;
};
export type WeeklySchedules = Record<string, WeekSchedule>;

export const DEFAULT_WEEKDAYS = [
  { value: "monday", labelRu: "Понедельник", labelShort: "Пн", dayIndex: 1 },
  { value: "tuesday", labelRu: "Вторник", labelShort: "Вт", dayIndex: 2 },
  { value: "wednesday", labelRu: "Среда", labelShort: "Ср", dayIndex: 3 },
  { value: "thursday", labelRu: "Четверг", labelShort: "Чт", dayIndex: 4 },
  { value: "friday", labelRu: "Пятница", labelShort: "Пт", dayIndex: 5 },
  { value: "saturday", labelRu: "Суббота", labelShort: "Сб", dayIndex: 6 },
  { value: "sunday", labelRu: "Воскресенье", labelShort: "Вс", dayIndex: 0 },
];

export const WEEKDAY_TO_NAME: Record<number, string> = {
  0: "monday",
  1: "tuesday",
  2: "wednesday",
  3: "thursday",
  4: "friday",
  5: "saturday",
  6: "sunday",
};

export const makeDay = (start: string, end: string, enabled = false): DaySchedule => ({
  start,
  end,
  enabled,
});

const defaultDayMap = (): Record<string, DaySchedule> => ({
  monday: makeDay("09:00", "18:00"),
  tuesday: makeDay("09:00", "18:00"),
  wednesday: makeDay("09:00", "18:00"),
  thursday: makeDay("09:00", "18:00"),
  friday: makeDay("09:00", "18:00"),
  saturday: makeDay("10:00", "14:00"),
  sunday: makeDay("10:00", "14:00"),
});

export const emptyWeek = (): WeekSchedule => ({
  online: defaultDayMap(),
  offline: defaultDayMap(),
  mixed: defaultDayMap(),
});
