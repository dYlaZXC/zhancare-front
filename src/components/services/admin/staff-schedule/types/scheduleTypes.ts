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
  // Which type tab to land on when the modal opens — defaults to "online"
  // (the long-standing behavior for every existing caller). A caller that
  // knows the thing it wants visible only shows up under a specific type
  // (e.g. navigating in to look at Кабинеты, which is hidden entirely on
  // the "Онлайн" tab) should pass that type instead, so the admin doesn't
  // land on an empty/irrelevant tab and have to switch manually.
  initialConsultationType?: ConsultationType;
  // Which week (YYYY-MM-DD, any date in it) the "По датам" tab should open
  // on — defaults to the real current week when omitted. A caller
  // navigating in to look at a SPECIFIC date (e.g. a DoctorRoomOverride,
  // which is anchored to one exact date, not "every Monday") should pass
  // that date so the admin lands on the record they actually clicked,
  // instead of always the current week with an extra manual "next week"
  // click needed to find it.
  initialDate?: string;
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

// Backend weekday convention (Python date.weekday(), Monday=0) — the
// inverse of WEEKDAY_TO_NAME above, needed wherever a DEFAULT_WEEKDAYS
// string key must be sent to a room-assignment endpoint as an integer.
export const DAY_TO_WEEKDAY: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};

// ── Гибкое расписание кабинетов (doctor-centric room assignments/overrides) ──

export interface AvailableRoom {
  id: number;
  name: string;
  number: string | null;
}

export interface DoctorRoomAssignmentRow {
  id: number;
  doctor_id: number;
  doctor_name: string;
  room: { id: number; name: string; number: string | null } | null;
  weekday: number;
  start_time: string;
  end_time: string;
  valid_from: string | null;
  valid_to: string | null;
}

export interface DoctorRoomOverrideRow {
  id: number;
  date: string;
  room_id: number | null;
  room_name: string | null;
  start_time: string;
  end_time: string;
}

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
