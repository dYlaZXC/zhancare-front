"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";
import {
  CheckCircle2,
  Shield,
  Calendar,
  MessageSquare,
  Video,
  Phone,
  MapPin,
  Bot,
  ChevronUp,
  Stethoscope,
  Building2,
} from "lucide-react";

import type { Doctor, TimeSlot, Language } from "../types/doctor";
import { getSpecializationName } from "../utils/doctorUtils";
import { formatTime, getTimeLabel, generateCalendarDates } from "../utils/timeslotUtils";
import bnClinicLogo from "@/assets/clinics_logos/bn-clinica.png";

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

  // Auto-select the first date with available slots when the full calendar opens
  React.useEffect(() => {
    if (!showFullCalendar || !timeslots.length) return;

    const availableSlot = timeslots.find(s => !s.is_booked && s.available_spots > 0);
    if (!availableSlot) return;

    const d = new Date(availableSlot.start_time);
    const firstAvailableDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (selectedDate !== firstAvailableDate) {
      onDateSelect?.(firstAvailableDate);
    }
  }, [showFullCalendar]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={onClick}
      className={clsx(
        "group relative p-2 sm:p-2.5 md:p-2.5 lg:p-4 xl:p-5 rounded-lg sm:rounded-xl md:rounded-xl lg:rounded-2xl border cursor-pointer transition-all duration-300 bg-white hover:shadow-lg w-full max-w-full overflow-hidden",
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md ring-1 sm:ring-2 ring-blue-200"
          : "border-gray-200 hover:border-blue-300",
        isRecommended && !isSelected && "ring-1 sm:ring-2 ring-blue-400/30"
      )}
    >

      {isRecommended && (
        <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1 shadow-lg z-10 border-2 border-white">
          <Bot size={9} />
          <span>AI рекомендует</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-stretch gap-2 sm:gap-2.5 md:gap-2.5 lg:gap-3 xl:gap-4 min-h-full relative z-[1]">
        {/* Doctor Avatar */}
        <div className="relative flex-shrink-0 md:self-start">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 rounded-lg sm:rounded-xl md:rounded-xl lg:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-base lg:text-lg xl:text-xl shadow-lg overflow-hidden">
            {doctor.avatar ? (
              <Image src={doctor.avatar} alt={doctor.name} fill className="object-cover" />
            ) : (
              <div className="relative z-10">{doctor.name.charAt(0)}</div>
            )}
          </div>

          {/* Availability Status Indicator */}
          <div className={`absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow-lg border-1 sm:border-2 border-white z-10 ${
            doctor.availability_status === 'available' ? 'bg-green-500' :
            doctor.availability_status === 'busy' ? 'bg-yellow-500' :
            doctor.availability_status === 'break' ? 'bg-blue-500' :
            'bg-red-500'
          }`}>
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

          {/* BN Clinic badge - under avatar */}
          {(doctor.clinic?.name?.toLowerCase().includes('bn') ||
            doctor.clinic?.name?.toLowerCase().includes('бн')) && (
            <div className="mt-2 bg-white px-2 py-1 rounded-lg shadow-md border border-blue-200 flex items-center justify-center">
              <Image
                src={bnClinicLogo}
                alt="BN Clinic"
                width={60}
                height={20}
                className="object-contain"
                priority={false}
              />
            </div>
          )}
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2 md:space-y-2 lg:space-y-3">
          <div>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-1.5 sm:mb-2 gap-1.5 sm:gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight mb-1">
                  {doctor.name || 'Имя не указано'}
                </h3>
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2 mb-1 flex-wrap">
                  <Stethoscope className="text-blue-600 flex-shrink-0" size={11} />
                  <p className="text-blue-600 font-bold text-xs sm:text-xs md:text-xs lg:text-sm">
                    {getSpecializationName(doctor, language)}
                  </p>
                  {/* Availability Status */}
                  <span className={`ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                    doctor.availability_status === 'available' ? 'bg-green-100 text-green-700' :
                    doctor.availability_status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                    doctor.availability_status === 'break' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {doctor.availability_status === 'available' ? 'Доступен' :
                     doctor.availability_status === 'busy' ? 'Занят' :
                     doctor.availability_status === 'break' ? 'На перерыве' :
                     'Не работает'}
                  </span>
                </div>
              </div>
            </div>

            {/* Doctor experience */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
              <Calendar className={doctor.years_of_experience ? "text-purple-500" : "text-gray-300"} size={9} />
              <span className={doctor.years_of_experience ? "font-medium text-gray-600" : "text-gray-400 italic"}>
                {doctor.years_of_experience ? `${doctor.years_of_experience} лет опыта` : 'Не указано'}
              </span>
            </div>

            {/* Clinic information */}
            {doctor.clinic ? (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-700 mb-1.5 sm:mb-2 bg-blue-50 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border border-blue-100">
                <Building2 className="text-blue-600 flex-shrink-0" size={11} />
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-semibold text-blue-800">{doctor.clinic.name}</span>
                  {doctor.clinic.city && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{doctor.clinic.city}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2 bg-gray-50 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border border-gray-100">
                <Building2 className="text-gray-400 flex-shrink-0" size={11} />
                <span className="font-medium">Независимый врач</span>
              </div>
            )}

          </div>

          {/* Communication methods */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs ${
              doctor.language
                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 font-semibold'
                : 'bg-gray-100 text-gray-400 italic'
            }`}>
              <MessageSquare size={9} />
              {doctor.language === 'kz' ? 'Қазақ тілі' : doctor.language === 'en' ? 'English' : doctor.language === 'ru' ? 'Русский язык' : 'Не указано'}
            </div>
            <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs font-medium">
              <Video size={9} />
              Видео
            </div>
            <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] sm:text-xs font-medium">
              <Phone size={9} />
              Аудио
            </div>
          </div>

          {/* Pricing section */}
          <div className={`p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg sm:rounded-xl border ${
            doctor.online_consultation_price
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center ${
                doctor.online_consultation_price ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <span className="text-white text-[10px] sm:text-xs">₸</span>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">Онлайн консультация</p>
            </div>
            <div className="text-center">
              {doctor.online_consultation_price ? (
                <div className="font-bold text-green-600 text-sm sm:text-base">
                  {Number(doctor.online_consultation_price).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₸
                </div>
              ) : (
                <div className="text-gray-400 italic text-[10px] sm:text-xs">Не указано</div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="w-full md:w-56 lg:w-64 xl:w-80 md:flex-shrink-0 md:flex md:flex-col md:justify-between md:min-h-full">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-1.5 sm:p-2 md:p-2 lg:p-3 xl:p-4 rounded-lg md:rounded-xl border border-indigo-200 shadow-md md:h-full md:flex md:flex-col">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2 mb-1.5 sm:mb-2 md:mb-2 lg:mb-2.5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="text-white" size={8} />
              </div>
              <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs xl:text-sm font-bold text-indigo-800">Расписание</span>
            </div>

            {!doctor.work_schedule ? (
              /* No schedule set — show placeholder */
              <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6">
                <div className="text-gray-400 text-[10px] sm:text-xs text-center italic">Пока что не указано</div>
              </div>
            ) : (
            <>
            {/* Mini Calendar or Full Date Picker */}
            <div className="flex-1 flex flex-col space-y-1.5 sm:space-y-2 md:space-y-2 lg:space-y-2.5">
              {showFullCalendar ? (
                /* Full Date and Time Picker */
                <div className="space-y-1.5 sm:space-y-2 md:space-y-2 lg:space-y-2.5">
                  <div className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs font-bold text-indigo-700 text-center">Выберите дату</div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2 text-center">
                    {calendarDates.map((dateItem) => (
                      <div key={dateItem.date} className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-semibold">
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
                            "w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 flex items-center justify-center text-[10px] sm:text-xs md:text-xs lg:text-sm rounded-md sm:rounded-lg font-medium transition-all cursor-pointer",
                            dateItem.isToday
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-lg ring-1 sm:ring-2 ring-blue-200"
                              : hasSlots
                              ? "bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                            selectedDate === dateItem.date && "ring-1 sm:ring-2 ring-blue-400 bg-blue-100 text-blue-700"
                          )}
                        >
                          {dateItem.dayNumber}
                        </div>
                      );
                    })}
                  </div>

                  {/* Time slots for selected date */}
                  {selectedDate && (
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-2 lg:space-y-2">
                      <div className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs font-bold text-indigo-700 text-center">
                        Доступное время на {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2 max-h-32 sm:max-h-36 md:max-h-36 lg:max-h-40 overflow-y-auto">
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

                          // console.log(`📅 DoctorCard: Selected date ${selectedDate}`);
                          // console.log(`📅 Found ${slotsForDate.length} slots for this specific date`);
                          if (slotsForDate.length > 0) {
                            // console.log(`📅 First slot: ${slotsForDate[0].start_time} (${new Date(slotsForDate[0].start_time).toLocaleString()})`);
                            // console.log(`📅 Last slot: ${slotsForDate[slotsForDate.length - 1].start_time} (${new Date(slotsForDate[slotsForDate.length - 1].start_time).toLocaleString()})`);
                          }
                          // console.log(`📅 Total timeslots available: ${timeslots.length}`);

                          return slotsForDate.length > 0 ? (
                            slotsForDate.map((timeslot) => (
                              <button
                                key={timeslot.id}
                                disabled={timeslot.is_booked || timeslot.available_spots === 0}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  // Prevent interaction with booked slots
                                  if (timeslot.is_booked || timeslot.available_spots === 0) {
                                    // console.log(`🚫 Booked slot clicked - ignoring: ${timeslot.start_time}`);
                                    return;
                                  }

                                  // console.log(`🕐 Timeslot clicked: ${timeslot.start_time}`, {
                                  //   isSelected,
                                  //   isUrgent,
                                  //   hasOnTimeslotSelect: !!onTimeslotSelect,
                                  //   hasOnClick: !!onClick
                                  // });

                                  if (!isUrgent) {
                                    // console.log(`🔄 Non-urgent consultation - processing timeslot selection`);

                                    // For non-urgent consultations, allow timeslot selection
                                    // First select the doctor if not already selected
                                    if (!isSelected) {
                                      // console.log(`👨‍⚕️ Selecting doctor first`);
                                      onClick?.(); // Select the doctor first
                                    }

                                    // Then select the timeslot
                                    // console.log(`⏰ Calling onTimeslotSelect with:`, timeslot);
                                    onTimeslotSelect?.(timeslot);
                                  } else {
                                    // console.log(`🚨 Urgent consultation - timeslot selection skipped`);
                                  }
                                }}
                                className={clsx(
                                  "px-2 sm:px-2.5 md:px-2.5 lg:px-3 py-1.5 sm:py-2 md:py-2 lg:py-2 rounded-lg text-xs sm:text-sm md:text-sm font-medium transition-colors",
                                  timeslot.is_booked || timeslot.available_spots === 0
                                    ? "bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed"
                                    : "bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                                )}
                              >
                                {formatTime(timeslot.start_time)}
                                {(timeslot.is_booked || timeslot.available_spots === 0) && (
                                  <div className="text-[9px] sm:text-[10px] mt-0.5 text-gray-400">Занято</div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="col-span-3 bg-gray-100 text-gray-500 px-3 sm:px-4 py-3 sm:py-4 rounded-lg text-center">
                              <div className="text-xs sm:text-sm">На эту дату нет свободных слотов</div>
                              <div className="text-xs sm:text-sm mt-1 text-gray-400">Выберите другую дату</div>
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
                    className="w-full mt-2 sm:mt-2.5 md:mt-3 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg md:rounded-xl text-center font-medium text-[10px] sm:text-xs md:text-sm transition-all hover:shadow-lg hover:from-orange-600 hover:to-red-600 flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    Закрыть календарь
                  </button>
                </div>
              ) : (
                /* Mini Calendar */
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2 text-center">
                  {calendarDates.map((dateItem) => (
                    <div key={dateItem.date} className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs text-gray-500 font-semibold">
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
                          "w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 flex items-center justify-center text-[10px] sm:text-xs md:text-xs lg:text-sm rounded-md sm:rounded-lg font-medium transition-all cursor-pointer",
                          dateItem.isToday
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-lg ring-1 sm:ring-2 ring-blue-200"
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
            <div className="md:flex-1 md:flex md:flex-col md:justify-center space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-3">
              {isUrgent ? (
                <>
                  <p className="text-[10px] sm:text-xs font-bold text-red-700 uppercase text-center">🚨 Экстренно</p>
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl text-center shadow-lg">
                    <div className="font-bold text-xs sm:text-sm md:text-base">СЕЙЧАС</div>
                    <div className="text-[10px] sm:text-xs md:text-sm opacity-90">Немедленно</div>
                  </div>
                </>
              ) : (
                <>
                  {!showFullCalendar && (
                    <div className="text-center mt-1.5 sm:mt-2">
                      <p className="text-[10px] sm:text-xs font-bold text-indigo-700 uppercase">
                        {(() => {
                          const first = timeslots.find(s => !s.is_booked && s.available_spots > 0);
                          if (!first) return 'Слоты';
                          const d = new Date(first.start_time);
                          return `Слоты на ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
                        })()}
                      </p>
                    </div>
                  )}

                  {showFullCalendar && (
                    <div className="flex items-center justify-center">
                      <p className="text-[10px] sm:text-xs font-bold text-indigo-700 uppercase">Выбор времени</p>
                    </div>
                  )}

                  {/* Timeslots display - only when calendar is not expanded */}
                  {!showFullCalendar && (
                    <>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-2 lg:gap-3">
                        {timeslots.length > 0 ? (
                          // Show only available slots in quick view
                          timeslots.filter(slot => !slot.is_booked && slot.available_spots > 0).slice(0, 4).map((timeslot, index) => (
                            <div
                              key={timeslot.id}
                              onClick={(e) => {
                                e.stopPropagation();

                                // Prevent interaction with booked slots
                                if (timeslot.is_booked || timeslot.available_spots === 0) {
                                  // console.log(`🚫 Booked slot clicked - ignoring: ${timeslot.start_time}`);
                                  return;
                                }

                                // console.log(`🕐 Quick timeslot clicked: ${timeslot.start_time}`, {
                                //   isSelected,
                                //   isUrgent,
                                //   hasOnTimeslotSelect: !!onTimeslotSelect,
                                //   hasOnClick: !!onClick
                                // });

                                if (!isUrgent) {
                                  // For non-urgent consultations, allow timeslot selection
                                  // First select the doctor if not already selected
                                  if (!isSelected) {
                                    // console.log(`👨‍⚕️ Selecting doctor first via quick slot`);
                                    onClick?.(); // Select the doctor first
                                  }

                                  // Then select the timeslot
                                  // console.log(`⏰ Calling onTimeslotSelect from quick view:`, timeslot);
                                  onTimeslotSelect?.(timeslot);
                                } else {
                                  // console.log(`🚨 Urgent consultation - timeslot selection skipped`);
                                }
                              }}
                              className={clsx(
                                "px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2.5 lg:px-4 lg:py-3 rounded-lg md:rounded-xl text-center shadow-lg transition-colors cursor-pointer",
                                index === 0
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                                  : "bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                              )}
                            >
                              <div className="font-bold text-xs sm:text-sm md:text-sm lg:text-base">
                                {formatTime(timeslot.start_time)}
                              </div>
                              <div className="text-[10px] sm:text-xs md:text-xs lg:text-sm opacity-90">
                                {getTimeLabel(timeslot.start_time)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-gray-100 text-gray-500 px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2.5 lg:px-4 lg:py-3 rounded-lg md:rounded-xl text-center">
                            <div className="font-bold text-xs sm:text-sm md:text-sm lg:text-base">—</div>
                            <div className="text-[10px] sm:text-xs md:text-xs lg:text-sm">Нет слотов</div>
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
                          className="w-full mt-1.5 sm:mt-2 px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl text-center font-medium text-[10px] sm:text-xs md:text-sm transition-all hover:shadow-lg hover:from-blue-600 hover:to-indigo-700"
                        >
                          📅 Выбрать дату и время
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            </>
            )}

            {/* Location */}
            <div className="mt-2 sm:mt-2.5 md:mt-3 pt-2 sm:pt-2.5 md:pt-3 border-t border-indigo-200">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-indigo-600">
                <MapPin size={9} />
                <span className="font-medium">Онлайн консультация</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DoctorCard);