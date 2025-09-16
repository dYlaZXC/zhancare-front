// types/consultation.ts
export type ConsultationStatus =
  | "pending"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "missed"; // 🆕 добавлен пропущенный статус

export interface Consultation {
  id: number;
  meeting_id: string;
  patient_name: string;
  patient_email: string | null;
  status: ConsultationStatus;
  doctor_first_name?: string;
  doctor_last_name?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  type?: "video" | "phone" | "chat";
  consultation_type?: 'general' | 'cardiology' | 'psychiatry' | 'pediatric';
}
