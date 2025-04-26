"use client";

import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle, faWindowClose } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

const statusTranslations: Record<string, string> = {
  pending: "⏳ В ожидании",
  ongoing: "🟢 В процессе",
  completed: "✅ Завершено",
  cancelled: "❌ Отменено",
};

interface Consultation {
  id: number;
  patient_name: string;
  patient_email: string | null;
  status: "pending" | "ongoing" | "completed" | "cancelled";
}

const DoctorConsultations: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [newConsultation, setNewConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seenIds = useRef(new Set<number>());
  const dismissedIds = useRef(new Set<number>());
  const isSoundPlaying = useRef(false);

  useEffect(() => {
    fetchConsultations();
    const interval = setInterval(fetchNewConsultations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchConsultations = async () => {
    try {
      const { data } = await api.get<Consultation[]>("/consultations/");
      setConsultations(data);
    } catch (error) {
      toast.error("Ошибка загрузки консультаций");
    } finally {
      setLoading(false);
    }
  };

  const fetchNewConsultations = async () => {
    try {
      const { data } = await api.get<Consultation[]>("/consultations/");
      const pending = data.find(
        (c) =>
          c.status === "pending" &&
          !seenIds.current.has(c.id) &&
          !dismissedIds.current.has(c.id)
      );

      if (pending && !newConsultation) {
        setNewConsultation(pending);
        seenIds.current.add(pending.id);
        playSound();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const playSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(() => {});
    isSoundPlaying.current = true;
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isSoundPlaying.current = false;
    }
  };

  const acceptConsultation = async (id: number) => {
    stopSound();
    try {
      const { data } = await api.post<{ meeting_id: string }>(`/consultations/${id}/accept/`, {});
      toast.success("Консультация принята");
      router.push(`/video-call?meetingId=${data.meeting_id}`);
    } catch {
      toast.error("Ошибка при принятии консультации");
    }
    setNewConsultation(null);
    fetchConsultations();
  };

  const rejectConsultation = async (id: number) => {
    stopSound();
    try {
      await api.post(`/consultations/${id}/reject/`, {});
      toast.info("Консультация отклонена");
    } catch {
      toast.error("Ошибка при отклонении консультации");
    }
    setNewConsultation(null);
    fetchConsultations();
  };

  const dismissPopup = () => {
    if (newConsultation) {
      dismissedIds.current.add(newConsultation.id);
    }
    stopSound();
    setNewConsultation(null);
  };

  return (
    <div className="p-6 bg-white shadow-xl rounded-2xl relative min-h-[400px]">
      <h2 className="text-2xl font-bold text-[#001E80]">Мои Консультации</h2>
      <p className="text-gray-600 mt-2">Следите за новыми запросами консультаций.</p>

      {/* ✅ Popup for New Consultation */}
      <AnimatePresence>
        {newConsultation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          >
            <div className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] p-8 rounded-xl w-full max-w-md space-y-4">
              <h3 className="text-xl font-bold text-white">🆕 Новая консультация</h3>
              <p className="text-lg text-white">
                Пациент: <strong>{newConsultation.patient_name}</strong>
              </p>
              <p className="text-gray-200">📧 {newConsultation.patient_email || "Нет Email"}</p>
              <p className="text-gray-200">
                📅 Статус: <strong>{statusTranslations[newConsultation.status]}</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => acceptConsultation(newConsultation.id)}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex-1"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  Принять
                </button>
                <button
                  onClick={() => rejectConsultation(newConsultation.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex-1"
                >
                  <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                  Отклонить
                </button>
                <button
                  onClick={dismissPopup}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex-1"
                >
                  <FontAwesomeIcon icon={faWindowClose} className="mr-2" />
                  Закрыть
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Consultations Table */}
      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">
            Загрузка консультаций...
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Консультаций нет
          </div>
        ) : (
          <table className="w-full border-collapse mt-4 min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3">Пациент</th>
                <th className="border p-3">Email</th>
                <th className="border p-3">Статус</th>
                <th className="border p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="border p-3 font-medium">{c.patient_name}</td>
                  <td className="border p-3 break-all text-gray-700">{c.patient_email || "—"}</td>
                  <td className="border p-3">
                    <span className="bg-gray-200 px-3 py-1 rounded-full text-xs font-medium">
                      {statusTranslations[c.status]}
                    </span>
                  </td>
                  <td className="border p-3">
                    {c.status === "pending" && (
                      <button
                        onClick={() => acceptConsultation(c.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md"
                      >
                        Принять
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DoctorConsultations;
