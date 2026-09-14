export type SectionType = "text" | "diagnostics_referral";

export type FormSection = {
  key: string;
  label: string;
  type: SectionType;
  ai_hint?: string;
  required?: boolean;
  placeholder?: string;
};

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  text: "Текст",
  diagnostics_referral: "Назначение диагностики",
};

export type ConsultationFormTemplate = {
  id: number;
  clinic: number | null;
  doctor: number | null;
  document_type: string;
  name: string;
  is_default: boolean;
  sections: FormSection[];
  created_at: string;
  updated_at: string;
};

export const EMPTY_SECTION: FormSection = {
  key: "",
  label: "",
  type: "text",
  ai_hint: "",
  required: false,
  placeholder: "",
};

export const SECTION_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;

// Opaque, generated once when a section is added and never touched again —
// not shown in the admin UI at all. A random suffix (not derived from the
// label) means two sections can share a label without ever colliding on key,
// so the admin never has to think about "Повторяющийся ключ секции" either.
export function generateSectionKey(): string {
  return `section_${Math.random().toString(36).slice(2, 10)}`;
}
