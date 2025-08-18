"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { toast } from "react-toastify";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import { api } from "@/utils/api";
import Logo from "@/assets/logoLogin.png";

import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import AuthTabs from "@/components/auth/AuthTabs";
import ErrorAlert from "@/components/auth/ErrorAlert";
import ForgotPasswordPopup from "@/components/auth/ForgotPasswordPopup";

const AuthPopup = () => {
  const { isAuthOpen, setIsAuthOpen, loginUser } = useAuth();
  const { language } = useLanguage();
  
  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return ru.auth;
      case "kz":
        return kz.auth;
      case "en":
        return en.auth;
      default:
        return en.auth;
    }
  };

  const translations = getTranslations();

  // Get error message translations
  const getErrorMessages = () => {
    switch (language) {
      case "ru":
        return {
          passwordsMismatch: "❌ Пароли не совпадают!",
          loginSuccess: "✅ Вы успешно вошли!",
          registerSuccess: "✅ Регистрация прошла успешно!",
          generalError: "Произошла ошибка. Попробуйте снова.",
          invalidCredentials: "Неправильный E-mail или пароль.",
          phoneExists: "Пользователь с таким телефоном уже существует.",
          emailExists: "Пользователь с таким email уже существует.",
          errorPrefix: "❌ Ошибка:"
        };
      case "kz":
        return {
          passwordsMismatch: "❌ Құпия сөздер сәйкес келмейді!",
          loginSuccess: "✅ Сіз сәтті кірдіңіз!",
          registerSuccess: "✅ Тіркелу сәтті өтті!",
          generalError: "Қате орын алды. Қайталап көріңіз.",
          invalidCredentials: "Қате E-mail немесе құпия сөз.",
          phoneExists: "Осы телефонмен қолданушы бұрын тіркелген.",
          emailExists: "Осы email-мен қолданушы бұрын тіркелген.",
          errorPrefix: "❌ Қате:"
        };
      case "en":
        return {
          passwordsMismatch: "❌ Passwords do not match!",
          loginSuccess: "✅ You have successfully logged in!",
          registerSuccess: "✅ Registration completed successfully!",
          generalError: "An error occurred. Please try again.",
          invalidCredentials: "Invalid E-mail or password.",
          phoneExists: "User with this phone number already exists.",
          emailExists: "User with this email already exists.",
          errorPrefix: "❌ Error:"
        };
      default:
        return {
          passwordsMismatch: "❌ Passwords do not match!",
          loginSuccess: "✅ You have successfully logged in!",
          registerSuccess: "✅ Registration completed successfully!",
          generalError: "An error occurred. Please try again.",
          invalidCredentials: "Invalid E-mail or password.",
          phoneExists: "User with this phone number already exists.",
          emailExists: "User with this email already exists.",
          errorPrefix: "❌ Error:"
        };
    }
  };

  const errorMessages = getErrorMessages();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Set initial height
  useEffect(() => {
    if (formRef.current && wrapperRef.current) {
      wrapperRef.current.style.height = `${formRef.current.offsetHeight}px`;
    }
  }, []);

  // Animate on tab change
  useEffect(() => {
    if (formRef.current && wrapperRef.current) {
      requestAnimationFrame(() => {
        const formHeight = formRef.current!.offsetHeight;

        gsap.to(wrapperRef.current, {
          height: formHeight,
          duration: 0.45,
          ease: "power2.out",
        });

        gsap.fromTo(
          formRef.current,
          { opacity: 0, y: 30, autoAlpha: 0 },
          { opacity: 1, y: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" }
        );
      });
    }
  }, [activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (activeTab === "register" && formData.password !== formData.confirmPassword) {
      toast.error(errorMessages.passwordsMismatch);
      setError(errorMessages.passwordsMismatch);
      setLoading(false);
      return;
    }

    const apiUrl = activeTab === "login" ? "/auth/login/" : "/auth/register/";
    const payload =
      activeTab === "login"
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            phone: formData.phone || null,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
          };

    try {
      const response = await api.post(apiUrl, payload);
      const data = response.data;

      if (activeTab === "login") {
        loginUser(data.access_token, data.refresh_token, data.user);
        toast.success(errorMessages.loginSuccess);
        window.location.href = data.user.role === "doctor" ? "/doctor-profile" : "/profile";
      } else {
        toast.success(errorMessages.registerSuccess);
        setActiveTab("login");
      }

      setFormData({
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
      });

      setIsAuthOpen(false);
    } catch (err: any) {
      const errorData = err?.response?.data;
      let errorMessage = errorMessages.generalError;

      if (activeTab === "login" && err?.response?.status === 401) {
        errorMessage = errorMessages.invalidCredentials;
      } else {
        const fieldErrors: string[] = [];
        const details = errorData?.details ?? errorData;

        if (details && typeof details === "object") {
          for (const field in details) {
            const messages = details[field];
            if (Array.isArray(messages)) {
              messages.forEach((msg: string) => {
                const friendlyMessage =
                  field === "phone" && msg.includes("существует")
                    ? errorMessages.phoneExists
                    : field === "email" && msg.includes("существует")
                    ? errorMessages.emailExists
                    : msg;
                fieldErrors.push(friendlyMessage);
              });
            }
          }
        }

        if (errorData?.detail) {
          fieldErrors.push(errorData.detail);
        }

        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join(". ");
        }
      }

      toast.error(`${errorMessages.errorPrefix} ${errorMessage}`);
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
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-6 rounded-xl shadow-lg w-full max-w-[90%] sm:max-w-[450px] md:max-w-[750px] relative"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-3xl"
            >
              &times;
            </button>

            <div className="flex flex-col md:flex-row p-4 md:p-8 gap-6 md:gap-8 items-center">
              <div className="text-center md:text-left w-full md:w-1/2">
                <div className="flex justify-center md:justify-start mb-4">
                  <Image src={Logo} alt="Logo" width={100} height={100} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{translations.welcome}</h2>
                <p className="text-gray-600 mt-2 md:mt-6 text-sm">{translations.description}</p>
              </div>

              <div className="w-full md:w-1/2">
                <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div ref={wrapperRef} className="relative overflow-hidden transition-all duration-300">
                  <div ref={formRef} className="pb-6 min-h-[260px]">
                    {activeTab === "login" ? (
                      <LoginForm
                        formData={formData}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        loading={loading}
                        onForgotPassword={() => setIsForgotOpen(true)}
                      />
                    ) : (
                      <RegisterForm
                        formData={formData}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        loading={loading}
                      />
                    )}
                  </div>
                </div>

                <ErrorAlert error={error} />
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