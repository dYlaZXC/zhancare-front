"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Calendar, MapPin, Phone, Building2, Navigation, DoorOpen } from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Step2 from "./VideoConsultationStep2";
import type { Doctor, RecommendedDoctor } from "./types/doctor";

const OFFLINE_TEXT = {
  ru: {
    bookingError: "Ошибка при записи. Попробуйте снова.",
    appointmentBooked: "Приём записан!", awaitConfirmation: "Ожидайте подтверждения от клиники",
    offline: "Оффлайн", dateTime: "Дата и время", clinic: "Клиника", address: "Адрес",
    route2gis: "Маршрут на 2ГИС", doctorCabinet: "Кабинет врача", cabinetNo: "№",
    clinicPhone: "Телефон клиники", format: "Формат", inPersonVisit: "Очный приём в клинике",
    toHome: "На главную", done: "Готово", locale: "ru-RU",
  },
  kz: {
    bookingError: "Жазылу кезінде қате орын алды. Қайталап көріңіз.",
    appointmentBooked: "Қабылдауға жазылдыңыз!", awaitConfirmation: "Клиникадан растауды күтіңіз",
    offline: "Оффлайн", dateTime: "Күні мен уақыты", clinic: "Клиника", address: "Мекенжай",
    route2gis: "2ГИС-те маршрут", doctorCabinet: "Дәрігер кабинеті", cabinetNo: "№",
    clinicPhone: "Клиника телефоны", format: "Формат", inPersonVisit: "Клиникада жеке қабылдау",
    toHome: "Басты бетке", done: "Дайын", locale: "kk-KZ",
  },
  en: {
    bookingError: "Error booking the appointment. Please try again.",
    appointmentBooked: "Appointment booked!", awaitConfirmation: "Awaiting confirmation from the clinic",
    offline: "Offline", dateTime: "Date and time", clinic: "Clinic", address: "Address",
    route2gis: "Route on 2GIS", doctorCabinet: "Doctor's office", cabinetNo: "No.",
    clinicPhone: "Clinic phone", format: "Format", inPersonVisit: "In-person visit at the clinic",
    toHome: "Back to home", done: "Done", locale: "en-US",
  },
  uz: {
    bookingError: "Yozilishda xatolik yuz berdi. Qayta urinib ko'ring.",
    appointmentBooked: "Qabulga yozildingiz!", awaitConfirmation: "Klinikadan tasdiqni kuting",
    offline: "Oflayn", dateTime: "Sana va vaqt", clinic: "Klinika", address: "Manzil",
    route2gis: "2GIS'da marshrut", doctorCabinet: "Shifokor kabineti", cabinetNo: "№",
    clinicPhone: "Klinika telefoni", format: "Format", inPersonVisit: "Klinikada yuzma-yuz qabul",
    toHome: "Bosh sahifaga", done: "Tayyor", locale: "uz-UZ",
  },
};

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
  clinicAddressComment?: string;
  clinicPhone?: string;
  clinicGis2Url?: string;
  clinicLat?: number | null;
  clinicLng?: number | null;
  roomNumber?: string | null;
}

const OfflineBookingFlow: React.FC<OfflineBookingFlowProps> = ({
  doctors, onBack, onComplete,
  onRequestAIRecommendation, loadingAI, recommendedDoctor, aiRecommendationId,
}) => {
  const { token } = useAuth();
  const { language: uiLanguage } = useLanguage();
  const tt = OFFLINE_TEXT[uiLanguage as keyof typeof OFFLINE_TEXT] ?? OFFLINE_TEXT.ru;
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
      const msg = err?.response?.data?.error || tt.bookingError;
      setBookingError(msg);
      return;
    }

    const clinic = doc.clinic;

    // Resolve phone: prefer phones JSON array, fall back to phone string
    let clinicPhone: string | undefined;
    const phonesRaw = clinic?.phones;
    if (Array.isArray(phonesRaw) && phonesRaw.length > 0) {
      const first = phonesRaw[0];
      clinicPhone = (typeof first === 'object' ? (first.value || first.number) : first) as string | undefined;
    } else if (typeof clinic?.phone === 'string') {
      clinicPhone = clinic.phone;
    }

    setBookedInfo({
      doctor: doc,
      time: scheduledTime,
      clinicName: clinic?.name,
      clinicAddress: clinic?.address,
      clinicAddressComment: clinic?.address_comment,
      clinicPhone,
      clinicGis2Url: clinic?.gis2_url,
      clinicLat: clinic?.lat,
      clinicLng: clinic?.lng,
      roomNumber: doc.room_number,
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
            <h2 className="font-bold text-white text-lg">{tt.appointmentBooked}</h2>
            <p className="text-white/70 text-sm mt-1">{tt.awaitConfirmation}</p>
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
                  {tt.offline}
                </span>
              </div>

              {/* Date/time row */}
              {bookedInfo.time && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{tt.dateTime}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(bookedInfo.time).toLocaleDateString(tt.locale, {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })} · {new Date(bookedInfo.time).toLocaleTimeString(tt.locale, {
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
                    <p className="text-xs text-gray-400 font-medium">{tt.clinic}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{bookedInfo.clinicName}</p>
                  </div>
                </div>
              )}

              {/* Clinic address row with 2GIS link */}
              {bookedInfo.clinicAddress && (() => {
                // Build 2GIS route URL: prefer stored gis2_url, else build search URL
                const gisUrl = bookedInfo.clinicGis2Url
                  || (bookedInfo.clinicLat && bookedInfo.clinicLng
                    ? `https://2gis.kz/geo/${bookedInfo.clinicLng},${bookedInfo.clinicLat}`
                    : `https://2gis.kz/search/${encodeURIComponent(bookedInfo.clinicAddress)}`);
                return (
                  <div className="border-b border-gray-50">
                    <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 font-medium mb-0.5">{tt.address}</p>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{bookedInfo.clinicAddress}</p>
                        {bookedInfo.clinicAddressComment && (
                          <p className="text-xs text-gray-500 mt-0.5">{bookedInfo.clinicAddressComment}</p>
                        )}
                      </div>
                    </div>
                    {/* Route button */}
                    <div className="px-4 pb-3.5">
                      <a
                        href={gisUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-sm hover:from-emerald-400 hover:to-green-500 transition-all"
                      >
                        <Navigation className="w-4 h-4 flex-shrink-0" />
                        {tt.route2gis}
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* Cabinet row */}
              {bookedInfo.roomNumber && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <DoorOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{tt.doctorCabinet}</p>
                    <p className="text-sm font-semibold text-gray-900">{tt.cabinetNo} {bookedInfo.roomNumber}</p>
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
                    <p className="text-xs text-gray-400 font-medium">{tt.clinicPhone}</p>
                    <a href={`tel:${bookedInfo.clinicPhone}`} className="text-sm font-semibold text-blue-600 hover:underline">
                      {bookedInfo.clinicPhone}
                    </a>
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
                    <p className="text-xs text-gray-400 font-medium">{tt.format}</p>
                    <p className="text-sm font-semibold text-gray-900">{tt.inPersonVisit}</p>
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
              {tt.toHome}
            </button>
            <button
              onClick={onComplete}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {tt.done}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBookingFlow;
