"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";
import {
  Star,
  CheckCircle2,
  Shield,
  TrendingUp,
  GraduationCap,
  Calendar,
  Award,
  MessageSquare,
  Video,
  Phone,
  Heart,
  MapPin,
  Bot,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from "lucide-react";

import type { Doctor, TimeSlot, Language } from "../types/doctor";
import { getSpecializationName } from "../utils/doctorUtils";
import { formatTime, getTimeLabel, generateCalendarDates } from "../utils/timeslotUtils";

interface DoctorCardProps {
  doctor: Doctor;
  isRecommended?: boolean;
  isSelected?: boolean;
  language: Language;
  isUrgent?: boolean;
  timeslots?: TimeSlot[];
  selectedDate?: string;
  showFullCalendar?: boolean;
  doctorTimeslotsByDate?: Record<string, TimeSlot[]>;
  lastUpdateTime?: string | null;
  onDateSelect?: (date: string) => void;
  onTimeslotSelect?: (timeslot: TimeSlot) => void;
  onToggleCalendar?: () => void;
  onClick?: () => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  isRecommended = false,
  isSelected = false,
  language = 'ru',
  isUrgent = false,
  timeslots = [],
  selectedDate,
  showFullCalendar = false,
  doctorTimeslotsByDate = {},
  lastUpdateTime,
  onDateSelect,
  onTimeslotSelect,
  onToggleCalendar,
  onClick,
}) => {
  const calendarDates = generateCalendarDates().slice(0, 7);

  return (
    <div
      onClick={onClick}
      className={clsx(
        "group relative p-3 sm:p-4 md:p-5 lg:p-5 xl:p-6 rounded-lg sm:rounded-xl md:rounded-xl lg:rounded-2xl border cursor-pointer transition-all duration-300 bg-white hover:shadow-lg w-full max-w-full",
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md ring-1 sm:ring-2 ring-blue-200"
          : "border-gray-200 hover:border-blue-300",
        isRecommended && !isSelected && "ring-1 sm:ring-2 ring-blue-400/30"
      )}
    >
      {isRecommended && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg z-10 border-2 border-white">
          <Bot size={10} />
          <span>AI рекомендует</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-stretch gap-3 md:gap-4 lg:gap-5 min-h-full">
        {/* Doctor Avatar */}
        <div className="relative flex-shrink-0 md:self-start">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-xl lg:text-2xl shadow-lg overflow-hidden">
            {doctor.avatar ? (
              <Image src={doctor.avatar} alt={doctor.name} fill className="object-cover" />
            ) : (
              <div className="relative z-10">{doctor.name.charAt(0)}</div>
            )}
          </div>

          {/* Status indicators */}
          <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-1 sm:border-2 border-white z-10">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
          </div>

          {isSelected && (
            <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-1 sm:border-2 border-white z-10">
              <CheckCircle2 className="text-white" size={10} />
            </div>
          )}

          <div className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-1 sm:border-2 border-white z-10">
            <Shield className="text-white" size={6} />
          </div>
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0 space-y-2 md:space-y-3">
          <div>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight mb-1">
                  {doctor.name || 'Имя не указано'}
                </h3>
                <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                  <Stethoscope className="text-blue-600 flex-shrink-0" size={12} />
                  <p className="text-blue-600 font-bold text-xs sm:text-sm md:text-sm lg:text-base">
                    {getSpecializationName(doctor, language)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 px-2 py-1 rounded-full self-start">
                <TrendingUp className="text-green-600" size={10} />
                <span className="text-green-700 font-bold text-xs">ТОП</span>
              </div>
            </div>

            {/* Doctor credentials */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <GraduationCap className="text-indigo-500" size={10} />
                <span className="font-medium">К.м.н</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="text-purple-500" size={10} />
                <span className="font-medium">{doctor.experience || 5} лет</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="text-amber-500" size={10} />
                <span className="font-medium">Сертифицирован</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs">
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Взрослые</div>
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">Ассоциация</div>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Премиум</div>
            </div>
          </div>

          {/* Communication methods */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold">
              <MessageSquare size={10} />
              Русский язык
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
              <Video size={10} />
              Видео
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
              <Phone size={10} />
              Аудио
            </div>
          </div>

          {/* Rating section */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-bold text-gray-900 text-base md:text-lg">{doctor.rating || "4.9"}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">из 1247 отзывов</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-bold">98% рекомендуют</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                <span className="font-bold">1.2k лайков</span>
              </div>
            </div>
          </div>

          {/* Pricing section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 md:p-3 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">₸</span>
              </div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">ПРЕМИУМ КОНСУЛЬТАЦИЯ</p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-white p-1.5 md:p-2 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Первичная</div>
                  <div className="font-bold text-green-600 text-sm">1740,00 ₸</div>
                  <div className="text-xs text-gray-400 line-through">2320,00 ₸</div>
                </div>
              </div>
              <div className="bg-white p-1.5 md:p-2 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Повторная</div>
                  <div className="font-bold text-green-600 text-sm">1392,00 ₸</div>
                  <div className="text-xs text-gray-400 line-through">1856,00 ₸</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                🔥 СКИДКА 25%
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="w-full md:w-96 md:flex-shrink-0 md:flex md:flex-col md:justify-between md:min-h-full">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-indigo-200 shadow-md md:h-full md:flex md:flex-col">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="text-white" size={10} />
              </div>
              <span className="text-xs md:text-sm font-bold text-indigo-800">Расписание</span>
            </div>

            {/* Mini Calendar or Full Date Picker */}
            <div className="flex-1 flex flex-col justify-center space-y-3">
              {showFullCalendar ? (
                /* Full Date and Time Picker */
                <div className="space-y-3">
                  <div className="text-xs font-bold text-indigo-700 text-center">Выберите дату</div>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {calendarDates.map((dateItem) => (
                      <div key={dateItem.date} className="text-xs text-gray-500 font-semibold">
                        {dateItem.dayName}
                      </div>
                    ))}
                    {calendarDates.map((dateItem) => {
                      const hasSlots = timeslots.some(slot =>
                        slot.start_time.split('T')[0] === dateItem.date
                      );
                      return (
                        <div
                          key={dateItem.date}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDateSelect?.(dateItem.date);
                          }}
                          className={clsx(
                            "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-sm rounded-lg font-medium transition-all cursor-pointer",
                            dateItem.isToday
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-lg ring-2 ring-blue-200"
                              : hasSlots
                              ? "bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                            selectedDate === dateItem.date && "ring-2 ring-blue-400 bg-blue-100 text-blue-700"
                          )}
                        >
                          {dateItem.dayNumber}
                        </div>
                      );
                    })}
                  </div>

                  {/* Time slots for selected date */}
                  {selectedDate && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-indigo-700 text-center">Доступное время</div>
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {(() => {
                          // Filter slots properly using local date comparison
                          const slotsForDate = timeslots.filter(slot => {
                            const slotDate = new Date(slot.start_time);
                            const selectedDateObj = new Date(selectedDate + 'T00:00:00');

                            // Compare dates in user's timezone, not just ISO string date part
                            const slotLocalDate = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
                            const targetLocalDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());

                            return slotLocalDate.getTime() === targetLocalDate.getTime();
                          }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                          console.log(`📅 DoctorCard: Selected date ${selectedDate}`);
                          console.log(`📅 Found ${slotsForDate.length} slots for this specific date`);
                          if (slotsForDate.length > 0) {
                            console.log(`📅 First slot: ${slotsForDate[0].start_time} (${new Date(slotsForDate[0].start_time).toLocaleString()})`);
                            console.log(`📅 Last slot: ${slotsForDate[slotsForDate.length - 1].start_time} (${new Date(slotsForDate[slotsForDate.length - 1].start_time).toLocaleString()})`);
                          }
                          console.log(`📅 Total timeslots available: ${timeslots.length}`);

                          return slotsForDate.length > 0 ? (
                            slotsForDate.map((timeslot) => (
                              <button
                                key={timeslot.id}
                                disabled={timeslot.is_booked || timeslot.available_spots === 0}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  // Prevent interaction with booked slots
                                  if (timeslot.is_booked || timeslot.available_spots === 0) {
                                    console.log(`🚫 Booked slot clicked - ignoring: ${timeslot.start_time}`);
                                    return;
                                  }

                                  console.log(`🕐 Timeslot clicked: ${timeslot.start_time}`, {
                                    isSelected,
                                    isUrgent,
                                    hasOnTimeslotSelect: !!onTimeslotSelect,
                                    hasOnClick: !!onClick
                                  });

                                  if (!isUrgent) {
                                    console.log(`🔄 Non-urgent consultation - processing timeslot selection`);

                                    // For non-urgent consultations, allow timeslot selection
                                    // First select the doctor if not already selected
                                    if (!isSelected) {
                                      console.log(`👨‍⚕️ Selecting doctor first`);
                                      onClick?.(); // Select the doctor first
                                    }

                                    // Then select the timeslot
                                    console.log(`⏰ Calling onTimeslotSelect with:`, timeslot);
                                    onTimeslotSelect?.(timeslot);
                                  } else {
                                    console.log(`🚨 Urgent consultation - timeslot selection skipped`);
                                  }
                                }}
                                className={clsx(
                                  "px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                  timeslot.is_booked || timeslot.available_spots === 0
                                    ? "bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed"
                                    : "bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                                )}
                              >
                                {formatTime(timeslot.start_time)}
                                {(timeslot.is_booked || timeslot.available_spots === 0) && (
                                  <div className="text-[10px] mt-0.5 text-gray-400">Занято</div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="col-span-3 bg-gray-100 text-gray-500 px-3 py-3 rounded-lg text-center">
                              <div className="text-xs">На эту дату нет свободных слотов</div>
                              <div className="text-xs mt-1 text-gray-400">Выберите другую дату</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Close Calendar Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCalendar?.();
                    }}
                    className="w-full mt-3 px-3 py-2 md:px-4 md:py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg md:rounded-xl text-center font-medium text-sm transition-all hover:shadow-lg hover:from-orange-600 hover:to-red-600 flex items-center justify-center gap-2"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Закрыть календарь
                  </button>
                </div>
              ) : (
                /* Mini Calendar */
                <div className="grid grid-cols-7 gap-2 text-center">
                  {calendarDates.map((dateItem) => (
                    <div key={dateItem.date} className="text-xs text-gray-500 font-semibold">
                      {dateItem.dayName}
                    </div>
                  ))}
                  {calendarDates.map((dateItem) => {
                    const hasSlots = timeslots.some(slot =>
                      slot.start_time.split('T')[0] === dateItem.date
                    );
                    return (
                      <div
                        key={dateItem.date}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateSelect?.(dateItem.date);
                        }}
                        className={clsx(
                          "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-sm rounded-lg font-medium transition-all cursor-pointer",
                          dateItem.isToday
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-lg ring-2 ring-blue-200"
                            : hasSlots
                            ? "bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                          selectedDate === dateItem.date && "ring-2 ring-blue-400 bg-blue-100 text-blue-700"
                        )}
                      >
                        {dateItem.dayNumber}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Schedule content */}
            <div className="md:flex-1 md:flex md:flex-col md:justify-center space-y-2 md:space-y-3">
              {isUrgent ? (
                <>
                  <p className="text-xs font-bold text-red-700 uppercase text-center">🚨 Экстренно</p>
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl text-center shadow-lg">
                    <div className="font-bold text-sm md:text-base">СЕЙЧАС</div>
                    <div className="text-xs md:text-sm opacity-90">Немедленно</div>
                  </div>
                </>
              ) : (
                <>
                  {!showFullCalendar && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-indigo-700 uppercase">Слоты</p>
                    </div>
                  )}

                  {showFullCalendar && (
                    <div className="flex items-center justify-center">
                      <p className="text-xs font-bold text-indigo-700 uppercase">Выбор времени</p>
                    </div>
                  )}

                  {/* Timeslots display - only when calendar is not expanded */}
                  {!showFullCalendar && (
                    <>
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {timeslots.length > 0 ? (
                          // Show only available slots in quick view
                          timeslots.filter(slot => !slot.is_booked && slot.available_spots > 0).slice(0, 4).map((timeslot, index) => (
                            <div
                              key={timeslot.id}
                              onClick={(e) => {
                                e.stopPropagation();

                                // Prevent interaction with booked slots
                                if (timeslot.is_booked || timeslot.available_spots === 0) {
                                  console.log(`🚫 Booked slot clicked - ignoring: ${timeslot.start_time}`);
                                  return;
                                }

                                console.log(`🕐 Quick timeslot clicked: ${timeslot.start_time}`, {
                                  isSelected,
                                  isUrgent,
                                  hasOnTimeslotSelect: !!onTimeslotSelect,
                                  hasOnClick: !!onClick
                                });

                                if (!isUrgent) {
                                  // For non-urgent consultations, allow timeslot selection
                                  // First select the doctor if not already selected
                                  if (!isSelected) {
                                    console.log(`👨‍⚕️ Selecting doctor first via quick slot`);
                                    onClick?.(); // Select the doctor first
                                  }

                                  // Then select the timeslot
                                  console.log(`⏰ Calling onTimeslotSelect from quick view:`, timeslot);
                                  onTimeslotSelect?.(timeslot);
                                } else {
                                  console.log(`🚨 Urgent consultation - timeslot selection skipped`);
                                }
                              }}
                              className={clsx(
                                "px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl text-center shadow-lg transition-colors cursor-pointer",
                                index === 0
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                                  : "bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                              )}
                            >
                              <div className="font-bold text-sm md:text-base">
                                {formatTime(timeslot.start_time)}
                              </div>
                              <div className="text-xs md:text-sm opacity-90">
                                {getTimeLabel(timeslot.start_time)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-gray-100 text-gray-500 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl text-center">
                            <div className="font-bold text-sm md:text-base">—</div>
                            <div className="text-xs md:text-sm">Нет слотов</div>
                          </div>
                        )}
                      </div>

                      {/* Date and Time Picker Button */}
                      {timeslots.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCalendar?.();
                          }}
                          className="w-full mt-2 px-3 py-2 md:px-4 md:py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl text-center font-medium text-sm transition-all hover:shadow-lg hover:from-blue-600 hover:to-indigo-700"
                        >
                          📅 Выбрать дату и время
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Location */}
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <div className="flex items-center gap-2 text-xs text-indigo-600">
                <MapPin size={10} />
                <span className="font-medium">Онлайн консультация</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;