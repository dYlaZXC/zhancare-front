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
  FlaskConical,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { ScheduleEvent } from "../types/scheduleTypes";
import { getStatusColor, getPaymentStatusColor, PAYMENT_TYPE_LABELS } from "../utils/scheduleUtils";
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function buildShareText(event: ScheduleEvent): string {
  const isOnline = event.consultation_type !== 'offline';
  const link = event.meeting_id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/video-call/patient?meetingId=${event.meeting_id}`
    : null;

  const lines: (string | null)[] = [
    '📋 Консультация ZhanCare',
    '',
    `📅 Дата: ${event.date}, ${event.time} (${event.duration} мин)`,
    `🏥 Тип: ${event.type === 'consultation' ? (isOnline ? 'Онлайн' : 'Оффлайн') : event.type === 'diagnostics' ? 'Диагностика' : 'Выезд на дом'}`,
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

  if (event.service_name) {
    lines.push('', `🧪 Услуга: ${event.service_name}`);
    if (event.clinic_name) lines.push(`🏥 Клиника: ${event.clinic_name}`);
  }

  if (link) {
    lines.push('', `🔗 Ссылка на консультацию:`, link);
  }
  if (event.access_code) lines.push(`🔑 Код доступа: ${event.access_code}`);
  if (event.address) lines.push('', `📍 Адрес: ${event.address}`);
  if (event.notes) lines.push('', `📝 Примечания: ${event.notes}`);

  return lines.filter(l => l !== null).join('\n');
}

function ShareButtons({ event }: { event: ScheduleEvent }) {
  const [copied, setCopied] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [waSent, setWaSent] = useState(false);
  const [tgSending, setTgSending] = useState(false);
  const [tgSent, setTgSent] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildShareText(event)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareWhatsApp = async () => {
    if (!event.patient_phone) { toast.error('У пациента нет номера телефона'); return; }
    const phone = event.patient_phone.replace(/\D/g, '');
    setWaSending(true);
    try {
      await api.post('/whatsapp/reply/', { to: phone, body: buildShareText(event) });
      setWaSent(true);
      toast.success('Отправлено в WhatsApp');
      setTimeout(() => setWaSent(false), 3000);
    } catch {
      toast.error('Не удалось отправить в WhatsApp');
    } finally {
      setWaSending(false);
    }
  };

  const shareTelegram = async () => {
    if (!event.patient_id) { toast.error('Нет ID пациента'); return; }
    setTgSending(true);
    try {
      const convRes = await api.get('/tg/conversation/', { params: { patient_id: event.patient_id } });
      if (!convRes.data.found) {
        toast.warn('Пациент не подключил Telegram бот');
        return;
      }
      await api.post('/tg/reply/', { chat_id: convRes.data.chat_id, text: buildShareText(event) });
      setTgSent(true);
      toast.success('Отправлено в Telegram');
      setTimeout(() => setTgSent(false), 3000);
    } catch {
      toast.error('Не удалось отправить в Telegram');
    } finally {
      setTgSending(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          copied
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
        }`}
      >
        {copied ? <Check className="w-4 h-4 flex-shrink-0" /> : <ClipboardList className="w-4 h-4 flex-shrink-0" />}
        <span>{copied ? 'Скопировано!' : 'Скопировать'}</span>
      </button>
      <button
        type="button"
        onClick={shareWhatsApp}
        disabled={waSending || waSent}
        title="Отправить в WhatsApp"
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border flex-shrink-0 disabled:opacity-70 ${
          waSent
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#16a34a] border-[#86efac] hover:border-[#4ade80]'
        }`}
      >
        {waSending ? <Loader2 className="w-4 h-4 animate-spin" /> : waSent ? <Check className="w-4 h-4" /> : <WhatsAppIcon className="w-4 h-4" />}
        <span className="hidden sm:inline">{waSent ? 'Отправлено' : 'WhatsApp'}</span>
      </button>
      <button
        type="button"
        onClick={shareTelegram}
        disabled={tgSending || tgSent}
        title="Отправить в Telegram"
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border flex-shrink-0 disabled:opacity-70 ${
          tgSent
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] border-[#93c5fd] hover:border-[#60a5fa]'
        }`}
      >
        {tgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : tgSent ? <Check className="w-4 h-4" /> : <TelegramIcon className="w-4 h-4" />}
        <span className="hidden sm:inline">{tgSent ? 'Отправлено' : 'Telegram'}</span>
      </button>
    </div>
  );
}

function getHeaderInfo(event: ScheduleEvent) {
  const isOnline = event.consultation_type !== 'offline';
  if (event.type === 'consultation') {
    return {
      icon: <Video className="w-5 h-5" style={{ color: isOnline ? '#3772ff' : '#059669' }} />,
      iconBg: isOnline ? '#3772ff20' : '#05966920',
      title: isOnline ? 'Онлайн консультация' : 'Оффлайн консультация',
    };
  }
  if (event.type === 'diagnostics') {
    return {
      icon: <FlaskConical className="w-5 h-5 text-cyan-600" />,
      iconBg: '#0891b220',
      title: event.service_name ? `Диагностика: ${event.service_name}` : 'Диагностика',
    };
  }
  return {
    icon: <Home className="w-5 h-5 text-violet-600" />,
    iconBg: '#7c3aed20',
    title: 'Выезд на дом',
  };
}

function BookingRow({ event, onChanged }: { event: ScheduleEvent; onChanged?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const headerInfo = getHeaderInfo(event);

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
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(v => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); } }}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors text-left cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: headerInfo.iconBg }}>
          {headerInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{headerInfo.title}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
            <Clock className="w-3 h-3" />
            {event.time} · {event.duration} мин
          </div>
        </div>
        {!!event.reschedule_count && (
          <span
            title={event.reschedule_reason ? `Последняя причина: «${event.reschedule_reason}»` : undefined}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0"
          >
            ⟲ {event.reschedule_count}
          </span>
        )}
        <StatusBadge status={event.status} />
        {event.payment_info && (() => {
          const pc = getPaymentStatusColor(event.payment_info.status);
          return (
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: pc.bg, color: pc.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pc.dot }} />
              {pc.label}
            </span>
          );
        })()}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setRescheduleOpen(true); }}
          title="Перенести запись"
          className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors text-blue-400 hover:text-blue-600 flex-shrink-0"
        >
          <CalendarDays className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
          title="Удалить запись"
          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-500 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
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

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-3 bg-gray-50/40">
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

              {/* Diagnostic service */}
              {event.service_name && (
                <div className="bg-cyan-50/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="text-xs font-bold text-cyan-700 uppercase tracking-wide">Услуга</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{event.service_name}</p>
                  {event.clinic_name && (
                    <InfoRow icon={<BadgeInfo className="w-3.5 h-3.5" />} value={event.clinic_name} />
                  )}
                </div>
              )}

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
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white">
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

              {/* Payment info */}
              {event.payment_info && (() => {
                const { payment_type, status, amount_due, amount_paid, currency } = event.payment_info;
                const pc = getPaymentStatusColor(status);
                const due = Number(amount_due);
                const paid = Number(amount_paid);
                return (
                  <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Оплата</span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: pc.bg, color: pc.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pc.dot }} />
                        {pc.label}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      <div className="flex items-center gap-2 px-4 py-2">
                        <span className="text-xs text-gray-400 w-28 flex-shrink-0">Тип оплаты</span>
                        <span className="text-xs font-semibold text-gray-700">{PAYMENT_TYPE_LABELS[payment_type] ?? payment_type}</span>
                      </div>
                      {due > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2">
                          <span className="text-xs text-gray-400 w-28 flex-shrink-0">К оплате</span>
                          <span className="text-xs font-semibold text-gray-700">{due.toLocaleString('ru-RU')} {currency}</span>
                        </div>
                      )}
                      {paid > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2">
                          <span className="text-xs text-gray-400 w-28 flex-shrink-0">Оплачено</span>
                          <span className="text-xs font-semibold" style={{ color: pc.text }}>{paid.toLocaleString('ru-RU')} {currency}</span>
                        </div>
                      )}
                    </div>
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

              {/* Share buttons */}
              <ShareButtons event={event} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PatientGroupCard({ events, onChanged }: { events: ScheduleEvent[]; onChanged?: () => void }) {
  const first = events[0];
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));
  const initials = first.patient_name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Patient header — shown once for all their bookings on this date */}
      <div className="px-5 py-4 flex items-center gap-3 bg-blue-50/60 border-b border-gray-100">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3772ff, #2c5bcc)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{first.patient_name}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
            {first.patient_phone && (
              <span className="flex items-center gap-1 flex-shrink-0">
                <Phone className="w-3 h-3" /> {first.patient_phone}
              </span>
            )}
            {first.patient_email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{first.patient_email}</span>
              </span>
            )}
          </div>
        </div>
        <span className="text-xs font-bold text-gray-400 flex-shrink-0">
          {sortedEvents.length} {sortedEvents.length === 1 ? 'запись' : 'записи'}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {sortedEvents.map(event => (
          <BookingRow key={event.id} event={event} onChanged={onChanged} />
        ))}
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

  // Group bookings by patient so the same person's multiple services on this
  // date appear under one card instead of repeating their info each time.
  const groupsByPatient = new Map<string, ScheduleEvent[]>();
  for (const e of filtered) {
    const key = String(e.patient_id ?? e.patient_name);
    if (!groupsByPatient.has(key)) groupsByPatient.set(key, []);
    groupsByPatient.get(key)!.push(e);
  }
  const earliestTime = (g: ScheduleEvent[]) => g.reduce((min, e) => (e.time < min ? e.time : min), g[0].time);
  const patientGroups = Array.from(groupsByPatient.values()).sort((a, b) => earliestTime(a).localeCompare(earliestTime(b)));

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
                  {patientGroups.length > 1 && ` · ${patientGroups.length} пациента`}
                  {q && <span className="normal-case font-normal ml-1 text-blue-400">· по запросу «{search.trim()}»</span>}
                </p>
                {patientGroups.map(group => (
                  <PatientGroupCard key={String(group[0].patient_id ?? group[0].patient_name)} events={group} onChanged={onEventChanged} />
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
