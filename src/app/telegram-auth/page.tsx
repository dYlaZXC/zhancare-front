"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import { api } from "@/utils/api";
import Logo from "@/assets/logosaas.png";

import AuthTabs from "@/components/auth/AuthTabs";
import LoginForm, { LoginFormData } from "@/components/auth/forms/LoginForm";
import RegisterForm, { RegisterFormData } from "@/components/auth/forms/RegisterForm";
import ForgotPasswordForm from "@/components/auth/forms/ForgotPasswordForm";
import heroVideo from "@/assets/hero-video.mp4";

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const TelegramAuthPage = () => {
  const { language } = useLanguage();
  const [webApp, setWebApp] = useState<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

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
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const userStr = localStorage.getItem("user");

        if (accessToken && userStr) {
          const user = JSON.parse(userStr);
          console.log("✅ User already authenticated:", user);

          // Redirect based on role
          const redirectUrl = user.role === "doctor" ? "/doctor-profile" : "/profile";
          console.log(`🔄 Redirecting to ${redirectUrl}...`);

          window.location.href = redirectUrl;
          return true;
        }
      } catch (error) {
        console.error("❌ Error checking authentication:", error);
      }

      setCheckingAuth(false);
      return false;
    };

    checkAuthentication();
  }, []);

  // Load Telegram SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ Telegram SDK loaded");
      setScriptLoaded(true);

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        // Apply theme
        if (tg.themeParams.bg_color) {
          document.body.style.backgroundColor = tg.themeParams.bg_color;
        }

        setWebApp(tg);
        console.log("🚀 Telegram WebApp initialized");
        console.log("👤 User:", tg.initDataUnsafe?.user);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Handle Login
  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);

    const payload = {
      email: data.email.trim(),
      password: data.password,
      telegram_data: webApp?.initData, // Send Telegram data
      telegram_user: webApp?.initDataUnsafe?.user, // Send Telegram user
    };

    try {
      const response = await api.post("/auth/login/", payload);
      const responseData = response.data;

      // Store tokens
      localStorage.setItem("access_token", responseData.access_token);
      localStorage.setItem("refresh_token", responseData.refresh_token);
      localStorage.setItem("user", JSON.stringify(responseData.user));

      toast.success(errorMessages.loginSuccess);

      // Haptic feedback
      webApp?.HapticFeedback?.notificationOccurred("success");

      // Redirect based on role - SAME AS AUTH POPUP!
      const redirectUrl = responseData.user.role === "doctor" ? "/doctor-profile" : "/profile";

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);

    } catch (err: any) {
      const errorData = err?.response?.data;
      let errorMessage = errorMessages.generalError;

      if (err?.response?.status === 401) {
        errorMessage = errorMessages.invalidCredentials;
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      }

      toast.error(errorMessage);
      webApp?.HapticFeedback?.notificationOccurred("error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true);

    const payload = {
      email: data.email.trim(),
      phone: data.phone.trim() || null,
      password: data.password,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      telegram_data: webApp?.initData, // Send Telegram data
      telegram_user: webApp?.initDataUnsafe?.user, // Send Telegram user
    };

    try {
      await api.post("/auth/register/", payload);
      toast.success(errorMessages.registerSuccess);
      webApp?.HapticFeedback?.notificationOccurred("success");
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
      webApp?.HapticFeedback?.notificationOccurred("error");
    } finally {
      setLoading(false);
    }
  };

  const videoBackground = (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover blur-md"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-black/60 -z-9" />
      <div
        className="absolute inset-0 -z-8"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </>
  );

  // Show loading while SDK loads
  if (!scriptLoaded) {
    return (
      <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
        {videoBackground}
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Loading Telegram SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-3 sm:px-4 py-4">
      {videoBackground}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95%] xs:max-w-[90%] sm:max-w-[480px] md:max-w-[520px] max-h-[95vh] overflow-y-auto">
        {/* Premium Header - Same as popup */}
        <div className="relative bg-gradient-to-br from-[#3772ff] via-[#2956bf] to-[#1e263e] px-6 py-6 sm:py-8 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2956bf]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

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

        {/* Form Container - Same as popup */}
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
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Telegram Info Badge (Optional - shows it's from Telegram) */}
        {webApp?.initDataUnsafe?.user && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.76 8.3c-.133.595-.48.744-.973.463l-2.688-1.979-1.296 1.246c-.144.144-.264.264-.542.264l.193-2.75 5.006-4.518c.217-.193-.048-.3-.336-.107l-6.184 3.893-2.666-.833c-.58-.18-.592-.58.12-.861l10.422-4.018c.483-.18.906.107.75.861z"/>
              </svg>
              <span className="text-sm text-blue-700 font-medium">
                Authenticated via Telegram
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramAuthPage;
