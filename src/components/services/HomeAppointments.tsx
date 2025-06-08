"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { MapPin, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";

// Шаги
import Step1 from "./homeAppointments/Step1";
import Step2 from "./homeAppointments/Step2";
import Step3 from "./homeAppointments/Step3";
import TipsPanel from "./homeAppointments/TipsPanel";
import Confirmation from "./homeAppointments/Confirmation";

interface Doctor {
  id: number;
  name: string;
  email: string;
}

const HomeAppointments: React.FC = () => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setFetchingDoctors(true);
    try {
      const res = await api.get("/appointments/available-doctors-sestrinskoe-delo/");
      setDoctors(res.data?.doctors || []);
    } catch (err) {
      console.error("Ошибка загрузки врачей:", err);
      setError("⚠️ Не удалось загрузить список врачей.");
    } finally {
      setFetchingDoctors(false);
    }
  };

  const handleFinalCheck = () => {
    if (!selectedDoctor || !appointmentTime || !address.trim()) {
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
      const res = await api.post("/appointments/", {
        doctor: selectedDoctor,
        appointment_time: appointmentTime,
        address: address.trim(),
        symptoms: symptoms.trim() || null,
        notes: notes.trim() || null,
      });

      if (res.status === 201 || res.status === 200) {
        toast.success("✅ Вызов успешно создан!");
        setSuccess(true);
        setStep(1);
        setSelectedDoctor(null);
        setAppointmentTime("");
        setAddress("");
        setSymptoms("");
        setNotes("");
      } else {
        toast.error("❌ Не удалось создать вызов.");
      }
    } catch (err: any) {
      console.error("Ошибка при создании:", err);
      toast.error(err?.response?.data?.error || "Ошибка сервера.");
    }

    setLoading(false);
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-8 w-full bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl ring-1 ring-blue-100 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-[#001E80]" />
            <h1 className="text-3xl font-extrabold text-[#001E80]">Вызов врача на дом</h1>
          </div>
          <p className="text-gray-600 mb-4">Заполните шаги ниже, чтобы оформить вызов.</p>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                step === 1
                  ? "w-1/3 bg-blue-600"
                  : step === 2
                  ? "w-2/3 bg-blue-600"
                  : "w-full bg-blue-600"
              }`}
            />
          </div>

          {error && (
            <p className="text-red-500 bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5" />
              {error}
            </p>
          )}

          {!success && (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step1
                  address={address}
                  symptoms={symptoms}
                  onChangeAddress={setAddress}
                  onChangeSymptoms={setSymptoms}
                  onNext={() => setStep(2)}
                  loading={loading}
                />
              )}
              {step === 2 && (
                <Step2
                  doctors={doctors}
                  selectedDoctorId={selectedDoctor}
                  onSelectDoctor={setSelectedDoctor}
                  appointmentTime={appointmentTime}
                  onChangeTime={setAppointmentTime}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  loading={loading}
                  fetchingDoctors={fetchingDoctors}
                />
              )}
              {step === 3 && (
                <Step3
                  doctors={doctors}
                  selectedDoctorId={selectedDoctor}
                  appointmentTime={appointmentTime}
                  address={address}
                  symptoms={symptoms}
                  notes={notes}
                  onBack={() => setStep(2)}
                  onSubmit={handleFinalCheck}
                  loading={loading}
                />
              )}
            </AnimatePresence>
          )}

          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center text-green-700 bg-green-50 border border-green-200 p-6 rounded-xl"
            >
              ✅ Вызов успешно создан! Мы свяжемся с вами в ближайшее время.
            </motion.div>
          )}
        </motion.div>

        <div className="lg:col-span-4">
          <TipsPanel step={step} />
        </div>
      </div>

      <Confirmation
        isOpen={confirmModal}
        onCancel={() => setConfirmModal(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
};

export default HomeAppointments;
