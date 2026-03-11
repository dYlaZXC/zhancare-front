"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarNavigationProps {
  dateRangeString: string;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function CalendarNavigation({
  dateRangeString,
  onToday,
  onPrevious,
  onNext
}: CalendarNavigationProps) {
  return (
    <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToday}
        className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base rounded-lg md:rounded-xl border-2 border-gray-200 hover:border-blue-300 font-medium transition-colors whitespace-nowrap flex-shrink-0"
      >
        Сегодня
      </motion.button>

      <div className="flex items-center gap-1 md:gap-2 flex-1 justify-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onPrevious}
          className="p-1.5 md:p-2 rounded-lg md:rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </motion.button>

        <div className="min-w-0 text-center font-semibold text-xs md:text-lg px-2 truncate" style={{ color: '#1e263e' }}>
          {dateRangeString}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onNext}
          className="p-1.5 md:p-2 rounded-lg md:rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </motion.button>
      </div>
    </div>
  );
}
