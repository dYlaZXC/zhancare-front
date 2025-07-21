"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Info, ClipboardPaste } from "lucide-react";

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
  const [showTooltip, setShowTooltip] = useState(false);

  const insertExample = () => {
    onChange("Головная боль, температура 38.5, слабость, першение в горле");
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Шаг и заголовок */}
      <div className="text-xs text-gray-500 uppercase tracking-wide">Шаг 1 из 3</div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-blue-600" size={28} />
          Расскажите о симптомах
        </h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Это поможет нам рекомендовать подходящего врача. Укажите: когда начались симптомы, что
          беспокоит больше всего, и насколько часто это происходит.
        </p>
      </motion.div>

      {/* Поле ввода */}
      <motion.textarea
        className="w-full h-40 p-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-gray-800 resize-none transition-all"
        placeholder="📝 Например: головная боль, жар, слабость..."
        value={symptoms}
        onChange={(e) => onChange(e.target.value)}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2 }}
      />

      {/* Вставить пример */}
      <div className="text-right">
        <button
          onClick={insertExample}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline transition"
        >
          <ClipboardPaste className="w-4 h-4" />
          Вставить пример
        </button>
      </div>

      {/* Подсказка */}
      <AnimatePresence>
        {!symptoms.trim() && (
          <motion.div
            className="text-sm text-blue-500 italic flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Info size={16} />
            💡 Опишите симптомы как можно точнее — это ускорит помощь.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопка Далее */}
      <div className="flex justify-end pt-4 relative">
        <motion.button
          onClick={onNext}
          disabled={isNextDisabled}
          onMouseEnter={() => setShowTooltip(isNextDisabled)}
          onMouseLeave={() => setShowTooltip(false)}
          whileTap={!isNextDisabled ? { scale: 0.97 } : {}}
          whileHover={!isNextDisabled ? { scale: 1.03 } : {}}
          transition={{ type: "spring", stiffness: 300 }}
          className={`px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition-all duration-300 ease-out ${
            isNextDisabled
              ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] opacity-50 cursor-not-allowed text-white"
              : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white hover:shadow-md"
          }`}
        >
          {loading ? (
            <>
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              AI думает...
            </>
          ) : (
            "Далее ➡"
          )}
        </motion.button>

        {showTooltip && isNextDisabled && (
          <div className="absolute -top-8 right-0 text-xs bg-gray-800 text-white px-3 py-1 rounded-md shadow">
            Пожалуйста, опишите симптомы перед продолжением
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VideoConsultationStep1;
