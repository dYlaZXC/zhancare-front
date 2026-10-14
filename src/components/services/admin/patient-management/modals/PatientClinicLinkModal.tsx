"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Building, Link2, Loader2, Mail, MailX, Phone } from "lucide-react";
import { api } from "@/utils/api";
import type { FoundPatient } from "../types/patientTypes";

// ─── Patient Clinic Link Modal ──────────────────────────────────────────────
// Shown when "Добавить Пациента" finds an existing patient (registered under
// a different clinic) by phone/email. Two steps: confirm + send the code
// (delivered to whichever of email/WhatsApp the patient actually has — both,
// if both), then the ADMIN types the code back in here — the patient relays
// it by phone/in person, there is no patient-facing confirmation screen for
// this.

const CODE_LENGTH = 6;
const CODE_EXPIRATION_SECONDS = 15 * 60;
const RESEND_COOLDOWN_SECONDS = 5 * 60;

export function PatientClinicLinkModal({
  patient,
  onClose,
  onLinked,
}: {
  patient: FoundPatient;
  onClose: () => void;
  onLinked: () => void;
}) {
  const [step, setStep] = useState<"confirm" | "code">("confirm");
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number | null>(null);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "code" || countdown === null) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (!prev || prev <= 1 ? null : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (resendCooldown === null) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (!prev || prev <= 1 ? null : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async () => {
    if (resendCooldown && resendCooldown > 0) return;
    setSending(true);
    try {
      const res = await api.post(`/patients/${patient.id}/send-link-code/`);
      toast.success(res.data.message || "Код отправлен");
      setStep("code");
      setCode(Array(CODE_LENGTH).fill(""));
      setCodeError(null);
      setCountdown(CODE_EXPIRATION_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Не удалось отправить код");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async (codeStr: string) => {
    setVerifying(true);
    setCodeError(null);
    try {
      await api.post(`/patients/${patient.id}/confirm-link-code/`, { code: codeStr });
      toast.success(`Пациент привязан к клинике`);
      onLinked();
    } catch (err: any) {
      setCode(Array(CODE_LENGTH).fill(""));
      setCodeError(err.response?.data?.error || "Неверный код. Попробуйте ещё раз.");
      codeRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeChange = (val: string, index: number) => {
    const char = val.toUpperCase();
    if (!/^[A-Z0-9]?$/.test(char)) return;

    const updated = [...code];
    updated[index] = char;
    setCode(updated);
    setCodeError(null);

    if (char && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }

    const fullCode = updated.join("");
    if (fullCode.length === CODE_LENGTH && !updated.includes("")) {
      verifyCode(fullCode);
    }
  };

  const clinicLabel = patient.clinic?.name || patient.additional_clinics[0]?.name || null;
  // The backend now sends the code to whichever channel(s) actually exist
  // (email and/or WhatsApp via phone, both if both) — phone is mandatory for
  // new patients, but `patient.phone` can still be empty for legacy data, so
  // this stays defensive rather than assuming it's always present.
  const hasEmail = Boolean(patient.has_email);
  const hasPhone = Boolean(patient.phone);
  const canSendCode = hasEmail || hasPhone;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
      >
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Link2 className="w-8 h-8 text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-3" style={{ color: '#1e263e' }}>
          Пациент уже есть в системе
        </h2>

        {step === "confirm" ? (
          <>
            <p className="text-center text-gray-600 mb-5">
              {clinicLabel ? (
                <>
                  Пациент с таким телефоном/email уже зарегистрирован в клинике{" "}
                  <span className="font-semibold">«{clinicLabel}»</span>. Хотите также привязать его к вашей клинике?
                </>
              ) : (
                "Пациент с таким телефоном/email уже есть в системе, но пока не привязан ни к одной клинике. Хотите привязать его к вашей клинике?"
              )}
            </p>

            {/* Found patient card */}
            <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 mb-5 space-y-2">
              <p className="text-base font-bold text-gray-800">
                {patient.first_name} {patient.last_name}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {patient.phone}
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {patient.email}
                </div>
              )}
              {patient.clinic && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  {patient.clinic.name}
                </div>
              )}
            </div>

            {!canSendCode ? (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 mb-5">
                <MailX className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  У пациента не указаны ни email, ни телефон — привязка через код подтверждения недоступна.
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center mb-5">
                Код придёт пациенту {hasEmail && hasPhone ? "на email и в WhatsApp" : hasEmail ? "на email" : "в WhatsApp"} —
                сообщите его вам по телефону или лично, чтобы завершить привязку.
              </p>
            )}

            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={sending}
                className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSendCode}
                disabled={sending || !canSendCode}
                className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Отправить код
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-5">
              Введите 6-символьный код, который пациент сообщил вам
            </p>

            <div className="flex gap-2 justify-center mb-4">
              {code.map((char, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleCodeChange(e.target.value, i)}
                  ref={(el) => { codeRefs.current[i] = el; }}
                  className={`w-11 h-13 text-center text-xl font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                    char
                      ? "border-2 border-blue-500 bg-blue-50 text-blue-700"
                      : codeError
                      ? "border-2 border-red-300 bg-red-50 text-red-900"
                      : "border-2 border-gray-200 bg-white text-gray-900"
                  }`}
                  disabled={verifying}
                />
              ))}
            </div>

            {codeError && (
              <p className="text-red-600 text-sm font-medium text-center mb-4">{codeError}</p>
            )}

            {verifying && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Проверяем код...
              </div>
            )}

            <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-gray-50 border border-gray-200 mb-5">
              {countdown !== null ? (
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                  Код действителен: <span className="font-mono text-blue-600">{formatCountdown(countdown)}</span>
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />
                  Код истёк
                </span>
              )}
              <button
                onClick={handleSendCode}
                disabled={sending || (resendCooldown !== null && resendCooldown > 0)}
                className={`font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  resendCooldown && resendCooldown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                {resendCooldown && resendCooldown > 0 ? formatCountdown(resendCooldown) : "Отправить снова"}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
