"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { toast } from "react-toastify";
import { X, Eye, EyeOff, Mail, Phone, User, Lock, Loader2 } from "lucide-react";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import { api } from "@/utils/api";
import Logo from "@/assets/logosaas.png";

import AuthTabs from "@/components/auth/AuthTabs";
import ErrorAlert from "@/components/auth/ErrorAlert";
import ForgotPasswordPopup from "@/components/auth/ForgotPasswordPopup";

interface FormData {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
}

const AuthPopup = () => {
  const { isAuthOpen, setIsAuthOpen, loginUser } = useAuth();
  const { language } = useLanguage();
  
  // Get translations based on language
  const getTranslations = useCallback(() => {
    switch (language) {
      case "ru": return ru.auth;
      case "kz": return kz.auth;
      case "en": return en.auth;
      default: return en.auth;
    }
  }, [language]);

  const translations = getTranslations();

  // Get error message translations
  const getErrorMessages = useCallback(() => {
    const messages = {
      ru: {
        passwordsMismatch: "Пароли не совпадают",
        loginSuccess: "Вы успешно вошли в систему",
        registerSuccess: "Регистрация прошла успешно",
        generalError: "Произошла ошибка. Попробуйте снова",
        invalidCredentials: "Неправильный E-mail или пароль",
        phoneExists: "Пользователь с таким телефоном уже существует",
        emailExists: "Пользователь с таким email уже существует",
        weakPassword: "Пароль должен содержать минимум 8 символов",
        invalidEmail: "Введите корректный email адрес"
      },
      kz: {
        passwordsMismatch: "Құпия сөздер сәйкес келмейді",
        loginSuccess: "Сіз сәтті кірдіңіз",
        registerSuccess: "Тіркелу сәтті өтті",
        generalError: "Қате орын алды. Қайталап көріңіз",
        invalidCredentials: "Қате E-mail немесе құпия сөз",
        phoneExists: "Осы телефонмен қолданушы бұрын тіркелген",
        emailExists: "Осы email-мен қолданушы бұрын тіркелген",
        weakPassword: "Құпия сөз кемінде 8 таңбадан тұруы керек",
        invalidEmail: "Дұрыс email мекенжайын енгізіңіз"
      },
      en: {
        passwordsMismatch: "Passwords do not match",
        loginSuccess: "Successfully logged in",
        registerSuccess: "Registration completed successfully",
        generalError: "An error occurred. Please try again",
        invalidCredentials: "Invalid email or password",
        phoneExists: "User with this phone number already exists",
        emailExists: "User with this email already exists",
        weakPassword: "Password must be at least 8 characters long",
        invalidEmail: "Please enter a valid email address"
      }
    };
    return messages[language as keyof typeof messages] || messages.en;
  }, [language]);

  const errorMessages = getErrorMessages();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({});

  const [formData, setFormData] = useState<FormData>({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const formElementRef = useRef<HTMLFormElement>(null);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = useCallback((): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.email || !validateEmail(formData.email)) {
      errors.email = errorMessages.invalidEmail;
    }

    if (!formData.password || !validatePassword(formData.password)) {
      errors.password = errorMessages.weakPassword;
    }

    if (activeTab === "register") {
      if (!formData.first_name.trim()) {
        errors.first_name = "Имя обязательно";
      }
      if (!formData.last_name.trim()) {
        errors.last_name = "Фамилия обязательна";
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = errorMessages.passwordsMismatch;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, activeTab, errorMessages]);

  // Animate height on tab change
  useEffect(() => {
    if (formContainerRef.current && wrapperRef.current && isAuthOpen) {
      requestAnimationFrame(() => {
        const formHeight = formContainerRef.current!.offsetHeight;
        
        gsap.to(wrapperRef.current, {
          height: formHeight,
          duration: 0.45,
          ease: "power2.out",
        });

        gsap.fromTo(
          formContainerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
        );
      });
    }
  }, [activeTab, isAuthOpen]);

  // Clear form when switching tabs
  useEffect(() => {
    setFormData({
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
    });
    setError("");
    setValidationErrors({});
  }, [activeTab]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (validationErrors[name as keyof FormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    const apiUrl = activeTab === "login" ? "/auth/login/" : "/auth/register/";
    const payload = activeTab === "login"
      ? { 
          email: formData.email.trim(), 
          password: formData.password 
        }
      : {
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          password: formData.password,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
        };

    try {
      const response = await api.post(apiUrl, payload);
      const data = response.data;

      if (activeTab === "login") {
        await loginUser(data.access_token, data.refresh_token, data.user);
        toast.success(errorMessages.loginSuccess);
        
        // Redirect based on role
        const redirectUrl = data.user.role === "doctor" ? "/doctor-profile" : "/profile";
        window.location.href = redirectUrl;
      } else {
        toast.success(errorMessages.registerSuccess);
        setActiveTab("login");
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      }

      setIsAuthOpen(false);
    } catch (err: any) {
      const errorData = err?.response?.data;
      let errorMessage = errorMessages.generalError;

      if (activeTab === "login" && err?.response?.status === 401) {
        errorMessage = errorMessages.invalidCredentials;
      } else if (errorData) {
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
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthOpen) return null;

  const InputField = ({ 
    name, 
    type = "text", 
    placeholder, 
    icon: Icon, 
    value, 
    autoComplete,
    showPasswordToggle = false 
  }: {
    name: keyof FormData;
    type?: string;
    placeholder: string;
    icon: any;
    value: string;
    autoComplete?: string;
    showPasswordToggle?: boolean;
  }) => (
    <div className="space-y-1">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type={showPasswordToggle && name === "password" ? (showPassword ? "text" : "password") : 
                showPasswordToggle && name === "confirmPassword" ? (showConfirmPassword ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full pl-11 pr-${showPasswordToggle ? '11' : '4'} py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            validationErrors[name] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          disabled={loading}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => name === "password" ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {(name === "password" ? showPassword : showConfirmPassword) ? 
              <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {validationErrors[name] && (
        <p className="text-sm text-red-600 ml-1">{validationErrors[name]}</p>
      )}
    </div>
  );

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setIsAuthOpen(false)}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-[500px] md:max-w-[800px] relative overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Left side - Branding */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-8 md:w-2/5 flex flex-col justify-center items-center text-center">
                <div className="mb-6">
                  <Image src={Logo} alt="Logo" width={80} height={80} className="mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">{translations.welcome}</h2>
                  <p className="text-blue-100 text-sm leading-relaxed">{translations.description}</p>
                </div>
              </div>

              {/* Right side - Form */}
              <div className="flex-1 p-8">
                <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div ref={wrapperRef} className="relative overflow-hidden mt-6">
                  <div ref={formContainerRef}>
                    <form ref={formElementRef} onSubmit={handleSubmit} className="space-y-4">
                      {activeTab === "login" ? (
                        <>
                          <InputField
                            name="email"
                            type="email"
                            placeholder="Email адрес"
                            icon={Mail}
                            value={formData.email}
                            autoComplete="email"
                          />
                          <InputField
                            name="password"
                            placeholder="Пароль"
                            icon={Lock}
                            value={formData.password}
                            autoComplete="current-password"
                            showPasswordToggle
                          />
                          <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center">
                              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                              <span className="ml-2 text-gray-600">Запомнить меня</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsForgotOpen(true)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Забыли пароль?
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField
                              name="first_name"
                              placeholder="Имя"
                              icon={User}
                              value={formData.first_name}
                              autoComplete="given-name"
                            />
                            <InputField
                              name="last_name"
                              placeholder="Фамилия"
                              icon={User}
                              value={formData.last_name}
                              autoComplete="family-name"
                            />
                          </div>
                          <InputField
                            name="email"
                            type="email"
                            placeholder="Email адрес"
                            icon={Mail}
                            value={formData.email}
                            autoComplete="email"
                          />
                          <InputField
                            name="phone"
                            type="tel"
                            placeholder="Телефон (необязательно)"
                            icon={Phone}
                            value={formData.phone}
                            autoComplete="tel"
                          />
                          <InputField
                            name="password"
                            placeholder="Пароль"
                            icon={Lock}
                            value={formData.password}
                            autoComplete="new-password"
                            showPasswordToggle
                          />
                          <InputField
                            name="confirmPassword"
                            placeholder="Подтвердите пароль"
                            icon={Lock}
                            value={formData.confirmPassword}
                            autoComplete="new-password"
                            showPasswordToggle
                          />
                        </>
                      )}

                      <ErrorAlert error={error} />

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span>{loading ? "Загрузка..." : (activeTab === "login" ? "Войти" : "Зарегистрироваться")}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {isForgotOpen && <ForgotPasswordPopup onClose={() => setIsForgotOpen(false)} />}
    </>
  );
};

export default AuthPopup;