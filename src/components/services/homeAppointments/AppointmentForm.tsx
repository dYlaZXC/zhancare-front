"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface AppointmentFormProps {
  doctors: Doctor[];
  fetchingDoctors: boolean;
  selectedDoctor: number | null;
  setSelectedDoctor: (id: number | null) => void;
  appointmentTime: string;
  setAppointmentTime: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  symptoms: string;
  setSymptoms: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  doctors,
  fetchingDoctors,
  selectedDoctor,
  setSelectedDoctor,
  appointmentTime,
  setAppointmentTime,
  address,
  setAddress,
  symptoms,
  setSymptoms,
  notes,
  setNotes,
  loading,
  onSubmit,
}) => {
  return (
    <div className="bg-white shadow rounded-2xl p-6 space-y-6 border border-gray-100">
      {/* Doctor Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🩺 Выберите медсестру:
        </label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={selectedDoctor || ""}
          onChange={(e) =>
            setSelectedDoctor(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">-- Выберите специалиста --</option>
          {doctors.length > 0 ? (
            doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))
          ) : (
            <option value="" disabled>
              Нет доступных специалистов
            </option>
          )}
        </select>
        {fetchingDoctors && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            Загрузка списка врачей...
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📍 Адрес вызова:
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Введите полный адрес"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Symptoms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🤒 Симптомы (необязательно):
        </label>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Опишите симптомы..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          rows={3}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📝 Заметки (необязательно):
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Дополнительные замечания..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          rows={2}
        />
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

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className={`w-full text-white py-3 rounded-lg font-medium transition flex items-center justify-center ${
          loading
            ? "bg-[#001E80] opacity-50 cursor-not-allowed"
            : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] hover:opacity-90"
        }`}
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Вызвать врача"}
      </button>
    </div>
  );
};

export default AppointmentForm;
