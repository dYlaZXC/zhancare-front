import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/utils/api";
import type { Consultation } from "@/types/consultation";
import { useAuth } from "@/context/AuthContext";

export const useConsultationManager = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [newConsultation, setNewConsultation] = useState<Consultation | null>(null);
  const { user } = useAuth();

  const seenIds = useRef<Set<number>>(new Set());
  const dismissedIds = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if current user is a doctor
  const isDoctor = user?.role === 'doctor';

  const fetchConsultations = useCallback(async (status?: string) => {
    try {
      // Different endpoints based on user role
      const baseUrl = user?.role === 'patient'
        ? '/consultations/my-consultations/'
        : '/consultations/';

      const url = status ? `${baseUrl}?status=${status}` : baseUrl;
      const { data } = await api.get<Consultation[] | any>(url);

      // Handle different response formats
      if (Array.isArray(data)) {
        setConsultations(data);
      } else if (data && Array.isArray((data as any).results)) {
        // Handle paginated response
        setConsultations((data as any).results);
      } else if (data && Array.isArray((data as any).consultations)) {
        // Handle wrapped response
        setConsultations((data as any).consultations);
      } else {
        console.warn("Unexpected API response format:", data);
        setConsultations([]);
      }
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

  const fetchNewConsultations = useCallback(async () => {
    try {
      // Use same role-based endpoint logic
      const baseUrl = user?.role === 'patient'
        ? '/consultations/my-consultations/'
        : '/consultations/';

      const { data } = await api.get<Consultation[] | any>(baseUrl);

      // Handle different response formats and extract array
      let consultationsArray: Consultation[] = [];
      if (Array.isArray(data)) {
        consultationsArray = data;
      } else if (data && Array.isArray((data as any).results)) {
        consultationsArray = (data as any).results;
      } else if (data && Array.isArray((data as any).consultations)) {
        consultationsArray = (data as any).consultations;
      }

      const pending = consultationsArray.find(
        (c) =>
          c.status === "pending" &&
          !seenIds.current.has(c.id) &&
          !dismissedIds.current.has(c.id)
      );

      if (pending && !newConsultation) {
        setNewConsultation(pending);
        seenIds.current.add(pending.id);
        // Only play sound for doctors
        if (isDoctor) {
          playSound();
        }
      }
    } catch (error) {
      console.error("Failed to fetch new consultations:", error);
    }
  }, [newConsultation, playSound, isDoctor, user?.role]);

  useEffect(() => {
    fetchConsultations();
    const interval = setInterval(fetchNewConsultations, 5000);
    return () => clearInterval(interval);
  }, [fetchConsultations, fetchNewConsultations]);

  return {
    consultations,
    newConsultation,
    setNewConsultation,
    dismissedIds,
    fetchConsultations,
    stopSound,
  };
};
