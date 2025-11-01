"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, UserCircle, Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

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
  // Calculate minimum date (now + 30 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  // Check if selected time is valid
  const isTimeValid = appointmentTime && new Date(appointmentTime) > new Date();

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Doctor Selection */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm hover:border-[#3772ff] transition-colors duration-200">
        <label className="block text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-[#3772ff]" />
          Выберите специалиста <span className="text-red-500">*</span>
        </label>

        {fetchingDoctors ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin inline-block text-[#3772ff] mb-3" />
            <p className="text-gray-500 text-sm">Загрузка списка специалистов...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-8 bg-red-50 rounded-xl border border-red-200">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Нет доступных специалистов</p>
            <p className="text-red-500 text-sm mt-1">Попробуйте позже или свяжитесь с поддержкой</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {doctors.map((doctor) => {
              const isSelected = selectedDoctorId === doctor.id;
              return (
                <button
                  key={doctor.id}
                  onClick={() => onSelectDoctor(doctor.id)}
                  className={`relative group border-2 rounded-xl p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-[#3772ff] bg-gradient-to-br from-[#3772ff]/5 to-[#2956bf]/5 shadow-md"
                      : "border-gray-200 hover:border-[#3772ff]/50 hover:bg-gray-50"
                  }`}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-[#3772ff]" />
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Doctor Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "bg-gradient-to-br from-[#3772ff] to-[#2956bf]"
                        : "bg-gray-100 group-hover:bg-[#3772ff]/10"
                    }`}>
                      <UserCircle className={`w-7 h-7 ${isSelected ? "text-white" : "text-gray-500 group-hover:text-[#3772ff]"}`} />
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm mb-1 ${
                        isSelected ? "text-[#3772ff]" : "text-gray-800"
                      }`}>
                        {doctor.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {doctor.email}
                      </div>

                      {/* Status Badge */}
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-md">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          Доступен
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Selection */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm hover:border-[#3772ff] transition-colors duration-200">
        <label className="block text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#3772ff]" />
          Дата и время визита <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <input
            type="datetime-local"
            value={appointmentTime}
            onChange={(e) => onChangeTime(e.target.value)}
            min={getMinDateTime()}
            className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all duration-200"
          />
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Time Validation Message */}
        {appointmentTime && (
          <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-sm ${
            isTimeValid
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {isTimeValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Время выбрано корректно</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Выберите время минимум через 30 минут от текущего момента</span>
              </>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Врач прибудет в указанное время (±15 минут)
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          ← Назад
        </button>
        <button
          onClick={onNext}
          disabled={!selectedDoctorId || !appointmentTime || !isTimeValid || loading}
          className={`flex-1 px-6 py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-lg ${
            loading || !selectedDoctorId || !appointmentTime || !isTimeValid
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:shadow-xl hover:shadow-[#3772ff]/30 hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {loading ? "Загрузка..." : "Продолжить →"}
        </button>
      </div>
    </motion.div>
  );
};

export default Step2;
