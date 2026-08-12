"use client";

import { motion } from "framer-motion";
import {
  Briefcase, Mail, Phone, Calendar, CheckCircle, XCircle, AlertCircle,
  Edit, Trash2, RotateCcw,
} from "lucide-react";
import type { StaffMember } from "../types/staffTypes";

export function StaffCard({
  member,
  initial,
  index,
  showDeleted,
  onEdit,
  onToggleStatus,
  onSchedule,
  onDelete,
  onRestore,
}: {
  member: StaffMember;
  initial: boolean;
  index: number;
  showDeleted: boolean;
  onEdit: (member: StaffMember) => void;
  onToggleStatus: (memberId: number, currentStatus: string | undefined) => void;
  onSchedule: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
  onRestore: (member: StaffMember) => void;
}) {
  return (
    <motion.div
      initial={initial ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={initial ? { delay: index * 0.05 } : { duration: 0.2 }}
      layout
      className="rounded-3xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all bg-white shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
            style={{
              background: member.role === 'doctor'
                ? 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
            }}
          >
            {member.first_name[0]}{member.last_name[0]}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold" style={{ color: '#1e263e' }}>
                {member.first_name} {member.last_name}
              </h3>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: member.role === 'doctor' ? '#ebf1ff' : '#f3e8ff',
                  color: member.role === 'doctor' ? '#3772ff' : '#8b5cf6'
                }}
              >
                {member.role === 'doctor' ? 'Доктор' : 'Медсестра'}
              </span>
              {member.availability_status === 'available' ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Доступен
                </span>
              ) : member.availability_status === 'busy' ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                  <AlertCircle className="w-3 h-3" />
                  Занят
                </span>
              ) : member.availability_status === 'break' ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  <AlertCircle className="w-3 h-3" />
                  На перерыве
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  <XCircle className="w-3 h-3" />
                  Не работает
                </span>
              )}
              {/* Schedule status badges for doctors/nurses */}
              {(member.role === 'doctor' || member.role === 'nurse') && (() => {
                const activeSchedules = (member.schedules || []).filter((s: any) => s.is_active);
                const hasOnline = activeSchedules.some((s: any) => s.consultation_type === 'online');
                const hasOffline = activeSchedules.some((s: any) => s.consultation_type === 'offline');
                const hasAvailability = (member as any).has_availability;
                if (!hasOnline && !hasOffline && !hasAvailability) return (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    <AlertCircle className="w-3 h-3" />
                    Нет расписания на эту неделю
                  </span>
                );
                return (<>
                  {hasOnline && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      <CheckCircle className="w-3 h-3" />
                      Онлайн расписание
                    </span>
                  )}
                  {hasOffline && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      <CheckCircle className="w-3 h-3" />
                      Офлайн расписание
                    </span>
                  )}
                </>);
              })()}
            </div>

            {member.specialization && (
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {member.specialization}
              </p>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {member.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {member.phone}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(member.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {showDeleted ? (
            /* Restore button only for deleted staff */
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRestore(member)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300"
              title="Восстановить сотрудника"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Восстановить</span>
            </motion.button>
          ) : (
            <>
              {/* Status Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onToggleStatus(member.id, member.availability_status)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md ${
                  member.availability_status === 'available'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300'
                }`}
                title={member.availability_status === 'available' ? 'Доступен - нажмите чтобы отключить' : 'Не работает - нажмите чтобы включить'}
              >
                {member.availability_status === 'available' ? (
                  <>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                    <span className="hidden sm:inline">В сети</span>
                    <span className="sm:hidden">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="hidden sm:inline">Не в сети</span>
                    <span className="sm:hidden">
                      <XCircle className="w-4 h-4" />
                    </span>
                  </>
                )}
              </motion.button>

              {/* Action Buttons Group */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onEdit(member)}
                  className="p-2.5 rounded-lg hover:bg-white transition-all group"
                  title="Редактировать профиль"
                >
                  <Edit className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onSchedule(member)}
                  className="p-2.5 rounded-lg hover:bg-white transition-all group"
                  title="Расписание"
                >
                  <Calendar className="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(member)}
                  className="p-2.5 rounded-lg hover:bg-white transition-all group"
                  title="Удалить сотрудника"
                >
                  <Trash2 className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" />
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
