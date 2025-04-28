import { api } from "@/utils/api";

export const fetchAvailableDoctors = async () => {
  return api.get("/auth/doctor/available/");
};

export const startConsultation = async (doctor_id: number) => {
  return api.post("/consultations/start/", { doctor_id });
};

export const checkConsultationStatus = async (meetingId: string) => {
  return api.get(`/consultations/status/?meeting_id=${meetingId}`);
};
