"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { ScheduleEvent } from "../types/scheduleTypes";
import EventDetailCard from "../components/EventDetailCard";

interface DateDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  events: ScheduleEvent[];
}

export default function DateDetailsDrawer({
  isOpen,
  onClose,
  selectedDate,
  events
}: DateDetailsDrawerProps) {
  if (!isOpen || !selectedDate) return null;

  const formattedDate = new Date(selectedDate).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between z-10">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-1">Консультации на дату</h2>
              <p className="text-blue-100 capitalize">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">Нет запланированных консультаций</p>
                <p className="text-gray-400 text-sm mt-2">На эту дату пока нет записей</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 font-medium">
                    Всего: {sortedEvents.length} {sortedEvents.length === 1 ? 'консультация' : 'консультаций'}
                  </p>
                </div>

                {sortedEvents.map((event) => (
                  <EventDetailCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
