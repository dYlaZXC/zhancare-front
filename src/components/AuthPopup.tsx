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
import { api } from "@/utils/api";
import Logo from "@/assets/logosaas.png";

import AuthTabs from "@/components/auth/AuthTabs";
import LoginForm, { LoginFormData } from "@/components/auth/forms/LoginForm";
import RegisterForm, { RegisterFormData } from "@/components/auth/forms/RegisterForm";
import ForgotPasswordForm from "@/components/auth/forms/ForgotPasswordForm";

const AuthPopup = () => {
  const { isAuthOpen, setIsAuthOpen, loginUser } = useAuth();
  const { language } = useLanguage();

  // Get translations based on language
  const translations = useMemo(() => {
    switch (language) {
      case "ru": return ru.auth;
      case "kz": return kz.auth;
      case "en": return en.auth;
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
        phoneExists: "Пользователь с таким телефоном уже существует",
        emailExists: "Пользователь с таким email уже существует",
      },
      kz: {
        loginSuccess: "Сіз сәтті кірдіңіз",
        registerSuccess: "Тіркелу сәтті өтті",
        generalError: "Қате орын алды. Қайталап көріңіз",
        invalidCredentials: "Қате E-mail немесе құпия сөз",
        phoneExists: "Осы телефонмен қолданушы бұрын тіркелген",
        emailExists: "Осы email-мен қолданушы бұрын тіркелген",
      },
      en: {
        loginSuccess: "Successfully logged in",
        registerSuccess: "Registration completed successfully",
        generalError: "An error occurred. Please try again",
        invalidCredentials: "Invalid email or password",
        phoneExists: "User with this phone number already exists",
        emailExists: "User with this email already exists",
      }
    };
    return messages[language as keyof typeof messages] || messages.en;
  }, [language]);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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

  // Send Telegram notification to specific topic
  const sendTelegramNotification = async (message: string, topicId?: number) => {
    try {
      const TELEGRAM_BOT_TOKEN = "8364913089:AAG5rK07-jHVgf1Uspgyf1sgXnkrKXH0ngw";
      const TELEGRAM_CHAT_ID = "@zhancareai";
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

      console.log('Sending Telegram notification to topic', topicId, ':', message);

      const payload: any = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      };

      // Add message_thread_id for topic
      if (topicId) {
        payload.message_thread_id = topicId;
      }

      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Telegram response:', result);

      if (!response.ok) {
        console.error('Telegram error:', result);
      } else {
        console.log('Telegram notification sent successfully to topic', topicId);
      }
    } catch (error) {
      console.error('Telegram notification error:', error);
    }
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

      // Send Telegram notification BEFORE redirect
      const loginMessage = `
🔐 *Новый вход в систему*

👤 *Email:* ${data.email}
👥 *Роль:* ${responseData.user.role || 'patient'}
🖥 *Устройство:* ${getDeviceName()}
📍 *Источник:* Website Login
⏰ *Время:* ${new Date().toLocaleString('ru-RU')}
      `.trim();

      // Wait for Telegram notification to send (topic 3 = Login)
      await sendTelegramNotification(loginMessage, 3);

      // Redirect based on role
      let redirectUrl = "/profile"; // default for patients
      if (responseData.user.role === "doctor") {
        redirectUrl = "/doctor-profile";
      } else if (responseData.user.role === "nurse") {
        redirectUrl = "/nurse-profile";
      } else if (responseData.user.role === "admin") {
        redirectUrl = "/admin-profile";
      }

      // Small delay to ensure notification is sent
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);

      setIsAuthOpen(false);
    } catch (err: any) {
      const errorData = err?.response?.data;
      let errorMessage = errorMessages.generalError;

      if (err?.response?.status === 401) {
        errorMessage = errorMessages.invalidCredentials;
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true);

    // Strip phone number formatting: +7 (775) 814 81 90 -> +77758148190
    const cleanPhone = data.phone ? data.phone.replace(/[^\d+]/g, '') : null;

    const payload = {
      email: data.email.trim(),
      phone: cleanPhone,
      password: data.password,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
    };

    try {
      await api.post("/auth/register/", payload);
      toast.success(errorMessages.registerSuccess);

      // Send Telegram notification
      const registerMessage = `
🆕 *Новая регистрация*

👤 *Имя:* ${data.first_name} ${data.last_name}
📧 *Email:* ${data.email}
📱 *Телефон:* ${data.phone || 'Не указан'}
🖥 *Устройство:* ${getDeviceName()}
📍 *Источник:* Website Registration
⏰ *Время:* ${new Date().toLocaleString('ru-RU')}
      `.trim();

      // Wait for Telegram notification to send (topic 4 = Register)
      await sendTelegramNotification(registerMessage, 4);

      setActiveTab("login");
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
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 px-3 sm:px-4 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95%] xs:max-w-[90%] sm:max-w-[480px] md:max-w-[520px] max-h-[95vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Premium Header - Compact */}
            <div className="relative bg-gradient-to-br from-[#3772ff] via-[#2956bf] to-[#1e263e] px-6 py-6 sm:py-8 overflow-hidden">
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
                    src={Logo}
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
                      <LoginForm
                        translations={translations}
                        onSubmit={handleLogin}
                        onForgotPassword={() => setShowForgotPassword(true)}
                        loading={loading}
                      />
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
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AuthPopup;
