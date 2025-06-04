// types/consultation.ts
export type ConsultationStatus = "pending" | "ongoing" | "completed" | "cancelled";

export interface Consultation {
  id: number;
  meeting_id: string;
  patient_name: string;
  patient_email: string | null;
  status: ConsultationStatus;
}
