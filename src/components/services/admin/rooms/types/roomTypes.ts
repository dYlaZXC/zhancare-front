export const ROOM_TYPE_OPTIONS = [
  { value: "reception", label: "Приёмный" },
  { value: "procedure", label: "Процедурный" },
  { value: "diagnostic", label: "Диагностический" },
  { value: "ultrasound", label: "УЗИ" },
  { value: "lab", label: "Лаборатория" },
  { value: "dental", label: "Стоматология" },
  { value: "other", label: "Другой" },
];

export function roomTypeLabel(value: string): string {
  return ROOM_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value;
}

export const ROOM_STATUS_OPTIONS = [
  { value: "active", label: "Активен", color: "#059669" },
  { value: "maintenance", label: "На обслуживании", color: "#d97706" },
  { value: "unavailable", label: "Недоступен", color: "#6b7280" },
];

export function roomStatusLabel(value: string): string {
  return ROOM_STATUS_OPTIONS.find(o => o.value === value)?.label ?? value;
}
export function roomStatusColor(value: string): string {
  return ROOM_STATUS_OPTIONS.find(o => o.value === value)?.color ?? "#6b7280";
}

export const WEEKDAY_LABELS_FULL = [
  "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье",
];

export interface ClinicRoom {
  id: number;
  clinic: number;
  clinic_name: string | null;
  name: string;
  number: string | null;
  floor: string | null;
  room_type: string;
  specialization: number | null;
  specialization_name: string | null;
  status: string;
  capacity: number;
  description: string | null;
}

export interface RoomFormData {
  name: string;
  number: string;
  floor: string;
  room_type: string;
  specialization_name: string;
  status: string;
  capacity: number;
  description: string;
}

export const EMPTY_ROOM_FORM: RoomFormData = {
  name: "",
  number: "",
  floor: "",
  room_type: "reception",
  specialization_name: "",
  status: "active",
  capacity: 1,
  description: "",
};

export interface DoctorRoomAssignment {
  id: number;
  doctor_id: number;
  // DoctorProfile pk (this row's own FK) — NOT the User pk that
  // /staff/{id}/... endpoints (e.g. the "Расписание" modal) need. Use
  // doctor_user_id for navigation, doctor_id only for anything scoped to
  // clinics.models.DoctorProfile itself.
  doctor_user_id: number;
  doctor_name: string;
  doctor_first_name: string;
  doctor_last_name: string;
  room: ClinicRoom;
  weekday: number;
  start_time: string;
  end_time: string;
  valid_from: string | null;
  valid_to: string | null;
}
