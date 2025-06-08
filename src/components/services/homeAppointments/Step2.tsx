"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface Step2Props {
  doctors: Doctor[];
  selectedDoctorId: number | null;
  onSelectDoctor: (id: number) => void;
  appointmentTime: string;
  onChangeTime: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
  fetchingDoctors?: boolean;
}

const Step2: React.FC<Step2Props> = ({
  doctors,
  selectedDoctorId,
  onSelectDoctor,
  appointmentTime,
  onChangeTime,
  onBack,
  onNext,
  loading = false,
  fetchingDoctors = false,
}) => {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Выберите врача <span className="text-red-500">*</span>
        </label>

        {fetchingDoctors ? (
          <div className="text-center text-gray-500 py-4">
            <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
            Загрузка списка врачей...
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-red-500">Нет доступных врачей</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => onSelectDoctor(doctor.id)}
                className={`border rounded-lg p-3 text-left transition ${
                  selectedDoctorId === doctor.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <div className="font-medium text-gray-800">{doctor.name}</div>
                <div className="text-sm text-gray-500">{doctor.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Время приёма <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={appointmentTime}
          onChange={(e) => onChangeTime(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100"
        >
          Назад
        </button>
        <button
          onClick={onNext}
          disabled={!selectedDoctorId || !appointmentTime || loading}
          className={`px-4 py-2 rounded-lg font-semibold text-white transition ${
            loading || !selectedDoctorId || !appointmentTime
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Загрузка..." : "Далее"}
        </button>
      </div>
    </motion.div>
  );
};

export default Step2;
