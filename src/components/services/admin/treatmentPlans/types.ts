export type PlanItemSource = "diagnostics_referral" | "consultation" | "clinic_appointment";
export type PlanItemStatus = "planned" | "completed" | "no_show" | "cancelled";
export type PlanStatus = "active" | "completed" | "cancelled";

export interface TreatmentPlanItem {
  id: number;
  plan: number;
  name: string;
  source: PlanItemSource;
  doctor: number | null;
  doctor_name: string | null;
  diagnostics_appointment: number | null;
  consultation: number | null;
  clinic_appointment: number | null;
  price: string;
  paid_amount: string;
  owed_amount: string;
  currency: string;
  status: PlanItemStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlan {
  id: number;
  patient: number;
  patient_name: string;
  patient_phone: string | null;
  clinic: number;
  created_by: number | null;
  created_by_name: string | null;
  title: string;
  notes: string;
  status: PlanStatus;
  items: TreatmentPlanItem[];
  total_amount: string;
  paid_amount: string;
  owed_amount: string;
  items_count: number;
  completed_count: number;
  no_show_count: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardOverview {
  total_patients: number;
  with_debt: number;
  with_no_show: number;
  total_plans: number;
  items_total: number;
  sum_planned: number | string;
  sum_paid: number | string;
  sum_owed: number | string;
  collection_pct: number;
}

export interface DashboardTopDebtor {
  patient_id: number;
  patient_name: string;
  sum_planned: number | string;
  sum_paid: number | string;
  sum_owed: number | string;
}

export type DashboardByStatus = Record<PlanItemStatus, number>;

export interface DashboardByPatientRow {
  patient_id: number;
  patient_name: string;
  patient_phone: string | null;
  plans_count: number;
  items_total: number;
  items_completed: number;
  items_no_show: number;
  sum_planned: number | string;
  sum_paid: number | string;
  sum_owed: number | string;
  completed_pct: number;
  no_show_pct: number;
}

export interface DashboardByMonthRow {
  month: string;
  items_total: number;
  items_completed: number;
  items_no_show: number;
  sum_planned: number | string;
  sum_paid: number | string;
  sum_owed: number | string;
  completed_pct: number;
  collection_pct: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  by_status: DashboardByStatus;
  top_debtors: DashboardTopDebtor[];
  by_patient: DashboardByPatientRow[];
  by_month: DashboardByMonthRow[];
}

export const SOURCE_LABELS: Record<PlanItemSource, string> = {
  diagnostics_referral: "Направление на диагностику",
  consultation: "Видео-консультация",
  clinic_appointment: "Приём в клинике",
};

export const STATUS_LABELS: Record<PlanItemStatus, string> = {
  planned: "Запланировано",
  completed: "Выполнено",
  no_show: "Не пришёл",
  cancelled: "Отменено",
};

export const STATUS_COLORS: Record<PlanItemStatus, { text: string; bg: string; border: string }> = {
  planned: { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  completed: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  no_show: { text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  cancelled: { text: "text-gray-400", bg: "bg-gray-50", border: "border-gray-200" },
};

export function formatMoney(value: number | string | null | undefined, currency = "KZT"): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return `${n.toLocaleString("ru-RU")} ${currency === "KZT" ? "₸" : currency}`;
}
