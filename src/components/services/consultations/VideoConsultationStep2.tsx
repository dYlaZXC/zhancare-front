"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Smile } from "lucide-react";
import clsx from "clsx";
import DoctorSelect from "./DoctorSelect";

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
}

interface Step2Props {
  doctors: Doctor[];
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
  aiErrorData?: {
    specialty: string;
    reason: string;
    raw: string;
  };
  fallbackUsed?: boolean;
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
  aiErrorData,
  fallbackUsed,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const selectedDoctor = useMemo(
    () => doctors.find((doc) => doc.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const showAIBlock = recommendedDoctor || aiErrorData;

  return (
    <motion.div
      className="p-6 bg-gradient-to-br from-white to-[#f6f9ff] shadow-2xl rounded-2xl border border-blue-100 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-xs text-gray-500 uppercase tracking-wide">Шаг 2 из 3</div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-blue-600" size={28} />
          Выбор врача
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Мы используем AI, чтобы рекомендовать врача на основе ваших симптомов. Вы можете
          воспользоваться рекомендацией или выбрать другого врача вручную.
        </p>
      </div>

      {showAIBlock && (
        <motion.div
          className={clsx(
            "p-4 rounded-lg shadow space-y-4",
            fallbackUsed
              ? "border-yellow-300 bg-yellow-50"
              : recommendedDoctor
              ? "border-blue-200 bg-blue-50"
              : "border-red-300 bg-red-50"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p
            className={clsx(
              "font-semibold text-lg",
              fallbackUsed
                ? "text-yellow-800"
                : recommendedDoctor
                ? "text-blue-800"
                : "text-red-700"
            )}
          >
            🤖 Рекомендация AI
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-2 shadow-md">
            <p className="font-medium text-gray-900">Вы описали симптомы:</p>
            <p className="whitespace-pre-wrap text-gray-700">{symptoms}</p>
          </div>

          {aiErrorData && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-2">
              <p className="font-medium text-gray-900">AI порекомендовал:</p>
              <p>
                <strong>Специализация:</strong> {aiErrorData.specialty}
              </p>
              <p>
                <strong>Пояснение:</strong>{" "}
                <span className="italic text-gray-600">{aiErrorData.reason}</span>
              </p>
            </div>
          )}

          {recommendedDoctor && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-2">
              <p>
                {fallbackUsed ? (
                  <span>
                    Назначен врач общей практики —{" "}
                    <strong>{recommendedDoctor.name}</strong> (
                    <em>{recommendedDoctor.doctor_type}</em>).
                  </span>
                ) : (
                  <span>
                    AI рекомендовал врача: <strong>{recommendedDoctor.name}</strong> (
                    <em>{recommendedDoctor.doctor_type}</em>).
                  </span>
                )}
              </p>
              <p className="text-gray-600 italic">{recommendedDoctor.reason}</p>

              <button
                onClick={() => onSelect(recommendedDoctor.id)}
                className="mt-4 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
              >
                ✅ Выбрать этого врача
              </button>

              {fallbackUsed && aiErrorData && (
                <div className="mt-4 flex items-start gap-3 border border-yellow-300 bg-yellow-100 text-yellow-900 rounded-xl p-4 shadow-sm text-sm">
                  <div className="flex-shrink-0 bg-yellow-200 rounded-full p-2">
                    <Smile className="text-yellow-700" size={20} />
                  </div>
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-semibold">
                      Врач по направлению <strong>{aiErrorData.specialty}</strong> пока недоступен.
                    </p>
                    <p className="text-sm text-gray-700">
                      Мы выбрали терапевта, чтобы вы могли начать консультацию без задержек.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      <DoctorSelect
        doctors={doctors}
        selectedDoctorId={selectedDoctorId}
        onChange={onSelect}
        loading={loading}
      />

      {!loading && doctors.length === 0 && (
        <p className="text-red-600 text-sm">❗ Нет доступных врачей в данный момент.</p>
      )}

      {selectedDoctor && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="border border-green-200 bg-green-50 rounded-lg p-4 shadow-sm mt-2"
        >
          <p className="text-green-800 font-semibold">✅ Вы выбрали врача:</p>
          <p className="text-sm text-gray-800 mt-1">
            <strong>{selectedDoctor.name}</strong>{" "}
            <em>({selectedDoctor.doctor_type || "специализация не указана"})</em>
          </p>
        </motion.div>
      )}

      <div className="flex justify-between items-center pt-4 relative flex-col sm:flex-row">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition shadow-md bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:shadow-lg"
        >
          ⬅ Назад
        </motion.button>

        <motion.button
          onClick={onNext}
          disabled={!selectedDoctorId}
          whileTap={selectedDoctorId ? { scale: 0.97 } : {}}
          whileHover={selectedDoctorId ? { scale: 1.02 } : {}}
          onMouseEnter={() => setShowTooltip(!selectedDoctorId)}
          onMouseLeave={() => setShowTooltip(false)}
          transition={{ type: "spring", stiffness: 300 }}
          className={clsx(
            "w-full sm:w-auto px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition shadow-md",
            selectedDoctorId
              ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white hover:shadow-xl"
              : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white opacity-50 cursor-not-allowed"
          )}
        >
          Далее ➡
        </motion.button>

        {showTooltip && !selectedDoctorId && (
          <div className="absolute -top-8 right-0 text-xs bg-gray-800 text-white px-3 py-1 rounded-md shadow">
            Пожалуйста, выберите врача
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VideoConsultationStep2;
