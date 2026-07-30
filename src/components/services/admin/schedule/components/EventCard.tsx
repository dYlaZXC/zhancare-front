"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Home, FlaskConical, Edit, Trash2 } from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from 'react-toastify';
import { ScheduleEvent } from '../types/scheduleTypes';
import { getPaymentStatusColor } from '../utils/scheduleUtils';
import RescheduleModal from '../modals/RescheduleModal';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';

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
  onChanged?: () => void;
}

function getEventStyle(event: ScheduleEvent) {
  if (event.type === 'consultation' && event.consultation_type === 'offline') {
    return { accent: '#059669', bg: '#dcfce7', border: '#86efac', gradientTo: '#047857', Icon: Home };
  }
  if (event.type === 'consultation') {
    return { accent: '#3772ff', bg: '#ebf1ff', border: '#c7d7ff', gradientTo: '#2c5bcc', Icon: Video };
  }
  if (event.type === 'diagnostics') {
    return { accent: '#0891b2', bg: '#cffafe', border: '#a5f3fc', gradientTo: '#0e7490', Icon: FlaskConical };
  }
  return { accent: '#8b5cf6', bg: '#f3e8ff', border: '#ddd6fe', gradientTo: '#7c3aed', Icon: Home };
}

export default function EventCard({ event, onChanged }: EventCardProps) {
  const statusColor = getStatusColor(event.status);
  const { accent: accentColor, bg: accentBg, border: accentBorder, gradientTo, Icon: TypeIcon } = getEventStyle(event);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = event.patient_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleDelete = async (reason: string) => {
    setDeleting(true);
    try {
      await api.delete(`/schedule/${event.id}/`, { data: { reason } });
      toast.success("Запись удалена");
      setConfirmDelete(false);
      onChanged?.();
    } catch {
      toast.error("Не удалось удалить запись");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <motion.div
      whileHover={{ y: -1, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
      initial={{ boxShadow: '0 0 0 0 rgb(0 0 0 / 0)' }}
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
              <TypeIcon className="w-3 h-3" style={{ color: accentColor }} />
            </div>
            <span className="text-xs md:text-sm font-bold" style={{ color: accentColor }}>
              {event.time}
            </span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setRescheduleOpen(true); }}
              className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
              title="Редактировать"
            >
              <Edit className="w-3 h-3 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>

        {/* Patient row with avatar */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${gradientTo})` }}>
            {initials}
          </div>
          <p className="text-xs md:text-sm font-semibold truncate" style={{ color: '#1e263e' }}>
            {event.patient_name}
          </p>
        </div>

        {/* Doctor / nurse / service */}
        {(event.doctor_name || event.nurse_name || event.service_name) && (
          <p className="text-[10px] md:text-xs text-gray-400 truncate pl-8 mb-1.5">
            {event.doctor_name || event.nurse_name || event.service_name}
          </p>
        )}

        {/* Status + payment badges */}
        <div className="pl-8 flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-block px-2 py-0.5 rounded-md text-[10px] md:text-xs font-semibold"
            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
          >
            {statusColor.label}
          </span>
          {!!event.reschedule_count && (
            <span
              title={event.reschedule_reason ? `Последняя причина: «${event.reschedule_reason}»` : undefined}
              className="inline-block px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold bg-amber-100 text-amber-700"
            >
              ⟲ {event.reschedule_count}
            </span>
          )}
          {event.payment_info && (() => {
            const pc = getPaymentStatusColor(event.payment_info.status);
            return (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] md:text-xs font-semibold"
                style={{ backgroundColor: pc.bg, color: pc.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pc.dot }} />
                {pc.label}
              </span>
            );
          })()}
        </div>
      </div>
    </motion.div>

    {rescheduleOpen && (
      <RescheduleModal
        event={event}
        onClose={() => setRescheduleOpen(false)}
        onRescheduled={() => onChanged?.()}
      />
    )}

    {confirmDelete && (
      <ConfirmDeleteModal
        patientName={event.patient_name}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )}
    </>
  );
}
