"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { useLanguage } from "@/context/LanguageContext";
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

interface ForgotPasswordPopupProps {
  onClose: () => void;
}

const CODE_LENGTH = 6;
const CODE_EXPIRATION_SECONDS = 15 * 60;

const ForgotPasswordPopup: React.FC<ForgotPasswordPopupProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return {
          title: "Восстановление пароля",
          enterEmail: "Введите ваш email",
          sendCode: "Отправить код на почту",
          sending: "Отправка...",
          codeSent: "📧 Код отправлен на вашу почту",
          failedToSend: "Не удалось отправить код",
          incorrectCode: "Неверный код. Попробуйте снова.",
          codeExpiresIn: "Код истечёт через:",
          codeExpired: "Код истёк",
          sendAgain: "Отправить снова",
          newPassword: "Новый пароль",
          confirmPassword: "Подтвердите пароль",
          resetPassword: "Сбросить пароль",
          updating: "Обновление...",
          passwordUpdated: "✅ Пароль обновлён",
          resetError: "Ошибка при сбросе пароля",
          fillAllFields: "Заполните все поля",
          passwordsMismatch: "Пароли не совпадают"
        };
      case "kz":
        return {
          title: "Құпия сөзді қалпына келтіру",
          enterEmail: "Электрондық поштаңызды енгізіңіз",
          sendCode: "Поштаға код жіберу",
          sending: "Жіберілуде...",
          codeSent: "📧 Код поштаңызға жіберілді",
          failedToSend: "Код жіберу мүмкін болмады",
          incorrectCode: "Қате код. Қайталап көріңіз.",
          codeExpiresIn: "Код мерзімі бітеді:",
          codeExpired: "Код мерзімі бітті",
          sendAgain: "Қайта жіберу",
          newPassword: "Жаңа құпия сөз",
          confirmPassword: "Құпия сөзді растаңыз",
          resetPassword: "Құпия сөзді қалпына келтіру",
          updating: "Жаңартылуда...",
          passwordUpdated: "✅ Құпия сөз жаңартылды",
          resetError: "Құпия сөзді қалпына келтіру қатесі",
          fillAllFields: "Барлық өрістерді толтырыңыз",
          passwordsMismatch: "Құпия сөздер сәйкес келмейді"
        };
      case "en":
        return {
          title: "Password Recovery",
          enterEmail: "Enter your email",
          sendCode: "Send code to email",
          sending: "Sending...",
          codeSent: "📧 Code sent to your email",
          failedToSend: "Failed to send code",
          incorrectCode: "Incorrect code. Try again.",
          codeExpiresIn: "Code expires in:",
          codeExpired: "Code expired",
          sendAgain: "Send again",
          newPassword: "New password",
          confirmPassword: "Confirm password",
          resetPassword: "Reset password",
          updating: "Updating...",
          passwordUpdated: "✅ Password updated",
          resetError: "Error resetting password",
          fillAllFields: "Fill all fields",
          passwordsMismatch: "Passwords don't match"
        };
      default:
        return {
          title: "Password Recovery",
          enterEmail: "Enter your email",
          sendCode: "Send code to email",
          sending: "Sending...",
          codeSent: "📧 Code sent to your email",
          failedToSend: "Failed to send code",
          incorrectCode: "Incorrect code. Try again.",
          codeExpiresIn: "Code expires in:",
          codeExpired: "Code expired",
          sendAgain: "Send again",
          newPassword: "New password",
          confirmPassword: "Confirm password",
          resetPassword: "Reset password",
          updating: "Updating...",
          passwordUpdated: "✅ Password updated",
          resetError: "Error resetting password",
          fillAllFields: "Fill all fields",
          passwordsMismatch: "Passwords don't match"
        };
    }
  };

  const translations = getTranslations();

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (step !== "code" || countdown === null) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async () => {
    if (!email) return toast.error(translations.enterEmail);
    try {
      setLoading(true);
      await api.post("/auth/forgot-password/", { email });
      toast.success(translations.codeSent);
      setStep("code");
      setCountdown(CODE_EXPIRATION_SECONDS);
      setCode(Array(CODE_LENGTH).fill(""));
      codeRefs.current[0]?.focus();
    } catch {
      toast.error(translations.failedToSend);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (val: string, index: number) => {
    const char = val.toUpperCase();
    if (/^[a-zA-Z0-9]?$/.test(char)) {
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
    }
  };

  const verifyCode = async (codeStr: string) => {
    try {
      setLoading(true);
      await api.post("/auth/verify-reset-code/", { email, reset_code: codeStr });
      setStep("password");
    } catch {
      setCode(Array(CODE_LENGTH).fill(""));
      setCodeError(translations.incorrectCode);
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const fullCode = code.join("");
    if (!newPassword || !confirmPassword) return toast.error(translations.fillAllFields);
    if (newPassword !== confirmPassword) return toast.error(translations.passwordsMismatch);

    try {
      setLoading(true);
      await api.post("/auth/reset-password/", {
        email,
        reset_code: fullCode,
        new_password: newPassword,
      });
      toast.success(translations.passwordUpdated);
      setTimeout(() => onClose(), 2000);
    } catch {
      toast.error(translations.resetError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50 px-4 py-4 transition-all duration-500 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb;"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(55, 114, 255, 0.15) 0%, transparent 50%),
            rgba(0, 0, 0, 0.7)
          `
        }}
      >
        <motion.div
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-[500px] max-h-[90vh] relative overflow-hidden border border-white/20 backdrop-blur-xl"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            background: `
              linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)
            `,
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.05),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
            `
          }}
        >
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 group">
            <button 
              onClick={onClose}
              className="relative min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] p-1.5 sm:p-2 rounded-lg backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95 border-0 outline-none overflow-hidden flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              disabled={loading}
              style={{ 
                background: `
                  linear-gradient(135deg, 
                    rgba(239, 68, 68, 0.1) 0%, 
                    rgba(220, 38, 38, 0.15) 50%,
                    rgba(185, 28, 28, 0.1) 100%
                  )
                `,
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <X className="w-4 h-4 sm:w-4 sm:h-4 text-red-400 group-hover:text-red-300 transition-all duration-300 drop-shadow-sm relative z-10" />
              
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)' }}></div>
            </button>
            
            {/* Button glow effect */}
            <div className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                 style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}></div>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">{translations.title}</h2>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto"></div>
            </div>

            {step === "email" && (
              <>
                <div className="relative group mb-6">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300"
                       style={email ? 
                         { background: 'rgba(55, 114, 255, 0.15)', border: '1px solid rgba(55, 114, 255, 0.2)' } : 
                         { background: 'rgba(156, 163, 175, 0.15)', border: '1px solid rgba(156, 163, 175, 0.2)' }
                       }>
                    <Mail className={`w-4 h-4 transition-all duration-300 ${
                      email ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'
                    }`} />
                  </div>
                  
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={translations.enterEmail}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; font-medium placeholder:font-normal text-base ${
                      email
                        ? 'border-2 border-blue-200/60 bg-blue-50/30 text-gray-900 placeholder:text-blue-400 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400'
                        : 'border-2 border-gray-200/60 bg-gray-50/30 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400 hover:border-gray-300/80'
                    }`}
                    style={{
                      boxShadow: email
                        ? '0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        : '0 0 0 1px rgba(156, 163, 175, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    disabled={loading}
                  />
                  
                  {/* Input glow effect */}
                  <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none ${
                    email ? 'group-focus-within:opacity-20' : 'group-focus-within:opacity-10'
                  }`}
                       style={{ 
                         background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
                       }}></div>
                </div>

                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full group relative overflow-hidden min-h-[52px] px-6 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 border-0 outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
                  style={{
                    background: loading 
                      ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)'
                      : 'linear-gradient(135deg, #3772ff 0%, #29358f 50%, #1e40af 100%)',
                    border: '1px solid rgba(55, 114, 255, 0.3)'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span className="text-sm font-medium">{translations.sending}</span>
                    </div>
                  ) : (
                    <span className="relative z-10 text-base font-semibold tracking-wide">
                      {translations.sendCode}
                    </span>
                  )}
                  
                  {/* Shimmer effect */}
                  {!loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                  )}
                  
                  {/* Button glow effect */}
                  <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                       style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
                </button>
              </>
            )}

            {step === "code" && (
              <>
                <div className="flex gap-2 xs:gap-3 justify-center mb-6">
                  {code.map((char, i) => (
                    <div key={i} className="relative group">
                      <input
                        type="text"
                        inputMode="text"
                        maxLength={1}
                        value={char}
                        onChange={(e) => handleCodeChange(e.target.value, i)}
                        ref={(el) => {
                          codeRefs.current[i] = el;
                        }}
                        className={`w-12 h-14 xs:w-14 xs:h-16 text-center text-lg xs:text-xl font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-200/50 ${
                          char
                            ? 'border-2 border-blue-400 bg-blue-50/50 text-blue-900 shadow-lg'
                            : codeError
                            ? 'border-2 border-red-300 bg-red-50/50 text-red-900'
                            : 'border-2 border-gray-200/60 bg-gray-50/30 text-gray-900 hover:border-blue-300'
                        }`}
                        style={{
                          boxShadow: char
                            ? '0 4px 12px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)'
                            : codeError
                            ? '0 4px 12px rgba(239, 68, 68, 0.15), 0 0 0 1px rgba(239, 68, 68, 0.1)'
                            : '0 2px 8px rgba(156, 163, 175, 0.1), 0 0 0 1px rgba(156, 163, 175, 0.05)'
                        }}
                        disabled={loading}
                      />
                      
                      {/* Input glow effect */}
                      <div className={`absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-30 transition-opacity duration-300 pointer-events-none ${
                        char ? 'bg-blue-400/10' : codeError ? 'bg-red-400/10' : 'bg-blue-400/10'
                      }`}></div>
                    </div>
                  ))}
                </div>

                {codeError && (
                  <div className="text-center mb-4">
                    <p className="text-red-600 text-sm font-medium flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      {codeError}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm mb-6 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50/30 border border-gray-200/50">
                  {countdown !== null ? (
                    <span className="text-gray-700 font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {translations.codeExpiresIn} <span className="font-mono text-blue-600">{formatCountdown(countdown)}</span>
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      {translations.codeExpired}
                    </span>
                  )}
                  <button
                    onClick={handleSendCode}
                    className="text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    disabled={loading}
                  >
                    {translations.sendAgain}
                  </button>
                </div>
              </>
            )}

            {step === "password" && (
              <>
                <div className="space-y-4 mb-6">
                  {/* New Password Field */}
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300"
                         style={newPassword ? 
                           { background: 'rgba(55, 114, 255, 0.15)', border: '1px solid rgba(55, 114, 255, 0.2)' } : 
                           { background: 'rgba(156, 163, 175, 0.15)', border: '1px solid rgba(156, 163, 175, 0.2)' }
                         }>
                      <Lock className={`w-4 h-4 transition-all duration-300 ${
                        newPassword ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'
                      }`} />
                    </div>
                    
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={translations.newPassword}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-xl transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; font-medium placeholder:font-normal text-base ${
                        newPassword
                          ? 'border-2 border-blue-200/60 bg-blue-50/30 text-gray-900 placeholder:text-blue-400 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400'
                          : 'border-2 border-gray-200/60 bg-gray-50/30 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400 hover:border-gray-300/80'
                      }`}
                      style={{
                        boxShadow: newPassword
                          ? '0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                          : '0 0 0 1px rgba(156, 163, 175, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      disabled={loading}
                    />
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
                    >
                      {showPassword ? 
                        <EyeOff className="w-4 h-4 text-gray-500 hover:text-gray-700" /> : 
                        <Eye className="w-4 h-4 text-gray-500 hover:text-gray-700" />}
                    </button>
                    
                    {/* Input glow effect */}
                    <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none ${
                      newPassword ? 'group-focus-within:opacity-20' : 'group-focus-within:opacity-10'
                    }`}
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
                         }}></div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300"
                         style={confirmPassword ? 
                           { background: 'rgba(55, 114, 255, 0.15)', border: '1px solid rgba(55, 114, 255, 0.2)' } : 
                           { background: 'rgba(156, 163, 175, 0.15)', border: '1px solid rgba(156, 163, 175, 0.2)' }
                         }>
                      <Lock className={`w-4 h-4 transition-all duration-300 ${
                        confirmPassword ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'
                      }`} />
                    </div>
                    
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={translations.confirmPassword}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-xl transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; font-medium placeholder:font-normal text-base ${
                        confirmPassword
                          ? 'border-2 border-blue-200/60 bg-blue-50/30 text-gray-900 placeholder:text-blue-400 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400'
                          : 'border-2 border-gray-200/60 bg-gray-50/30 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400 hover:border-gray-300/80'
                      }`}
                      style={{
                        boxShadow: confirmPassword
                          ? '0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                          : '0 0 0 1px rgba(156, 163, 175, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      disabled={loading}
                    />
                    
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
                    >
                      {showConfirmPassword ? 
                        <EyeOff className="w-4 h-4 text-gray-500 hover:text-gray-700" /> : 
                        <Eye className="w-4 h-4 text-gray-500 hover:text-gray-700" />}
                    </button>
                    
                    {/* Input glow effect */}
                    <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none ${
                      confirmPassword ? 'group-focus-within:opacity-20' : 'group-focus-within:opacity-10'
                    }`}
                         style={{ 
                           background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
                         }}></div>
                  </div>
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full group relative overflow-hidden min-h-[52px] px-6 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 border-0 outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
                  style={{
                    background: loading 
                      ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)'
                      : 'linear-gradient(135deg, #3772ff 0%, #29358f 50%, #1e40af 100%)',
                    border: '1px solid rgba(55, 114, 255, 0.3)'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span className="text-sm font-medium">{translations.updating}</span>
                    </div>
                  ) : (
                    <span className="relative z-10 text-base font-semibold tracking-wide">
                      {translations.resetPassword}
                    </span>
                  )}
                  
                  {/* Shimmer effect */}
                  {!loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                  )}
                  
                  {/* Button glow effect */}
                  <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                       style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ForgotPasswordPopup;