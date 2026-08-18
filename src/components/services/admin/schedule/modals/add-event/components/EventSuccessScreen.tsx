"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Banknote, Building2, Check, CheckCircle2, Copy, Loader2, MapPin, Stethoscope, User, Video,
} from "lucide-react";
import type { ConsultationType, CreatedInfo, DiagService, EventFormData, Patient, PaymentTypeOption, StaffMember } from "../types/addEventTypes";

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

const PAYMENT_LABELS: Record<string, string> = {
  free: 'Бесплатно',
  pay_at_clinic: 'Оплата при визите',
  full_prepay: 'Полная предоплата',
  partial_prepay: 'Частичная предоплата',
};

export function EventSuccessScreen({
  consultationType,
  formData,
  paymentType,
  prepayAmount,
  createdInfo,
  patient,
  doctor,
  diagService,
  referringDoctor,
  clinicName,
  clinicAddress,
  onClose,
}: {
  consultationType: ConsultationType;
  formData: EventFormData;
  paymentType: PaymentTypeOption;
  prepayAmount: string;
  createdInfo: CreatedInfo;
  patient: Patient | undefined;
  doctor: StaffMember | undefined;
  // Diagnostics only. diagService.doctor_name is the performing doctor
  // (fixed by the service itself); referringDoctor is who ordered the
  // test — a different, independent, optional role.
  diagService?: DiagService | null;
  referringDoctor?: StaffMember | undefined;
  clinicName: string;
  clinicAddress: string;
  onClose: () => void;
}) {
  const [shareCopied, setShareCopied] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [waSent, setWaSent] = useState(false);
  const [tgSending, setTgSending] = useState(false);
  const [tgSent, setTgSent] = useState(false);

  const isOnline = consultationType === 'online';
  const isHome = consultationType === 'home';
  const typeLabel = consultationType === 'online' ? 'Видеоконсультация'
    : consultationType === 'offline' ? 'Приём в клинике'
    : consultationType === 'home' ? 'Выезд на дом'
    : 'Диагностика';
  const link = isOnline && createdInfo.meeting_id
    ? `${window.location.origin}/video-call/patient?meetingId=${createdInfo.meeting_id}`
    : null;
  const priceRaw = doctor
    ? (isOnline ? doctor.online_consultation_price : doctor.offline_consultation_price)
    : null;
  const price = priceRaw ? Number(priceRaw) : 0;

  // Build share text from current form state + response
  const buildCreatedShareText = () => {
    const lines: (string | null)[] = [
      '📋 Ваша запись в ZhanCare',
      '',
      `📅 Дата: ${formData.date}, ${formData.time} (${formData.duration} мин)`,
      `🏥 Тип: ${typeLabel}`,
    ];

    if (doctor) lines.push(`👨‍⚕️ Доктор: ${doctor.first_name} ${doctor.last_name}`);
    // Performing doctor only — this text goes to the patient, and the
    // referring doctor (who ordered the test) is an internal/billing
    // concept, not something relevant to share with them.
    if (consultationType === 'diagnostics' && diagService?.doctor_name) {
      lines.push(`👨‍⚕️ Исполнитель: ${diagService.doctor_name}`);
    }
    if (patient) {
      lines.push('');
      lines.push(`👤 Пациент: ${patient.first_name} ${patient.last_name}`);
    }

    if (isOnline && link) {
      lines.push('', `🔗 Ссылка для входа:`, link);
    }
    if (isOnline && createdInfo.access_code) {
      lines.push(`🔑 Код доступа: ${createdInfo.access_code}`);
    }

    if (paymentType !== 'free' && price > 0) {
      lines.push('');
      lines.push(`💳 Оплата: ${PAYMENT_LABELS[paymentType] ?? paymentType}`);
      if (paymentType === 'partial_prepay' && prepayAmount) {
        lines.push(`   Предоплата: ${Number(prepayAmount).toLocaleString('ru-RU')} из ${price.toLocaleString('ru-RU')} ₸`);
      } else if (paymentType === 'full_prepay') {
        lines.push(`   Сумма: ${price.toLocaleString('ru-RU')} ₸`);
      } else if (paymentType === 'pay_at_clinic') {
        lines.push(`   Сумма: ${price.toLocaleString('ru-RU')} ₸`);
      }
    }

    if (formData.notes) lines.push('', `📝 ${formData.notes}`);

    return lines.filter(l => l !== null).join('\n');
  };

  const shareText = buildCreatedShareText();
  const patientPhone = patient?.phone ? patient.phone.replace(/\D/g, '') : '';

  const handleShareCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };
  const handleWhatsApp = async () => {
    if (!patientPhone) { toast.error('У пациента нет номера телефона'); return; }
    setWaSending(true);
    try {
      await api.post('/whatsapp/reply/', { to: patientPhone, body: shareText });
      setWaSent(true);
      toast.success('Отправлено в WhatsApp');
    } catch { toast.error('Не удалось отправить в WhatsApp'); }
    finally { setWaSending(false); }
  };
  const handleTelegram = async () => {
    if (!formData.patient_id) return;
    setTgSending(true);
    try {
      const convRes = await api.get('/tg/conversation/', { params: { patient_id: formData.patient_id } });
      if (!convRes.data.found) { toast.warn('Пациент не подключил Telegram бот'); return; }
      await api.post('/tg/reply/', { chat_id: convRes.data.chat_id, text: shareText });
      setTgSent(true);
      toast.success('Отправлено в Telegram');
    } catch { toast.error('Не удалось отправить в Telegram'); }
    finally { setTgSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
      >
        {/* Green success header */}
        <div className="px-8 py-6 text-center" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Запись создана!</h2>
          <p className="text-emerald-100 text-sm mt-1">
            {formData.date} в {formData.time} · {formData.duration} мин
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-sm">
            {/* Type */}
            <div className="flex items-center gap-2.5">
              {isOnline
                ? <Video className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                : isHome
                  ? <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  : <Building2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
              }
              <span className="text-gray-500 w-24 flex-shrink-0">Тип</span>
              <span className="font-semibold text-gray-800">{typeLabel}</span>
            </div>

            {patient && (
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-gray-500 w-24 flex-shrink-0">Пациент</span>
                <span className="font-semibold text-gray-800">{patient.first_name} {patient.last_name}</span>
              </div>
            )}
            {doctor && (
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-500 w-24 flex-shrink-0">Доктор</span>
                <span className="font-semibold text-gray-800">{doctor.first_name} {doctor.last_name}</span>
              </div>
            )}
            {/* Diagnostics: two distinct, independent roles — never just "Доктор" */}
            {consultationType === 'diagnostics' && diagService?.doctor_name && (
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-4 h-4 text-violet-500 flex-shrink-0" />
                <span className="text-gray-500 w-24 flex-shrink-0">Исполнитель</span>
                <span className="font-semibold text-gray-800">{diagService.doctor_name}</span>
              </div>
            )}
            {consultationType === 'diagnostics' && referringDoctor && (
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-gray-500 w-24 flex-shrink-0">Назначил</span>
                <span className="font-semibold text-gray-800">{referringDoctor.first_name} {referringDoctor.last_name}</span>
              </div>
            )}

            {/* Online-only: video link + code */}
            {isOnline && link && (
              <div className="flex items-start gap-2.5">
                <Video className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 w-24 flex-shrink-0">Ссылка</span>
                <span className="font-medium text-indigo-600 text-xs break-all leading-relaxed">{link}</span>
              </div>
            )}
            {isOnline && createdInfo.access_code && (
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 text-amber-500 flex-shrink-0 text-center text-xs font-black">🔑</span>
                <span className="text-gray-500 w-24 flex-shrink-0">Код</span>
                <span className="font-black font-mono tracking-widest text-gray-800">{createdInfo.access_code}</span>
              </div>
            )}

            {/* Offline: clinic address */}
            {!isOnline && !isHome && clinicName && (
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <span className="text-gray-500 w-24 flex-shrink-0">Клиника</span>
                <span className="font-semibold text-gray-800">{clinicName}</span>
              </div>
            )}
            {!isOnline && !isHome && clinicAddress && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 w-24 flex-shrink-0">Адрес</span>
                <span className="font-medium text-gray-700">{clinicAddress}</span>
              </div>
            )}

            {/* Home visit: patient address */}
            {isHome && patient && (patient as any).address && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 w-24 flex-shrink-0">Адрес</span>
                <span className="font-medium text-gray-700">{(patient as any).address}</span>
              </div>
            )}

            {paymentType !== 'free' && price > 0 && (
              <div className="flex items-center gap-2.5">
                <Banknote className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-500 w-24 flex-shrink-0">Оплата</span>
                <span className="font-semibold text-gray-800">
                  {PAYMENT_LABELS[paymentType]} · {price.toLocaleString('ru-RU')} ₸
                </span>
              </div>
            )}
          </div>

          {/* Share label */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
            Отправить пациенту
          </p>

          {/* Share buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShareCopy}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-sm font-semibold border transition-all ${
                shareCopied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {shareCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {shareCopied ? 'Скопировано' : 'Скопировать'}
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={waSending || waSent}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border transition-all flex-shrink-0 disabled:opacity-70 ${waSent ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#16a34a] border-[#86efac]'}`}
            >
              {waSending ? <Loader2 className="w-4 h-4 animate-spin" /> : waSent ? <Check className="w-4 h-4" /> : <WhatsAppIcon className="w-4 h-4" />}
              {waSent ? 'Отправлено' : 'WhatsApp'}
            </button>
            <button
              type="button"
              onClick={handleTelegram}
              disabled={tgSending || tgSent}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border transition-all flex-shrink-0 disabled:opacity-70 ${tgSent ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] border-[#93c5fd]'}`}
            >
              {tgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : tgSent ? <Check className="w-4 h-4" /> : <TelegramIcon className="w-4 h-4" />}
              {tgSent ? 'Отправлено' : 'Telegram'}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors text-sm"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );
}
