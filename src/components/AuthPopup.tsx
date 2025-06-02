"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import Image from "next/image";
import Logo from "@/assets/logoLogin.png";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import { api } from "@/utils/api";
import { AlertTriangle } from "lucide-react";

const AuthPopup = () => {
  const { isAuthOpen, setIsAuthOpen, loginUser } = useAuth();
  const { language } = useLanguage();
  const translations = language === "ru" ? ru.auth : kz.auth;

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (activeTab === "register" && formData.password !== formData.confirmPassword) {
      const passwordError = "❌ Пароли не совпадают!";
      setError(passwordError);
      toast.error(passwordError);
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
        toast.success("✅ Вы успешно вошли!");
        const redirectTo = data.user.role === "doctor" ? "/doctor-profile" : "/profile";
        window.location.href = redirectTo;
      } else {
        toast.success("✅ Регистрация прошла успешно!");
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
      console.log("🚨 errorData:", errorData);

      let errorMessage = "Произошла ошибка. Попробуйте снова.";

      if (activeTab === "login" && err?.response?.status === 401) {
        // Show friendly login error for invalid credentials
        errorMessage = "Неправильный E-mail или пароль. Пожалуйста, проверьте данные и попробуйте снова.";
      } else {
        const fieldErrors: string[] = [];
        const details = errorData?.details ?? errorData;

        if (details && typeof details === "object") {
          for (const field in details) {
            const messages = details[field];
            if (Array.isArray(messages)) {
              messages.forEach((msg: string) => {
                if (msg.includes("with this") || msg.includes("уже существует")) {
                  const friendlyMessage =
                    field === "phone"
                      ? "Пользователь с таким телефоном уже существует."
                      : field === "email"
                      ? "Пользователь с таким email уже существует."
                      : msg;
                  fieldErrors.push(friendlyMessage);
                } else {
                  fieldErrors.push(msg);
                }
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

      setError(errorMessage);
      toast.error(`❌ Ошибка: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthOpen) return null;

  return (
    <AnimatePresence>
      {isAuthOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-lg w-full max-w-[90%] sm:max-w-[450px] md:max-w-[750px] relative"
          >
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-3xl"
              onClick={() => setIsAuthOpen(false)}
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
                <div className="flex border-b mb-4 w-full">
                  <button
                    className={`flex-1 text-center py-2 font-medium ${
                      activeTab === "login"
                        ? "border-b-2 border-black text-black"
                        : "text-gray-500 hover:text-black"
                    }`}
                    onClick={() => setActiveTab("login")}
                  >
                    {translations.login}
                  </button>
                  <button
                    className={`flex-1 text-center py-2 font-medium ${
                      activeTab === "register"
                        ? "border-b-2 text-black border-black"
                        : "text-gray-500 hover:text-black"
                    }`}
                    onClick={() => setActiveTab("register")}
                  >
                    {translations.register}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="text-black mt-4 md:mt-6">
                  {activeTab === "login" ? (
                    <>
                      <input
                        name="email"
                        type="email"
                        placeholder={translations.email}
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
                        required
                        autoComplete="email"
                      />
                      <input
                        name="password"
                        type="password"
                        placeholder={translations.password}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
                        required
                        autoComplete="current-password"
                      />
                      <div className="text-right text-sm mb-4">
                        <a href="#" className="text-gray-500 hover:underline">
                          {translations.forgotPassword}
                        </a>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white py-3 md:py-4 rounded-lg font-medium hover:opacity-85 transition flex justify-center items-center gap-2"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          translations.loginButton
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        name="last_name"
                        type="text"
                        autoFocus
                        placeholder={translations.lastName}
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
                        required
                      />
                      <input
                        name="first_name"
                        type="text"
                        placeholder={translations.firstName}
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
                        required
                      />
                      <input
                        name="email"
                        type="email"
                        placeholder={translations.email}
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
                        required
                      />
                      <input
                        name="phone"
                        type="tel"
                        placeholder={translations.phone}
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
                      />
                      <input
                        name="password"
                        type="password"
                        placeholder={translations.password}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
                        required
                        autoComplete="new-password"
                      />
                      <input
                        name="confirmPassword"
                        type="password"
                        placeholder={translations.confirmPassword}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white py-3 md:py-4 rounded-lg font-medium hover:opacity-85 transition flex justify-center items-center gap-2"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          translations.registerButton
                        )}
                      </button>
                    </>
                  )}
                </form>

                {error && (
                  <div className="bg-red-100 text-red-700 rounded-lg p-3 mt-3 text-sm shadow-sm">
                    {error.split(/[.]\s*/).filter(Boolean).map((line, index) => (
                      <p key={index} className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-500" />
                        {line.trim()}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthPopup;
