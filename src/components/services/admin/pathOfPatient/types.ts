export type PathOfPatientSource = "site" | "whatsapp" | "instagram" | "phone" | "referral" | "ai_agent" | "booking" | "other";

// A column of the clinic's own "Путь пациента" board — per-clinic and
// customizable (see backend PathOfPatientStage's own docstring).
// `is_intake` marks the one fallback stage that's always there (seeded for
// every clinic). `is_default` marks any of the 6 starter-funnel stages
// (computed server-side from the CURRENT label matching one of
// DEFAULT_STAGE_LABELS, not a stored flag — renaming one opts it out) —
// can be renamed/recolored but never deleted or reordered, enforced
// server-side; the frontend disables those actions to match.
export interface PathOfPatientStage {
  id: number;
  clinic: number;
  label: string;
  color: string;
  order: number;
  is_intake: boolean;
  is_default: boolean;
  deals_count: number;
}

export interface PathOfPatient {
  id: number;
  clinic: number;
  name: string;
  phone: string;
  patient: number | null;
  amount: string;
  source: PathOfPatientSource;
  stage: number;
  stage_label: string;
  stage_color: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  // The underlying User pk (assigned_to is an AdminProfile pk — a
  // different id space than the logged-in user's own id). Use this, not
  // assigned_to, when comparing against the current user for "Мои карточки".
  assigned_to_user_id: number | null;
  created_by: number | null;
  notes: string;
  tasks_total: number;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
}

export const SOURCE_LABELS: Record<PathOfPatientSource, string> = {
  site: "Сайт",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  phone: "Телефон",
  referral: "Рекомендация",
  ai_agent: "ИИ-агент",
  booking: "Запись на приём",
  other: "Другое",
};

// Offered when adding/recoloring a custom stage — same preset palette
// style already used for AI agent branding colors elsewhere in admin.
export const STAGE_COLOR_PRESETS = [
  "#6b7280", "#3772ff", "#d97706", "#16a34a", "#059669",
  "#ef4444", "#8b5cf6", "#ec4899", "#0ea5e9", "#f59e0b",
];

export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "0 ₸";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "0 ₸";
  return `${n.toLocaleString("ru-RU")} ₸`;
}

export function waLink(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}
