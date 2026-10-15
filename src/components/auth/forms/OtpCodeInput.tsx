"use client";

import { useState, useEffect, useRef } from "react";

// Shared 6-box OTP entry — countdown-to-expiry + resend-cooldown timers are
// self-contained here (started on mount), since by the time this renders the
// "send" step has already succeeded once. The parent owns the actual
// send/verify API calls; this component only reports user intent
// (onComplete when all boxes are filled, onResend when the resend button is
// clicked) and manages its own input/timer state. Extracted from
// ForgotPasswordForm.tsx's original inline implementation — same visual
// pattern, now reused across the phone/email verification steps in
// RegisterForm and the OTP login form.

export interface OtpCodeInputProps {
  codeLength?: number;
  /** Phone/login codes are numeric-only; the original password-reset code is alnum. */
  digitsOnly?: boolean;
  expirationSeconds: number;
  resendCooldownSeconds: number;
  onComplete: (code: string) => void;
  /** Resolves to whether the resend actually succeeded — timers only reset on true. */
  onResend: () => Promise<boolean>;
  error?: string | null;
  disabled?: boolean;
  description?: string;
  expiresInLabel?: string;
  expiredLabel?: string;
  resendLabel?: string;
}

export default function OtpCodeInput({
  codeLength = 6,
  digitsOnly = true,
  expirationSeconds,
  resendCooldownSeconds,
  onComplete,
  onResend,
  error,
  disabled,
  description,
  expiresInLabel = "Код истечёт через:",
  expiredLabel = "Код истёк",
  resendLabel = "Отправить снова",
}: OtpCodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(codeLength).fill(""));
  const [countdown, setCountdown] = useState<number | null>(expirationSeconds);
  const [resendCooldown, setResendCooldown] = useState<number | null>(resendCooldownSeconds);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown === null) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (!prev || prev <= 1 ? null : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (resendCooldown === null) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (!prev || prev <= 1 ? null : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleChange = (val: string, index: number) => {
    const pattern = digitsOnly ? /^[0-9]?$/ : /^[a-zA-Z0-9]?$/;
    const char = digitsOnly ? val : val.toUpperCase();
    if (!pattern.test(char)) return;

    const updated = [...code];
    updated[index] = char;
    setCode(updated);

    if (char && index < codeLength - 1) {
      refs.current[index + 1]?.focus();
    }

    const full = updated.join("");
    if (full.length === codeLength && !updated.includes("")) {
      onComplete(full);
    }
  };

  const handleResend = async () => {
    if (resendCooldown !== null && resendCooldown > 0) return;
    const ok = await onResend();
    if (!ok) return;
    setCode(Array(codeLength).fill(""));
    setCountdown(expirationSeconds);
    setResendCooldown(resendCooldownSeconds);
    setTimeout(() => refs.current[0]?.focus(), 100);
  };

  return (
    <div className="space-y-4">
      {description && <p className="text-sm text-gray-600 text-center">{description}</p>}

      <div className="flex gap-2 justify-center">
        {code.map((char, i) => (
          <input
            key={i}
            type="text"
            inputMode={digitsOnly ? "numeric" : "text"}
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(e.target.value, i)}
            ref={(el) => { refs.current[i] = el; }}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 ${
              char
                ? "border-2 border-[#3772ff] bg-[#3772ff]/5 text-[#3772ff]"
                : error
                ? "border-2 border-red-300 bg-red-50 text-red-900"
                : "border-2 border-gray-200 bg-white text-gray-900"
            }`}
            disabled={disabled}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-600 text-sm font-medium text-center">{error}</p>
      )}

      <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-gray-50 border border-gray-200">
        {countdown !== null ? (
          <span className="text-gray-700 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
            {expiresInLabel} <span className="font-mono text-[#3772ff]">{formatCountdown(countdown)}</span>
          </span>
        ) : (
          <span className="text-red-600 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />
            {expiredLabel}
          </span>
        )}
        <button
          type="button"
          onClick={handleResend}
          disabled={disabled || (resendCooldown !== null && resendCooldown > 0)}
          className={`font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
            resendCooldown && resendCooldown > 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-[#3772ff] hover:text-[#2956bf] hover:bg-[#3772ff]/5"
          }`}
        >
          {resendCooldown && resendCooldown > 0 ? formatCountdown(resendCooldown) : resendLabel}
        </button>
      </div>
    </div>
  );
}
