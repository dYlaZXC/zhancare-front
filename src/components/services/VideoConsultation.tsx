"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { fetchAvailableDoctors, startConsultation, checkConsultationStatus } from "@/components/services/consultationService";

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
        const doctors = response.data.doctors || [];

        const filteredDoctors = doctors.filter(
          (doc: Doctor) => doc.doctor_type !== "Сестринское дело" && doc.doctor_type != null
        );

        if (filteredDoctors.length > 0) {
          setDoctors(filteredDoctors);
        } else {
          setDoctors([]);
          toast.warn("⚠️ Нет доступных врачей.");
        }
      } else {
        setDoctors([]);
        toast.warn("⚠️ Нет доступных врачей.");
      }
    } catch (error: any) {
      console.error("❌ Ошибка загрузки врачей:", error);
      setDoctors([]);
      toast.error("⚠️ Ошибка загрузки списка врачей. Попробуйте позже.");
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
    const maxWaitTime = 2 * 60 * 1000; // 2 minutes

    const interval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;
        if (elapsed > maxWaitTime) {
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
        console.error("Ошибка проверки статуса консультации:", error);
      }
    }, 3000);

    return interval;
  };

  const scrollToTop = () => {
    containerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="p-6 bg-white shadow-xl rounded-2xl max-w-xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-[#001E80]">Видео консультация</h2>
      <p className="text-gray-600 mt-2">Выберите врача для онлайн-видеозвонка.</p>

      <div className="mt-6 space-y-4">
        {/* 🔹 Выбор врача */}
        <div>
          <label className="block text-gray-700 mb-2 text-sm">Выберите доступного врача:</label>
          {fetchingDoctors ? (
            <div className="animate-pulse text-sm text-gray-500">Загрузка списка врачей...</div>
          ) : doctors.length > 0 ? (
            <select
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition"
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
        </div>

        {/* 🔹 Кнопка старта */}
        <button
          onClick={handleStartCall}
          className={`w-full text-white py-3 rounded-lg font-medium transition flex items-center justify-center ${
            loading || waitingForDoctor
              ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] opacity-50 cursor-not-allowed"
              : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] hover:opacity-90"
          }`}
          disabled={loading || !selectedDoctorId || waitingForDoctor}
        >
          {waitingForDoctor ? (
            <>
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
              Ожидание врача...
            </>
          ) : (
            "Начать звонок"
          )}
        </button>

        {/* ⏳ Loading Indicator */}
        {waitingForDoctor && (
          <div className="text-sm text-blue-600 mt-2 animate-pulse">
            Ожидание подтверждения врача...
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoConsultation;
