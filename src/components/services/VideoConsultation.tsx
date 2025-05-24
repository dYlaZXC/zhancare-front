"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAvailableDoctors,
  startConsultation,
  checkConsultationStatus,
} from "@/components/services/consultationService";

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
}

const VideoConsultation: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [waitingForDoctor, setWaitingForDoctor] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (waitingForDoctor && meetingId) {
      interval = pollForDoctorAcceptance();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [waitingForDoctor, meetingId]);

  const fetchDoctors = async () => {
    setFetchingDoctors(true);
    try {
      if (!token) {
        toast.error("🚫 Вы не авторизованы! Пожалуйста, войдите в систему.");
        setDoctors([]);
        return;
      }
      const response = await fetchAvailableDoctors();
      if (response.status === 200) {
        const availableDoctors = response.data.doctors?.filter(
          (doc: Doctor) =>
            doc.doctor_type !== "Сестринское дело" && doc.doctor_type != null
        );
        setDoctors(availableDoctors || []);
        if (!availableDoctors || availableDoctors.length === 0)
          toast.warn("⚠️ Нет доступных врачей.");
      } else {
        setDoctors([]);
        toast.warn("⚠️ Нет доступных врачей.");
      }
    } catch (error: any) {
      console.error("❌ Ошибка загрузки врачей:", error);
      toast.error("⚠️ Ошибка загрузки списка врачей. Попробуйте позже.");
      setDoctors([]);
    } finally {
      setFetchingDoctors(false);
    }
  };

  const handleStartCall = async () => {
    if (!selectedDoctorId) {
      toast.error("⚠️ Пожалуйста, выберите врача перед началом звонка.");
      scrollToTop();
      return;
    }
    setLoading(true);
    setWaitingForDoctor(true);
    try {
      const response = await startConsultation(selectedDoctorId);
      if (response.status === 200 && response.data) {
        setMeetingId(response.data.meeting_id);
        toast.success("Консультация запрошена! Ожидаем подтверждения врача.");
      } else {
        toast.error("⚠️ Не удалось начать консультацию.");
        setWaitingForDoctor(false);
      }
    } catch (error: any) {
      console.error("❌ Ошибка начала консультации:", error);
      toast.error(error?.response?.data?.error || "⚠️ Ошибка сети. Попробуйте позже.");
      setWaitingForDoctor(false);
      scrollToTop();
    } finally {
      setLoading(false);
    }
  };

  const pollForDoctorAcceptance = () => {
    const startTime = Date.now();
    const maxWaitTime = 2 * 60 * 1000;
    const interval = setInterval(async () => {
      try {
        if (Date.now() - startTime > maxWaitTime) {
          toast.error("⏳ Время ожидания истекло. Попробуйте выбрать другого врача.");
          clearInterval(interval);
          setWaitingForDoctor(false);
          setMeetingId(null);
          return;
        }
        const response = await checkConsultationStatus(meetingId!);
        if (response.status === 200) {
          const { status } = response.data;
          if (status === "ongoing") {
            toast.success("Доктор принял звонок! Подключаемся...");
            clearInterval(interval);
            setWaitingForDoctor(false);
            router.push(`/video-call?meetingId=${meetingId}`);
          } else if (status === "cancelled") {
            toast.error("Доктор отклонил запрос. Попробуйте другого специалиста.");
            clearInterval(interval);
            setMeetingId(null);
            setWaitingForDoctor(false);
          }
        }
      } catch (error) {
        console.error("Ошибка проверки статуса:", error);
      }
    }, 3000);
    return interval;
  };

  const scrollToTop = () => {
    containerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto p-8 sm:p-10 bg-white/80 backdrop-blur rounded-3xl shadow-2xl border border-gray-200"
    >
      <h2 className="text-3xl font-extrabold text-[#001E80] mb-2">
        Видео консультация
      </h2>
      <p className="text-gray-600 mb-6">Выберите врача для онлайн-видеозвонка.</p>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Доступные врачи:
          </label>
          {fetchingDoctors ? (
            <div className="animate-pulse text-gray-400 text-sm">Загрузка врачей...</div>
          ) : doctors.length > 0 ? (
            <select
              className="w-full border-b-2 border-gray-300 bg-transparent text-gray-800 py-2 focus:outline-none focus:border-blue-500 transition rounded-none"
              value={selectedDoctorId || ""}
              onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
            >
              <option value="">-- Выберите врача --</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.doctor_type})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-gray-400 text-sm">Нет доступных врачей.</div>
          )}
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          onClick={handleStartCall}
          disabled={loading || !selectedDoctorId || waitingForDoctor}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition shadow-sm ${
            loading || waitingForDoctor
              ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] opacity-50 cursor-not-allowed"
              : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white hover:shadow-lg"
          }`}
        >
          {waitingForDoctor ? (
            <>
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
              Ожидание врача...
            </>
          ) : (
            "Начать звонок"
          )}
        </motion.button>

        <AnimatePresence>
          {waitingForDoctor && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-blue-600 mt-2 animate-pulse"
            >
              Подключаемся... ждём подтверждения врача
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VideoConsultation;
