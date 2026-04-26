"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Calendar, MapPin, Phone, Building2 } from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Step2 from "./VideoConsultationStep2";
import type { Doctor, RecommendedDoctor } from "./types/doctor";

interface OfflineBookingFlowProps {
  doctors: Doctor[];
  onBack: () => void;
  onComplete?: () => void;
  onRequestAIRecommendation?: (symptoms: string) => void;
  loadingAI?: boolean;
  recommendedDoctor?: RecommendedDoctor;
  aiRecommendationId?: number;
}

interface BookedInfo {
  doctor: Doctor;
  time: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

const OfflineBookingFlow: React.FC<OfflineBookingFlowProps> = ({
  doctors, onBack, onComplete,
  onRequestAIRecommendation, loadingAI, recommendedDoctor, aiRecommendationId,
}) => {
  const { token } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [bookedInfo, setBookedInfo] = useState<BookedInfo | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleConsultationBooked = async (_consultationId: number, data?: any) => {
    const doc = doctors.find(d => d.id === selectedDoctorId);
    if (!doc || !token) return;

    const scheduledTime: string = data?.scheduled_time || data?.scheduled_at || '';

    setBookingError(null);
    try {
      await api.post(
        '/clinic-appointments/',
        {
          doctor_id: doc.id,
          scheduled_time: scheduledTime,
        },
        { headers: { Authorization: `Token ${token}` } }
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Ошибка при записи. Попробуйте снова.';
      setBookingError(msg);
      return;
    }

    const clinic = doc.clinic;
    const phoneRaw = clinic?.phone;
    let clinicPhone: string | undefined;
    if (Array.isArray(phoneRaw) && phoneRaw.length > 0) {
      clinicPhone = phoneRaw[0]?.number || phoneRaw[0];
    } else if (typeof phoneRaw === 'string') {
      clinicPhone = phoneRaw;
    }

    setBookedInfo({
      doctor: doc,
      time: scheduledTime,
      clinicName: clinic?.name,
      clinicAddress: clinic?.address,
      clinicPhone,
    });
    setStep(2);
  };

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div
          key="offline-step1"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {/* Flow header */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Оффлайн приём</p>
              <p className="text-xs text-gray-400">Выберите врача и запишитесь на приём</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Очный визит
            </span>
          </div>

          {bookingError && (
            <div className="mb-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {bookingError}
            </div>
          )}

          <Step2
            doctors={doctors}
            selectedDoctorId={selectedDoctorId}
            onSelect={setSelectedDoctorId}
            loading={false}
            onBack={onBack}
            onNext={() => setStep(2)}
            symptoms=""
            onConsultationBooked={handleConsultationBooked}
            consultationType="offline"
            onRequestAIRecommendation={onRequestAIRecommendation}
            loadingAI={loadingAI}
            recommendedDoctor={recommendedDoctor}
            aiRecommendationId={aiRecommendationId}
          />
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          key="offline-step2"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Success card */}
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-6 text-center"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="relative w-14 h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center mx-auto mb-3"
            >
              <CheckCircle2 className="w-7 h-7 text-white" />
            </motion.div>
            <h2 className="font-bold text-white text-lg">Приём записан!</h2>
            <p className="text-white/70 text-sm mt-1">Ожидайте подтверждения от клиники</p>
          </div>

          {bookedInfo && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Doctor row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {bookedInfo.doctor.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-400 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{bookedInfo.doctor.name}</p>
                  <p className="text-xs text-emerald-600 truncate">{bookedInfo.doctor.doctor_type}</p>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
                  Оффлайн
                </span>
              </div>

              {/* Date/time row */}
              {bookedInfo.time && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Дата и время</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(bookedInfo.time).toLocaleDateString('ru-RU', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })} · {new Date(bookedInfo.time).toLocaleTimeString('ru-RU', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Clinic name row */}
              {bookedInfo.clinicName && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium">Клиника</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{bookedInfo.clinicName}</p>
                  </div>
                </div>
              )}

              {/* Clinic address row */}
              {bookedInfo.clinicAddress && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium">Адрес</p>
                    <p className="text-sm font-semibold text-gray-900">{bookedInfo.clinicAddress}</p>
                  </div>
                </div>
              )}

              {/* Clinic phone row */}
              {bookedInfo.clinicPhone && (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Телефон клиники</p>
                    <p className="text-sm font-semibold text-gray-900">{bookedInfo.clinicPhone}</p>
                  </div>
                </div>
              )}

              {/* Fallback if no clinic info */}
              {!bookedInfo.clinicName && !bookedInfo.clinicAddress && (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Формат</p>
                    <p className="text-sm font-semibold text-gray-900">Очный приём в клинике</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold bg-white border border-gray-200 text-gray-600 text-sm transition-all shadow-sm hover:border-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
              На главную
            </button>
            <button
              onClick={onComplete}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              Готово
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBookingFlow;
