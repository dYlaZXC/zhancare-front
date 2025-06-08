"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import CallButton from "./CallButton";
import { Sparkles, User, Stethoscope } from "lucide-react";

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
      className="space-y-6 p-6 bg-gradient-to-br from-white to-[#f6f9ff] shadow-2xl rounded-2xl border border-blue-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Step indicator */}
      <div className="text-xs text-gray-500 uppercase tracking-wide">Шаг 3 из 3</div>

      {/* Header */}
      <motion.h2
        className="text-3xl font-bold text-gray-900 flex items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Sparkles className="text-blue-600" size={28} />
        Подтверждение консультации
      </motion.h2>

      {/* Summary Blocks */}
      <motion.div
        className="space-y-4 text-sm text-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <User size={16} />
            Ваши симптомы
          </div>
          <p className="whitespace-pre-wrap text-gray-700">{symptoms}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <Stethoscope size={16} />
            Выбранный врач
          </div>
          <p className="text-gray-700">
            {doctorName} {doctorType && `(${doctorType})`}
          </p>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex justify-between items-center pt-4">
        {/* Styled Back Button */}
        <motion.button
          onClick={onBack}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition shadow-md bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:shadow-lg"
        >
          ⬅ Назад
        </motion.button>

        {/* Call */}
        <CallButton
          onClick={onCall}
          disabled={loading || !selectedDoctorId || waiting}
          loading={loading}
          waiting={waiting}
        />
      </div>

      {/* Waiting Block */}
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
              className="text-red-500 underline mt-2 text-xs hover:text-red-700 transition"
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
