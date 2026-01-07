"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faClock,
  faUserMd,
  faArrowLeft,
  faCheckCircle,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function SchedulePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const doctors = [
    { id: 1, name: "Доктор Аманжол Касымов", specialty: "Терапевт", rating: 4.9 },
    { id: 2, name: "Доктор Айгерим Нурланова", specialty: "Кардиолог", rating: 4.8 },
    { id: 3, name: "Доктор Ербол Мухамедов", specialty: "Невролог", rating: 4.9 },
  ];

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00"
  ];

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !symptoms) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    toast.success("Консультация запланирована!");
    setTimeout(() => {
      router.push("/consultation/payment");
    }, 1500);
  };

  // Generate dates for next 7 days
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
      });
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="hidden sm:inline">Назад</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Запланировать консультацию</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
            <FontAwesomeIcon icon={faCalendar} className="text-5xl mb-3" />
            <h2 className="text-3xl font-bold mb-2">Выберите удобное время</h2>
            <p className="text-blue-100">Заполните форму и мы свяжемся с вами для подтверждения</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Symptoms */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Опишите ваши симптомы *
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Расскажите, что вас беспокоит..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Выберите специалиста *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor.id.toString())}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedDoctor === doctor.id.toString()
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                          {doctor.name.split(' ')[1].charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{doctor.name}</h4>
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                          <span className="font-semibold">{doctor.rating}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Выберите дату *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {getNextDays().map((day) => (
                  <button
                    key={day.value}
                    onClick={() => setSelectedDate(day.value)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${
                      selectedDate === day.value
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-blue-300 text-gray-600"
                    }`}
                  >
                    <div className="text-xs font-medium">{day.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Выберите время *
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 px-4 rounded-xl border-2 transition-all text-center font-semibold ${
                      selectedTime === time
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-blue-300 text-gray-600"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedDate && selectedTime && selectedDoctor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100"
              >
                <h3 className="font-bold text-gray-900 mb-3">Ваша консультация:</h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Врач:</strong> {doctors.find(d => d.id.toString() === selectedDoctor)?.name}
                  </p>
                  <p>
                    <strong>Дата:</strong> {new Date(selectedDate).toLocaleDateString('ru-RU', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p>
                    <strong>Время:</strong> {selectedTime}
                  </p>
                  <p>
                    <strong>Стоимость:</strong> 15,000 ₸
                  </p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSchedule}
              disabled={!selectedDate || !selectedTime || !selectedDoctor || !symptoms}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              <span>Запланировать консультацию</span>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>

            <p className="text-center text-sm text-gray-500">
              После подтверждения врачом вы получите уведомление и сможете оплатить консультацию
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
