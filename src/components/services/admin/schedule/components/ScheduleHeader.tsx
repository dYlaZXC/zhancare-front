"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface ScheduleHeaderProps {
  onAddClick: () => void;
}

export default function ScheduleHeader({ onAddClick }: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-0 mb-4 md:mb-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 truncate" style={{ color: '#1e263e' }}>
          Расписание
        </h1>
        <p className="text-xs md:text-base text-gray-600 truncate">
          Управление онлайн и оффлайн консультациями
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddClick}
        className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-white text-sm md:text-base font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
        style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
      >
        <Plus className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline">Добавить Запись</span>
        <span className="sm:hidden">Добавить</span>
      </motion.button>
    </div>
  );
}
