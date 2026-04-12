"use client";

/**
 * Optimized Consultation Context using the new WebSocket service
 *
 * Features:
 * - Clean separation of concerns
 * - Type-safe event handling
 * - Better error handling
 * - Optimized popup logic
 * - Built-in debugging
 */

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { consultationWebSocket, ConsultationData, useConsultationWebSocket } from "@/services/consultationWebSocket";

interface OptimizedConsultationContextType {
  activeConsultation: ConsultationData | null;
  dismissConsultation: (id: number) => void;
  acceptConsultation: (consultation: ConsultationData) => void;
  rejectConsultation: (consultation: ConsultationData) => void;
  isWebSocketConnected: boolean;
  consultationHistory: ConsultationData[];
  clearHistory: () => void;
}

const OptimizedConsultationContext = createContext<OptimizedConsultationContextType | undefined>(undefined);

export const useOptimizedConsultation = () => {
  const context = useContext(OptimizedConsultationContext);
  if (context === undefined) {
    throw new Error("useOptimizedConsultation must be used within an OptimizedConsultationProvider");
  }
  return context;
};

export const OptimizedConsultationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const [activeConsultation, setActiveConsultation] = useState<ConsultationData | null>(null);
  const [consultationHistory, setConsultationHistory] = useState<ConsultationData[]>([]);

  // Refs for tracking seen and dismissed consultations
  const seenConsultationIds = useRef<Set<number>>(new Set());
  const dismissedConsultationIds = useRef<Set<number>>(new Set());

  // Get user context
  const { user, token } = useAuth();
  const isDoctor = !!user?.roles?.includes('doctor');

  // ==========================================
  // WebSocket Event Handlers
  // ==========================================

  const handleConsultationCreated = useCallback((consultation: ConsultationData) => {
    // console.log("🆕 New consultation created:", consultation);

    // Add to history
    setConsultationHistory(prev => [consultation, ...prev.slice(0, 9)]); // Keep last 10

    // Only show popup for doctors and pending urgent consultations
    if (
      isDoctor &&
      consultation.status === "pending" &&
      consultation.is_urgent &&
      !seenConsultationIds.current.has(consultation.id) &&
      !dismissedConsultationIds.current.has(consultation.id) &&
      !activeConsultation // Don't show if there's already an active consultation
    ) {
      // console.log("🚨 Showing urgent consultation popup:", consultation);

      setActiveConsultation(consultation);
      seenConsultationIds.current.add(consultation.id);

      // Show toast notification
      toast.info(`🚨 Срочная консультация от ${consultation.patient_name}!`, {
        autoClose: false,
        closeOnClick: false,
        position: 'top-right'
      });
    }
  }, [isDoctor, activeConsultation]);

  const handleConsultationUpdated = useCallback((consultation: ConsultationData) => {
    // console.log("📝 Consultation updated:", consultation);

    // Update in history
    setConsultationHistory(prev =>
      prev.map(c => c.id === consultation.id ? consultation : c)
    );

    // Update active consultation if it matches
    if (activeConsultation?.id === consultation.id) {
      setActiveConsultation(consultation);
    }
  }, [activeConsultation]);

  const handleConsultationStatusChanged = useCallback((consultation: ConsultationData) => {
    // console.log("🔄 Consultation status changed:", consultation);

    // Update in history
    setConsultationHistory(prev =>
      prev.map(c => c.id === consultation.id ? consultation : c)
    );

    // If the active consultation status changed, handle accordingly
    if (activeConsultation?.id === consultation.id) {
      if (consultation.status === 'ongoing') {
        toast.success("✅ Консультация началась!");
        setActiveConsultation(null); // Clear popup since consultation started
      } else if (consultation.status === 'cancelled') {
        toast.error("❌ Консультация отменена");
        setActiveConsultation(null);
      } else if (consultation.status === 'completed') {
        toast.info("✅ Консультация завершена");
        setActiveConsultation(null);
      }
    }
  }, [activeConsultation]);

  const handleWebSocketConnect = useCallback(() => {
    // console.log("✅ Consultation WebSocket connected");
    if (isDoctor) {
      toast.success("🔗 Подключено к системе консультаций", {
        autoClose: 2000,
        position: 'top-right'
      });
    }
  }, [isDoctor]);

  const handleWebSocketDisconnect = useCallback(() => {
    // console.log("📡 Consultation WebSocket disconnected");
    if (isDoctor) {
      toast.warning("⚠️ Соединение с системой консультаций потеряно", {
        autoClose: 3000,
        position: 'top-right'
      });
    }
  }, [isDoctor]);

  const handleWebSocketError = useCallback((error: string) => {
    console.error("❌ Consultation WebSocket error:", error);
    toast.error(`❌ Ошибка соединения: ${error}`, {
      autoClose: 5000,
      position: 'top-right'
    });
  }, []);

  // ==========================================
  // Initialize WebSocket Connection
  // ==========================================

  const { isConnected } = useConsultationWebSocket({
    onConsultationCreated: handleConsultationCreated,
    onConsultationUpdated: handleConsultationUpdated,
    onConsultationStatusChanged: handleConsultationStatusChanged,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
    onError: handleWebSocketError,
    userRole: user?.role as 'doctor' | 'patient',
    userId: user?.id
  });

  // ==========================================
  // Consultation Actions
  // ==========================================

  const dismissConsultation = useCallback((id: number) => {
    // console.log(`💤 Dismissing consultation ${id}`);
    dismissedConsultationIds.current.add(id);
    setActiveConsultation(null);

    toast.info("💤 Консультация отложена", {
      autoClose: 2000,
      position: 'top-right'
    });
  }, []);

  const acceptConsultation = useCallback(async (consultation: ConsultationData) => {
    // console.log(`✅ Accepting consultation ${consultation.id}`);

    try {
      // Update consultation status to ongoing
      const response = await fetch(`/api/v1/consultations/${consultation.meeting_id}/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ status: 'ongoing' })
      });

      if (response.ok) {
        // Navigate to video call
        window.location.href = `/video-call/doctor?meetingId=${consultation.meeting_id}`;

        setActiveConsultation(null);
        toast.success("✅ Консультация принята!", {
          autoClose: 2000,
          position: 'top-right'
        });
      } else {
        throw new Error('Failed to accept consultation');
      }
    } catch (error) {
      console.error("Failed to accept consultation:", error);
      toast.error("⚠️ Ошибка при принятии консультации", {
        autoClose: 3000,
        position: 'top-right'
      });
    }
  }, [token]);

  const rejectConsultation = useCallback(async (consultation: ConsultationData) => {
    // console.log(`❌ Rejecting consultation ${consultation.id}`);

    try {
      const response = await fetch(`/api/v1/consultations/${consultation.meeting_id}/reject/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        setActiveConsultation(null);
        toast.info("❌ Консультация отклонена", {
          autoClose: 2000,
          position: 'top-right'
        });
      } else {
        throw new Error('Failed to reject consultation');
      }
    } catch (error) {
      console.error("Failed to reject consultation:", error);
      toast.error("⚠️ Ошибка при отклонении консультации", {
        autoClose: 3000,
        position: 'top-right'
      });
    }
  }, [token]);

  const clearHistory = useCallback(() => {
    setConsultationHistory([]);
    seenConsultationIds.current.clear();
    dismissedConsultationIds.current.clear();
  }, []);

  // ==========================================
  // Context Value
  // ==========================================

  const value = {
    activeConsultation,
    dismissConsultation,
    acceptConsultation,
    rejectConsultation,
    isWebSocketConnected: isConnected,
    consultationHistory,
    clearHistory
  };

  return (
    <OptimizedConsultationContext.Provider value={value}>
      {children}

      {/* Render active consultation popup */}
      {activeConsultation && isDoctor && (
        <OptimizedConsultationPopup
          consultation={activeConsultation}
          onAccept={() => acceptConsultation(activeConsultation)}
          onReject={() => rejectConsultation(activeConsultation)}
          onDismiss={() => dismissConsultation(activeConsultation.id)}
        />
      )}
    </OptimizedConsultationContext.Provider>
  );
};

// ==========================================
// Optimized Consultation Popup Component
// ==========================================

interface OptimizedConsultationPopupProps {
  consultation: ConsultationData;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
}

const OptimizedConsultationPopup: React.FC<OptimizedConsultationPopupProps> = ({
  consultation,
  onAccept,
  onReject,
  onDismiss
}) => {
  const [remainingTime, setRemainingTime] = useState(30); // 30 seconds timer
  const [isRejected, setIsRejected] = useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isRejected) {
        onDismiss();
        toast.info("⏰ Время ожидания истекло");
      }
    }, 30000); // 30 seconds

    const interval = setInterval(() => {
      setRemainingTime(prev => prev <= 1 ? 0 : prev - 1);
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

  const progress = ((30 - remainingTime) / 30) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-8">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-[#ebf1ff] to-[#e1eaff] border border-[#c1d3ff] shadow-2xl p-6 text-[#132859] space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3772ff] to-[#2956bf] flex items-center justify-center text-xl font-bold text-white">
                {consultation.patient_name?.[0] ?? "P"}
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#132859]">🚨 Срочная консультация</h3>
              <p className="text-sm text-[#2956bf] font-medium">Требует немедленного внимания</p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-[#132859]">{remainingTime}</div>
            <div className="text-xs text-[#2956bf]">сек</div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="bg-white/70 rounded-2xl p-4 border border-[#c1d3ff]/50 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#2956bf]">Пациент:</span>
            <span className="font-semibold text-[#132859]">{consultation.patient_name}</span>
          </div>

          {consultation.patient_email && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#2956bf]">Email:</span>
              <span className="text-sm text-[#132859]">{consultation.patient_email}</span>
            </div>
          )}

          {consultation.symptoms && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-[#2956bf]">Симптомы:</span>
              <p className="text-sm text-[#132859] bg-[#ebf1ff] p-2 rounded">{consultation.symptoms}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#2956bf]">Время:</span>
            <span className="text-sm text-[#132859]">{new Date(consultation.created_at).toLocaleString("ru-RU")}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-all"
          >
            ✅ Принять
          </button>

          <button
            onClick={handleReject}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all"
          >
            ❌ Отклонить
          </button>

          <button
            onClick={onDismiss}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-3 rounded-xl font-semibold transition-all"
          >
            💤
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#c1d3ff] rounded-full h-2">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              remainingTime <= 10 ? 'bg-red-500' : 'bg-[#3772ff]'
            }`}
            style={{ width: `${100 - progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default OptimizedConsultationProvider;