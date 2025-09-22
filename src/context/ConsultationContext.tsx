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
      console.log("🔍 Consultation data:", consultation);
      console.log("🔍 Consultation status:", consultation.status);
      console.log("🔍 Current newConsultation:", newConsultation);
      console.log("🔍 seenIds:", Array.from(seenIds.current));
      console.log("🔍 dismissedIds:", Array.from(dismissedIds.current));

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
        console.log("💡 WebSocket connection lost - will reconnect automatically");
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

  // WebSocket handles real-time consultation notifications
  // No fallback polling needed since WebSocket is reliable

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-8">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-[#ebf1ff] to-[#e1eaff] border border-[#c1d3ff] shadow-2xl p-6 text-[#132859] space-y-6 transition-all duration-300 transform scale-100 hover:scale-[1.02]">
        
        {/* Header with urgent indicator */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3772ff] to-[#2956bf] flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {consultation.patient_name?.[0] ?? "P"}
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#132859] flex items-center gap-2">
                🚨 Срочная консультация
              </h3>
              <p className="text-sm text-[#2956bf] font-medium">Требует немедленного внимания</p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#c1d3ff]"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-1000 ${remainingTime <= 5 ? 'text-red-500' : remainingTime <= 10 ? 'text-yellow-500' : 'text-[#3772ff]'}`}
                  strokeWidth="3"
                  strokeDasharray={`${100 - progress}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-bold ${remainingTime <= 5 ? 'text-red-500' : 'text-[#132859]'}`}>
                  {remainingTime}
                </span>
                <span className="text-xs text-[#2956bf]">сек</span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Information Card */}
        <div className="bg-white/70 rounded-2xl p-4 border border-[#c1d3ff]/50 space-y-3">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#ebf1ff] border border-[#c1d3ff]/30">
              <div className="w-8 h-8 rounded-full bg-[#3772ff] flex items-center justify-center text-white text-xs">
                👤
              </div>
              <div>
                <p className="text-xs text-[#2956bf] font-medium">Пациент</p>
                <p className="font-semibold text-[#132859]">{consultation.patient_name || "Неизвестный пациент"}</p>
              </div>
            </div>

            {consultation.patient_email && (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-[#ebf1ff] border border-[#c1d3ff]/30">
                <div className="w-8 h-8 rounded-full bg-[#3772ff] flex items-center justify-center text-white text-xs">
                  📧
                </div>
                <div>
                  <p className="text-xs text-[#2956bf] font-medium">Email</p>
                  <p className="font-semibold text-[#132859] text-xs">{consultation.patient_email}</p>
                </div>
              </div>
            )}

            {consultation.symptoms && (
              <div className="flex items-start gap-3 p-2 rounded-xl bg-[#ebf1ff] border border-[#c1d3ff]/30">
                <div className="w-8 h-8 rounded-full bg-[#3772ff] flex items-center justify-center text-white text-xs mt-0.5">
                  🩺
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#2956bf] font-medium">Симптомы</p>
                  <p className="font-semibold text-[#132859] text-sm leading-relaxed">{consultation.symptoms}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#ebf1ff] border border-[#c1d3ff]/30">
              <div className="w-8 h-8 rounded-full bg-[#3772ff] flex items-center justify-center text-white text-xs">
                ⏰
              </div>
              <div>
                <p className="text-xs text-[#2956bf] font-medium">Время обращения</p>
                <p className="font-semibold text-[#132859]">{new Date(consultation.created_at).toLocaleString("ru-RU")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onAccept}
            className="flex-1 group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 shadow-lg hover:shadow-xl text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-lg">✅</span>
              <span>Принять</span>
            </div>
          </button>
          
          <button
            onClick={handleReject}
            className="flex-1 group relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 shadow-lg hover:shadow-xl text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-lg">❌</span>
              <span>Отклонить</span>
            </div>
          </button>
          
          <button
            onClick={onDismiss}
            className="group relative overflow-hidden bg-gradient-to-br from-[#283353] to-[#202942] hover:from-[#202942] hover:to-[#1e263e] focus:outline-none focus:ring-4 focus:ring-[#c1d3ff] shadow-lg hover:shadow-xl text-white py-3 px-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center justify-center">
              <span className="text-lg">💤</span>
            </div>
          </button>
        </div>

        {/* Progress bar at the bottom */}
        <div className="w-full bg-[#c1d3ff] rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${
              remainingTime <= 5 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : remainingTime <= 10 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                : 'bg-gradient-to-r from-[#3772ff] to-[#2956bf]'
            }`}
            style={{ width: `${100 - progress}%` }}
          />
        </div>

        {/* Urgency indicator */}
        <div className="text-center">
          <p className="text-sm font-medium text-[#2956bf]">
            {remainingTime <= 5 
              ? "⚠️ Критически важно!" 
              : remainingTime <= 10 
              ? "⏰ Требует внимания" 
              : "🩺 Новая консультация"}
          </p>
        </div>
      </div>
    </div>
  );
};