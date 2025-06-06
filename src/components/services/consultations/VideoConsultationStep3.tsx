"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import CallButton from "./CallButton";

interface Step3Props {
  symptoms: string;
  doctors: any[];
  selectedDoctorId: number | null;
  onBack: () => void;
  onCall: () => void;
  onCancel: () => void;
  loading: boolean;
  waiting: boolean;
}

const VideoConsultationStep3: React.FC<Step3Props> = ({
  symptoms,
  doctors,
  selectedDoctorId,
  onBack,
  onCall,
  onCancel,
  loading,
  waiting,
}) => {
  const doctor = doctors.find((d) => d.id === selectedDoctorId);
  const doctorName = doctor?.name || "Не выбран";
  const doctorType = doctor?.doctor_type || "";

  return (
    <motion.div
      className="space-y-6 p-6 bg-white shadow-xl rounded-2xl border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h2
        className="text-2xl font-semibold text-gray-800"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Подтверждение консультации
      </motion.h2>

      <motion.div
        className="space-y-3 text-sm text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p>
          <strong>📝 Ваши симптомы:</strong><br />
          <span className="inline-block mt-1 bg-gray-100 p-2 rounded text-gray-800 whitespace-pre-wrap">
            {symptoms}
          </span>
        </p>
        <p>
          <strong>👨‍⚕️ Выбранный врач:</strong>{" "}
          {doctorName} {doctorType && `(${doctorType})`}
        </p>
      </motion.div>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={onBack}
          className="text-blue-600 underline text-sm"
        >
          ⬅ Назад
        </button>
        <CallButton
          onClick={onCall}
          disabled={loading || !selectedDoctorId || waiting}
          loading={loading}
          waiting={waiting}
        />
      </div>

      <AnimatePresence>
        {waiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-blue-600 mt-5 flex flex-col items-center"
          >
            <p className="animate-pulse">⏳ Ждём подключения врача...</p>
            <button
              onClick={onCancel}
              className="text-red-500 underline mt-2 text-xs"
            >
              Отменить запрос
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoConsultationStep3;
