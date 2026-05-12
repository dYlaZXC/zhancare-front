"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { MapPin, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";

import Step1 from "./homeAppointments/Step1";
import PaymentStep from "./homeAppointments/PaymentStep";
import AppointmentStatus from "./homeAppointments/AppointmentStatus";
import TipsPanel from "./homeAppointments/TipsPanel";

interface HomeAppointmentsProps {
  onBack?: () => void;
}

const HomeAppointments: React.FC<HomeAppointmentsProps> = ({ onBack }) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [appointmentTime, setAppointmentTime] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60000);
    return d.toISOString().slice(0, 16);
  });
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [entrance, setEntrance] = useState("");
  const [intercom, setIntercom] = useState("");
  const [addressComment, setAddressComment] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    try {
      const subParts: string[] = [];
      if (apartment.trim()) subParts.push(`кв. ${apartment.trim()}`);
      if (entrance.trim()) subParts.push(`подъезд ${entrance.trim()}`);
      if (intercom.trim()) subParts.push(`домофон ${intercom.trim()}`);
      const fullAddress = subParts.length
        ? `${address.trim()}, ${subParts.join(", ")}`
        : address.trim();

      const payload: Record<string, unknown> = {
        appointment_time: appointmentTime,
        address: fullAddress,
        symptoms: symptoms.trim() || null,
        notes: addressComment.trim() || null,
      };
      if (latitude !== null && longitude !== null) {
        payload.latitude = latitude;
        payload.longitude = longitude;
      }

      const res = await api.post("/appointments/", payload);
      if (res.status === 201 || res.status === 200) {
        toast.success("✅ Оплата принята, заявка создана!");
        setAppointmentId(res.data.id);
      } else {
        toast.error("❌ Не удалось создать вызов.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Ошибка сервера.";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleNewAppointment = () => {
    setAppointmentId(null);
    setStep(1);
    setAppointmentTime(new Date(Date.now() + 60 * 60000).toISOString().slice(0, 16));
    setAddress("");
    setApartment("");
    setEntrance("");
    setIntercom("");
    setAddressComment("");
    setSymptoms("");
    setLatitude(null);
    setLongitude(null);
    setError(null);
  };

  const isEmbedded = !!onBack;

  const step1Props = {
    address, apartment, entrance, intercom, addressComment, symptoms, appointmentTime,
    onChangeAddress: setAddress,
    onChangeApartment: setApartment,
    onChangeEntrance: setEntrance,
    onChangeIntercom: setIntercom,
    onChangeAddressComment: setAddressComment,
    onChangeSymptoms: setSymptoms,
    onChangeTime: setAppointmentTime,
    onChangeCoordinates: (lat: number | null, lng: number | null) => {
      setLatitude(lat);
      setLongitude(lng);
    },
    onNext: () => setStep(2),
    loading,
  };

  const paymentProps = {
    address, apartment, entrance, intercom, addressComment,
    appointmentTime, symptoms,
    onBack: () => setStep(1),
    onPay: handlePay,
    loading,
  };

  const statusProps = appointmentId
    ? {
        appointmentId,
        address,
        latitude,
        longitude,
        onNewAppointment: handleNewAppointment,
      }
    : null;

  /* ── Embedded layout ── */
  if (isEmbedded) {
    /* Status page gets its own full-height card with no padding */
    if (appointmentId && statusProps) {
      return (
        <div ref={containerRef}>
          <div className="relative overflow-hidden rounded-2xl shadow-sm border border-gray-200" style={{ height: "600px" }}>
            <AppointmentStatus key="status" {...statusProps} />
          </div>
        </div>
      );
    }

    return (
      <div ref={containerRef} className="space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-800 flex-1">
              {step === 1 ? "Данные вызова" : "Оплата"}
            </span>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Назад
              </button>
            )}
            <span className="text-xs text-gray-400 flex-shrink-0">Шаг {step} / 2</span>
          </div>

          {error && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="p-4">
            <AnimatePresence mode="wait">
              {step === 1 && <Step1 key="step1" {...step1Props} />}
              {step === 2 && <PaymentStep key="payment" {...paymentProps} />}
            </AnimatePresence>
          </div>
        </div>

        <TipsPanel step={step as 1 | 2 | 3} compact />
      </div>
    );
  }

  /* ── Standalone layout ── */
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-screen">
          <div ref={containerRef} className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">

            {/* Header — hide on status page */}
            {!appointmentId && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#3772ff] to-[#2956bf] shadow-lg shadow-[#3772ff]/20 flex-shrink-0">
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
                <div className="relative pt-2">
                  <div className="flex justify-between items-center mb-2 px-1">
                    {[
                      { n: 1, label: "Данные вызова" },
                      { n: 2, label: "Оплата" },
                    ].map(({ n, label }) => (
                      <div
                        key={n}
                        className={`flex items-center gap-2 transition-all duration-300 ${step >= n ? "opacity-100" : "opacity-40"}`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all duration-300 ${
                          step > n
                            ? "bg-gradient-to-br from-green-400 to-green-500 text-white"
                            : step === n
                            ? "bg-gradient-to-br from-[#3772ff] to-[#2956bf] text-white ring-4 ring-[#3772ff]/20"
                            : "bg-gray-200 text-gray-500"
                        }`}>
                          {step > n ? "✓" : n}
                        </div>
                        <span className={`text-xs md:text-sm font-medium ${step >= n ? "text-[#001E80]" : "text-gray-400"}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#3772ff] to-[#2956bf] rounded-full"
                      animate={{ width: step === 1 ? "50%" : "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Status page header */}
            {appointmentId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-3"
              >
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-[#001E80]">
                    Отслеживание вызова
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Заявка #{String(appointmentId).padStart(6, "0")}
                  </p>
                </div>
              </motion.div>
            )}

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

            <AnimatePresence mode="wait">
              {!appointmentId && step === 1 && (
                <Step1 key="step1" {...step1Props} />
              )}
              {!appointmentId && step === 2 && (
                <PaymentStep key="payment" {...paymentProps} />
              )}
              {appointmentId && statusProps && (
                <AppointmentStatus key="status" {...statusProps} />
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar tips — only during form steps */}
          {!appointmentId && (
            <div className="w-full lg:w-80 xl:w-96 bg-gray-50 lg:bg-transparent p-3 sm:p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-200">
              <TipsPanel step={step as 1 | 2 | 3} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeAppointments;
