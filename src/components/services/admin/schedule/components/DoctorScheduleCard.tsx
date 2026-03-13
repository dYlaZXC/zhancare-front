"use client";

import { motion } from "framer-motion";
import {
  Plus,
  Video,
  Home,
  Stethoscope,
  Loader2,
  Clock,
  CalendarCheck
} from "lucide-react";
import { ScheduleEvent } from '../types/scheduleTypes';

interface DoctorScheduleCardProps {
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    years_of_experience?: number;
    preferred_consultation_duration?: number;
    room_number?: string | null;
    online_work_schedule?: any;
  };
  slots: any[];
  bookedSlots: ScheduleEvent[];
  loadingSlots: boolean;
  selectedDate: string;
  onSlotClick: (doctorId: number, slot: any) => void;
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
];

export function DoctorScheduleCard({
  doctor,
  slots,
  bookedSlots,
  loadingSlots,
  selectedDate,
  onSlotClick
}: DoctorScheduleCardProps) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const availableSlots = slots.filter(slot => {
    if (bookedSlots.some(e => e.time === slot.start_time)) return false;
    if (isToday) {
      const [h, m] = slot.start_time.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(h, m, 0, 0);
      if (slotTime <= now) return false;
    }
    return true;
  });

  const gradientClass = AVATAR_GRADIENTS[doctor.id % AVATAR_GRADIENTS.length];
  const hasActivity = bookedSlots.length > 0 || availableSlots.length > 0;

  return (
    <motion.div
      key={doctor.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-200 bg-white flex flex-col shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Doctor header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
            {doctor.first_name[0]}{doctor.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 truncate leading-tight">
              {doctor.first_name} {doctor.last_name}
            </h3>
            {doctor.specialization ? (
              <p className="text-blue-600 text-xs flex items-center gap-1 mt-0.5">
                <Stethoscope className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{doctor.specialization}</span>
              </p>
            ) : (
              <p className="text-gray-400 text-xs mt-0.5">Специализация не указана</p>
            )}
            {doctor.room_number && (
              <p className="text-gray-500 text-xs mt-0.5">Кабинет {doctor.room_number}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-blue-600 font-semibold">
            <CalendarCheck className="w-3.5 h-3.5" />
            {loadingSlots ? '–' : bookedSlots.length} записей
          </span>
          <span className="text-gray-300">·</span>
          <span className={`flex items-center gap-1 font-semibold ${availableSlots.length > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <Clock className="w-3.5 h-3.5" />
            {loadingSlots ? '–' : availableSlots.length} свободно
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loadingSlots ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : !hasActivity ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <CalendarCheck className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Расписание не задано</p>
            <p className="text-[11px] text-gray-300 mt-0.5">на этот день</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {/* Booked appointments */}
            {bookedSlots.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Записи
                </p>
                <div className="space-y-2">
                  {bookedSlots.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50 border border-blue-100"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 leading-tight text-center">
                        {event.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900 truncate">{event.patient_name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                          {event.type === 'consultation'
                            ? <><Video className="w-3 h-3" /> Онлайн</>
                            : <><Home className="w-3 h-3" /> Оффлайн</>}
                          <span className="text-gray-300">·</span>
                          <span>{event.duration} мин</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Available slots */}
            {availableSlots.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Свободные слоты
                </p>
                <div className="flex flex-col gap-1.5">
                  {availableSlots.map((slot: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => onSlotClick(doctor.id, slot)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-500 hover:border-emerald-500 text-emerald-700 hover:text-white transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-bold text-sm">{slot.start_time}</span>
                        <span className="text-xs opacity-60 group-hover:opacity-80">→ {slot.end_time}</span>
                      </div>
                      <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        + Записать
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Add booking button */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={() => onSlotClick(doctor.id, availableSlots[0] ?? null)}
          disabled={availableSlots.length === 0 && !loadingSlots}
          className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить запись
        </button>
      </div>
    </motion.div>
  );
}
