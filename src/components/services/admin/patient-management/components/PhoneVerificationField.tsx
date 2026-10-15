"use client";

import { Loader2, Phone, ArrowLeft, CheckCircle } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import OtpCodeInput from "@/components/auth/forms/OtpCodeInput";
import type { VerificationStatus } from "../hooks/usePatientVerificationCodes";

const CODE_EXPIRATION_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

export default function PhoneVerificationField({
  phone,
  onPhoneChange,
  status,
  onSend,
  onVerify,
  onResend,
  otpError,
  onChangePhone,
}: {
  phone: string;
  onPhoneChange: (e164: string) => void;
  status: VerificationStatus;
  onSend: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<boolean>;
  otpError: string | null;
  onChangePhone: () => void;
}) {
  const phoneDigitsOk = phone.replace(/\D/g, "").length >= 10;

  if (status === "verified") {
    return (
      <div className="flex items-center justify-between gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Подтверждён: {phone}
        </span>
        <button type="button" onClick={onChangePhone} className="text-emerald-600 hover:text-emerald-800 underline text-xs flex-shrink-0">
          Изменить
        </button>
      </div>
    );
  }

  if (status === "sent" || status === "verifying") {
    return (
      <div className="space-y-2">
        <button type="button" onClick={onChangePhone} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
          <ArrowLeft className="w-3 h-3" /> Изменить номер
        </button>
        <OtpCodeInput
          expirationSeconds={CODE_EXPIRATION_SECONDS}
          resendCooldownSeconds={RESEND_COOLDOWN_SECONDS}
          onComplete={onVerify}
          onResend={onResend}
          error={otpError}
          disabled={status === "verifying"}
          description={`Код отправлен на ${phone} — пациент должен сообщить его вам`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <PhoneInput name="phone" value={phone} onChange={onPhoneChange} disabled={status === "sending"} defaultCountry="KZ" />
      <button
        type="button"
        onClick={onSend}
        disabled={!phoneDigitsOk || status === "sending"}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#3772ff]/10 text-[#3772ff] text-sm font-semibold hover:bg-[#3772ff]/15 transition-colors disabled:opacity-50"
      >
        {status === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
        Отправить код в WhatsApp
      </button>
    </div>
  );
}
