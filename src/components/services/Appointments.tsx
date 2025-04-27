"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { Loader2, CalendarCheck, UserCircle, CheckCircle2, AlertCircle, Stethoscope, Clock } from "lucide-react";
import { api } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

const Appointments = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<{ id: number; name: string; email: string }[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setFetchingDoctors(true);
    try {
      const response = await api.get("/auth/doctor/available/");
      setDoctors(response.data.doctors || []);
    } catch (err) {
      console.error("Ошибка загрузки врачей:", err);
      setError("⚠️ Не удалось загрузить список врачей.");
    } finally {
      setFetchingDoctors(false);
    }
  };

  const handleBeforeSubmit = () => {
    if (!selectedDoctor || !appointmentTime) {
      toast.error("Пожалуйста, выберите врача и время приема.");
      return;
    }

    if (new Date(appointmentTime) <= new Date()) {
      toast.error("Пожалуйста, выберите дату и время в будущем.");
      return;
    }

    setConfirmModal(true);
  };

  const handleSubmit = async () => {
    setConfirmModal(false);
    setLoading(true);
    try {
      const response = await api.post("/appointments/", {
        doctor_id: selectedDoctor,
        appointment_time: appointmentTime,
      });

      if (response.status === 201 || response.status === 200) {
        toast.success("✅ Запись успешно создана!");
        setSelectedDoctor(null);
        setAppointmentTime("");
        setSuccess(true);
      } else {
        toast.error("❌ Не удалось создать запись.");
      }
    } catch (err: any) {
      console.error("Ошибка создания записи:", err);
      toast.error(err?.response?.data?.error || "Ошибка сервера.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full px-6 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Info Panel */}
        <div className="space-y-6 md:col-span-1">
          <div className="flex items-center space-x-4 bg-white rounded-2xl p-4 shadow border border-gray-100">
            <UserCircle className="w-12 h-12 text-[#001E80]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {user?.first_name} {user?.last_name || ""}
              </h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 space-y-2">
            <h3 className="text-md font-semibold text-[#001E80] flex items-center gap-2">
              <CalendarCheck className="w-5 h-5" /> Советы по записи
            </h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Выбирайте удобное для вас время</li>
              <li>Доктор свяжется с вами для подтверждения</li>
              <li>Не забудьте проверить уведомления</li>
            </ul>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-2 space-y-8">
          {/* Title */}
          <div className="flex items-center space-x-3">
            <CalendarCheck className="w-8 h-8 text-[#001E80]" />
            <h1 className="text-3xl font-extrabold text-[#001E80]">
              Запись на прием
            </h1>
          </div>
          <p className="text-gray-600">
            Выберите врача и удобное время для консультации
          </p>

          {error && (
            <p className="text-red-500 bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </p>
          )}

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white shadow rounded-2xl p-6 space-y-6 border border-gray-100"
              >
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🩺 Выберите врача:
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={selectedDoctor || ""}
                    onChange={(e) => setSelectedDoctor(Number(e.target.value))}
                  >
                    <option value="">-- Выберите врача --</option>
                    {doctors.length > 0 ? (
                      doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        Нет доступных врачей
                      </option>
                    )}
                  </select>

                  {fetchingDoctors && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" /> Загрузка списка врачей...
                    </p>
                  )}
                </div>

                {/* Appointment Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🕒 Дата и время:
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleBeforeSubmit}
                  disabled={loading}
                  className={`w-full text-white py-3 rounded-lg font-medium transition flex items-center justify-center ${
                    loading
                      ? "bg-[#001E80] opacity-50 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] hover:opacity-90"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    "Записаться на консультацию"
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-700 mb-2">
                  Запись успешно создана!
                </h2>
                <p className="text-green-700">
                  Ожидайте подтверждения врача. Информация будет доступна в личном кабинете.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Подтверждение записи</h3>
            <p className="text-gray-700">
              Вы уверены, что хотите записаться на консультацию к выбранному врачу?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#001E80] text-white rounded-lg hover:opacity-90 transition"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
