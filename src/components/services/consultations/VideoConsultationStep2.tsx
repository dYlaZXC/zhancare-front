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
    urgency: string;
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

  const getUrgencyIndicator = (urgency: string) => {
    console.log("Urgency value passed to getUrgencyIndicator:", urgency); // Debugging line
    if (urgency === "urgent") {
      return (
        <div className="flex items-center bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          Экстренно
        </div>
      );
    } else {
      return (
        <div className="flex items-center bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          Не экстренно
        </div>
      );
    }
  };

  return (
    <motion.div
      className="space-y-6"
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
          Мы используем AI, чтобы рекомендовать врача на основе ваших симптомов.
        </p>
      </div>

      {showAIBlock && (
        <motion.div
          className={clsx(
            "p-4 space-y-4",
            fallbackUsed
              ? "bg-yellow-50"
              : recommendedDoctor
              ? "bg-blue-50"
              : "bg-red-50"
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

          {aiErrorData && (
            <div className="p-4 text-sm text-gray-700 space-y-2 bg-white border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-900">AI порекомендовал:</p>
              <p><strong>Специализация:</strong> {aiErrorData.specialty}</p>
              <p><strong>Пояснение:</strong> <span className="italic text-gray-600">{aiErrorData.reason}</span></p>
            </div>
          )}

          {recommendedDoctor && (
            <div className="p-4 text-sm text-gray-700 space-y-2 bg-white border border-gray-200 rounded-lg">
              <p>
                {fallbackUsed ? (
                  <>Назначен врач общей практики — <strong>{recommendedDoctor.name}</strong> (<em>{recommendedDoctor.doctor_type}</em>).</>
                ) : (
                  <>Рекомендация AI: <strong>{recommendedDoctor.name}</strong> (<em>{recommendedDoctor.doctor_type}</em>).</>
                )}
              </p>
              <p className="text-gray-600 italic">{recommendedDoctor.reason}</p>

              {/* Display urgency indicator */}
              {recommendedDoctor.urgency && (
                <div className="mt-2">
                  {getUrgencyIndicator(recommendedDoctor.urgency)}
                </div>
              )}

              {fallbackUsed && aiErrorData && (
                <div className="mt-4 flex items-start gap-3 p-4 bg-yellow-100 text-yellow-900 rounded-xl text-sm">
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
          className="p-1 mt-2 bg-green-50 text-green-800 rounded-lg"
        ></motion.div>
      )}

      {/* Buttons aligned left and right */}
      <div className="w-full pt-2">
        <div className="flex justify-between items-center w-full gap-4">
          {/* Назад */}
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="min-w-[120px] px-5 py-3 rounded-xl font-semibold flex items-center justify-center bg-gray-200 text-gray-800"
          >
            ⬅ Назад
          </motion.button>

          {/* Далее */}
          <motion.button
            onClick={onNext}
            disabled={!selectedDoctorId}
            whileTap={selectedDoctorId ? { scale: 0.97 } : {}}
            whileHover={selectedDoctorId ? { scale: 1.02 } : {}}
            onMouseEnter={() => setShowTooltip(!selectedDoctorId)}
            onMouseLeave={() => setShowTooltip(false)}
            transition={{ type: "spring", stiffness: 300 }}
            className={clsx(
              "min-w-[120px] px-5 py-3 rounded-xl font-semibold flex items-center justify-center",
              selectedDoctorId
                ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white hover:shadow-md"
                : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white opacity-50 cursor-not-allowed"
            )}
          >
            Далее ➡
          </motion.button>
        </div>

        {/* Tooltip */}
        {showTooltip && !selectedDoctorId && (
          <div className="mt-2 text-xs bg-gray-800 text-white px-3 py-1 rounded-md shadow text-center">
            Пожалуйста, выберите врача
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VideoConsultationStep2;
