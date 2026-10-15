"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import uz from "@/locales/uz.json";
import { api } from "@/utils/api";
import { useClinicCurrency } from "@/context/BrandContext";

import AuthTabs from "@/components/auth/AuthTabs";
import LoginForm, { LoginFormData } from "@/components/auth/forms/LoginForm";
import RegisterForm, { RegisterFormData } from "@/components/auth/forms/RegisterForm";
import ForgotPasswordForm from "@/components/auth/forms/ForgotPasswordForm";
import PhoneLoginForm from "@/components/auth/forms/PhoneLoginForm";
import LoginOtpForm from "@/components/auth/forms/LoginOtpForm";

// Not in the shared ru/kz/en/uz locale JSON yet — same stopgap pattern as
// RegisterForm.tsx's WIZARD_LABELS/LoginOtpForm's own LABELS.
const LOGIN_OTP_LINK_LABEL: Record<string, string> = {
  ru: "Войти по коду",
  kz: "Код арқылы кіру",
  en: "Log in with a code",
  uz: "Kod orqali kirish",
};

const AuthPopup = () => {
  const { isAuthOpen, setIsAuthOpen, loginUser, authDefaultTab, authNoRedirect } = useAuth();
  const { appLogo, brand } = useClinicCurrency();
  const { language } = useLanguage();

  // Get translations based on language
  const translations = useMemo(() => {
    switch (language) {
      case "ru": return ru.auth;
      case "kz": return kz.auth;
      case "en": return en.auth;
      case "uz": return uz.auth;
      default: return en.auth;
    }
  }, [language]);

  // Get error message translations
  const errorMessages = useMemo(() => {
    const messages = {
      ru: {
        loginSuccess: "Вы успешно вошли в систему",
        registerSuccess: "Регистрация прошла успешно",
        generalError: "Произошла ошибка. Попробуйте снова",
        invalidCredentials: "Неправильный E-mail или пароль",
        accountDeactivated: "Извините, ваш аккаунт был деактивирован. Обратитесь к администратору.",
        phoneExists: "Пользователь с таким телефоном уже существует",
        emailExists: "Пользователь с таким email уже существует",
      },
      kz: {
        loginSuccess: "Сіз сәтті кірдіңіз",
        registerSuccess: "Тіркелу сәтті өтті",
        generalError: "Қате орын алды. Қайталап көріңіз",
        invalidCredentials: "Қате E-mail немесе құпия сөз",
        accountDeactivated: "Кешіріңіз, сіздің аккаунтыңыз деактивтендірілді. Әкімшіге хабарласыңыз.",
        phoneExists: "Осы телефонмен қолданушы бұрын тіркелген",
        emailExists: "Осы email-мен қолданушы бұрын тіркелген",
      },
      en: {
        loginSuccess: "Successfully logged in",
        registerSuccess: "Registration completed successfully",
        generalError: "An error occurred. Please try again",
        invalidCredentials: "Invalid email or password",
        accountDeactivated: "Sorry, your account has been deactivated. Please contact an administrator.",
        phoneExists: "User with this phone number already exists",
        emailExists: "User with this email already exists",
      }
    };
    return messages[language as keyof typeof messages] || messages.en;
  }, [language]);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  useEffect(() => { if (isAuthOpen) setActiveTab(authDefaultTab); }, [isAuthOpen, authDefaultTab]);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("phone");
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordMethod, setForgotPasswordMethod] = useState<"email" | "phone">("email");
  const [loading, setLoading] = useState(false);

  // Track mousedown position to detect real clicks vs text selection
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthOpen) {
        setIsAuthOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isAuthOpen, setIsAuthOpen]);

  // Get device name for session tracking
  const getDeviceName = (): string => {
    if (typeof window === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const browser = ua.includes('Chrome') ? 'Chrome' :
                   ua.includes('Firefox') ? 'Firefox' :
                   ua.includes('Safari') ? 'Safari' :
                   ua.includes('Edge') ? 'Edge' : 'Browser';
    const os = ua.includes('Windows') ? 'Windows' :
              ua.includes('Mac') ? 'MacOS' :
              ua.includes('Linux') ? 'Linux' :
              ua.includes('Android') ? 'Android' :
              ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' : 'Unknown';
    return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
  };

  // Handle Login
  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);

    const payload = {
      email: data.email.trim(),
      password: data.password,
      device_name: getDeviceName(),
    };

    try {
      const response = await api.post("/auth/login/", payload);
      const responseData = response.data;

      await loginUser(responseData.access_token, responseData.refresh_token, responseData.user);
      toast.success(errorMessages.loginSuccess);

      // Admin Telegram notification now sent server-side (common/views/auth.py
      // login()/_login_success_response) — it used to be sent from here with
      // a hardcoded bot token embedded in client-side code.

      setIsAuthOpen(false);

      // If must change password — modal handles redirect after change
      if (responseData.user.must_change_password) return;

      // If opened from a context (e.g. booking modal) — don't redirect, stay on page
      if (!authNoRedirect) {
        const userRoles: string[] = responseData.user.roles ?? [];
        let redirectUrl = "/patient/video";
        if (userRoles.includes("doctor")) redirectUrl = "/doctor/consultations";
        else if (userRoles.includes("nurse")) redirectUrl = "/nurse/home-visits";
        else if (userRoles.includes("admin")) redirectUrl = "/admin/profile";

        setTimeout(() => { window.location.href = redirectUrl; }, 500);
      }
    } catch (err: any) {
      const errorData = err?.response?.data;
      let errorMessage = errorMessages.generalError;

      if (err?.response?.status === 403) {
        errorMessage = errorMessages.accountDeactivated;
      } else if (err?.response?.status === 401) {
        errorMessage = errorMessages.invalidCredentials;
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLoginSuccess = async (accessToken: string, refreshToken: string, user: any) => {
    const safeUser = user ?? { roles: [], first_name: "", last_name: "", email: "" };
    await loginUser(accessToken, refreshToken, safeUser);
    toast.success(errorMessages.loginSuccess);
    setIsAuthOpen(false);
    // If must change password — modal handles redirect after change
    if (safeUser.must_change_password) return;
    if (!authNoRedirect) {
      const userRoles: string[] = safeUser.roles ?? [];
      let redirectUrl = "/patient/video";
      if (userRoles.includes("doctor")) redirectUrl = "/doctor/consultations";
      else if (userRoles.includes("nurse")) redirectUrl = "/nurse/home-visits";
      else if (userRoles.includes("admin")) redirectUrl = "/admin/profile";
      setTimeout(() => { window.location.href = redirectUrl; }, 300);
    }
  };

  // Handle Register
  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true);

    // Strip phone number formatting: +7 (775) 814 81 90 -> +77758148190
    const cleanPhone = data.phone ? data.phone.replace(/[^\d+]/g, '') : null;

    const payload: Record<string, any> = {
      phone: cleanPhone,
      password: data.password,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
    };
    // Only ever sent when RegisterForm's own email step actually verified it
    // (see its handleSubmit) — omitted entirely otherwise, never sent unverified.
    if (data.email) payload.email = data.email.trim();

    try {
      await api.post("/auth/register/", payload);
      toast.success(errorMessages.registerSuccess);

      // Admin Telegram notification now sent server-side (common/views/auth.py
      // register()) — see the note in handleLogin above.

      // Auto-login with the just-registered credentials
      try {
        const loginRes = await api.post("/auth/login/", {
          phone: cleanPhone,
          password: data.password,
          device_name: getDeviceName(),
        });
        const ld = loginRes.data;
        await loginUser(ld.access_token, ld.refresh_token, ld.user);
        setIsAuthOpen(false);
        if (!authNoRedirect) {
          const userRoles: string[] = ld.user.roles ?? [];
          let redirectUrl = "/patient/video";
          if (userRoles.includes("doctor")) redirectUrl = "/doctor/consultations";
          else if (userRoles.includes("nurse")) redirectUrl = "/nurse/home-visits";
          else if (userRoles.includes("admin")) redirectUrl = "/admin/profile";
          setTimeout(() => { window.location.href = redirectUrl; }, 500);
        }
      } catch {
        // Auto-login failed — fall back to login tab so user can sign in manually
        setActiveTab("login");
      }
    } catch (err: any) {
      const errorData = err?.response?.data;
      let errorMessage = errorMessages.generalError;

      if (errorData) {
        const details = errorData?.details ?? errorData;
        const fieldErrors: string[] = [];

        if (details && typeof details === "object") {
          for (const field in details) {
            const messages = details[field];
            if (Array.isArray(messages)) {
              messages.forEach((msg: string) => {
                if (field === "phone" && msg.includes("существует")) {
                  fieldErrors.push(errorMessages.phoneExists);
                } else if (field === "email" && msg.includes("существует")) {
                  fieldErrors.push(errorMessages.emailExists);
                } else {
                  fieldErrors.push(msg);
                }
              });
            }
          }
        }

        if (errorData?.detail) fieldErrors.push(errorData.detail);
        // register()'s own error responses are plain {"error": "..."} (e.g.
        // the phone-verification gate, or the 409 duplicate check) — with
        // no `detail`/`details` key, `details` above just becomes errorData
        // itself, and the loop above sees field="error" with a STRING value
        // (not an array), which fails the Array.isArray check and silently
        // drops it. Without this, the real backend message never reached
        // the user — they only ever saw the generic fallback below.
        if (errorData?.error) fieldErrors.push(errorData.error);
        if (fieldErrors.length > 0) errorMessage = fieldErrors.join(". ");
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthOpen) return null;

  // Handle overlay click - only close if it's a real click, not text selection
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMouseDownTarget(e.target);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if mousedown and mouseup happened on the same overlay element
    // This prevents closing when user is selecting text and drags outside
    if (e.target === e.currentTarget && mouseDownTarget === e.target) {
      setIsAuthOpen(false);
    }
    setMouseDownTarget(null);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[80] px-3 sm:px-4 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95%] xs:max-w-[90%] sm:max-w-[480px] md:max-w-[520px] overflow-hidden [contain:paint]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
          <div className="overflow-y-auto max-h-[95vh]">
            {/* Premium Header - Compact */}
            <div className="relative px-6 py-6 sm:py-8 overflow-hidden" style={{ background: brand.sidebarGradient }}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2956bf]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

              {/* Close button */}
              <button
                onClick={() => setIsAuthOpen(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 active:scale-95 disabled:opacity-50 group z-20"
                disabled={loading}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>

              {/* Logo - Full Header Size */}
              <div className="relative z-10 flex items-center justify-center h-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-full max-w-[200px] sm:max-w-[220px]"
                >
                  <Image
                    src={appLogo}
                    alt="ZhanCare.AI"
                    width={220}
                    height={220}
                    className="w-full h-auto object-contain drop-shadow-2xl"
                    priority
                  />
                </motion.div>
              </div>
            </div>

            {/* Form Container */}
            <div className="px-6 sm:px-8 py-6 bg-gradient-to-b from-[#ebf1ff] to-white">
              {!showForgotPassword && (
                <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />
              )}

              <div className={showForgotPassword ? "" : "mt-6 relative"}>
                <AnimatePresence mode="wait">
                  {showForgotPassword ? (
                    <motion.div
                      key="forgot-password"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <ForgotPasswordForm
                        translations={translations}
                        onBack={() => setShowForgotPassword(false)}
                        loading={loading}
                        setLoading={setLoading}
                        defaultMethod={forgotPasswordMethod}
                        language={language}
                      />
                    </motion.div>
                  ) : activeTab === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {/* Email / Phone toggle */}
                      <div className="flex rounded-xl border border-[#e8e8e8] overflow-hidden mb-3">
                        {(["phone", "email"] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setLoginMethod(m)}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
                              loginMethod === m
                                ? "bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white shadow-inner"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {m === "email" ? "Email" : translations.phone}
                          </button>
                        ))}
                      </div>

                      {loginMode === "password" && (
                        <div className="flex justify-end mb-3">
                          <button
                            type="button"
                            onClick={() => setLoginMode("otp")}
                            className="text-sm text-[#3772ff] hover:text-[#2956bf] font-medium underline"
                          >
                            {LOGIN_OTP_LINK_LABEL[language] ?? LOGIN_OTP_LINK_LABEL.en}
                          </button>
                        </div>
                      )}

                      <AnimatePresence mode="wait">
                        {loginMode === "otp" ? (
                          <motion.div
                            key="otp-login"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <LoginOtpForm
                              translations={translations}
                              loginMethod={loginMethod}
                              onSuccess={handlePhoneLoginSuccess}
                              onBackToPassword={() => setLoginMode("password")}
                              language={language}
                            />
                          </motion.div>
                        ) : loginMethod === "email" ? (
                          <motion.div
                            key="email-login"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <LoginForm
                              translations={translations}
                              onSubmit={handleLogin}
                              onForgotPassword={() => { setForgotPasswordMethod("email"); setShowForgotPassword(true); }}
                              loading={loading}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="phone-login"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <PhoneLoginForm
                              translations={translations}
                              onSuccess={handlePhoneLoginSuccess}
                              onForgotPassword={() => { setForgotPasswordMethod("phone"); setShowForgotPassword(true); }}
                              loading={loading}
                              setLoading={setLoading}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <RegisterForm
                        translations={translations}
                        onSubmit={handleRegister}
                        loading={loading}
                        language={language}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AuthPopup;
