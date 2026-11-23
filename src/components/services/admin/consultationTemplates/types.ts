export type SectionType = "text" | "diagnostics_referral";

export type FormSection = {
  key: string;
  label: string;
  type: SectionType;
  ai_hint?: string;
  required?: boolean;
  placeholder?: string;
  // Real, editable starting text for this section — pre-fills a brand-new
  // consultation sheet's field (not just greyed-out placeholder hint text),
  // since the same boilerplate text often repeats across visits. The doctor
  // can freely change or clear it. Only meaningful for type="text" — a
  // diagnostics_referral section's real content is its referrals array, not
  // text (same exclusion ConsultationFormPreset.values already makes).
  default_text?: string;
};

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  text: "Текст",
  diagnostics_referral: "Назначение диагностики",
};

export type ModerationStatus = "draft" | "pending" | "verified" | "rejected";

export type ConsultationFormTemplate = {
  id: number;
  clinic: number | null;
  doctor: number | null;
  document_type: string;
  name: string;
  is_default: boolean;
  // Publish toggle — orthogonal to ownership (clinic/doctor above). Shared
  // templates stay editable/deletable only by their owner; this only widens
  // who may view/copy them. See consultations/views.py::ConsultationFormTemplateViewSet.
  is_shared: boolean;
  usage_count: number;
  clinic_name?: string | null;
  doctor_name?: string | null;
  // Lineage — set only by POST .../duplicate/, never client-writable.
  original_template: number | null;
  copied_from: number | null;
  original_template_name?: string | null;
  original_author_name?: string | null;
  derived_count: number;
  // Combined usage_count across the WHOLE lineage (root + every
  // descendant) — lets an original author see the full downstream reach,
  // not just their own row's number.
  ecosystem_usage_count: number;
  specialty: number | null;
  specialty_name?: string | null;
  visit_type: VisitType | null;
  // "Проверено ZhanCare" — derived server-side from moderation_status
  // (read-only). Only the moderation workflow actions can change it.
  is_verified: boolean;
  moderation_status: ModerationStatus;
  submitted_for_review_at: string | null;
  // Latest moderation_history note — the rejection reason an owner needs
  // to see to know what to fix.
  moderation_note?: string | null;
  view_count: number;
  is_favorited: boolean;
  unique_doctor_count: number;
  unique_clinic_count: number;
  sections: FormSection[];
  created_at: string;
  updated_at: string;
};

export type VisitType = "primary" | "follow_up" | "preventive";

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  primary: "Первичный приём",
  follow_up: "Повторный приём",
  preventive: "Диспансерный осмотр",
};

// Shape returned by GET /consultations/{meetingId}/available-templates/'s
// "templates" array (see components/shared/ConsultationTemplatePicker.tsx).
export type TemplateOption = {
  id: number;
  name: string;
  scope: "doctor" | "clinic" | "shared" | "system";
  is_default: boolean;
  sections_count: number;
  clinic_name?: string | null;
  doctor_name?: string | null;
};

// Shape returned by the same endpoint's new "recommended" array — same
// fields as TemplateOption plus the ranking's own machine-readable output,
// so the frontend can explain *why* something is recommended, not just
// that it ranks first.
export type RecommendedTemplateOption = TemplateOption & {
  specialty_name?: string | null;
  is_verified: boolean;
  score: number;
  reasons: string[];
};

export const REASON_LABELS: Record<string, string> = {
  specialty_match: "Совпадает специальность",
  visit_type_match: "Совпадает тип визита",
  clinic_template: "Шаблон клиники",
  verified: "Проверено ZhanCare",
  popular: "Популярный",
};

export const EMPTY_SECTION: FormSection = {
  key: "",
  label: "",
  type: "text",
  ai_hint: "",
  required: false,
  placeholder: "",
  default_text: "",
};

export const SECTION_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;

// Opaque, generated once when a section is added and never touched again —
// not shown in the admin UI at all. A random suffix (not derived from the
// label) means two sections can share a label without ever colliding on key,
// so the admin never has to think about "Повторяющийся ключ секции" either.
export function generateSectionKey(): string {
  return `section_${Math.random().toString(36).slice(2, 10)}`;
}
