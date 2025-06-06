"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

import Step1 from "./consultations/VideoConsultationStep1";
import Step2 from "./consultations/VideoConsultationStep2";
import Step3 from "./consultations/VideoConsultationStep3";

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
}

const VideoConsultation: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [symptoms, setSymptoms] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [recommendedDoctor, setRecommendedDoctor] = useState<RecommendedDoctor | undefined>();
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingCall, setLoadingCall] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

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
  }, [waiting, meetingId]);

  const fetchDoctors = async () => {
    setFetchingDoctors(true);
    try {
      const res = await api.get("/auth/doctor/available/");
      const filtered = res.data?.doctors?.filter(
        (doc: Doctor) => doc.doctor_type !== "Сестринское дело"
      );
      setDoctors(filtered || []);
    } catch {
      toast.error("⚠️ Ошибка загрузки врачей.");
    } finally {
      setFetchingDoctors(false);
    }
  };

  const handleAIRecommend = async () => {
    if (loadingAI) return;
    setLoadingAI(true);
    try {
      const res = await api.post("/consultations/ai-recommend/", {
        symptoms,
        language: "ru",
      });

      const doctor = res.data?.recommended_doctor;
      if (doctor?.id && doctor.reason) {
        setRecommendedDoctor({
          id: doctor.id,
          name: doctor.name,
          doctor_type: doctor.doctor_type,
          reason: doctor.reason,
        });
        setSelectedDoctorId(doctor.id);
        toast.success(`🤖 AI рекомендовал врача: ${doctor.name}`);
      } else {
        setRecommendedDoctor(undefined);
        toast.warn("⚠️ AI не смог подобрать врача.");
      }
    } catch {
      toast.warn("⚠️ Ошибка AI.");
    } finally {
      setLoadingAI(false);
      setStep(2);
    }
  };

  const handleStartCall = async () => {
    if (!selectedDoctorId) {
      toast.error("⚠️ Пожалуйста, выберите врача.");
      containerRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setLoadingCall(true);
    setWaiting(true);
    try {
      const res = await api.post("/consultations/start/", {
        doctor_id: selectedDoctorId,
        symptoms,
      });
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

  const cancelConsultation = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setWaiting(false);
    setMeetingId(null);
    toast.info("🚫 Консультация отменена.");
  };

  const startPolling = () => {
    const start = Date.now();
    const maxWait = 2 * 60 * 1000;

    return setInterval(async () => {
      if (!meetingId) return;

      if (Date.now() - start > maxWait) {
        toast.error("⏳ Время ожидания истекло.");
        cancelConsultation();
        return;
      }

      try {
        const res = await api.get("/consultations/status/", {
          params: { meeting_id: meetingId },
        });

        const status = res.data?.status;

        if (status === "ongoing") {
          toast.success("✅ Доктор подключился.");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
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
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-3xl mx-auto p-8 sm:p-10 bg-white/80 backdrop-blur rounded-3xl shadow-2xl border"
    >
      <h2 className="text-3xl font-extrabold text-[#001E80] mb-2">Видео консультация</h2>

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
    </motion.div>
  );
};

export default VideoConsultation;
