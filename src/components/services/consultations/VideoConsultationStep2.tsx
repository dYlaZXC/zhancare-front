"use client";

import React from "react";
import { motion } from "framer-motion";
import DoctorSelect from "./DoctorSelect";

interface Step2Props {
  doctors: any[];
  selectedDoctorId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  symptoms: string;
  recommendedDoctor?: {
    id: number;
    name: string;
    doctor_type: string;
    reason: string;
  };
}

const VideoConsultationStep2: React.FC<Step2Props> = ({
  doctors,
  selectedDoctorId,
  onSelect,
  loading,
  onBack,
  onNext,
  symptoms,
  recommendedDoctor,
}) => {
  return (
    <motion.div
      className="space-y-6 p-6 bg-white shadow-xl rounded-2xl border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Выбор врача</h2>
        <p className="text-gray-500 text-sm">
          Выберите специалиста для консультации. Мы также подготовили рекомендацию на основе ваших симптомов.
        </p>

        {recommendedDoctor && (
          <motion.div
            className="p-4 border border-blue-200 bg-blue-50 rounded-lg shadow-sm space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-blue-800 font-medium">🧠 Рекомендация AI:</p>

            <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-700">
              <p className="font-medium mb-1 text-gray-900">Вопрос пациента:</p>
              <p className="whitespace-pre-wrap">{symptoms}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-700">
              <p className="font-medium mb-1 text-gray-900">Ответ AI:</p>
              <p>
                Мы рекомендуем <strong>{recommendedDoctor.name}</strong> ({recommendedDoctor.doctor_type}).
              </p>
              <p className="text-gray-600 italic mt-1">{recommendedDoctor.reason}</p>
            </div>

            <button
              onClick={() => onSelect(recommendedDoctor.id)}
              className="mt-2 text-sm text-blue-600 underline"
            >
              Выбрать этого врача
            </button>
          </motion.div>
        )}
      </div>

      <DoctorSelect
        doctors={doctors}
        selectedDoctorId={selectedDoctorId}
        onChange={onSelect}
        loading={loading}
      />

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="text-blue-600 underline text-sm">
          ⬅ Назад
        </button>

        <motion.button
          onClick={onNext}
          disabled={!selectedDoctorId}
          whileTap={{ scale: 0.97 }}
          whileHover={selectedDoctorId ? { scale: 1.02 } : {}}
          transition={{ type: "spring", stiffness: 300 }}
          className={`px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition shadow-sm ${
            selectedDoctorId
              ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white hover:shadow-lg"
              : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] opacity-50 cursor-not-allowed text-white"
          }`}
        >
          Далее ➡
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VideoConsultationStep2;
