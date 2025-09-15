"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
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

interface InputFieldProps {
  name: keyof FormData;
  type?: string;
  placeholder: string;
  icon: any;
  value: string;
  autoComplete?: string;
  showPasswordToggle?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationError?: string;
  loading?: boolean;
  showPassword?: boolean;
  showConfirmPassword?: boolean;
  onTogglePassword?: (field: 'password' | 'confirmPassword') => void;
}

const InputField = memo(function InputField({ 
  name, 
  type = "text", 
  placeholder, 
  icon: Icon, 
  value, 
  autoComplete,
  showPasswordToggle = false,
  onChange,
  validationError,
  loading = false,
  showPassword = false,
  showConfirmPassword = false,
  onTogglePassword
}: InputFieldProps) {
  return (
  <div className="space-y-1 xs:space-y-2">
    <div className="relative group">
      <div className="absolute left-2 xs:left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all duration-300"
           style={value ? 
             { background: 'rgba(55, 114, 255, 0.15)', border: '1px solid rgba(55, 114, 255, 0.2)' } : 
             { background: 'rgba(156, 163, 175, 0.15)', border: '1px solid rgba(156, 163, 175, 0.2)' }
           }>
        <Icon className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
          value ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'
        }`} />
      </div>
      
      <input
        type={showPasswordToggle && name === "password" ? (showPassword ? "text" : "password") : 
              showPasswordToggle && name === "confirmPassword" ? (showConfirmPassword ? "text" : "password") : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full pl-8 xs:pl-9 sm:pl-12 pr-${showPasswordToggle ? '8 xs:pr-9 sm:pr-12' : '3 sm:pr-4'} py-2.5 xs:py-3 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; font-medium placeholder:font-normal text-sm sm:text-base ${
          validationError 
            ? 'border-2 border-red-300/60 bg-red-50/50 text-red-900 placeholder:text-red-400 focus:ring-4 focus:ring-red-200/50 focus:border-red-400' 
            : value
            ? 'border-2 border-blue-200/60 bg-blue-50/30 text-gray-900 placeholder:text-blue-400 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400'
            : 'border-2 border-gray-200/60 bg-gray-50/30 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400 hover:border-gray-300/80'
        }`}
        style={{
          boxShadow: validationError 
            ? '0 0 0 1px rgba(239, 68, 68, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            : value
            ? '0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            : '0 0 0 1px rgba(156, 163, 175, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}
        disabled={loading}
      />
      
      {showPasswordToggle && onTogglePassword && (
        <button
          type="button"
          onClick={() => onTogglePassword(name === "password" ? "password" : "confirmPassword")}
          className="absolute right-2 xs:right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
        >
          {(name === "password" ? showPassword : showConfirmPassword) ? 
            <EyeOff className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-gray-500 hover:text-gray-700" /> : 
            <Eye className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-gray-500 hover:text-gray-700" />}
        </button>
      )}
      
      {/* Input glow effect */}
      <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none ${
        value ? 'group-focus-within:opacity-20' : 'group-focus-within:opacity-10'
      }`}
           style={{ 
             background: validationError 
               ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
               : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
           }}></div>
    </div>
    
    {validationError && (
      <p className="text-sm text-red-600 ml-1 flex items-center gap-1.5 animate-pulse">
        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
        {validationError}
      </p>
    )}
  </div>
  );
});

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

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [rememberMe, setRememberMe] = useState(false);

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

  // Mouse tracking for interactive effects
  useEffect(() => {
    if (!isAuthOpen) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isAuthOpen]);

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (validationErrors[name as keyof FormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) setError("");
  }, [validationErrors, error]);

  const handleTogglePassword = useCallback((field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(prev => !prev);
    } else {
      setShowConfirmPassword(prev => !prev);
    }
  }, []);

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

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50 px-2 sm:px-4 py-4 sm:py-0 transition-all duration-500 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb;"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setIsAuthOpen(false)}
          style={{
            background: `
              radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(55, 114, 255, 0.15) 0%, transparent 50%),
              rgba(0, 0, 0, 0.7)
            `
          }}
        >
          <motion.div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95%] xs:max-w-[90%] sm:max-w-[500px] md:max-w-[800px] max-h-[90vh] sm:max-h-[95vh] md:max-h-none relative overflow-hidden border border-white/20 backdrop-blur-xl flex flex-col"
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
                onClick={() => setIsAuthOpen(false)}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `
                    linear-gradient(135deg, 
                      rgba(239, 68, 68, 0.2) 0%, 
                      rgba(220, 38, 38, 0.25) 50%,
                      rgba(185, 28, 28, 0.2) 100%
                    )
                  `;
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `
                    linear-gradient(135deg, 
                      rgba(239, 68, 68, 0.1) 0%, 
                      rgba(220, 38, 38, 0.15) 50%,
                      rgba(185, 28, 28, 0.1) 100%
                    )
                  `;
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <X className="w-4 h-4 sm:w-4 sm:h-4 text-red-400 group-hover:text-red-300 transition-all duration-300 drop-shadow-sm relative z-10" />
                
                {/* Ripple effect on hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     style={{ background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)' }}></div>
                
                {/* Cross animation lines */}
                <div className="absolute top-1/2 left-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent transform -translate-x-1/2 -translate-y-1/2 rotate-45 group-hover:w-8 transition-all duration-300"></div>
                <div className="absolute top-1/2 left-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent transform -translate-x-1/2 -translate-y-1/2 -rotate-45 group-hover:w-8 transition-all duration-300"></div>
              </button>

              {/* Button glow effect */}
              <div className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                   style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}></div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
              {/* Left side - Branding */}
              <div 
                className="text-white p-3 xs:p-4 sm:p-8 md:w-2/5 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[140px] xs:min-h-[160px] md:min-h-0 pt-10 xs:pt-12 sm:pt-4 md:pt-8"
                style={{
                  background: `
                    radial-gradient(circle at ${mousePos.x * 0.1}px ${mousePos.y * 0.1}px, rgba(55, 114, 255, 0.3) 0%, transparent 50%),
                    linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)
                  `
                }}
              >
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-10 left-10 w-16 h-16 xs:w-20 xs:h-20 rounded-full blur-xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.2) 0%, rgba(41, 53, 143, 0.1) 100%)', animationDuration: '4s' }}></div>
                  <div className="absolute bottom-10 right-10 w-12 h-12 xs:w-16 xs:h-16 rounded-full blur-lg animate-bounce" style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.25) 0%, rgba(30, 38, 62, 0.15) 100%)', animationDuration: '3s' }}></div>
                  <div className="absolute top-1/2 left-1/2 w-8 h-8 xs:w-12 xs:h-12 rounded-full blur-md animate-ping" style={{ background: 'radial-gradient(circle, rgba(67, 126, 255, 0.3) 0%, transparent 70%)', animationDuration: '2s' }}></div>
                </div>

                <div className="mb-4 sm:mb-6 relative z-10">
                  <div className="relative group mb-3 sm:mb-4">
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-2 sm:p-4 backdrop-blur-sm border border-white/20 transition-all duration-500 group-hover:scale-105 group-hover:-rotate-1"
                         style={{ 
                           background: `
                             linear-gradient(135deg, 
                               rgba(55, 114, 255, 0.15) 0%, 
                               rgba(50, 103, 230, 0.1) 50%, 
                               rgba(41, 53, 143, 0.05) 100%
                             )
                           ` 
                         }}>
                      
                      {/* Logo Image */}
                      <div className="relative">
                        <Image 
                          src={Logo} 
                          alt="Logo" 
                          width={220} 
                          height={220} 
                          className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 mx-auto transition-all duration-500 group-hover:scale-110 drop-shadow-lg object-contain" 
                        />
                        
                        {/* Animated glow behind logo */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-blue-600/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>
                      </div>
                      
                      {/* Shimmer overlay effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1200 ease-out"></div>
                      
                      {/* Subtle border glow */}
                      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/30 transition-all duration-500"></div>
                      
                      {/* Corner accents */}
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/20 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/20 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    {/* Floating particles effect */}
                    <div className="absolute -top-2 -left-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="absolute -bottom-2 -right-1 w-2 h-2 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">{translations.welcome}</h2>
                  <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed opacity-90 px-2 md:px-0">{translations.description}</p>
                </div>

                {/* Premium Glass Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
              </div>

              {/* Right side - Form */}
              <div className="flex-1 p-3 xs:p-4 sm:p-6 md:p-8 flex flex-col overflow-hidden">
                <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div ref={wrapperRef} className="relative overflow-hidden mt-3 xs:mt-4 sm:mt-6 flex-1 min-h-0">
                  <div ref={formContainerRef} className="h-full overflow-y-auto scroll-smooth">
                    <form ref={formElementRef} onSubmit={handleSubmit} className="min-h-full flex flex-col">
                      <div className="space-y-2 xs:space-y-3 sm:space-y-4 flex-1">
                      {activeTab === "login" ? (
                        <>
                          <InputField
                            name="email"
                            type="email"
                            placeholder={translations.email}
                            icon={Mail}
                            value={formData.email}
                            autoComplete="email"
                            onChange={handleChange}
                            validationError={validationErrors.email}
                            loading={loading}
                          />
                          <InputField
                            name="password"
                            placeholder={translations.password}
                            icon={Lock}
                            value={formData.password}
                            autoComplete="current-password"
                            showPasswordToggle
                            onChange={handleChange}
                            validationError={validationErrors.password}
                            loading={loading}
                            showPassword={showPassword}
                            onTogglePassword={handleTogglePassword}
                          />
                          <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center cursor-pointer group">
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  className="absolute opacity-0 w-4 h-4 xs:w-5 xs:h-5 cursor-pointer" 
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <div className={`w-4 h-4 xs:w-5 xs:h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center ${
                                  rememberMe 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500' 
                                    : 'border-gray-300/60 bg-gray-50/30 group-hover:border-blue-400/80 group-hover:bg-blue-50/50'
                                }`}
                                     style={{
                                       boxShadow: '0 0 0 1px rgba(156, 163, 175, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                     }}>
                                  <svg className={`w-2.5 h-2.5 xs:w-3 xs:h-3 text-white transition-all duration-200 transform ${
                                    rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                
                                {/* Checkbox glow effect */}
                                <div className={`absolute inset-0 rounded-md transition-opacity duration-300 pointer-events-none ${
                                  rememberMe ? 'opacity-20' : 'opacity-0'
                                }`}
                                     style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)' }}></div>
                              </div>
                              <span className={`ml-2 xs:ml-3 font-medium select-none transition-colors duration-200 ${
                                rememberMe ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-700'
                              }`}>{translations.rememberMe}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsForgotOpen(true)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {translations.forgotPassword}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
                            <InputField
                              name="first_name"
                              placeholder={translations.firstName}
                              icon={User}
                              value={formData.first_name}
                              autoComplete="given-name"
                              onChange={handleChange}
                              validationError={validationErrors.first_name}
                              loading={loading}
                            />
                            <InputField
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
                          <InputField
                            name="email"
                            type="email"
                            placeholder={translations.email}
                            icon={Mail}
                            value={formData.email}
                            autoComplete="email"
                            onChange={handleChange}
                            validationError={validationErrors.email}
                            loading={loading}
                          />
                          <InputField
                            name="phone"
                            type="tel"
                            placeholder={translations.phone}
                            icon={Phone}
                            value={formData.phone}
                            autoComplete="tel"
                            onChange={handleChange}
                            validationError={validationErrors.phone}
                            loading={loading}
                          />
                          <InputField
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
                            onTogglePassword={handleTogglePassword}
                          />
                          <InputField
                            name="confirmPassword"
                            placeholder={translations.confirmPassword}
                            icon={Lock}
                            value={formData.confirmPassword}
                            autoComplete="new-password"
                            showPasswordToggle
                            onChange={handleChange}
                            validationError={validationErrors.confirmPassword}
                            loading={loading}
                            showConfirmPassword={showConfirmPassword}
                            onTogglePassword={handleTogglePassword}
                          />
                        </>
                      )}
                      </div>

                      {/* Error and Submit Button - Fixed at bottom */}
                      <div className="mt-auto pt-2 xs:pt-3 sm:pt-4 space-y-2 xs:space-y-3 sm:space-y-4">
                        <ErrorAlert error={error} />

                        <button
                        type="submit"
                        disabled={loading}
                        className="w-full group relative overflow-hidden min-h-[44px] xs:min-h-[48px] sm:min-h-[52px] px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-4 rounded-lg sm:rounded-xl text-white font-semibold flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 border-0 outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
                        style={{
                          background: loading 
                            ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)'
                            : 'linear-gradient(135deg, #3772ff 0%, #29358f 50%, #1e40af 100%)',
                          border: '1px solid rgba(55, 114, 255, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5 0%, #3730a3 50%, #1e1b4b 100%)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #3772ff 0%, #29358f 50%, #1e40af 100%)';
                          }
                        }}
                      >
                        {loading && (
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
                            <span className="text-xs sm:text-sm font-medium">Загрузка...</span>
                          </div>
                        )}
                        
                        {!loading && (
                          <span className="relative z-10 text-sm sm:text-base font-semibold tracking-wide">
                            {activeTab === "login" ? translations.loginButton : translations.registerButton}
                          </span>
                        )}
                        
                        {/* Animated background */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" 
                             style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(55, 48, 163, 0.2) 100%)' }}></div>
                        
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                        
                        {/* Button glow effect */}
                        <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                             style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
                      </button>
                      </div>
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