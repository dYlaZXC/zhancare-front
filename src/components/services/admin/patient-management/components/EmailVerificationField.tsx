"use client";

import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import OtpCodeInput from "@/components/auth/forms/OtpCodeInput";
import type { VerificationStatus } from "../hooks/usePatientVerificationCodes";

const CODE_EXPIRATION_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

export default function EmailVerificationField({
  email,
  onEmailChange,
  status,
  onSend,
  onVerify,
  onResend,
  otpError,
  onSkip,
  onChangeEmail,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  status: VerificationStatus;
  onSend: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<boolean>;
  otpError: string | null;
  onSkip: () => void;
  onChangeEmail: () => void;
}) {
  const emailLooksValid = /\S+@\S+\.\S+/.test(email);

  if (status === "verified") {
    return (
      <div className="flex items-center justify-between gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Подтверждён: {email}
        </span>
        <button type="button" onClick={onChangeEmail} className="text-emerald-600 hover:text-emerald-800 underline text-xs flex-shrink-0">
          Изменить
        </button>
      </div>
    );
  }

  if (status === "skipped") {
    return (
      <div className="flex items-center justify-between gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
        <span>Можно добавить позже из профиля пациента</span>
        <button type="button" onClick={onChangeEmail} className="text-[#3772ff] hover:text-[#2956bf] underline text-xs flex-shrink-0">
          Добавить email
        </button>
      </div>
    );
  }

  if (status === "sent" || status === "verifying") {
    return (
      <div className="space-y-2">
        <button type="button" onClick={onChangeEmail} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
          <ArrowLeft className="w-3 h-3" /> Изменить
        </button>
        <OtpCodeInput
          expirationSeconds={CODE_EXPIRATION_SECONDS}
          resendCooldownSeconds={RESEND_COOLDOWN_SECONDS}
          onComplete={onVerify}
          onResend={onResend}
          error={otpError}
          disabled={status === "verifying"}
          description={`Код отправлен на ${email}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={e => onEmailChange(e.target.value)}
        placeholder="email@example.com"
        className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSend}
          disabled={!emailLooksValid || status === "sending"}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#3772ff]/10 text-[#3772ff] text-sm font-semibold hover:bg-[#3772ff]/15 transition-colors disabled:opacity-50"
        >
          {status === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Подтвердить"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={status === "sending"}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Указать позже
        </button>
      </div>
    </div>
  );
}
