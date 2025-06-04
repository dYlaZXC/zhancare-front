import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import type { Consultation } from "@/types/consultation";

export const useConsultationManager = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [newConsultation, setNewConsultation] = useState<Consultation | null>(null);

  const seenIds = useRef<Set<number>>(new Set());
  const dismissedIds = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchConsultations = async () => {
    try {
      const { data } = await api.get<Consultation[]>("/consultations/");
      setConsultations(data);
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
    }
  };

  const playSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(() => {});
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const fetchNewConsultations = async () => {
    try {
      const { data } = await api.get<Consultation[]>("/consultations/");
      const pending = data.find(
        (c) =>
          c.status === "pending" &&
          !seenIds.current.has(c.id) &&
          !dismissedIds.current.has(c.id)
      );

      if (pending && !newConsultation) {
        setNewConsultation(pending);
        seenIds.current.add(pending.id);
        playSound();
      }
    } catch (error) {
      console.error("Failed to fetch new consultations:", error);
    }
  };

  useEffect(() => {
    fetchConsultations();
    const interval = setInterval(fetchNewConsultations, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    consultations,
    newConsultation,
    setNewConsultation,
    dismissedIds,
    fetchConsultations,
    stopSound,
  };
};
