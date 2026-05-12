"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, Calendar, FileText } from "lucide-react";

interface Step3Props {
  appointmentTime: string;
  address: string;
  apartment: string;
  entrance: string;
  intercom: string;
  addressComment: string;
  symptoms: string;
  notes: string;
  onBack: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

const Step3: React.FC<Step3Props> = ({
  appointmentTime,
  address,
  apartment,
  entrance,
  intercom,
  addressComment,
  symptoms,
  notes,
  onBack,
  onSubmit,
  loading = false,
}) => {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Подтвердите данные</h3>
        <p className="text-gray-600 text-sm">Проверьте информацию перед отправкой вызова</p>
      </div>

      {/* Confirmation Details */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 shadow-sm space-y-4">
        {/* Address */}
        <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#3772ff]/10 flex-shrink-0">
            <MapPin className="w-5 h-5 text-[#3772ff]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Адрес приёма</p>
            <p className="text-sm font-medium text-gray-900">{address}</p>
            {(apartment || entrance || intercom) && (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {apartment && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">кв. {apartment}</span>
                )}
                {entrance && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">подъезд {entrance}</span>
                )}
                {intercom && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">домофон {intercom}</span>
                )}
              </div>
            )}
            {addressComment && (
              <p className="text-xs text-gray-500 mt-1 italic">{addressComment}</p>
            )}
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#3772ff]/10 flex-shrink-0">
            <Calendar className="w-5 h-5 text-[#3772ff]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Дата и время визита</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(appointmentTime).toLocaleString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Symptoms */}
        {symptoms && (
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#3772ff]/10 flex-shrink-0">
              <FileText className="w-5 h-5 text-[#3772ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Симптомы</p>
              <p className="text-sm font-medium text-gray-900">{symptoms}</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Обратите внимание:</span> После создания вызова, медсестра примет его и свяжется с вами для уточнения деталей.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>

        <button
          onClick={onSubmit}
          disabled={loading || !appointmentTime || !address}
          className={`flex-1 px-6 py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
            loading || !appointmentTime || !address
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:shadow-xl hover:shadow-[#3772ff]/30 hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Отправка...
            </>
          ) : (
            "Подтвердить и отправить"
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Step3;
