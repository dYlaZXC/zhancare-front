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
}
