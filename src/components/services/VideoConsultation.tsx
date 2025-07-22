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
}

interface RecommendedDoctor {
  id: number;
  name: string;
  doctor_type: string;
  reason: string;
  urgency: "urgent" | "non_urgent"; // Add urgency here
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

  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingCall, setLoadingCall] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [waiting, setWaiting] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setFetchingDoctors(true);
    try {
      const res = await api.get("/auth/doctor/available/", {
        headers: { Authorization: `Token ${token}` },
      });
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
          router.push(`/video-call?meetingId=${meetingId}`);
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

      if (res.data.success && res.data.recommended_doctor) {
        const doctor = res.data.recommended_doctor;
        // Set urgency based on the response or set a default
        const urgency = res.data.urgency || "non_urgent"; // Assume AI response provides 'urgency'
        setRecommendedDoctor({
          ...doctor,
          urgency, // Add urgency to the recommended doctor
        });
        setSelectedDoctorId(doctor.id);
        toast.success(`🤖 AI рекомендовал врача: ${doctor.name}`);
      } else if (!res.data.success && res.data.ai_data) {
        const fallback = doctors.find((d) =>
          d.doctor_type.toLowerCase().includes("терапевт")
        );
        if (fallback) {
          setRecommendedDoctor({
            id: fallback.id,
            name: fallback.name,
            doctor_type: fallback.doctor_type,
            reason: "Врач общей практики поможет оценить состояние.",
            urgency: "non_urgent", // Set default urgency for fallback
          });
          setSelectedDoctorId(fallback.id);
          setAiErrorData(res.data.ai_data);
          setFallbackUsed(true);
          toast.info("❌ Специалист не найден. Назначен терапевт.");
        } else {
          setAiErrorData(res.data.ai_data);
          toast.warn("❌ AI дал рекомендацию, но подходящих врачей не найдено.");
        }
      }
    } catch {
      toast.error("⚠️ Ошибка AI.");
    } finally {
      setLoadingAI(false);
      setStep(2);
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
    } catch {
      toast.error("⚠️ Не удалось начать консультацию.");
      setWaiting(false);
    } finally {
      setLoadingCall(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6 py-8 sm:py-10">
      <div ref={containerRef} className="lg:col-span-8 w-full">
        <h2 className="text-3xl font-extrabold text-[#001E80] mb-4">Видео консультация</h2>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className={`h-full transition-all duration-500 rounded-full ${step === 1
                ? "w-1/3 bg-blue-600"
                : step === 2
                ? "w-2/3 bg-blue-600"
                : "w-full bg-blue-600"}`}
          />
        </div>

        <div className="space-y-6">
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
            />
          )}
          {step === 3 && (
            <Step3
              symptoms={symptoms}
              doctors={doctors}
              selectedDoctorId={selectedDoctorId}
              onBack={() => setStep(2)}
              onCall={handleStartCall}
              onCancel={cancelConsultation}
              loading={loadingCall}
              waiting={waiting}
            />
          )}
        </div>
      </div>

      <div className="lg:col-span-4">
        <TipsPanel
          step={step}
          onInsertExample={() => setSymptoms("Головная боль, температура 38.5, слабость, першение в горле")}
          recommendedDoctor={recommendedDoctor}
          aiErrorData={aiErrorData}
          fallbackUsed={fallbackUsed}
        />
      </div>
    </div>
  );
};

export default VideoConsultation;
