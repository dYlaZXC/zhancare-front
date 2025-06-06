"use client";

import React from "react";
import { motion } from "framer-motion";

interface Step1Props {
  symptoms: string;
  onChange: (value: string) => void;
  onNext: () => void;
  loading?: boolean;
}

const VideoConsultationStep1: React.FC<Step1Props> = ({
  symptoms,
  onChange,
  onNext,
  loading = false,
}) => {
  const isNextDisabled = !symptoms.trim() || loading;

  return (
    <motion.div
      className="space-y-6 p-6 bg-white shadow-xl rounded-2xl border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-semibold text-gray-800">Опишите свои симптомы</h2>
        <p className="mt-1 text-sm text-gray-500">
          Это поможет нам порекомендовать подходящего врача. Укажите все важные детали:
          например, когда начались симптомы, как часто возникают и насколько они сильные,
          а самое главное — какие симптомы сейчас вы наблюдаете у себя или у своих близких.
        </p>
      </motion.div>

      <motion.textarea
        className="w-full h-40 p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none"
        placeholder="Например: головная боль, жар, кашель, слабость..."
        value={symptoms}
        onChange={(e) => onChange(e.target.value)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      />

      <div className="flex justify-end pt-4">
        <motion.button
          onClick={onNext}
          disabled={isNextDisabled}
          whileTap={!isNextDisabled ? { scale: 0.97 } : {}}
          whileHover={!isNextDisabled ? { scale: 1.02 } : {}}
          transition={{ type: "spring", stiffness: 300 }}
          className={`px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition shadow-sm ${
            isNextDisabled
              ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] opacity-50 cursor-not-allowed text-white"
              : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white hover:shadow-lg"
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              AI думает...
            </>
          ) : (
            "Далее ➡"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VideoConsultationStep1;
