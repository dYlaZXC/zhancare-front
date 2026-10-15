"use client";

import { useState, useCallback, FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Phone, User, Lock, Loader2, Shield, CheckCircle, ArrowLeft, Mail } from "lucide-react";
import { api } from "@/utils/api";
import AuthInput from "./AuthInput";
import PhoneInput from "@/components/ui/PhoneInput";
import PdfViewerModal from "../PdfViewerModal";
import OtpCodeInput from "./OtpCodeInput";
import TurnstileWidget from "../TurnstileWidget";

// Регистрация требует подтверждённого телефона (см.
// common/views/auth.py::register — отклоняет без него с 400) — эти тайминги
// зеркалят _PHONE_CODE_EXPIRATION_MINUTES/_PHONE_CODE_RESEND_COOLDOWN_SECONDS
// на бэкенде.
const PHONE_CODE_EXPIRATION_SECONDS = 10 * 60;
const PHONE_CODE_RESEND_COOLDOWN_SECONDS = 60;
// EmailVerificationCode tuning (Part B, optional email step) — mirrors the above.
const EMAIL_CODE_EXPIRATION_SECONDS = 10 * 60;
const EMAIL_CODE_RESEND_COOLDOWN_SECONDS = 60;

// Новые строки шагов phone/otp — translations (ru/kz/en/uz JSON) ещё не
// содержат под них ключи (см. план: полноценная локализация — отдельная,
// не блокирующая задача), но language уже передаётся в эту форму как prop
// — простая локальная карта вместо смешивания русского текста с остальной
// (уже переведённой через translations) формой на английском/казахском.
const WIZARD_LABELS: Record<string, {
  sendCodeButton: string; otpDescription: (phone: string) => string;
  changeNumber: string; phoneConfirmed: (phone: string) => string; change: string;
  phoneExists: string;
  emailSectionTitle: string; emailPlaceholder: string; emailConfirmButton: string;
  emailSkipButton: string; emailOtpDescription: (email: string) => string;
  emailConfirmed: (email: string) => string; emailSkipped: string; addEmail: string;
  emailExists: string; emailMustConfirmOrSkip: string; emailInvalid: string;
}> = {
  ru: {
    sendCodeButton: "Отправить код в WhatsApp",
    otpDescription: (phone) => `Код отправлен на ${phone} — введите 6 цифр из WhatsApp`,
    changeNumber: "Изменить номер",
    phoneConfirmed: (phone) => `Телефон подтверждён: ${phone}`,
    change: "Изменить",
    phoneExists: "Пользователь с таким телефоном уже существует",
    emailSectionTitle: "Email (необязательно)",
    emailPlaceholder: "Email",
    emailConfirmButton: "Подтвердить",
    emailSkipButton: "Указать позже",
    emailOtpDescription: (email) => `Код отправлен на ${email}`,
    emailConfirmed: (email) => `Email подтверждён: ${email}`,
    emailSkipped: "Email можно добавить позже из профиля",
    addEmail: "Добавить email",
    emailExists: "Пользователь с таким email уже существует",
    emailMustConfirmOrSkip: "Подтвердите email или нажмите «Указать позже»",
    emailInvalid: "Введите корректный email",
  },
  kz: {
    sendCodeButton: "WhatsApp-қа код жіберу",
    otpDescription: (phone) => `Код ${phone} нөміріне жіберілді — WhatsApp-тан 6 санды енгізіңіз`,
    changeNumber: "Нөмірді өзгерту",
    phoneConfirmed: (phone) => `Телефон расталды: ${phone}`,
    change: "Өзгерту",
    phoneExists: "Осы телефонмен қолданушы бұрын тіркелген",
    emailSectionTitle: "Email (міндетті емес)",
    emailPlaceholder: "Email",
    emailConfirmButton: "Растау",
    emailSkipButton: "Кейінірек көрсету",
    emailOtpDescription: (email) => `Код ${email} мекенжайына жіберілді`,
    emailConfirmed: (email) => `Email расталды: ${email}`,
    emailSkipped: "Email-ды кейін профильден қосуға болады",
    addEmail: "Email қосу",
    emailExists: "Осы email-мен қолданушы бұрын тіркелген",
    emailMustConfirmOrSkip: "Email-ды растаңыз немесе «Кейінірек көрсету» басыңыз",
    emailInvalid: "Жарамды email енгізіңіз",
  },
  en: {
    sendCodeButton: "Send code via WhatsApp",
    otpDescription: (phone) => `Code sent to ${phone} — enter the 6 digits from WhatsApp`,
    changeNumber: "Change number",
    phoneConfirmed: (phone) => `Phone confirmed: ${phone}`,
    change: "Change",
    phoneExists: "User with this phone number already exists",
    emailSectionTitle: "Email (optional)",
    emailPlaceholder: "Email",
    emailConfirmButton: "Confirm",
    emailSkipButton: "Add later",
    emailOtpDescription: (email) => `Code sent to ${email}`,
    emailConfirmed: (email) => `Email confirmed: ${email}`,
    emailSkipped: "You can add an email later from your profile",
    addEmail: "Add email",
    emailExists: "User with this email already exists",
    emailMustConfirmOrSkip: "Confirm the email or click \"Add later\"",
    emailInvalid: "Enter a valid email",
  },
  uz: {
    sendCodeButton: "WhatsApp orqali kod yuborish",
    otpDescription: (phone) => `Kod ${phone} raqamiga yuborildi — WhatsApp'dan 6 ta raqamni kiriting`,
    changeNumber: "Raqamni o'zgartirish",
    phoneConfirmed: (phone) => `Telefon tasdiqlandi: ${phone}`,
    change: "O'zgartirish",
    phoneExists: "Bu telefon raqami bilan foydalanuvchi allaqachon mavjud",
    emailSectionTitle: "Email (ixtiyoriy)",
    emailPlaceholder: "Email",
    emailConfirmButton: "Tasdiqlash",
    emailSkipButton: "Keyinroq qo'shish",
    emailOtpDescription: (email) => `Kod ${email} manziliga yuborildi`,
    emailConfirmed: (email) => `Email tasdiqlandi: ${email}`,
    emailSkipped: "Email-ni keyin profildan qo'shishingiz mumkin",
    addEmail: "Email qo'shish",
    emailExists: "Bu email bilan foydalanuvchi allaqachon mavjud",
    emailMustConfirmOrSkip: "Email-ni tasdiqlang yoki \"Keyinroq qo'shish\"ni bosing",
    emailInvalid: "To'g'ri email kiriting",
  },
};

interface RegisterFormProps {
  translations: any;
  onSubmit: (data: RegisterFormData) => Promise<void>;
  loading: boolean;
  language?: string;
}

export interface RegisterFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
  consentPersonalData: boolean;
  consentInformAgreement: boolean;
  consentOffer: boolean;
}

const RegisterForm = ({ translations, onSubmit, loading, language = "en" }: RegisterFormProps) => {
  const wizardLabels = WIZARD_LABELS[language] ?? WIZARD_LABELS.en;
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    consentPersonalData: false,
    consentInformAgreement: false,
    consentOffer: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterFormData>>({});

  // Регистрация блокируется бэкендом без подтверждённого телефона (см.
  // common/views/auth.py::register) — визард из 3 шагов: phone → otp →
  // details (имя/пароль/согласия, как раньше). Телефон проверяется первым
  // и отдельно от остальной формы — send-phone-code 409-ит сразу, если
  // телефон уже зарегистрирован, нет смысла сначала заполнять всю форму.
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  // Turnstile tokens — one per identifier-entry screen (phone/email are two
  // separate send-code flows). `key` forces TurnstileWidget to remount after
  // every attempt, since a Cloudflare token is single-use.
  const [phoneTurnstileToken, setPhoneTurnstileToken] = useState<string | null>(null);
  const [phoneTurnstileKey, setPhoneTurnstileKey] = useState(0);
  const [emailTurnstileToken, setEmailTurnstileToken] = useState<string | null>(null);
  const [emailTurnstileKey, setEmailTurnstileKey] = useState(0);

  // Part B — optional email verification, inline within the "details" step.
  // "unset": nothing entered yet. "otp": code sent, showing OtpCodeInput.
  // "verified"/"skipped": the two explicit terminal states register()'s
  // email gate (and the plan's "never silently trust an unconfirmed email")
  // require before submit is allowed to proceed with/without an email.
  const [emailStatus, setEmailStatus] = useState<"unset" | "otp" | "verified" | "skipped">("unset");
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);

  // PDF Modal state
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: "",
    title: "",
  });

  // Helper function to get PDF path based on language
  const getPdfPath = (docType: string) => {
    const langSuffix = language === "ru" ? "rus" : language === "kz" ? "kaz" : "eng";
    return `/docs/${docType}_${langSuffix}.pdf`;
  };

  // Helper function to open PDF modal
  const openPdfModal = (docType: string, title: string) => {
    setPdfModal({
      isOpen: true,
      url: getPdfPath(docType),
      title,
    });
  };

  // Helper function to close PDF modal
  const closePdfModal = () => {
    setPdfModal({
      isOpen: false,
      url: "",
      title: "",
    });
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = useCallback((): boolean => {
    const errors: Partial<RegisterFormData> = {};

    if (!formData.first_name.trim()) {
      errors.first_name = translations.firstNameRequired;
    }

    if (!formData.last_name.trim()) {
      errors.last_name = translations.lastNameRequired;
    }

    if (!formData.phone || formData.phone.replace(/\D/g, "").length < 10) {
      errors.phone = translations.phoneRequired;
    }

    if (!formData.password || !validatePassword(formData.password)) {
      errors.password = translations.passwordTooShort;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = translations.passwordsMismatch;
    }

    if (!formData.consentPersonalData) {
      errors.consentPersonalData = translations.consentRequired as any;
    }

    if (!formData.consentInformAgreement) {
      errors.consentInformAgreement = translations.consentRequired as any;
    }

    if (!formData.consentOffer) {
      errors.consentOffer = translations.consentRequired as any;
    }

    setValidationErrors(errors);

    // Email is optional, but once something's typed it must be explicitly
    // confirmed or explicitly skipped — never silently submitted unverified.
    const emailEntered = !!(formData.email || "").trim();
    const emailOk = !emailEntered || emailStatus === "verified" || emailStatus === "skipped";
    if (!emailOk) setEmailError(wizardLabels.emailMustConfirmOrSkip);

    return Object.keys(errors).length === 0 && emailOk;
  }, [formData, translations, emailStatus, wizardLabels]);

  const handleSendPhoneCode = useCallback(async () => {
    const digits = formData.phone.replace(/\D/g, "");
    if (!formData.phone || digits.length < 10) {
      setValidationErrors(prev => ({ ...prev, phone: translations.phoneRequired }));
      return;
    }
    setSendingCode(true);
    try {
      await api.post("/auth/send-phone-code/", { phone: formData.phone, turnstile_token: phoneTurnstileToken });
      setValidationErrors(prev => ({ ...prev, phone: undefined }));
      setOtpError(null);
      setStep("otp");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        (status === 409 ? wizardLabels.phoneExists : translations.failedToSend) ||
        "Не удалось отправить код";
      setValidationErrors(prev => ({ ...prev, phone: msg }));
    } finally {
      setSendingCode(false);
      setPhoneTurnstileToken(null);
      setPhoneTurnstileKey(k => k + 1);
    }
  }, [formData.phone, translations, wizardLabels, phoneTurnstileToken]);

  const handleVerifyPhoneCode = useCallback(async (code: string) => {
    setVerifyingCode(true);
    setOtpError(null);
    try {
      await api.post("/auth/verify-phone-code/", { phone: formData.phone, code });
      setStep("details");
    } catch (err: any) {
      setOtpError(err?.response?.data?.error || translations.incorrectCode || "Неверный код. Попробуйте снова.");
    } finally {
      setVerifyingCode(false);
    }
  }, [formData.phone, translations]);

  const handleResendPhoneCode = useCallback(async (): Promise<boolean> => {
    try {
      await api.post("/auth/send-phone-code/", { phone: formData.phone });
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || translations.failedToSend || "Не удалось отправить код");
      return false;
    }
  }, [formData.phone, translations]);

  const handleSendEmailCode = useCallback(async () => {
    const email = (formData.email || "").trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(wizardLabels.emailInvalid);
      return;
    }
    setSendingEmailCode(true);
    try {
      await api.post("/auth/send-email-code/", { email, turnstile_token: emailTurnstileToken });
      setEmailError(undefined);
      setEmailOtpError(null);
      setEmailStatus("otp");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        (status === 409 ? wizardLabels.emailExists : translations.failedToSend) ||
        "Не удалось отправить код";
      setEmailError(msg);
    } finally {
      setSendingEmailCode(false);
      setEmailTurnstileToken(null);
      setEmailTurnstileKey(k => k + 1);
    }
  }, [formData.email, translations, wizardLabels, emailTurnstileToken]);

  const handleVerifyEmailCode = useCallback(async (code: string) => {
    setVerifyingEmailCode(true);
    setEmailOtpError(null);
    try {
      await api.post("/auth/verify-email-code/", { email: formData.email, code });
      setEmailStatus("verified");
    } catch (err: any) {
      setEmailOtpError(err?.response?.data?.error || translations.incorrectCode || "Неверный код. Попробуйте снова.");
    } finally {
      setVerifyingEmailCode(false);
    }
  }, [formData.email, translations]);

  const handleResendEmailCode = useCallback(async (): Promise<boolean> => {
    try {
      await api.post("/auth/send-email-code/", { email: formData.email });
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || translations.failedToSend || "Не удалось отправить код");
      return false;
    }
  }, [formData.email, translations]);

  const handleSkipEmail = useCallback(() => {
    setEmailStatus("skipped");
    setEmailError(undefined);
  }, []);

  const handleChangeEmail = useCallback(() => {
    setEmailStatus("unset");
    setEmailOtpError(null);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (validationErrors[name as keyof RegisterFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [validationErrors]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));

    // Clear error when user checks the checkbox
    if (validationErrors[name as keyof RegisterFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [validationErrors]);

  const handleEmailInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, email: e.target.value }));
    if (emailError) setEmailError(undefined);
  }, [emailError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Only a CONFIRMED email is ever sent — "skipped"/"unset" means the
    // field is omitted from this request entirely (see register()'s email
    // gate: an email present but unverified gets a 400, by design).
    await onSubmit({ ...formData, email: emailStatus === "verified" ? formData.email : undefined });
  };

  if (step === "phone") {
    return (
      <div className="space-y-4">
        <PhoneInput
          name="phone"
          value={formData.phone}
          onChange={(e164) => {
            setFormData(prev => ({ ...prev, phone: e164 }));
            if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: undefined }));
          }}
          error={validationErrors.phone as string | undefined}
          disabled={sendingCode}
          defaultCountry="KZ"
        />
        <TurnstileWidget key={phoneTurnstileKey} onToken={setPhoneTurnstileToken} />
        <motion.button
          type="button"
          onClick={handleSendPhoneCode}
          disabled={sendingCode}
          whileHover={{ scale: sendingCode ? 1 : 1.02 }}
          whileTap={{ scale: sendingCode ? 1 : 0.98 }}
          className="relative w-full px-6 py-4 bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:from-[#3267e6] hover:to-[#214499] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3772ff]/30 hover:shadow-xl hover:shadow-[#3772ff]/40 flex items-center justify-center gap-2.5"
        >
          {sendingCode ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{translations.sending || "Отправка..."}</span>
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              <span>{wizardLabels.sendCodeButton}</span>
            </>
          )}
        </motion.button>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => { setStep("phone"); setOtpError(null); }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3772ff] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {wizardLabels.changeNumber}
        </button>
        <OtpCodeInput
          expirationSeconds={PHONE_CODE_EXPIRATION_SECONDS}
          resendCooldownSeconds={PHONE_CODE_RESEND_COOLDOWN_SECONDS}
          onComplete={handleVerifyPhoneCode}
          onResend={handleResendPhoneCode}
          error={otpError}
          disabled={verifyingCode}
          description={wizardLabels.otpDescription(formData.phone)}
          expiresInLabel={translations.codeExpiresIn}
          expiredLabel={translations.codeExpired}
          resendLabel={translations.sendAgain}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Verified phone indicator */}
      <div className="flex items-center justify-between gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {wizardLabels.phoneConfirmed(formData.phone)}
        </span>
        <button
          type="button"
          onClick={() => setStep("phone")}
          className="text-emerald-600 hover:text-emerald-800 underline text-xs flex-shrink-0"
        >
          {wizardLabels.change}
        </button>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <AuthInput
          name="first_name"
          placeholder={translations.firstName}
          icon={User}
          value={formData.first_name}
          autoComplete="given-name"
          onChange={handleChange}
          validationError={validationErrors.first_name}
          loading={loading}
        />
        <AuthInput
          name="last_name"
          placeholder={translations.lastName}
          icon={User}
          value={formData.last_name}
          autoComplete="family-name"
          onChange={handleChange}
          validationError={validationErrors.last_name}
          loading={loading}
        />
      </div>

      {/* Optional email verification (Part B) */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600">{wizardLabels.emailSectionTitle}</p>

        {emailStatus === "verified" ? (
          <div className="flex items-center justify-between gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {wizardLabels.emailConfirmed(formData.email || "")}
            </span>
            <button type="button" onClick={handleChangeEmail} className="text-emerald-600 hover:text-emerald-800 underline text-xs flex-shrink-0">
              {wizardLabels.change}
            </button>
          </div>
        ) : emailStatus === "skipped" ? (
          <div className="flex items-center justify-between gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <span>{wizardLabels.emailSkipped}</span>
            <button type="button" onClick={handleChangeEmail} className="text-[#3772ff] hover:text-[#2956bf] underline text-xs flex-shrink-0">
              {wizardLabels.addEmail}
            </button>
          </div>
        ) : emailStatus === "otp" ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleChangeEmail}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3772ff] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {wizardLabels.change}
            </button>
            <OtpCodeInput
              expirationSeconds={EMAIL_CODE_EXPIRATION_SECONDS}
              resendCooldownSeconds={EMAIL_CODE_RESEND_COOLDOWN_SECONDS}
              onComplete={handleVerifyEmailCode}
              onResend={handleResendEmailCode}
              error={emailOtpError}
              disabled={verifyingEmailCode}
              description={wizardLabels.emailOtpDescription(formData.email || "")}
              expiresInLabel={translations.codeExpiresIn}
              expiredLabel={translations.codeExpired}
              resendLabel={translations.sendAgain}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <AuthInput
              name="email"
              placeholder={wizardLabels.emailPlaceholder}
              icon={Mail}
              value={formData.email || ""}
              autoComplete="email"
              onChange={handleEmailInputChange}
              validationError={emailError}
              loading={sendingEmailCode}
            />
            <TurnstileWidget key={emailTurnstileKey} onToken={setEmailTurnstileToken} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={sendingEmailCode || !(formData.email || "").trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#3772ff]/10 text-[#3772ff] text-sm font-semibold hover:bg-[#3772ff]/15 transition-colors disabled:opacity-50"
              >
                {sendingEmailCode ? <Loader2 className="w-4 h-4 animate-spin" /> : wizardLabels.emailConfirmButton}
              </button>
              <button
                type="button"
                onClick={handleSkipEmail}
                disabled={sendingEmailCode}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {wizardLabels.emailSkipButton}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Password */}
      <AuthInput
        name="password"
        placeholder={translations.password}
        icon={Lock}
        value={formData.password}
        autoComplete="new-password"
        showPasswordToggle
        onChange={handleChange}
        validationError={validationErrors.password}
        loading={loading}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(prev => !prev)}
      />

      {/* Confirm Password */}
      <AuthInput
        name="confirmPassword"
        placeholder={translations.confirmPassword}
        icon={Lock}
        value={formData.confirmPassword}
        autoComplete="new-password"
        showPasswordToggle
        onChange={handleChange}
        validationError={validationErrors.confirmPassword}
        loading={loading}
        showPassword={showConfirmPassword}
        onTogglePassword={() => setShowConfirmPassword(prev => !prev)}
      />

      {/* Consent Checkboxes */}
      <div className="space-y-3 mt-2">
        {/* Personal Data Consent */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consentPersonalData"
            name="consentPersonalData"
            checked={formData.consentPersonalData}
            onChange={handleCheckboxChange}
            disabled={loading}
            className="mt-1 w-4 h-4 text-[#3772ff] bg-white/5 border-gray-300 rounded focus:ring-[#3772ff] focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="consentPersonalData" className="text-sm text-black leading-tight cursor-pointer">
            {translations.consentPersonalData}{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openPdfModal("consent_to_the_collection_of_personal_data", translations.consentPersonalDataLink);
              }}
              className="text-[#3772ff] hover:text-[#3267e6] underline focus:outline-none"
            >
              {translations.consentPersonalDataLink}
            </button>
          </label>
        </div>
        {validationErrors.consentPersonalData && (
          <p className="text-red-500 text-xs ml-6">{validationErrors.consentPersonalData}</p>
        )}

        {/* Informed Agreement Consent */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consentInformAgreement"
            name="consentInformAgreement"
            checked={formData.consentInformAgreement}
            onChange={handleCheckboxChange}
            disabled={loading}
            className="mt-1 w-4 h-4 text-[#3772ff] bg-white/5 border-gray-300 rounded focus:ring-[#3772ff] focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="consentInformAgreement" className="text-sm text-black leading-tight cursor-pointer">
            {translations.consentInformAgreement}{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openPdfModal("inform_aggrement", translations.consentInformAgreementLink);
              }}
              className="text-[#3772ff] hover:text-[#3267e6] underline focus:outline-none"
            >
              {translations.consentInformAgreementLink}
            </button>
          </label>
        </div>
        {validationErrors.consentInformAgreement && (
          <p className="text-red-500 text-xs ml-6">{validationErrors.consentInformAgreement}</p>
        )}

        {/* Offer Consent */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consentOffer"
            name="consentOffer"
            checked={formData.consentOffer}
            onChange={handleCheckboxChange}
            disabled={loading}
            className="mt-1 w-4 h-4 text-[#3772ff] bg-white/5 border-gray-300 rounded focus:ring-[#3772ff] focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="consentOffer" className="text-sm text-black leading-tight cursor-pointer">
            {translations.consentOffer}{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openPdfModal("offer", translations.consentOfferLink);
              }}
              className="text-[#3772ff] hover:text-[#3267e6] underline focus:outline-none"
            >
              {translations.consentOfferLink}
            </button>
          </label>
        </div>
        {validationErrors.consentOffer && (
          <p className="text-red-500 text-xs ml-6">{validationErrors.consentOffer}</p>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="relative w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:from-[#3267e6] hover:to-[#214499] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3772ff]/30 hover:shadow-xl hover:shadow-[#3772ff]/40 flex items-center justify-center gap-2.5 group overflow-hidden"
      >
        <span className="relative z-10 text-base sm:text-lg flex items-center gap-2.5">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{translations.loading}</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {translations.registerButton}
            </>
          )}
        </span>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </motion.button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
        <Shield className="w-4 h-4 text-green-600" />
        <span>{translations.secureConnection}</span>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={closePdfModal}
        pdfUrl={pdfModal.url}
        title={pdfModal.title}
      />
    </form>
  );
};

export default RegisterForm;
