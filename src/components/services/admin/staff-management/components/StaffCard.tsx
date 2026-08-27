"use client";

import { motion } from "framer-motion";
import { Briefcase, Mail, Phone, Calendar, Pencil } from "lucide-react";
import type { StaffMember, TodayActivity } from "../types/staffTypes";
import { StaffAvatar } from "./StaffAvatar";
import { StaffScheduleStatus } from "./StaffScheduleStatus";
import { StaffTodayActivity } from "./StaffTodayActivity";
import { StaffCardMenu } from "./StaffCardMenu";

const STATUS_STYLE: Record<string, string> = {
  available: 'bg-green-100 text-green-700 hover:bg-green-200',
  busy: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  break: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  offline: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Доступен',
  busy: 'Занят',
  break: 'На перерыве',
  offline: 'Не работает',
};

export function StaffCard({
  member,
  initial,
  index,
  showDeleted,
  activity,
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
  activity?: TodayActivity;
  onEdit: (member: StaffMember) => void;
  onToggleStatus: (memberId: number, currentStatus: string | undefined) => void;
  onSchedule: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
  onRestore: (member: StaffMember) => void;
}) {
  const statusKey = member.availability_status ?? 'offline';

  return (
    <motion.div
      initial={initial ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={initial ? { delay: index * 0.05 } : { duration: 0.2 }}
      layout
      className="rounded-3xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all bg-white shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col xl:flex-row xl:items-stretch gap-4">
        {/* Identity */}
        <div className="flex items-center gap-4 xl:w-[26%] xl:flex-shrink-0">
          <StaffAvatar member={member} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-bold truncate" style={{ color: '#1e263e' }}>
                {member.first_name} {member.last_name}
              </h3>
              {(member.role === 'doctor' || member.role === 'nurse') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleStatus(member.id, member.availability_status)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${STATUS_STYLE[statusKey]}`}
                  title="Нажмите, чтобы переключить доступность"
                >
                  {STATUS_LABEL[statusKey]}
                </motion.button>
              )}
            </div>
            {member.specialization && (
              <p className="text-xs font-medium text-gray-700 mb-0.5 flex items-center gap-1.5 truncate">
                <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{member.specialization}</span>
                {!!member.years_of_experience && <span className="text-gray-400">· опыт {member.years_of_experience} лет</span>}
              </p>
            )}
            <div className="flex flex-col gap-0.5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                {member.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule status */}
        <div className="flex xl:flex-1 xl:min-w-0">
          <StaffScheduleStatus member={member} />
        </div>

        {/* Today's activity */}
        <div className="flex xl:flex-shrink-0">
          <StaffTodayActivity activity={activity} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(member)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs text-white shadow-sm hover:shadow-md transition-all"
            style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            title="Открыть профиль"
          >
            <Pencil className="w-3.5 h-3.5" />
            Открыть
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSchedule(member)}
            className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Расписание"
          >
            <Calendar className="w-5 h-5 text-gray-500" />
          </motion.button>

          <StaffCardMenu member={member} showDeleted={showDeleted} onDelete={onDelete} onRestore={onRestore} />
        </div>
      </div>
    </motion.div>
  );
}
