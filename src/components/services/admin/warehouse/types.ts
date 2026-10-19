export type WarehouseCategory = "consumable" | "medication" | "equipment" | "stationery" | "other";
export type WarehouseUnit = "pcs" | "pack" | "ml" | "l" | "kg" | "g" | "m";
export type TransactionType = "in" | "out" | "adjustment";
export type TransactionReason = "purchase" | "return" | "consumption" | "write_off" | "correction";
export type AttemptStatus = "pending" | "completed" | "failed_insufficient_stock" | "failed_error";

export const CATEGORY_LABELS: Record<WarehouseCategory, string> = {
  consumable: "Расходники",
  medication: "Медикаменты",
  equipment: "Оборудование",
  stationery: "Канцелярия",
  other: "Прочее",
};

export const UNIT_LABELS: Record<WarehouseUnit, string> = {
  pcs: "шт",
  pack: "уп",
  ml: "мл",
  l: "л",
  kg: "кг",
  g: "г",
  m: "м",
};

export const REASON_LABELS: Record<TransactionReason, string> = {
  purchase: "Закупка",
  return: "Возврат поставщику",
  consumption: "Списание на приём",
  write_off: "Списание (порча/просрочка)",
  correction: "Коррекция по инвентаризации",
};

export interface WarehouseItem {
  id: number;
  clinic: number;
  name: string;
  category: WarehouseCategory;
  unit: WarehouseUnit;
  sku: string;
  min_quantity: string;
  current_quantity: string;
  last_unit_cost: string | null;
  is_active: boolean;
  notes: string;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseSupplier {
  id: number;
  clinic: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseTransaction {
  id: number;
  item: number;
  item_name: string;
  unit: WarehouseUnit;
  type: TransactionType;
  reason: TransactionReason;
  quantity: string;
  unit_cost: string | null;
  supplier: number | null;
  expected_quantity: string | null;
  counted_quantity: string | null;
  consumption_attempt: number | null;
  created_by: number | null;
  created_by_name: string | null;
  notes: string;
  created_at: string;
}

export interface WarehouseConsumptionRule {
  id: number;
  clinic: number;
  item: number;
  item_name: string;
  quantity_per_use: string;
  diagnostics_service: number | null;
  applies_to_offline_visit: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseConsumptionAttempt {
  id: number;
  diagnostics_appointment: number | null;
  consultation: number | null;
  clinic_appointment: number | null;
  appointment_label: string | null;
  status: AttemptStatus;
  rule_snapshot: { item_id: number; quantity_per_use: string }[];
  attempt_count: number;
  last_attempted_at: string | null;
  last_error: string;
  resolved_at: string | null;
  created_at: string;
}
