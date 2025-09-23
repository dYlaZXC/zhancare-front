"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Video,
  MessageSquare,
  AlertCircle,
  XCircle,
  User,
  Volume2,
  RefreshCw
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

interface UrgentConsultationPopupProps {
  isVisible: boolean;
  consultation: IncomingConsultation | null;
  isProcessing: boolean;
  onAccept: () => void;
  onReject: (isTimerExpired?: boolean) => void;
  onClose: () => void;
}

const UrgentConsultationPopup: React.FC<UrgentConsultationPopupProps> = ({
  isVisible,
  consultation,
  isProcessing,
  onAccept,
  onReject,
  onClose
}) => {
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds countdown
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Start countdown when popup becomes visible
  useEffect(() => {
    if (isVisible && consultation) {
      setTimeLeft(15);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  }, [isVisible, consultation]);

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0 || isProcessing) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onReject(true); // Pass true to indicate timer expired
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft, isProcessing, onReject]);

  if (!consultation) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl animate-pulse">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {consultation.is_urgent ? "🚨 Срочная консультация" : "📞 Новая консультация"}
                    </h3>
                    <p className="text-red-100 text-sm">Пациент ожидает ответа</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Countdown Timer */}
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl">
                    <Clock className="w-4 h-4" />
                    <span className={`font-bold text-sm ${timeLeft <= 5 ? 'animate-pulse text-yellow-200' : ''}`}>
                      {timeLeft}с
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/30 h-1">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / 15) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Patient Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{consultation.patient_name}</h4>
                  <p className="text-sm text-gray-600">{consultation.patient_email}</p>
                </div>
              </div>

              {/* Symptoms */}
              {consultation.symptoms && (
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Симптомы
                  </h5>
                  <p className="text-blue-800 text-sm">{consultation.symptoms}</p>
                </div>
              )}

              {/* Urgency indicator */}
              {consultation.is_urgent && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Срочная консультация требует немедленного внимания</span>
                  </div>
                </div>
              )}

              {/* Time info */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Получено: {new Date(consultation.created_at).toLocaleTimeString('ru-RU')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onReject(false)}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Обработка..." : "Отклонить"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAccept}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    Принять звонок
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrgentConsultationPopup;
export type { IncomingConsultation };