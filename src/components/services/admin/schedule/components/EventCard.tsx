"use client";

import { motion } from 'framer-motion';
import { Video, Home, Edit, Trash2 } from 'lucide-react';
import { ScheduleEvent } from '../types/scheduleTypes';

export function getStatusColor(status: string) {
  switch (status) {
    case 'scheduled':
      return { bg: '#ebf1ff', text: '#3772ff', label: 'Запланировано' };
    case 'in_progress':
      return { bg: '#fef3c7', text: '#f59e0b', label: 'В процессе' };
    case 'completed':
      return { bg: '#d1fae5', text: '#10b981', label: 'Завершено' };
    case 'cancelled':
      return { bg: '#fee2e2', text: '#ef4444', label: 'Отменено' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280', label: 'Неизвестно' };
  }
}

interface EventCardProps {
  event: ScheduleEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const statusColor = getStatusColor(event.status);
  const isConsultation = event.type === 'consultation';
  const accentColor = isConsultation ? '#3772ff' : '#8b5cf6';
  const accentBg = isConsultation ? '#ebf1ff' : '#f3e8ff';
  const accentBorder = isConsultation ? '#c7d7ff' : '#ddd6fe';

  const initials = event.patient_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -1, shadow: 'lg' }}
      className="rounded-xl border cursor-pointer group overflow-hidden bg-white"
      style={{ borderColor: accentBorder }}
    >
      {/* Colored top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-2.5 md:p-3">
        {/* Time + type + actions row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentBg }}>
              {isConsultation
                ? <Video className="w-3 h-3" style={{ color: accentColor }} />
                : <Home className="w-3 h-3" style={{ color: accentColor }} />}
            </div>
            <span className="text-xs md:text-sm font-bold" style={{ color: accentColor }}>
              {event.time}
            </span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors" title="Редактировать">
              <Edit className="w-3 h-3 text-gray-400" />
            </button>
            <button className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors" title="Удалить">
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>

        {/* Patient row with avatar */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${isConsultation ? '#2c5bcc' : '#7c3aed'})` }}>
            {initials}
          </div>
          <p className="text-xs md:text-sm font-semibold truncate" style={{ color: '#1e263e' }}>
            {event.patient_name}
          </p>
        </div>

        {/* Doctor */}
        {(event.doctor_name || event.nurse_name) && (
          <p className="text-[10px] md:text-xs text-gray-400 truncate pl-8 mb-1.5">
            {event.doctor_name || event.nurse_name}
          </p>
        )}

        {/* Status badge */}
        <div className="pl-8">
          <span
            className="inline-block px-2 py-0.5 rounded-md text-[10px] md:text-xs font-semibold"
            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
          >
            {statusColor.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
