"use client";

import { motion } from "framer-motion";
import {
  Plus,
  Video,
  Home,
  Stethoscope,
  Loader2
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
    online_work_schedule?: any;
  };
  slots: any[];
  bookedSlots: ScheduleEvent[];
  loadingSlots: boolean;
  selectedDate: string;
  onSlotClick: (doctorId: number, slot: any) => void;
}

export function DoctorScheduleCard({
  doctor,
  slots,
  bookedSlots,
  loadingSlots,
  selectedDate,
  onSlotClick
}: DoctorScheduleCardProps) {
  const availableSlots = slots.filter(slot =>
    !bookedSlots.some(e => e.time === slot.start_time)
  );

  return (
    <motion.div
      key={doctor.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl md:rounded-3xl p-3 md:p-4 border-2 border-gray-200 bg-white min-h-[400px] md:min-h-[500px] flex flex-col"
    >
      {/* Doctor header */}
      <div className="mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 border-gray-200">
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">
            {doctor.first_name[0]}{doctor.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm md:text-base truncate" style={{ color: '#1e263e' }}>
              {doctor.first_name} {doctor.last_name}
            </h3>
            {doctor.specialization && (
              <p className="text-blue-600 text-[10px] md:text-xs flex items-center gap-1">
                <Stethoscope className="w-2.5 h-2.5 md:w-3 md:h-3" />
                <span className="truncate">{doctor.specialization}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onSlotClick(doctor.id, availableSlots[0])}
          disabled={availableSlots.length === 0}
          className="w-full py-1.5 md:py-2 rounded-lg md:rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3 md:w-4 md:h-4" />
          Добавить
        </button>
      </div>

      {/* Events list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {loadingSlots ? (
          <div className="flex items-center justify-center py-6 md:py-8">
            <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-blue-600" />
          </div>
        ) : bookedSlots.length > 0 ? (
          <>
            <h4 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">
              Записи на {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </h4>
            {bookedSlots.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200"
              >
                <div className="flex items-start gap-1.5 md:gap-2">
                  <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-500 text-white font-bold text-xs md:text-sm flex-shrink-0">
                    {event.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs md:text-sm text-gray-900 truncate mb-0.5 md:mb-1">
                      {event.patient_name}
                    </p>
                    <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-gray-600">
                      {event.type === 'consultation' ? (
                        <span className="flex items-center gap-0.5 md:gap-1">
                          <Video className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          <span className="hidden sm:inline">Онлайн</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 md:gap-1">
                          <Home className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          <span className="hidden sm:inline">Оффлайн</span>
                        </span>
                      )}
                      <span className="hidden sm:inline">•</span>
                      <span>{event.duration} мин</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <div className="text-center py-6 md:py-8 text-gray-400 text-xs md:text-sm">
            Нет записей
          </div>
        )}
      </div>

      {/* Available slots footer */}
      <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t-2 border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase">
            Доступно
          </span>
          <span className={`text-base md:text-lg font-bold ${availableSlots.length > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
            {loadingSlots ? '...' : availableSlots.length}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
