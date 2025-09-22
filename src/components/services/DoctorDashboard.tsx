"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { websocketService } from "@/services/websocketService";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Volume2,
  Bell
} from "lucide-react";

interface IncomingConsultation {
  id: number;
  meeting_id: string;
  patient_name: string;
  patient_email: string;
  symptoms?: string;
  is_urgent?: boolean;
  created_at: string;
}

const DoctorDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ New state for popup system
  const [incomingConsultation, setIncomingConsultation] = useState<IncomingConsultation | null>(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [notificationSound] = useState(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3'); // Add notification sound
      audio.volume = 0.7;
      return audio;
    }
    return null;
  });

  useEffect(() => {
    fetchConsultations();

    // ✅ Setup WebSocket listeners for real-time notifications
    if (user?.role === 'doctor') {
      console.log('🔌 Setting up WebSocket listeners for doctor dashboard');

      // Connect to WebSocket with token
      console.log('🔌 DoctorDashboard connecting to WebSocket with token:', {
        hasToken: !!token,
        tokenLength: token?.length,
        userRole: user?.role,
        userId: user?.id
      });

      websocketService.connect(token);

      // Listen for new consultation requests
      const unsubscribeConsultationCreated = websocketService.on('consultation_created', (data: any) => {
        console.log('🔔 New consultation request received:', data);

        const consultationData: IncomingConsultation = {
          id: data.data?.id || data.id,
          meeting_id: data.data?.meeting_id || data.meeting_id,
          patient_name: data.data?.patient_name || data.patient_name,
          patient_email: data.data?.patient_email || data.patient_email,
          symptoms: data.data?.symptoms || data.symptoms,
          is_urgent: data.data?.is_urgent || data.is_urgent,
          created_at: data.data?.created_at || data.created_at
        };

        // Show popup notification
        setIncomingConsultation(consultationData);
        setShowNotificationPopup(true);

        // Play notification sound
        if (notificationSound) {
          notificationSound.play().catch(console.error);
        }

        // Show toast notification
        toast.info(`📞 Новый запрос на консультацию от ${consultationData.patient_name}`, {
          autoClose: 8000,
          onClick: () => setShowNotificationPopup(true)
        });

        // Auto-refresh consultations list
        fetchConsultations();
      });

      // Listen for consultation status changes
      const unsubscribeStatusChanged = websocketService.on('consultation_status_changed', (data: any) => {
        console.log('📊 Consultation status changed:', data);
        fetchConsultations();
      });

      // Cleanup listeners on unmount
      return () => {
        unsubscribeConsultationCreated();
        unsubscribeStatusChanged();
      };
    }
  }, [user, notificationSound]);

  const fetchConsultations = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await api.get("/consultations/");
      setConsultations(response.data);
    } catch (error) {
      console.error("Ошибка загрузки консультаций:", error);
      setError("Ошибка загрузки консультаций.");
    }

    setLoading(false);
  };

  const handleAccept = async (consultationId: number, meetingId?: string) => {
    setIsProcessingRequest(true);
    try {
      await api.post(`/consultations/${meetingId || consultationId}/accept/`, {});
      toast.success("✅ Консультация принята! Переход к видеозвонку...");

      // Close popup if accepting from popup
      if (showNotificationPopup) {
        setShowNotificationPopup(false);
        setIncomingConsultation(null);
      }

      // Redirect to video call
      if (meetingId) {
        window.location.href = `/video-call/doctor?meeting_id=${meetingId}`;
      }

      fetchConsultations();
    } catch (error) {
      console.error("Ошибка при принятии консультации:", error);
      toast.error("❌ Ошибка при принятии консультации.");
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const handleReject = async (consultationId: number, meetingId?: string) => {
    setIsProcessingRequest(true);
    try {
      await api.post(`/consultations/${meetingId || consultationId}/reject/`, {});
      toast.info("❌ Консультация отклонена.");

      // Close popup if rejecting from popup
      if (showNotificationPopup) {
        setShowNotificationPopup(false);
        setIncomingConsultation(null);
      }

      fetchConsultations();
    } catch (error) {
      console.error("Ошибка при отклонении консультации:", error);
      toast.error("❌ Ошибка при отклонении консультации.");
    } finally {
      setIsProcessingRequest(false);
    }
  };

  // ✅ New handlers for popup
  const handlePopupAccept = () => {
    if (incomingConsultation) {
      handleAccept(incomingConsultation.id, incomingConsultation.meeting_id);
    }
  };

  const handlePopupReject = () => {
    if (incomingConsultation) {
      handleReject(incomingConsultation.id, incomingConsultation.meeting_id);
    }
  };

  const handlePopupClose = () => {
    setShowNotificationPopup(false);
    // Don't clear incomingConsultation immediately in case user wants to reopen
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-semibold text-[#001E80]">Панель врача</h2>
      <p className="text-gray-600 mt-2">Список ожидающих консультаций</p>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <ul>
        {consultations.map((consultation) => (
          <li key={consultation.id} className="mt-4 p-4 border rounded-lg">
            <p>
              Пациент: {consultation.patient.name} ({consultation.patient.email})
            </p>
            <button
              onClick={() => handleAccept(consultation.id)}
              className="bg-green-500 px-4 py-2 rounded-lg text-white mt-2"
            >
              ✅ Принять
            </button>
            <button
              onClick={() => handleReject(consultation.id)}
              className="bg-red-500 px-4 py-2 ml-2 rounded-lg text-white mt-2"
            >
              ❌ Отклонить
            </button>
          </li>
        ))}
      </ul>

      {/* ✅ Real-time Consultation Request Popup */}
      <AnimatePresence>
        {showNotificationPopup && incomingConsultation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handlePopupClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Входящий вызов
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Bell className="w-4 h-4" />
                  <span>Новый запрос на консультацию</span>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{incomingConsultation.patient_name}</h4>
                    <p className="text-sm text-gray-600">{incomingConsultation.patient_email}</p>
                  </div>
                  {incomingConsultation.is_urgent && (
                    <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      Срочно
                    </div>
                  )}
                </div>

                {incomingConsultation.symptoms && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm text-gray-600 mb-1">Симптомы:</p>
                    <p className="text-sm text-gray-900 line-clamp-3">{incomingConsultation.symptoms}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Получено: {new Date(incomingConsultation.created_at).toLocaleTimeString('ru-RU')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePopupReject}
                  disabled={isProcessingRequest}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  {isProcessingRequest ? 'Отклонение...' : 'Отклонить'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePopupAccept}
                  disabled={isProcessingRequest}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isProcessingRequest ? 'Принятие...' : 'Принять'}
                </motion.button>
              </div>

              {/* Additional info */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Нажмите вне окна или ожидайте автоматического закрытия
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
