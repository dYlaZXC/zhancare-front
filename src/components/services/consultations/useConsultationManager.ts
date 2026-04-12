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

  // Check if current user is a doctor
  const fetchConsultations = useCallback(async (status?: string) => {
    try {
      // Different endpoints based on user role
      const baseUrl = isPatient
        ? '/consultations/my-consultations/'
        : '/consultations/doctor-consultations/';

      const url = status ? `${baseUrl}?status=${status}` : baseUrl;
      // console.log(`🔄 Fetching consultations from: ${url}`);
      const { data } = await api.get<Consultation[] | any>(url);

      // Handle different response formats
      let consultationsArray: Consultation[] = [];
      if (Array.isArray(data)) {
        consultationsArray = data;
      } else if (data && Array.isArray((data as any).results)) {
        // Handle paginated response
        consultationsArray = (data as any).results;
      } else if (data && Array.isArray((data as any).consultations)) {
        // Handle wrapped response
        consultationsArray = (data as any).consultations;
      } else {
        console.warn("Unexpected API response format:", data);
        consultationsArray = [];
      }

      // Sort by created_at descending (most recent first) to ensure latest consultations appear first
      const sortedConsultations = consultationsArray.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      // console.log(`✅ Fetched ${sortedConsultations.length} consultations`);
      setConsultations(sortedConsultations);
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
      setConsultations([]);
    }
  }, [user?.role]);

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
