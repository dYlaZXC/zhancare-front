"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import CallButton from "./CallButton";
import {
  Sparkles,
  User,
  Stethoscope,
  Video,
  CheckCircle2,
} from "lucide-react";

interface Step3Props {
  symptoms: string;
  doctors: {
    id: number;
    name: string;
    doctor_type: string;
  }[];
  selectedDoctorId: number | null;
  onBack: () => void;
  onCall: () => void;
  onCancel: () => void;
  loading: boolean;
  waiting: boolean;
  activeStep?: number; // 1 = symptoms, 2 = doctor, 3 = call
}

const steps = [
  {
    id: 1,
    label: "Симптомы",
    icon: User,
    key: "symptoms",
  },
  {
    id: 2,
    label: "Выбранный врач",
    icon: Stethoscope,
    key: "doctor",
  },
  {
    id: 3,
    label: "Подключение",
    icon: Video,
    key: "connect",
  },
];

const VideoConsultationStep3: React.FC<Step3Props> = ({
  symptoms,
  doctors,
  selectedDoctorId,
  onBack,
  onCall,
  onCancel,
  loading,
  waiting,
  activeStep = 3,
}) => {
  const doctor = doctors.find((d) => d.id === selectedDoctorId);

  const getStepStatus = (stepId: number) => {
    if (stepId < activeStep) return "completed";
    if (stepId === activeStep) return "current";
    return "upcoming";
  };

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.h2
        className="text-3xl font-bold text-gray-900 flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Sparkles className="text-blue-600" size={28} />
        Подтверждение консультации
      </motion.h2>

      {/* Timeline */}
      <div className="relative border-l-4 border-blue-100 pl-4 space-y-10">
        {steps.map((step) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          const isCurrent = status === "current";

          return (
            <div key={step.id} className="relative flex gap-4 pl-10">
              {/* Icon */}
              <div className="absolute left-0 top-[2px]">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center
                    ${
                      status === "completed"
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : status === "current"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-400 border border-gray-300"
                    }`}
                >
                  {status === "completed" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Icon size={16} />
                  )}
                </div>
              </div>

              {/* Text content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? "text-blue-700"
                        : status === "completed"
                        ? "text-gray-800"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      Текущий шаг
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-700">
                  {step.key === "symptoms" && symptoms}
                  {step.key === "doctor" && (
                    <>
                      {doctor?.name || "Не выбран"}{" "}
                      {doctor?.doctor_type && `(${doctor?.doctor_type})`}
                    </>
                  )}
                  {step.key === "connect" && (
                    <>
                      Нажмите <strong>«Начать консультацию»</strong>, чтобы связаться с врачом.
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="pt-4">
        <div className="flex justify-between gap-4">
          <motion.button
            onClick={onBack}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            className="min-w-[120px] px-5 py-3 rounded-xl font-semibold flex items-center justify-center bg-gray-200 text-gray-800"
          >
            ⬅ Назад
          </motion.button>

          <CallButton
            onClick={onCall}
            disabled={loading || !selectedDoctorId || waiting}
            loading={loading}
            waiting={waiting}
          />
        </div>
      </div>

      {/* Waiting */}
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
