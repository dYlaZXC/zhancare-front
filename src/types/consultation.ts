// types/consultation.ts
export type ConsultationStatus =
  | "pending"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "missed"
  | "scheduled"
  | "planned"
  | "confirmed"
  | "in_progress";

export interface Consultation {
  id: number;
  meeting_id?: string;
  // Numeric user ids — present in the API response (plain FK fields on the
  // backend serializer), just not previously declared here.
  patient?: number;
  doctor?: number;
  patient_name?: string;
  patient_email?: string | null;
  status: ConsultationStatus;
  doctor_first_name?: string;
  doctor_last_name?: string;
  doctor_type?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number | null;
  scheduled_at?: string;
  appointment_time?: string;
  symptoms?: string;
  is_urgent?: boolean;
  type?: "video" | "phone" | "chat" | "offline" | "home" | "diagnostics";
  consultation_type?: string;
  // Clinic appointment extras
  clinic_name?: string;
  clinic_address?: string;
  // Clinic (offline) appointment extras
  clinic_appointment_id?: number; // real DB id (before +100000 offset)
  // Home appointment extras
  home_appointment_id?: number;  // real DB id (before +200000 offset)
  // Diagnostics appointment extras — this doctor is the PERFORMING doctor
  // (who carries out the test), independent from referring_doctor_name
  // (who ordered it and drives commission, possibly a different person).
  diagnostics_appointment_id?: number; // real DB id (before +300000 offset)
  service_name?: string;
  referring_doctor_name?: string | null;
  address?: string;
  latitude?: number;
  longitude?: number;
  nurse_name?: string;
  nurse_photo?: string;
  nurse_phone?: string;
  // Universal consultation form constructor — fixed on first form fetch (see
  // consultations/template_utils.py), legacy-compatible via form_data fallback.
  // `selected` = the doctor hand-picked this template for the visit (vs. following
  // the doctor's/clinic's default) — see ConsultationTemplatePicker.
  template_snapshot?: { id: number | null; name: string; document_type: string; sections: ConsultationFormSection[]; selected?: boolean };
  // Keyed by section — a "text" section's value is a string, a
  // "diagnostics_referral" section's value is a DiagnosticsReferralValue.
  form_data?: Record<string, string | DiagnosticsReferralValue>;
}

export type ConsultationSectionType = "text" | "diagnostics_referral";

export interface ConsultationFormSection {
  key: string;
  label: string;
  type?: ConsultationSectionType;
  ai_hint?: string;
  required?: boolean;
  placeholder?: string;
  // Real, editable starting text that pre-fills a brand-new sheet's field —
  // see components/services/admin/consultationTemplates/types.ts::FormSection
  // for the full rationale. Only meaningful for type="text".
  default_text?: string;
}

// Wire shape for a type="diagnostics_referral" section's value — the doctor
// picks these from the clinic's own DiagnosticsService catalog; the backend
// validates every service_id belongs to that clinic (see
// consultations/template_utils.py::validate_diagnostics_referral_value).
export interface DiagnosticsReferralEntry {
  // Optional — a doctor can add a referral not in the clinic's catalog by
  // name alone ("Добавить вручную" / AI extraction), see
  // validate_diagnostics_referral_value's docstring.
  service_id?: number;
  name: string;
  category_label?: string;
  price?: string | number | null;
  currency?: string | null;
  booked_at?: string;
  appointment_id?: number;
  original_text?: string | null;
  source?: "manual" | "ai";
}

export interface DiagnosticsReferralValue {
  referrals: DiagnosticsReferralEntry[];
  comment: string;
}
