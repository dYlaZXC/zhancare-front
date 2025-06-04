"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faWindowClose,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import type { Consultation } from "@/types/consultation";

interface ConsultationPopupProps {
  consultation: Consultation;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
  timeoutMs?: number;
}

export const ConsultationPopup: React.FC<ConsultationPopupProps> = ({
  consultation,
  onAccept,
  onReject,
  onDismiss,
  timeoutMs = 15000,
}) => {
  const totalSeconds = timeoutMs / 1000;
  const [remainingTime, setRemainingTime] = useState(totalSeconds);

  useEffect(() => {
    const timeout = setTimeout(onReject, timeoutMs);
    const interval = setInterval(() => {
      setRemainingTime((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [onReject, timeoutMs]);

  const progress = ((totalSeconds - remainingTime) / totalSeconds) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8"
    >
      <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-5 sm:p-6 text-white space-y-5 transition-all">
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center text-base sm:text-lg font-bold uppercase shadow-md">
            {consultation.patient_name?.[0] ?? "P"}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Новая консультация</h3>
            <p className="text-xs sm:text-sm text-white/70">Ожидает подтверждения</p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="space-y-1 text-sm sm:text-base">
          <p>
            👤 <b>Пациент:</b> {consultation.patient_name}
          </p>
          <p>
            📧 <b>Email:</b>{" "}
            {consultation.patient_email ? (
              consultation.patient_email
            ) : (
              <span className="italic text-white/60">не указан</span>
            )}
          </p>
        </div>

        {/* Premium Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-2">
          <button
            onClick={onAccept}
            className="group flex items-center justify-center gap-2 bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-md hover:shadow-lg text-white py-2 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200"
          >
            <FontAwesomeIcon icon={faCheckCircle} />
            Принять
          </button>
          <button
            onClick={onReject}
            className="group flex items-center justify-center gap-2 bg-gradient-to-br from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-md hover:shadow-lg text-white py-2 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200"
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            Отклонить
          </button>
          <button
            onClick={onDismiss}
            className="group flex items-center justify-center gap-2 bg-gradient-to-br from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-md hover:shadow-lg text-white py-2 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200"
          >
            <FontAwesomeIcon icon={faWindowClose} />
            Закрыть
          </button>
        </div>
      </div>
    </motion.div>
  );
};
