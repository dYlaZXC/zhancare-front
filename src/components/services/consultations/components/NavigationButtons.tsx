"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import clsx from "clsx";

interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  disabled?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onBack,
  onNext,
  canProceed,
  disabled = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
      <motion.button
        onClick={onBack}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
      >
        <ArrowLeft size={16} />
        Назад
      </motion.button>

      <div className="relative">
        <motion.button
          onClick={onNext}
          disabled={!canProceed || disabled}
          whileTap={canProceed && !disabled ? { scale: 0.95 } : {}}
          onTouchStart={() => setShowTooltip(!canProceed && !disabled)}
          onTouchEnd={() => setShowTooltip(false)}
          onMouseEnter={() => setShowTooltip(!canProceed && !disabled)}
          onMouseLeave={() => setShowTooltip(false)}
          className={clsx(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all",
            canProceed && !disabled
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          Продолжить
          <ArrowRight size={16} />
        </motion.button>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-10"
            >
              Выберите врача
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NavigationButtons;