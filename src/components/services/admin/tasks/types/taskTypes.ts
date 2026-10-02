export type TaskStatus = "pending" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high";

export interface AdminTask {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  assigned_to_name: string;
  // The underlying User pk (assigned_to is an AdminProfile pk — a
  // different id space than request.user.id). Use this, not assigned_to,
  // when comparing against the logged-in user's id.
  assigned_to_user_id: number;
  created_by: number;
  created_by_name: string;
  // Nullable link back to a "Путь пациента" card (see
  // pathOfPatient/types.ts) — set when the task was created FROM a card
  // ("Создать задачу"); null otherwise.
  path_of_patient: number | null;
  due_at: string;
  remind_at: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  completed_at: string | null;
  reminder_sent_at: string | null;
  due_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignableAdmin {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  admin_type: string | null;
  clinic: { id: number; name: string } | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  assigned_to: number | null;
  date: string;
  time: string;
  reminderOffset: string;
  priority: TaskPriority;
}

export const EMPTY_TASK_FORM: TaskFormData = {
  title: "",
  description: "",
  assigned_to: null,
  date: "",
  time: "18:00",
  reminderOffset: "30",
  priority: "normal",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
};

export const PRIORITY_COLORS: Record<TaskPriority, { text: string; bg: string }> = {
  low: { text: "#6b7280", bg: "#f3f4f6" },
  normal: { text: "#3772ff", bg: "#eff4ff" },
  high: { text: "#ef4444", bg: "#fef2f2" },
};

// value "none" → remind_at stays null. value "0" ("В момент выполнения") →
// remind_at = due_at exactly, which the backend's own reminder query treats
// as "no separate reminder" (remind_at__lt=F('due_at')) — only the due
// notification fires, avoiding two near-identical notifications for the
// same moment.
export const REMINDER_OFFSET_OPTIONS: { value: string; label: string; minutes: number | null }[] = [
  { value: "none", label: "Без напоминания", minutes: null },
  { value: "0", label: "В момент выполнения", minutes: 0 },
  { value: "15", label: "За 15 минут", minutes: 15 },
  { value: "30", label: "За 30 минут", minutes: 30 },
  { value: "60", label: "За 1 час", minutes: 60 },
  { value: "1440", label: "За 1 день", minutes: 1440 },
];
