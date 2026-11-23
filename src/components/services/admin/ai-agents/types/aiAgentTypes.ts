export const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://127.0.0.1:8000";
export const resolveUrl = (url: string) => (url.startsWith("http") ? url : `${BACKEND}${url}`);

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export interface QuickLink {
  label: string;
  message: string;
}

export interface AIAgent {
  id: number;
  clinic_id: number;
  slug: string;
  agent_name: string;
  welcome_message: string;
  system_prompt_extra: string;
  quick_links: QuickLink[];
  primary_color: string;
  logo_url: string;
  is_active: boolean;
  public_url: string;
  created_at: string;
  updated_at: string;
}

export type FormState = Omit<AIAgent, "id" | "clinic_id" | "public_url" | "created_at" | "updated_at">;

export const defaultForm: FormState = {
  slug: "",
  agent_name: "AI Ассистент",
  welcome_message: "",
  system_prompt_extra: "",
  quick_links: [],
  primary_color: "#8b5cf6",
  logo_url: "",
  is_active: true,
};

export const PRESET_COLORS = [
  "#8b5cf6", "#3772ff", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#0ea5e9", "#6366f1",
];

export interface ClinicRow {
  clinic_id: number;
  clinic_name: string;
  clinic_logo: string | null;
  agent: AIAgent | null;
}
