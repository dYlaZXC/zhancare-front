"use client";

import { motion } from "framer-motion";
import { Video, Home, User, Stethoscope, MapPin } from "lucide-react";
import { ScheduleEvent } from "../types/scheduleTypes";
import { getStatusColor } from "../utils/scheduleUtils";

interface EventDetailCardProps {
  event: ScheduleEvent;
}

export default function EventDetailCard({ event }: EventDetailCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-all"
    >
      {/* Event Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: event.type === 'consultation' ? '#ebf1ff' : '#f3e8ff'
            }}
          >
            {event.type === 'consultation' ? (
              <Video className="w-6 h-6" style={{ color: '#3772ff' }} />
            ) : (
              <Home className="w-6 h-6" style={{ color: '#8b5cf6' }} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: '#1e263e' }}>
              {event.type === 'consultation' ? 'Онлайн консультация' : 'Оффлайн консультация'}
            </h3>
            <p className="text-sm text-gray-600">
              {event.time} ({event.duration} мин)
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: getStatusColor(event.status).bg,
            color: getStatusColor(event.status).text
          }}
        >
          {event.status === 'scheduled' && 'Запланировано'}
          {event.status === 'in_progress' && 'В процессе'}
          {event.status === 'completed' && 'Завершено'}
          {event.status === 'cancelled' && 'Отменено'}
        </div>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Info */}
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">Пациент</span>
          </div>
          <p className="font-semibold text-gray-900">{event.patient_name}</p>
        </div>

        {/* Doctor Info */}
        {event.doctor_name && (
          <div className="bg-emerald-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Доктор</span>
            </div>
            <p className="font-semibold text-gray-900">{event.doctor_name}</p>
          </div>
        )}

        {/* Nurse Info */}
        {event.nurse_name && (
          <div className="bg-violet-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-bold text-violet-700">Медсестра</span>
            </div>
            <p className="font-semibold text-gray-900">{event.nurse_name}</p>
          </div>
        )}

        {/* Address (for appointments) */}
        {event.address && (
          <div className="bg-purple-50 p-4 rounded-xl md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-700">Адрес</span>
            </div>
            <p className="font-semibold text-gray-900">{event.address}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {event.notes && (
        <div className="mt-4 bg-gray-50 p-4 rounded-xl">
          <p className="text-sm font-semibold text-gray-700 mb-2">Примечания:</p>
          <p className="text-sm text-gray-600">{event.notes}</p>
        </div>
      )}
    </motion.div>
  );
}
