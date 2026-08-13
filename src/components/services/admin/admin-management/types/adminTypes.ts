export interface Clinic {
  id: number;
  name: string;
}

export interface Admin {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  admin_type: "super" | "clinic" | "manager";
  clinic: { id: number; name: string } | null;
  can_manage_staff: boolean;
  can_manage_patients: boolean;
  can_view_reports: boolean;
  can_manage_settings: boolean;
  department: string;
  notes: string;
  created_at: string | null;
}

export type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  clinic_id: string;
  admin_type: "clinic" | "manager";
  can_manage_staff: boolean;
  can_manage_patients: boolean;
  can_view_reports: boolean;
  can_manage_settings: boolean;
  department: string;
  notes: string;
};

export const EMPTY_FORM: FormData = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  clinic_id: "",
  admin_type: "clinic",
  can_manage_staff: true,
  can_manage_patients: true,
  can_view_reports: true,
  can_manage_settings: false,
  department: "",
  notes: "",
};

export const ADMIN_TYPE_LABELS: Record<string, string> = {
  super: "Супер-администратор",
  clinic: "Администратор клиники",
  manager: "Менеджер",
};

export const ADMIN_TYPE_COLORS: Record<string, string> = {
  super: "bg-purple-100 text-purple-700",
  clinic: "bg-blue-100 text-blue-700",
  manager: "bg-green-100 text-green-700",
};
