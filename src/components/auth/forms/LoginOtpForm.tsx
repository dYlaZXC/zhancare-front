"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Loader2, Shield, ArrowLeft, MessageCircle, Mail } from "lucide-react";
import { api } from "@/utils/api";
import AuthInput from "./AuthInput";
import PhoneInput from "@/components/ui/PhoneInput";
import OtpCodeInput from "./OtpCodeInput";
import TurnstileWidget from "../TurnstileWidget";

// Mirrors RegisterForm.tsx's own WIZARD_LABELS pattern — this copy isn't in
// the shared ru/kz/en/uz locale JSON yet (see that file's own note on why a
// local per-language map is the right stopgap here instead of hardcoding one
// language into a form the rest of the popup localizes properly).
const LABELS: Record<string, {
  sendCodeButton: string;
  confirmTitle: (value: string) => string;
  confirmBody: string;
  changeValue: string;
  sendCode: string;
  otpDescription: (value: string) => string;
  backToPassword: string;
  emailPlaceholder: string;
}> = {
  ru: {
    sendCodeButton: "Войти по коду",
    confirmTitle: (value) => `Отправить код на ${value}?`,
    confirmBody: "Если аккаунт существует, код будет отправлен. Проверьте, что указали правильный номер/email.",
    changeValue: "Изменить",
    sendCode: "Отправить код",
    otpDescription: (value) => `Если аккаунт с ${value} существует — код отправлен`,
    backToPassword: "Войти по паролю",
    emailPlaceholder: "Email",
  },
  kz: {
    sendCodeButton: "Код арқылы кіру",
    confirmTitle: (value) => `${value} мекенжайына код жіберілсін бе?`,
    confirmBody: "Аккаунт бар болса, код жіберіледі. Нөмір/email дұрыс екенін тексеріңіз.",
    changeValue: "Өзгерту",
    sendCode: "Код жіберу",
    otpDescription: (value) => `${value} мекенжайымен аккаунт бар болса — код жіберілді`,
    backToPassword: "Құпия сөзбен кіру",
    emailPlaceholder: "Email",
  },
  en: {
    sendCodeButton: "Log in with a code",
    confirmTitle: (value) => `Send a code to ${value}?`,
    confirmBody: "If an account exists, a code will be sent. Double-check the number/email is correct.",
    changeValue: "Change",
    sendCode: "Send code",
    otpDescription: (value) => `If an account exists for ${value}, a code was sent`,
    backToPassword: "Log in with password",
    emailPlaceholder: "Email",
  },
  uz: {
    sendCodeButton: "Kod orqali kirish",
    confirmTitle: (value) => `${value} manzilga kod yuborilsinmi?`,
    confirmBody: "Agar hisob mavjud bo'lsa, kod yuboriladi. Raqam/email to'g'riligini tekshiring.",
    changeValue: "O'zgartirish",
    sendCode: "Kod yuborish",
    otpDescription: (value) => `Agar ${value} uchun hisob mavjud bo'lsa — kod yuborildi`,
    backToPassword: "Parol orqali kirish",
    emailPlaceholder: "Email",
  },
};

const LOGIN_CODE_EXPIRATION_SECONDS = 10 * 60;
const LOGIN_CODE_RESEND_COOLDOWN_SECONDS = 60;

interface LoginOtpFormProps {
  translations: any;
  loginMethod: "phone" | "email";
  onSuccess: (accessToken: string, refreshToken: string, user: any) => void;
  onBackToPassword: () => void;
  language?: string;
}

export default function LoginOtpForm({ translations, loginMethod, onSuccess, onBackToPassword, language = "en" }: LoginOtpFormProps) {
  const labels = LABELS[language] ?? LABELS.en;

  const [step, setStep] = useState<"identifier" | "confirm" | "code">("identifier");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identifierError, setIdentifierError] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  // Only rendered on the "confirm" step (see TurnstileWidget's own note on
  // never showing it on the code-entry step) — a resend triggered from the
  // "code" step's OtpCodeInput reuses whatever token is still held here,
  // which is fine while Turnstile is unconfigured (today) but will need its
  // own fresh-token flow once it's actually turned on for this form.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const value = loginMethod === "phone" ? phone : email;

  const buildPayload = useCallback(() => (
    loginMethod === "phone" ? { phone, turnstile_token: turnstileToken } : { email: email.trim(), turnstile_token: turnstileToken }
  ), [loginMethod, phone, email, turnstileToken]);

  const handleContinueFromIdentifier = () => {
    if (loginMethod === "phone") {
      if (!phone || phone.replace(/\D/g, "").length < 10) {
        setIdentifierError(translations.phoneRequired);
        return;
      }
    } else if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setIdentifierError(translations.emailRequired || translations.invalidEmail);
      return;
    }
    setIdentifierError(undefined);
    setStep("confirm");
  };

  const handleSendCode = useCallback(async (): Promise<boolean> => {
    setSending(true);
    try {
      await api.post("/auth/send-login-code/", buildPayload());
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || translations.failedToSend || "Не удалось отправить код");
      return false;
    } finally {
      setSending(false);
      setTurnstileToken(null);
      setTurnstileKey(k => k + 1);
    }
  }, [buildPayload, translations]);

  const handleConfirmSend = async () => {
    const ok = await handleSendCode();
    if (ok) {
      setOtpError(null);
      setStep("code");
    }
  };

  const handleVerifyCode = useCallback(async (code: string) => {
    setVerifying(true);
    setOtpError(null);
    try {
      const res = await api.post("/auth/verify-login-code/", { ...buildPayload(), code });
      onSuccess(res.data.access_token, res.data.refresh_token, res.data.user ?? null);
    } catch (err: any) {
      setOtpError(err?.response?.data?.error || translations.incorrectCode || "Неверный код. Попробуйте снова.");
    } finally {
      setVerifying(false);
    }
  }, [buildPayload, onSuccess, translations]);

  if (step === "identifier") {
    return (
      <div className="space-y-4">
        {loginMethod === "phone" ? (
          <PhoneInput
            name="phone"
            value={phone}
            onChange={(e164) => { setPhone(e164); if (identifierError) setIdentifierError(undefined); }}
            error={identifierError}
            disabled={sending}
            defaultCountry="KZ"
          />
        ) : (
          <AuthInput
            name="email"
            placeholder={labels.emailPlaceholder}
            icon={Mail}
            value={email}
            autoComplete="email"
            onChange={(e) => { setEmail(e.target.value); if (identifierError) setIdentifierError(undefined); }}
            validationError={identifierError}
            loading={sending}
          />
        )}

        <motion.button
          type="button"
          onClick={handleContinueFromIdentifier}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full px-6 py-4 bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:from-[#3267e6] hover:to-[#214499] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#3772ff]/30 flex items-center justify-center gap-2.5"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{labels.sendCode}</span>
        </motion.button>

        <button
          type="button"
          onClick={onBackToPassword}
          className="w-full text-center text-sm text-gray-500 hover:text-[#3772ff] transition-colors"
        >
          {labels.backToPassword}
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#e8e8e8] bg-[#f8faff] p-4 space-y-2">
          <p className="font-semibold text-gray-800">{labels.confirmTitle(value)}</p>
          <p className="text-sm text-gray-500">{labels.confirmBody}</p>
        </div>

        <TurnstileWidget key={turnstileKey} onToken={setTurnstileToken} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("identifier")}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            {labels.changeValue}
          </button>
          <motion.button
            type="button"
            onClick={handleConfirmSend}
            disabled={sending}
            whileHover={{ scale: sending ? 1 : 1.02 }}
            whileTap={{ scale: sending ? 1 : 0.98 }}
            className="flex-1 relative px-4 py-3 bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:from-[#3267e6] hover:to-[#214499] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-[#3772ff]/30 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : labels.sendCode}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => { setStep("confirm"); setOtpError(null); }}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3772ff] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {labels.changeValue}
      </button>
      <OtpCodeInput
        expirationSeconds={LOGIN_CODE_EXPIRATION_SECONDS}
        resendCooldownSeconds={LOGIN_CODE_RESEND_COOLDOWN_SECONDS}
        onComplete={handleVerifyCode}
        onResend={handleSendCode}
        error={otpError}
        disabled={verifying}
        description={labels.otpDescription(value)}
        expiresInLabel={translations.codeExpiresIn}
        expiredLabel={translations.codeExpired}
        resendLabel={translations.sendAgain}
      />
      <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500">
        <Shield className="w-4 h-4 text-green-600" />
        <span>{translations.secureConnection}</span>
      </div>
    </div>
  );
}
