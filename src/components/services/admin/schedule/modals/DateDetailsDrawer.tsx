"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Video,
  Home,
  User,
  Stethoscope,
  MapPin,
  X,
  Phone,
  Mail,
  Clock,
  Copy,
  Check,
  Link,
  KeyRound,
  BadgeInfo,
  Activity,
  ClipboardList,
  Search,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { ScheduleEvent } from "../types/scheduleTypes";
import { getStatusColor } from "../utils/scheduleUtils";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import RescheduleModal from "./RescheduleModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface DateDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  events: ScheduleEvent[];
  onEventChanged?: () => void;
}

const GENDER_LABEL: Record<string, string> = { M: 'Мужчина', F: 'Женщина' };

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title={`Копировать ${label}`}
      className="p-1 rounded-lg hover:bg-white/60 transition-colors flex-shrink-0"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-600" />
        : <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
      }
    </button>
  );
}

function InfoRow({ icon, value, copyable }: { icon: React.ReactNode; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span className="flex-shrink-0 text-gray-400">{icon}</span>
      <span className="truncate flex-1">{value}</span>
      {copyable && <CopyButton value={value} label={value} />}
    </div>
  );
}

function StatusBadge({ status }: { status: ScheduleEvent['status'] }) {
  const colors = getStatusColor(status);
  const labels: Record<string, string> = {
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено',
  };
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {labels[status] ?? status}
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Запланировано',
  in_progress: 'В процессе',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

function CopyAllButton({ event }: { event: ScheduleEvent }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const isOnline = event.consultation_type !== 'offline';
    const link = event.meeting_id
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/video-call/patient?meetingId=${event.meeting_id}`
      : null;

    const lines: (string | null)[] = [
      '📋 Консультация ZhanCare',
      '',
      `📅 Дата: ${event.date}, ${event.time} (${event.duration} мин)`,
      `🏥 Тип: ${event.type === 'consultation' ? (isOnline ? 'Онлайн' : 'Оффлайн') : 'Выезд на дом'}`,
      `📊 Статус: ${STATUS_LABELS[event.status] ?? event.status}`,
      '',
      `👤 Пациент: ${event.patient_name}`,
      event.patient_phone ? `📞 Телефон: ${event.patient_phone}` : null,
      event.patient_email ? `📧 Email: ${event.patient_email}` : null,
      event.patient_birth_date ? `🎂 Дата рождения: ${event.patient_birth_date}` : null,
    ];

    if (event.doctor_name) {
      lines.push('', `👨‍⚕️ Доктор: ${event.doctor_name}`);
      if (event.doctor_specialization) lines.push(`🔬 Специализация: ${event.doctor_specialization}`);
      if (event.doctor_phone) lines.push(`📞 Телефон врача: ${event.doctor_phone}`);
      if (event.doctor_email) lines.push(`📧 Email врача: ${event.doctor_email}`);
    }

    if (event.nurse_name) {
      lines.push('', `👩‍⚕️ Медсестра: ${event.nurse_name}`);
      if (event.nurse_phone) lines.push(`📞 Телефон: ${event.nurse_phone}`);
    }

    if (link) {
      lines.push('', `🔗 Ссылка на консультацию:`, link);
    }
    if (event.access_code) lines.push(`🔑 Код доступа: ${event.access_code}`);
    if (event.address) lines.push('', `📍 Адрес: ${event.address}`);
    if (event.notes) lines.push('', `📝 Примечания: ${event.notes}`);

    navigator.clipboard.writeText(lines.filter(l => l !== null).join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {copied
        ? <><Check className="w-4 h-4" /> Скопировано!</>
        : <><ClipboardList className="w-4 h-4" /> Скопировать всю информацию</>
      }
    </button>
  );
}

function ConsultationCard({ event, onChanged }: { event: ScheduleEvent; onChanged?: () => void }) {
  const isOnline = event.consultation_type !== 'offline';
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/schedule/${event.id}/`);
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Card header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: isOnline ? 'linear-gradient(135deg, #ebf1ff 0%, #f0f7ff 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isOnline ? '#3772ff20' : '#05966920' }}
          >
            {event.type === 'consultation'
              ? <Video className="w-5 h-5" style={{ color: isOnline ? '#3772ff' : '#059669' }} />
              : <Home className="w-5 h-5 text-violet-600" />
            }
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#1e263e' }}>
              {event.type === 'consultation'
                ? (isOnline ? 'Онлайн консультация' : 'Оффлайн консультация')
                : 'Выезд на дом'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">
                {event.time} · {event.duration} мин
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={event.status} />
          <button
            onClick={() => setRescheduleOpen(true)}
            title="Перенести запись"
            className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors text-blue-400 hover:text-blue-600"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Удалить запись"
            className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {rescheduleOpen && (
        <RescheduleModal
          event={event}
          onClose={() => setRescheduleOpen(false)}
          onRescheduled={() => { onChanged?.(); }}
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

      <div className="p-5 space-y-4">
        {/* Patient + Doctor grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Patient */}
          <div className="bg-blue-50/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Пациент</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-snug">{event.patient_name}</p>
            {event.patient_phone && (
              <InfoRow icon={<Phone className="w-3.5 h-3.5" />} value={event.patient_phone} copyable />
            )}
            {event.patient_email && (
              <InfoRow icon={<Mail className="w-3.5 h-3.5" />} value={event.patient_email} copyable />
            )}
            {event.patient_birth_date && (
              <InfoRow icon={<CalendarIcon className="w-3.5 h-3.5" />} value={event.patient_birth_date} />
            )}
            {event.patient_gender && (
              <InfoRow icon={<BadgeInfo className="w-3.5 h-3.5" />} value={GENDER_LABEL[event.patient_gender] ?? event.patient_gender} />
            )}
          </div>

          {/* Doctor */}
          {event.doctor_name && (
            <div className="bg-emerald-50/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Доктор</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm leading-snug">{event.doctor_name}</p>
              {event.doctor_specialization && (
                <InfoRow icon={<Activity className="w-3.5 h-3.5" />} value={event.doctor_specialization} />
              )}
              {event.doctor_phone && (
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} value={event.doctor_phone} copyable />
              )}
              {event.doctor_email && (
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} value={event.doctor_email} copyable />
              )}
              {event.doctor_years_of_experience != null && (
                <InfoRow icon={<BadgeInfo className="w-3.5 h-3.5" />} value={`${event.doctor_years_of_experience} лет опыта`} />
              )}
            </div>
          )}

          {/* Nurse */}
          {event.nurse_name && (
            <div className="bg-violet-50/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-violet-600" />
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">Медсестра</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{event.nurse_name}</p>
              {event.nurse_phone && (
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} value={event.nurse_phone} copyable />
              )}
              {event.nurse_email && (
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} value={event.nurse_email} copyable />
              )}
            </div>
          )}
        </div>

        {/* Address */}
        {event.address && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-purple-50/60">
            <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{event.address}</span>
          </div>
        )}

        {/* Consultation access — link + meeting id + access code */}
        {(event.meeting_id || event.access_code) && (() => {
          const consultLink = event.meeting_id
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/video-call/patient?meetingId=${event.meeting_id}`
            : null;
          return (
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              {consultLink && (
                <div className="flex items-center gap-2.5 px-4 py-2.5">
                  <Link className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400 flex-shrink-0 w-24">Ссылка</span>
                  <span className="text-xs text-blue-600 truncate flex-1 font-medium">{consultLink}</span>
                  <CopyButton value={consultLink} label="ссылку" />
                </div>
              )}
              {event.meeting_id && (
                <div className="flex items-center gap-2.5 px-4 py-2.5">
                  <Link className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  <span className="text-xs text-gray-400 flex-shrink-0 w-24">Meeting ID</span>
                  <span className="text-xs font-mono text-gray-500 truncate flex-1">{event.meeting_id}</span>
                  <CopyButton value={event.meeting_id} label="Meeting ID" />
                </div>
              )}
              {event.access_code && (
                <div className="flex items-center gap-2.5 px-4 py-2.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400 flex-shrink-0 w-24">Код доступа</span>
                  <span className="text-sm font-bold font-mono tracking-widest text-gray-800 flex-1">{event.access_code}</span>
                  <CopyButton value={event.access_code} label="код" />
                </div>
              )}
            </div>
          );
        })()}

        {/* Notes */}
        {event.notes && (
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Примечания</p>
            <p className="text-sm text-gray-700 leading-relaxed">{event.notes}</p>
          </div>
        )}

        {/* Copy all info button */}
        <CopyAllButton event={event} />
      </div>
    </motion.div>
  );
}

export default function DateDetailsDrawer({
  isOpen,
  onClose,
  selectedDate,
  events,
  onEventChanged,
}: DateDetailsDrawerProps) {
  const [search, setSearch] = useState("");

  if (!isOpen || !selectedDate) return null;

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));

  const q = search.trim().toLowerCase();
  const filtered = q
    ? sorted.filter(e =>
        e.patient_name?.toLowerCase().includes(q) ||
        e.doctor_name?.toLowerCase().includes(q) ||
        e.nurse_name?.toLowerCase().includes(q) ||
        e.patient_phone?.includes(q) ||
        e.doctor_phone?.includes(q) ||
        e.patient_email?.toLowerCase().includes(q) ||
        e.time?.includes(q)
      )
    : sorted;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header — same gradient as AdminSidebar/navbar */}
          <div className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)' }}
          >
            <div className="text-white">
              <h2 className="text-xl font-bold">Консультации на дату</h2>
              <p className="text-blue-100 text-sm capitalize mt-0.5">{formattedDate}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Search */}
          {sorted.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по пациенту, врачу, телефону..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold">Нет запланированных консультаций</p>
                <p className="text-gray-400 text-sm mt-1">На эту дату пока нет записей</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold">Ничего не найдено</p>
                <p className="text-gray-400 text-sm mt-1">Попробуйте изменить запрос</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {filtered.length} {filtered.length === 1 ? 'запись' : 'записей'}
                  {q && <span className="normal-case font-normal ml-1 text-blue-400">· по запросу «{search.trim()}»</span>}
                </p>
                {filtered.map(event => (
                  <ConsultationCard key={event.id} event={event} onChanged={onEventChanged} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors text-sm"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
