"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Stethoscope, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { Doctor, TimeSlot, Language } from "../types/doctor";
import { getSpecializationName } from "../utils/doctorUtils";
import { formatTime } from "../utils/timeslotUtils";

const GRADIENTS = [
  ['#3772ff', '#2c5bcc'],
  ['#8b5cf6', '#7c3aed'],
  ['#f43f5e', '#e11d48'],
  ['#f59e0b', '#d97706'],
  ['#10b981', '#059669'],
  ['#06b6d4', '#0891b2'],
];

interface SlotPickerModalProps {
  doctor: Doctor;
  timeslots: TimeSlot[];
  language: Language;
  onSelect: (timeslot: TimeSlot) => void;
  onClose: () => void;
  onFetchDates?: (dates: string[]) => void;
}

// Generate 7 days starting from a given offset (in days from today)
const getWeekDates = (startOffset: number) => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + startOffset + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    return { date: dateStr, dayName: dayNames[d.getDay()], dayNumber: d.getDate(), month: d.getMonth(), year: d.getFullYear(), fullDate: d, isToday, isTomorrow };
  });
};

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const SlotPickerModal: React.FC<SlotPickerModalProps> = ({
  doctor,
  timeslots,
  language,
  onSelect,
  onClose,
  onFetchDates,
}) => {
  const [g1, g2] = GRADIENTS[doctor.id % GRADIENTS.length];
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week (today + 6)

  const weekDates = getWeekDates(weekOffset);

  // Auto-select first date with free slots in current week view
  const firstAvailableDateInWeek = (() => {
    for (const dateItem of weekDates) {
      const hasFree = timeslots.some(s => {
        const d = new Date(s.start_time);
        return d.getFullYear() === dateItem.year && d.getMonth() === dateItem.month && d.getDate() === dateItem.dayNumber && !s.is_booked && (s.available_spots ?? 1) > 0;
      });
      if (hasFree) return dateItem.date;
    }
    return weekDates[0].date;
  })();

  const [selectedDate, setSelectedDate] = useState(() => {
    // Initially pick first available date overall
    const slot = timeslots.find(s => !s.is_booked && (s.available_spots ?? 1) > 0);
    if (!slot) return weekDates[0].date;
    const d = new Date(slot.start_time);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // When week changes, fetch new dates and auto-select first available
  useEffect(() => {
    const dates = weekDates.map(d => d.date);
    onFetchDates?.(dates);
    setSelectedDate(firstAvailableDateInWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const goToToday = () => {
    setWeekOffset(0);
    const today = new Date();
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  };

  // Header date label — show selected date
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const headerLabel = `${WEEKDAYS_RU[selectedDateObj.getDay()]}, ${selectedDateObj.getDate()} ${MONTHS_RU[selectedDateObj.getMonth()]} ${selectedDateObj.getFullYear()} г.`;

  const getSlotsForDate = (date: string) =>
    timeslots
      .filter(s => {
        const d = new Date(s.start_time);
        const t = new Date(date + 'T00:00:00');
        return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const slotsForDate = getSlotsForDate(selectedDate);
  const freeCount = slotsForDate.filter(s => !s.is_booked && (s.available_spots ?? 1) > 0).length;
  const bookedCount = slotsForDate.length - freeCount;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Doctor header */}
          <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${g1}15, white)` }}>
            {/* Drag handle (mobile) */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                >
                  {doctor.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{doctor.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Stethoscope size={9} className="text-blue-500" />
                    <p className="text-xs text-blue-600 font-medium">{getSpecializationName(doctor, language)}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-6 space-y-3">

            {/* Week navigation — like admin */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                Сегодня
              </button>
              <button
                onClick={() => setWeekOffset(o => o - 7)}
                disabled={weekOffset <= 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                <ChevronLeft size={14} className="text-gray-600" />
              </button>
              <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-700">
                <Calendar size={12} className="text-gray-400" />
                <span className="truncate">{headerLabel}</span>
              </div>
              <button
                onClick={() => setWeekOffset(o => o + 7)}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>

            {/* 7-day strip */}
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((dateItem) => {
                const isDateSelected = selectedDate === dateItem.date;
                const hasFreeSlots = timeslots.some(s => {
                  const d = new Date(s.start_time);
                  return d.getFullYear() === dateItem.year && d.getMonth() === dateItem.month && d.getDate() === dateItem.dayNumber && !s.is_booked && (s.available_spots ?? 1) > 0;
                });
                return (
                  <button
                    key={dateItem.date}
                    onClick={() => setSelectedDate(dateItem.date)}
                    className={clsx(
                      "flex flex-col items-center py-2 rounded-xl text-[9px] font-semibold transition-all border",
                      isDateSelected
                        ? "text-white border-transparent shadow-sm"
                        : dateItem.isToday
                        ? "bg-blue-50 text-blue-600 border-blue-200"
                        : hasFreeSlots
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                        : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                    )}
                    style={isDateSelected ? { background: `linear-gradient(135deg, ${g1}, ${g2})` } : undefined}
                  >
                    <span className="opacity-80">{dateItem.dayName}</span>
                    <span className="font-bold text-[12px] leading-tight mt-0.5">{dateItem.dayNumber}</span>
                    {dateItem.isToday && (
                      <span className={clsx("text-[7px] mt-0.5", isDateSelected ? "text-white/70" : "text-blue-400")}>сег</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Slots */}
            <div>
              {slotsForDate.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Выберите время</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {freeCount} свободно
                    </span>
                    {bookedCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        {bookedCount} занято
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {slotsForDate.map(slot => {
                      const isFree = !slot.is_booked && (slot.available_spots ?? 1) > 0;
                      return (
                        <button
                          key={slot.id}
                          disabled={!isFree}
                          onClick={() => isFree && onSelect(slot)}
                          className={clsx(
                            "flex flex-col items-center justify-center py-2.5 rounded-xl transition-all",
                            isFree
                              ? "bg-emerald-50 border border-emerald-200 hover:text-white hover:border-transparent cursor-pointer"
                              : "bg-gray-50 border border-gray-100 cursor-not-allowed"
                          )}
                          onMouseEnter={(e) => {
                            if (isFree) (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${g1}, ${g2})`;
                          }}
                          onMouseLeave={(e) => {
                            if (isFree) (e.currentTarget as HTMLButtonElement).style.background = '';
                          }}
                        >
                          <span className={clsx(
                            "text-[12px] font-black leading-tight",
                            isFree ? "text-emerald-700" : "text-gray-300 line-through"
                          )}>
                            {formatTime(slot.start_time)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Нет слотов на эту дату</p>
                  <p className="text-xs text-gray-300">Выберите другую дату</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SlotPickerModal;
