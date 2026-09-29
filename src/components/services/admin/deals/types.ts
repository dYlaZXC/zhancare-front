export type DealStage = "unsorted" | "booked" | "confirmed" | "arrived" | "paid";
export type DealSource = "site" | "whatsapp" | "instagram" | "phone" | "referral" | "other";

export interface Deal {
  id: number;
  clinic: number;
  name: string;
  phone: string;
  patient: number | null;
  amount: string;
  source: DealSource;
  stage: DealStage;
  assigned_to: number | null;
  assigned_to_name: string | null;
  // The underlying User pk (assigned_to is an AdminProfile pk — a
  // different id space than the logged-in user's own id). Use this, not
  // assigned_to, when comparing against the current user for "Мои сделки".
  assigned_to_user_id: number | null;
  created_by: number | null;
  notes: string;
  tasks_total: number;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
}

export const STAGE_ORDER: DealStage[] = ["unsorted", "booked", "confirmed", "arrived", "paid"];

export const STAGE_LABELS: Record<DealStage, string> = {
  unsorted: "Неразобранные",
  booked: "Записан на приём",
  confirmed: "Запись подтверждена",
  arrived: "Пациент пришёл",
  paid: "Оплачено",
};

export const STAGE_COLORS: Record<DealStage, { bg: string; text: string }> = {
  unsorted: { bg: "#f3f4f6", text: "#6b7280" },
  booked: { bg: "#eaf1ff", text: "#3772ff" },
  confirmed: { bg: "#fffbeb", text: "#d97706" },
  arrived: { bg: "#f0fdf4", text: "#16a34a" },
  paid: { bg: "#ecfdf5", text: "#059669" },
};

export const SOURCE_LABELS: Record<DealSource, string> = {
  site: "Сайт",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  phone: "Телефон",
  referral: "Рекомендация",
  other: "Другое",
};

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
