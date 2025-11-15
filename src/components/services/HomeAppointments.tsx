"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { MapPin, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";

// Шаги
import Step1 from "./homeAppointments/Step1";
import Step3 from "./homeAppointments/Step3";
import TipsPanel from "./homeAppointments/TipsPanel";
import Confirmation from "./homeAppointments/Confirmation";

const HomeAppointments: React.FC = () => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFinalCheck = () => {
    if (!appointmentTime || !address.trim()) {
      toast.error("Пожалуйста, заполните все обязательные поля.");
      return;
    }

    if (new Date(appointmentTime) <= new Date()) {
      toast.error("Пожалуйста, выберите дату и время в будущем.");
      return;
    }

    setConfirmModal(true);
  };

  const handleSubmit = async () => {
    setConfirmModal(false);
    setLoading(true);

    try {
      const payload: any = {
        appointment_time: appointmentTime,
        address: address.trim(),
        symptoms: symptoms.trim() || null,
        notes: notes.trim() || null,
      };

      // Only include coordinates if they're set
      if (latitude !== null && longitude !== null) {
        payload.latitude = latitude;
        payload.longitude = longitude;
      }

      const res = await api.post("/appointments/", payload);

      if (res.status === 201 || res.status === 200) {
        toast.success("✅ Вызов успешно создан!");
        setSuccess(true);
        setStep(1);
        setAppointmentTime("");
        setAddress("");
        setSymptoms("");
        setNotes("");
        setLatitude(null);
        setLongitude(null);
      } else {
        toast.error("❌ Не удалось создать вызов.");
      }
    } catch (err: any) {
      console.error("Ошибка при создании:", err);
      console.error("Response data:", err?.response?.data);
      toast.error(err?.response?.data?.error || err?.response?.data?.detail || "Ошибка сервера.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-screen">
          {/* Main content area - full width on mobile */}
          <div ref={containerRef} className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
            {/* Premium header section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#3772ff] to-[#2956bf] shadow-lg shadow-[#3772ff]/20">
                  <MapPin className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#001E80]">
                    Вызов медсестры на дом
                  </h1>
                  <p className="text-sm md:text-base text-gray-600 mt-1">
                    Заполните данные ниже, чтобы оформить вызов
                  </p>
                </div>
              </div>

              {/* Modern step progress */}
              <div className="relative pt-4">
                <div className="flex justify-between items-center mb-2 px-1">
                  {[1, 2].map((stepNum) => (
                    <div
                      key={stepNum}
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        step >= stepNum ? "opacity-100" : "opacity-40"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all duration-300 ${
                          step > stepNum
                            ? "bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-500/30"
                            : step === stepNum
                            ? "bg-gradient-to-br from-[#3772ff] to-[#2956bf] text-white shadow-lg shadow-[#3772ff]/30 ring-4 ring-[#3772ff]/20"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step > stepNum ? "✓" : stepNum}
                      </div>
                      <span className={`text-xs md:text-sm font-medium ${
                        step >= stepNum ? "text-[#001E80]" : "text-gray-400"
                      }`}>
                        {stepNum === 1 ? "Данные вызова" : "Подтверждение"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#3772ff] to-[#2956bf] rounded-full shadow-lg"
                    initial={{ width: "50%" }}
                    animate={{
                      width: step === 1 ? "50%" : "100%"
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm md:text-base">{error}</p>
              </motion.div>
            )}

            {/* Steps content */}
            {!success && (
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <Step1
                    address={address}
                    symptoms={symptoms}
                    appointmentTime={appointmentTime}
                    onChangeAddress={setAddress}
                    onChangeSymptoms={setSymptoms}
                    onChangeTime={setAppointmentTime}
                    onChangeCoordinates={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                    onNext={() => setStep(2)}
                    loading={loading}
                  />
                )}
                {step === 2 && (
                  <Step3
                    appointmentTime={appointmentTime}
                    address={address}
                    symptoms={symptoms}
                    notes={notes}
                    onBack={() => setStep(1)}
                    onSubmit={handleFinalCheck}
                    loading={loading}
                  />
                )}
              </AnimatePresence>
            )}

            {/* Success message */}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-lg text-center"
              >
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl md:text-2xl font-bold text-green-800 mb-2">
                  Вызов успешно создан!
                </h3>
                <p className="text-green-700">
                  Мы свяжемся с вами в ближайшее время.
                </p>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Tips Panel */}
          <div className="w-full lg:w-80 xl:w-96 bg-gray-50 lg:bg-transparent p-3 sm:p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-200">
            <TipsPanel step={step} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Confirmation
        isOpen={confirmModal}
        onCancel={() => setConfirmModal(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
};

export default HomeAppointments;
