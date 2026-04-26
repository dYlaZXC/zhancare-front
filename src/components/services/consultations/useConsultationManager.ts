import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/utils/api";
import type { Consultation } from "@/types/consultation";
import { useAuth } from "@/context/AuthContext";

export const useConsultationManager = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [newConsultation, setNewConsultation] = useState<Consultation | null>(null);
  const { user, isDoctor, isPatient } = useAuth();

  const seenIds = useRef<Set<number>>(new Set());
  const dismissedIds = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchConsultations = useCallback(async (status?: string) => {
    try {
      const results: Consultation[] = [];

      // 1. Video consultations
      const baseUrl = isPatient
        ? '/consultations/my-consultations/'
        : '/consultations/doctor-consultations/';
      const url = status ? `${baseUrl}?status=${status}` : baseUrl;
      const { data } = await api.get<any>(url);
      let videoList: any[] = [];
      if (Array.isArray(data)) videoList = data;
      else if (Array.isArray(data?.results)) videoList = data.results;
      else if (Array.isArray(data?.consultations)) videoList = data.consultations;
      videoList.forEach(c => results.push({ ...c, type: 'video' as const }));

      // 2. Clinic (offline) appointments — patients only
      if (isPatient) {
        try {
          const { data: clinicData } = await api.get<any>('/clinic-appointments/my-appointments/');
          const rawClinicList: any[] = Array.isArray(clinicData) ? clinicData : (clinicData?.results || []);
          // Deduplicate by doctor + appointment_time (keep latest id)
          const seenClinic = new Map<string, any>();
          rawClinicList.forEach(a => {
            const key = `${a.doctor}_${a.appointment_time}`;
            if (!seenClinic.has(key) || a.id > seenClinic.get(key).id) seenClinic.set(key, a);
          });
          const clinicList = Array.from(seenClinic.values());
          clinicList.forEach(a => results.push({
            id: a.id + 100000,
            type: 'offline' as const,
            status: a.status === 'confirmed' ? 'confirmed' : a.status,
            scheduled_at: a.appointment_time,
            appointment_time: a.appointment_time,
            created_at: a.created_at,
            doctor_first_name: a.doctor_name?.split(' ')[0] || '',
            doctor_last_name: a.doctor_name?.split(' ').slice(1).join(' ') || '',
            doctor_type: a.doctor_type,
            clinic_name: a.clinic_name,
            clinic_address: a.clinic_address,
          } as Consultation));
        } catch { /* ignore if endpoint not available */ }

        // 3. Home appointments
        try {
          const { data: homeData } = await api.get<any>('/appointments/my-appointments/');
          const homeList: any[] = Array.isArray(homeData) ? homeData : (homeData?.results || []);
          homeList.forEach(a => results.push({
            id: a.id + 200000,
            type: 'home' as const,
            status: a.status,
            scheduled_at: a.appointment_time,
            appointment_time: a.appointment_time,
            created_at: a.created_at,
            doctor_first_name: a.doctor_first_name || '',
            doctor_last_name: a.doctor_last_name || '',
          } as Consultation));
        } catch { /* ignore if endpoint not available */ }
      }

      results.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setConsultations(results);
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
      setConsultations([]);
    }
  }, [user?.role, isPatient]);

  const playSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(() => {});
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Note: fetchNewConsultations removed - now handled via WebSocket in ConsultationContext

  useEffect(() => {
    fetchConsultations();
    // Only poll for main consultations list (table data)
    // New consultations are now handled via WebSocket in ConsultationContext
    const interval = setInterval(() => {
      fetchConsultations(); // Update main consultations list only
    }, 10000); // Reduced frequency since urgent notifications are real-time
    return () => clearInterval(interval);
  }, [fetchConsultations]);

  return {
    consultations,
    newConsultation,
    setNewConsultation,
    dismissedIds,
    fetchConsultations,
    stopSound,
  };
};
