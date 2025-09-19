"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/utils/api";
import type { Consultation } from "@/types/consultation";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "react-toastify";

interface ConsultationContextType {
  newConsultation: Consultation | null;
  dismissConsultation: (id: number) => void;
  acceptConsultation: (consultation: Consultation) => void;
  isWebSocketConnected: boolean;
}

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

export const useGlobalConsultation = () => {
  const context = useContext(ConsultationContext);
  if (context === undefined) {
    throw new Error("useGlobalConsultation must be used within a ConsultationProvider");
  }
  return context;
};

export const ConsultationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [newConsultation, setNewConsultation] = useState<Consultation | null>(null);
  const { user, token } = useAuth();

  const seenIds = useRef<Set<number>>(new Set());
  const dismissedIds = useRef<Set<number>>(new Set());

  // Check if current user is a doctor
  const isDoctor = user?.role === 'doctor';

  // Handle WebSocket messages for real-time consultation updates
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log("📥 Received WebSocket message:", message);

    if (message.type === 'consultation_created' && message.data) {
      const consultation: Consultation = message.data;

      // Only show popup for pending consultations that haven't been seen or dismissed
      if (
        consultation.status === "pending" &&
        !seenIds.current.has(consultation.id) &&
        !dismissedIds.current.has(consultation.id) &&
        !newConsultation
      ) {
        console.log("🚨 New urgent consultation received via WebSocket:", consultation);
        setNewConsultation(consultation);
        seenIds.current.add(consultation.id);

        // Show toast notification
        toast.info(`🚨 Новый срочный вызов от пациента!`, {
          autoClose: false,
          closeOnClick: false,
        });
      }
    }
  }, [newConsultation]);

  // Initialize WebSocket connection for doctors only
  const { isConnected } = useWebSocket({
    onMessage: isDoctor ? handleWebSocketMessage : undefined,
    onConnect: () => {
      if (isDoctor) {
        console.log("✅ WebSocket connected - listening for urgent consultations");
        toast.success("🔗 Подключено к системе уведомлений", { autoClose: 2000 });
      }
    },
    onDisconnect: () => {
      if (isDoctor) {
        console.log("💡 WebSocket not available - using polling fallback");
        // Don't show error toast since WebSocket server isn't implemented yet
      }
    },
    onError: (error) => {
      if (isDoctor) {
        console.log("💡 WebSocket server not ready - this is expected until backend implements WebSocket support");
      }
    }
  });

  const dismissConsultation = useCallback((id: number) => {
    dismissedIds.current.add(id);
    setNewConsultation(null);
  }, []);

  const rejectConsultation = useCallback(async (consultation: Consultation) => {
    try {
      await api.post(`/consultations/${consultation.meeting_id}/reject/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      setNewConsultation(null);
      toast.info("❌ Консультация отклонена");
    } catch (error) {
      console.error("Failed to reject consultation:", error);
      toast.error("⚠️ Ошибка при отклонении консультации");
    }
  }, [token]);

  const acceptConsultation = useCallback(async (consultation: Consultation) => {
    try {
      // Update consultation status to ongoing
      await api.post(
        `/consultations/${consultation.meeting_id}/status/`,
        { status: "ongoing" },
        { headers: { Authorization: `Token ${token}` } }
      );

      // Navigate to video call
      window.location.href = `/video-call/doctor?meetingId=${consultation.meeting_id}`;

      setNewConsultation(null);
      toast.success("✅ Консультация принята!");
    } catch (error) {
      console.error("Failed to accept consultation:", error);
      toast.error("⚠️ Ошибка при принятии консультации");
    }
  }, [token]);

  // Fallback polling when WebSocket is not available
  const fetchNewConsultationsFallback = useCallback(async () => {
    if (!isDoctor || !token || isConnected) return; // Only use fallback when WebSocket is not connected

    try {
      const { data } = await api.get<Consultation[] | any>('/consultations/doctor-consultations/');

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
        console.log("🚨 New urgent consultation found via fallback polling:", pending);
        setNewConsultation(pending);
        seenIds.current.add(pending.id);

        toast.info(`🚨 Новый срочный вызов от пациента!`, {
          autoClose: false,
          closeOnClick: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch new consultations via fallback:", error);
    }
  }, [isDoctor, token, isConnected, newConsultation]);

  // Use fallback polling when WebSocket is not connected
  useEffect(() => {
    if (!isDoctor) return;

    let interval: NodeJS.Timeout | null = null;

    // Add a small delay to let WebSocket attempt to connect first
    const fallbackTimer = setTimeout(() => {
      if (!isConnected) {
        console.log("🔄 Using polling fallback since WebSocket is not available");

        // Initial fetch
        fetchNewConsultationsFallback();

        // Set up polling interval as fallback
        interval = setInterval(fetchNewConsultationsFallback, 5000); // Check every 5 seconds
      }
    }, 3000); // Wait 3 seconds for WebSocket to connect

    return () => {
      clearTimeout(fallbackTimer);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isDoctor, isConnected, fetchNewConsultationsFallback]);

  const value = {
    newConsultation,
    dismissConsultation,
    acceptConsultation,
    isWebSocketConnected: isConnected,
  };

  return (
    <ConsultationContext.Provider value={value}>
      {children}
      {/* Global Urgent Consultation Popup */}
      {newConsultation && isDoctor && (
        <UrgentConsultationPopup
          consultation={newConsultation}
          onAccept={() => acceptConsultation(newConsultation)}
          onReject={() => rejectConsultation(newConsultation)}
          onDismiss={() => dismissConsultation(newConsultation.id)}
        />
      )}
    </ConsultationContext.Provider>
  );
};

// Global Urgent Consultation Popup Component
const UrgentConsultationPopup: React.FC<{
  consultation: Consultation;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
}> = ({ consultation, onAccept, onReject, onDismiss }) => {
  const [remainingTime, setRemainingTime] = useState(15);
  const [isRejected, setIsRejected] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isRejected) {
        onDismiss();
        toast.info("⏰ Время ожидания истекло");
      }
    }, 15000);

    const interval = setInterval(() => {
      setRemainingTime((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [onDismiss, isRejected]);

  const handleReject = () => {
    setIsRejected(true);
    onReject();
  };

  const progress = ((15 - remainingTime) / 15) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
      <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-5 sm:p-6 text-white space-y-5 transition-all animate-pulse">
        {/* Radial Countdown */}
        <div className="absolute -top-4 -right-4">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16">
            <svg className="absolute inset-0" viewBox="0 0 36 36">
              <path
                className="text-white/20"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-yellow-400"
                strokeWidth="3"
                strokeDasharray={`${(progress / 100) * 100}, 100`}
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-semibold">
              {remainingTime}s
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-base sm:text-lg font-bold uppercase shadow-md">
            {consultation.patient_name?.[0] ?? "P"}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold">🚨 Срочная консультация</h3>
            <p className="text-xs sm:text-sm text-white/70">Ожидает подтверждения</p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="space-y-1 text-sm sm:text-base">
          <p>
            👤 <b>Пациент:</b> {consultation.patient_name || "Неизвестный пациент"}
          </p>
          {consultation.patient_email && (
            <p>
              📧 <b>Email:</b> {consultation.patient_email}
            </p>
          )}
          {consultation.symptoms && (
            <p>
              🩺 <b>Симптомы:</b> {consultation.symptoms}
            </p>
          )}
          <p>
            ⏰ <b>Время:</b> {new Date(consultation.created_at).toLocaleString("ru-RU")}
          </p>
        </div>

        {/* Premium Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-2">
          <button
            onClick={onAccept}
            className="group flex items-center justify-center gap-2 bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-md hover:shadow-lg text-white py-2 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200"
          >
            ✅ Принять
          </button>
          <button
            onClick={handleReject}
            className="group flex items-center justify-center gap-2 bg-gradient-to-br from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-md hover:shadow-lg text-white py-2 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200"
          >
            ❌ Отклонить
          </button>
          <button
            onClick={onDismiss}
            className="group flex items-center justify-center gap-2 bg-gradient-to-br from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-md hover:shadow-lg text-white py-2 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200"
          >
            💤 Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};