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
  scheduled_at?: string;
  appointment_time?: string;
  symptoms?: string;
  is_urgent?: boolean;
  type?: "video" | "phone" | "chat" | "offline" | "home";
  consultation_type?: string;
  // Clinic appointment extras
  clinic_name?: string;
  clinic_address?: string;
}
