"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { MapPin, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useConsultationPayment } from "@/components/payment/useConsultationPayment";

const HOME_TEXT = {
  ru: {
    apt: "кв.", entrance: "подъезд", intercom: "домофон",
    paymentAccepted: "✅ Оплата принята, заявка создана!", callFailed: "❌ Не удалось создать вызов.", serverError: "Ошибка сервера.",
    callData: "Данные вызова", chooseClinic: "Клиника", payment: "Оплата", back: "Назад", step: "Шаг",
    callNurseHome: "Вызов медсестры на дом", fillDataBelow: "Заполните данные ниже, чтобы оформить вызов",
    trackingCall: "Отслеживание вызова", request: "Заявка",
  },
  kz: {
    apt: "пәт.", entrance: "кіреберіс", intercom: "домофон",
    paymentAccepted: "✅ Төлем қабылданды, өтінім жасалды!", callFailed: "❌ Шақыруды жасау мүмкін болмады.", serverError: "Сервер қатесі.",
    callData: "Шақыру деректері", chooseClinic: "Клиника", payment: "Төлем", back: "Артқа", step: "Қадам",
    callNurseHome: "Медбикені үйге шақыру", fillDataBelow: "Шақыруды рәсімдеу үшін төмендегі деректерді толтырыңыз",
    trackingCall: "Шақыруды бақылау", request: "Өтінім",
  },
  en: {
    apt: "apt.", entrance: "entrance", intercom: "intercom",
    paymentAccepted: "✅ Payment accepted, request created!", callFailed: "❌ Could not create the call.", serverError: "Server error.",
    callData: "Call details", chooseClinic: "Clinic", payment: "Payment", back: "Back", step: "Step",
    callNurseHome: "Call a nurse home", fillDataBelow: "Fill in the details below to request a visit",
    trackingCall: "Tracking the call", request: "Request",
  },
  uz: {
    apt: "kv.", entrance: "kirish", intercom: "domofon",
    paymentAccepted: "✅ To'lov qabul qilindi, ariza yaratildi!", callFailed: "❌ Chaqiruvni yaratib bo'lmadi.", serverError: "Server xatosi.",
    callData: "Chaqiruv ma'lumotlari", chooseClinic: "Klinika", payment: "To'lov", back: "Orqaga", step: "Qadam",
    callNurseHome: "Hamshirani uyga chaqirish", fillDataBelow: "Chaqiruvni rasmiylashtirish uchun quyidagi ma'lumotlarni to'ldiring",
    trackingCall: "Chaqiruvni kuzatish", request: "Ariza",
  },
};

import Step1 from "./homeAppointments/Step1";
import ClinicStep from "./homeAppointments/ClinicStep";
import PaymentStep from "./homeAppointments/PaymentStep";
import AppointmentStatus from "./homeAppointments/AppointmentStatus";
import TipsPanel from "./homeAppointments/TipsPanel";

interface HomeAppointmentsProps {
  onBack?: () => void;
}

const HomeAppointments: React.FC<HomeAppointmentsProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { language: uiLanguage } = useLanguage();
  const tt = HOME_TEXT[uiLanguage as keyof typeof HOME_TEXT] ?? HOME_TEXT.ru;
  const { pay: payForConsultation } = useConsultationPayment();
  const containerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [clinicName, setClinicName] = useState<string>("");
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
      if (apartment.trim()) subParts.push(`${tt.apt} ${apartment.trim()}`);
      if (entrance.trim()) subParts.push(`${tt.entrance} ${entrance.trim()}`);
      if (intercom.trim()) subParts.push(`${tt.intercom} ${intercom.trim()}`);
      const fullAddress = subParts.length
        ? `${address.trim()}, ${subParts.join(", ")}`
        : address.trim();

      const result = await payForConsultation({
        paymentType: "home",
        amount: 4950, // 50% prepay of 9 900 ₸
        description: `Вызов медсестры на дом — ${fullAddress}`,
        bookingData: {
          clinic_id: clinicId,
          appointment_time: appointmentTime,
          address: fullAddress,
          symptoms: symptoms.trim() || null,
          notes: addressComment.trim() || null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        },
      });

      toast.success(tt.paymentAccepted);
      // result.resultId is the created HomeAppointment.id (set by webhook)
      if (result.resultId) {
        setAppointmentId(Number(result.resultId));
      }
    } catch (err: any) {
      if (err?.message !== "Payment cancelled") {
        const msg = err?.message || tt.serverError;
        setError(msg);
        toast.error(msg);
      }
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
    setClinicId(null);
    setClinicName("");
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

  const clinicStepProps = {
    clinicId,
    onSelectClinic: (id: number, name: string) => {
      setClinicId(id);
      setClinicName(name);
    },
    onNext: () => setStep(3),
    onBack: () => setStep(1),
    loading,
  };

  const paymentProps = {
    address, apartment, entrance, intercom, addressComment,
    appointmentTime, symptoms, clinicName,
    onBack: () => setStep(2),
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
              {step === 1 ? tt.callData : step === 2 ? tt.chooseClinic : tt.payment}
            </span>
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as 1 | 2)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {tt.back}
              </button>
            )}
            <span className="text-xs text-gray-400 flex-shrink-0">{tt.step} {step} / 3</span>
          </div>

          {error && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="p-4">
            <AnimatePresence mode="wait">
              {step === 1 && <Step1 key="step1" {...step1Props} />}
              {step === 2 && <ClinicStep key="clinic" {...clinicStepProps} />}
              {step === 3 && <PaymentStep key="payment" {...paymentProps} />}
            </AnimatePresence>
          </div>
        </div>

        <TipsPanel step={step} compact />
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
                      {tt.callNurseHome}
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">
                      {tt.fillDataBelow}
                    </p>
                  </div>
                </div>
                <div className="relative pt-2">
                  <div className="flex justify-between items-center mb-2 px-1">
                    {[
                      { n: 1, label: tt.callData },
                      { n: 2, label: tt.chooseClinic },
                      { n: 3, label: tt.payment },
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
                      animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
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
                    {tt.trackingCall}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {tt.request} #{String(appointmentId).padStart(6, "0")}
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
                <ClinicStep key="clinic" {...clinicStepProps} />
              )}
              {!appointmentId && step === 3 && (
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
              <TipsPanel step={step} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeAppointments;
