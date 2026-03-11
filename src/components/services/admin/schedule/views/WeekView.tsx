"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import {
  getWeekDays,
  toLocalDateStr,
  getDayName,
  formatDate,
  isToday,
} from "../utils/calendarUtils";
import { getEventsForDate } from "../hooks/useScheduleData";
import EventCard from "../components/EventCard";
import { ScheduleEvent } from "../types/scheduleTypes";

interface WeekViewProps {
  currentDate: Date;
  filteredEvents: ScheduleEvent[];
  onDateClick: (date: string) => void;
  onAddClick: () => void;
}

export default function WeekView({
  currentDate,
  filteredEvents,
  onDateClick,
  onAddClick,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
      {weekDays.map((day) => {
        const dateString = toLocalDateStr(day);
        const dayEvents = getEventsForDate(filteredEvents, dateString);
        const isTodayDate = isToday(day);

        return (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl md:rounded-3xl p-3 md:p-4 border-2 min-h-[400px] md:min-h-[500px] ${
              isTodayDate ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white'
            }`}
          >
            {/* Day header */}
            <div className="mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-semibold">
                {getDayName(day)}
              </div>
              <div className={`text-xl md:text-2xl font-bold mt-1 ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
                {day.getDate()}
              </div>
              <button
                onClick={() => {
                  onDateClick(dateString);
                  onAddClick();
                }}
                className="mt-2 w-full py-1.5 md:py-2 rounded-lg md:rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 hover:text-blue-600"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                Добавить
              </button>
            </div>

            {/* Events list */}
            <div className="space-y-2">
              {dayEvents.length > 0 ? (
                dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-400 text-xs md:text-sm">
                  Нет записей
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
