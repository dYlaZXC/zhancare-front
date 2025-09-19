import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

import Step1 from "./consultations/VideoConsultationStep1";
import Step2 from "./consultations/VideoConsultationStep2";
import Step3 from "./consultations/VideoConsultationStep3";
import TipsPanel from "./consultations/TipsPanel";

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
  specialization?: {
    id: number;
    name_ru: string;
    name_kz: string;
    name_en: string;
  } | null;
}

interface RecommendedDoctor {
  id: number;
  name: string;
  doctor_type: string;
  reason: string;
  urgency: "urgent" | "non_urgent";
}

interface AIErrorData {
  specialty: string;
  reason: string;
  raw: string;
}

const VideoConsultation: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [symptoms, setSymptoms] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [recommendedDoctor, setRecommendedDoctor] = useState<RecommendedDoctor | undefined>(undefined);
  const [aiErrorData, setAiErrorData] = useState<AIErrorData | undefined>();
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [aiRecommendationId, setAiRecommendationId] = useState<number | undefined>(undefined);
  const [scheduledConsultation, setScheduledConsultation] = useState<{
    id: number;
    scheduled_time: string;
    doctor_name: string;
    doctor_type: string;
    booking_type: 'urgent' | 'scheduled';
  } | null>(null);
  const [pendingConsultationData, setPendingConsultationData] = useState<{
    scheduled_time: string;
    doctor_id: number;
    ai_recommendation_id: number;
  } | null>(null);

  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingCall, setLoadingCall] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [waiting, setWaiting] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setFetchingDoctors(true);
    try {
      const res = await api.get("/auth/doctor/available/", {
        headers: { Authorization: `Token ${token}` },
        params: { lang: 'ru' } // Request Russian by default, can be made dynamic later
      });

      console.log("Enhanced doctor data:", res.data); // Debug log to see the new structure

      const filtered = res.data?.doctors?.filter(
        (doc: Doctor) => doc.doctor_type !== "Сестринское дело"
      );
      setDoctors(filtered || []);
    } catch {
      toast.error("⚠️ Ошибка загрузки врачей.");
    } finally {
      setFetchingDoctors(false);
    }
  }, [token]);

  const cancelConsultation = useCallback(() => {
    setWaiting(false);
    setMeetingId(null);
    toast.info("🚫 Консультация отменена.");
  }, []);

  const startPolling = useCallback(() => {
    const start = Date.now();
    const timeout = 2 * 60 * 1000;

    return setInterval(async () => {
      if (!meetingId || !token) return;
      if (Date.now() - start > timeout) {
        toast.error("⏳ Время ожидания истекло.");
        cancelConsultation();
        return;
      }

      try {
        const res = await api.get("/consultations/status/", {
          headers: { Authorization: `Token ${token}` },
          params: { meeting_id: meetingId },
        });

        const status = res.data?.status;
        if (status === "ongoing") {
          toast.success("✅ Доктор подключился.");
          clearInterval(pollingRef.current!);
          setWaiting(false);

          router.push(`/video-call/patient?meetingId=${meetingId}`);
        } else if (status === "cancelled") {
          toast.error("❌ Запрос отклонён.");
          cancelConsultation();
        }
      } catch (err) {
        console.error("Ошибка при проверке статуса:", err);
      }
    }, 3000);
  }, [cancelConsultation, meetingId, token, router]);

  useEffect(() => {
    if (!token) {
      toast.error("❌ Вы не авторизованы. Пожалуйста, войдите.");
      return;
    }
    fetchDoctors();
  }, [token, fetchDoctors]);

  useEffect(() => {
    if (waiting && meetingId) {
      pollingRef.current = startPolling();
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [waiting, meetingId, startPolling]);

  const handleAIRecommend = async () => {
    if (loadingAI || !token) return;
    if (!symptoms.trim()) {
      toast.warn("⚠️ Пожалуйста, опишите симптомы.");
      return;
    }

    setLoadingAI(true);
    setRecommendedDoctor(undefined);
    setAiErrorData(undefined);
    setFallbackUsed(false);

    try {
      const res = await api.post(
        "/consultations/ai-recommend/",
        { symptoms, language: "ru" },
        { headers: { Authorization: `Token ${token}` } }
      );

      console.log("AI response:", res.data);

      if (res.data.success && res.data.recommended_doctor) {
        const doctor = res.data.recommended_doctor;
        const urgency = doctor.urgency === "urgent" ? "urgent" : "non_urgent";
        console.log("Urgency extracted from recommended_doctor:", urgency);

        setRecommendedDoctor({
          ...doctor,
          urgency,
        });

        // Store the AI recommendation ID for timeslot booking
        if (res.data.ai_recommendation_id) {
          setAiRecommendationId(res.data.ai_recommendation_id);
          console.log("AI recommendation ID stored:", res.data.ai_recommendation_id);
        }

        setSelectedDoctorId(doctor.id);
        toast.success(`🤖 AI рекомендовал врача: ${doctor.name}`);
      } else if (!res.data.success && res.data.ai_data) {
        const fallback = doctors.find((d) =>
          d.doctor_type.toLowerCase().includes("терапевт")
        );

        if (fallback) {
          const urgency =
            res.data.ai_data?.urgency === "non_urgent" ? "non_urgent" : "urgent";

          console.log("Fallback urgency (from ai_data or default):", urgency);

          setRecommendedDoctor({
            id: fallback.id,
            name: fallback.name,
            doctor_type: fallback.doctor_type,
            reason: "Врач общей практики поможет оценить состояние.",
            urgency,
          });

          setSelectedDoctorId(fallback.id);
          setAiErrorData(res.data.ai_data);
          setFallbackUsed(true);

          // Store AI recommendation ID for fallback case too
          if (res.data.ai_recommendation_id) {
            setAiRecommendationId(res.data.ai_recommendation_id);
            console.log("AI recommendation ID stored (fallback):", res.data.ai_recommendation_id);
          }

          toast.info("❌ Специалист не найден. Назначен терапевт.");
        } else {
          setAiErrorData(res.data.ai_data);
          toast.warn("❌ AI дал рекомендацию, но подходящих врачей не найдено.");
        }
      }
    } catch (error) {
      toast.error("⚠️ Ошибка AI.");
      console.error("AI Recommendation Error:", error);
    } finally {
      setLoadingAI(false);
      setStep(2);
    }
  };

  const handleScheduleConsultation = async () => {
    if (!pendingConsultationData || !token) {
      toast.error("⚠️ Данные для планирования консультации отсутствуют.");
      return;
    }

    setLoadingCall(true);

    try {
      console.log("🔄 Scheduling consultation...");
      const createRes = await api.post(
        "/consultations/book-dynamic-slot/",
        {
          doctor_id: pendingConsultationData.doctor_id,
          scheduled_time: pendingConsultationData.scheduled_time,
          ai_recommendation_id: pendingConsultationData.ai_recommendation_id
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      if (createRes.data?.consultation) {
        console.log("✅ Consultation scheduled successfully:", createRes.data.consultation.id);

        // Show success message
        toast.success("✅ Консультация успешно запланирована! Вы можете подключиться к ней в назначенное время.");

        // Reset state
        setScheduledConsultation(null);
        setPendingConsultationData(null);
        setSelectedDoctorId(null);
        setRecommendedDoctor(undefined);
        setSymptoms("");
        setAiRecommendationId(undefined);

        // Return to Step 1
        setStep(1);
      }
    } catch (error) {
      console.error("❌ Error scheduling consultation:", error);
      toast.error("⚠️ Не удалось запланировать консультацию.");
    } finally {
      setLoadingCall(false);
    }
  };

  const handleStartCall = async () => {
    if (!selectedDoctorId || !token) {
      toast.error("⚠️ Пожалуйста, выберите врача.");
      containerRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setLoadingCall(true);
    setWaiting(true);

    try {
      console.log("🔄 Starting consultation...");

      // Create and start the consultation (all consultations created here in Step 3)
      const res = await api.post(
        "/consultations/start/",
        { doctor_id: selectedDoctorId, symptoms },
        { headers: { Authorization: `Token ${token}` } }
      );

      if (res.data?.meeting_id) {
        setMeetingId(res.data.meeting_id);
        toast.success("⏳ Ожидаем ответа врача...");
      } else {
        throw new Error("Invalid meeting ID response");
      }
    } catch (error) {
      console.error("❌ Error starting consultation:", error);
      toast.error("⚠️ Не удалось начать консультацию.");
      setWaiting(false);
    } finally {
      setLoadingCall(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mobile-first layout with minimal padding */}
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-screen">
          {/* Main content area - full width on mobile */}
          <div ref={containerRef} className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
            {/* Compact header section */}
            <div className="mb-4 space-y-3">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#001E80]">
                Видео консультация
              </h2>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    step === 1
                      ? "w-1/3 bg-blue-600"
                      : step === 2
                      ? "w-2/3 bg-blue-600"
                      : "w-full bg-blue-600"
                  }`}
                />
              </div>
            </div>

            {/* Step content - no extra spacing */}
            <div className="w-full">
              {step === 1 && (
                <Step1
                  symptoms={symptoms}
                  onChange={setSymptoms}
                  onNext={handleAIRecommend}
                  loading={loadingAI}
                />
              )}
              {step === 2 && (
                <Step2
                  doctors={doctors}
                  selectedDoctorId={selectedDoctorId}
                  onSelect={setSelectedDoctorId}
                  loading={fetchingDoctors}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  symptoms={symptoms}
                  recommendedDoctor={recommendedDoctor}
                  aiErrorData={aiErrorData}
                  fallbackUsed={fallbackUsed}
                  aiRecommendationId={aiRecommendationId}
                  onConsultationBooked={(consultationId, consultationData) => {
                    console.log("🎉 Consultation booked:", consultationId, consultationData);

                    // Find the selected doctor for the consultation details
                    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

                    if (consultationId === 0 && consultationData) {
                      // Step 2: Timeslot confirmed, not yet created
                      setPendingConsultationData({
                        scheduled_time: consultationData.scheduled_at || consultationData.scheduled_time,
                        doctor_id: consultationData.doctor_id,
                        ai_recommendation_id: consultationData.ai_recommendation_id
                      });

                      if (selectedDoctor) {
                        setScheduledConsultation({
                          id: 0, // Not created yet
                          scheduled_time: consultationData.scheduled_at || consultationData.scheduled_time,
                          doctor_name: selectedDoctor.name,
                          doctor_type: selectedDoctor.doctor_type || selectedDoctor.specialization?.name_ru || 'Врач',
                          booking_type: recommendedDoctor?.urgency === 'urgent' ? 'urgent' : 'scheduled'
                        });
                      }

                      toast.success("✅ Время для консультации выбрано!");
                    } else if (consultationId > 0) {
                      // Step 3: Actual consultation created
                      if (consultationData && selectedDoctor) {
                        setScheduledConsultation({
                          id: consultationId,
                          scheduled_time: consultationData.scheduled_at || consultationData.scheduled_time,
                          doctor_name: selectedDoctor.name,
                          doctor_type: selectedDoctor.doctor_type || selectedDoctor.specialization?.name_ru || 'Врач',
                          booking_type: recommendedDoctor?.urgency === 'urgent' ? 'urgent' : 'scheduled'
                        });
                      }
                      toast.success("✅ Консультация успешно создана!");
                    }

                    setStep(3);
                  }}
                />
              )}
              {step === 3 && (
                <Step3
                  symptoms={symptoms}
                  doctors={doctors}
                  selectedDoctorId={selectedDoctorId}
                  onBack={() => setStep(2)}
                  onCall={handleStartCall}
                  onScheduleConsultation={handleScheduleConsultation}
                  onCancel={cancelConsultation}
                  loading={loadingCall}
                  waiting={waiting}
                  recommendedDoctor={recommendedDoctor}
                  scheduledConsultation={scheduledConsultation}
                  pendingConsultationData={pendingConsultationData}
                />
              )}
            </div>
          </div>

          {/* Tips panel - hidden on mobile, sidebar on desktop */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0 p-6 bg-gray-50 border-l border-gray-200">
            <div className="sticky top-6">
              <TipsPanel
                step={step}
                onInsertExample={() => setSymptoms("Головная боль, температура 38.5, слабость, першение в горле")}
                recommendedDoctor={recommendedDoctor}
                aiErrorData={aiErrorData}
                fallbackUsed={fallbackUsed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoConsultation;