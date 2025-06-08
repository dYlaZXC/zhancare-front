"use client";

import React from "react";
import { motion } from "framer-motion";

interface Step1Props {
  address: string;
  symptoms: string;
  onChangeAddress: (val: string) => void;
  onChangeSymptoms: (val: string) => void;
  onNext: () => void;
  loading?: boolean;
}

const Step1: React.FC<Step1Props> = ({
  address,
  symptoms,
  onChangeAddress,
  onChangeSymptoms,
  onNext,
  loading = false,
}) => {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Адрес приёма <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Введите адрес, где вас нужно принять"
          value={address}
          onChange={(e) => onChangeAddress(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Симптомы
        </label>
        <textarea
          placeholder="Опишите ваши симптомы"
          rows={4}
          value={symptoms}
          onChange={(e) => onChangeSymptoms(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="pt-4">
        <button
          onClick={onNext}
          disabled={!address.trim() || loading}
          className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition ${
            loading || !address.trim()
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

export default Step1;
