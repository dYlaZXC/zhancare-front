"use client";

import { motion } from 'framer-motion';
import { Video, Home, Edit, Trash2 } from 'lucide-react';
import { ScheduleEvent } from '../types/scheduleTypes';
import { getStatusColor } from '../utils/scheduleUtils';

interface EventCardProps {
  event: ScheduleEvent;
}

/**
 * Event Card Component
 * Displays individual event in calendar views
 */
export default function EventCard({ event }: EventCardProps) {
  const statusColor = getStatusColor(event.status);
  const typeColor = event.type === 'consultation'
    ? { bg: '#ebf1ff', text: '#3772ff' }
    : { bg: '#f3e8ff', text: '#8b5cf6' };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-2 md:p-3 rounded-lg md:rounded-xl border-l-4 cursor-pointer group"
      style={{
        backgroundColor: typeColor.bg,
        borderLeftColor: typeColor.text
      }}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1 md:gap-2 flex-1">
          {event.type === 'consultation' ? (
            <Video className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" style={{ color: typeColor.text }} />
          ) : (
            <Home className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" style={{ color: typeColor.text }} />
          )}
          <span className="text-xs md:text-sm font-bold" style={{ color: typeColor.text }}>
            {event.time}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button className="p-1 rounded hover:bg-white/50 transition-colors" title="Редактировать">
            <Edit className="w-3 h-3 text-gray-600" />
          </button>
          <button className="p-1 rounded hover:bg-white/50 transition-colors" title="Удалить">
            <Trash2 className="w-3 h-3 text-red-600" />
          </button>
        </div>
      </div>

      <p className="text-xs md:text-sm font-semibold mb-0.5 truncate" style={{ color: '#1e263e' }}>
        {event.patient_name}
      </p>

      <p className="text-[10px] md:text-xs text-gray-700 mb-1 truncate">
        {event.doctor_name || event.nurse_name}
      </p>

      {event.specialization && (
        <p className="text-[10px] md:text-xs text-gray-600 truncate">{event.specialization}</p>
      )}

      {event.location && (
        <p className="text-xs text-gray-600 mt-1">📍 {event.location}</p>
      )}

      <div className="mt-2">
        <span
          className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
          style={{
            backgroundColor: statusColor.bg,
            color: statusColor.text
          }}
        >
          {statusColor.label}
        </span>
      </div>
    </motion.div>
  );
}
