"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

interface Props {
  formData: {
    email: string;
    password: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  onForgotPassword?: () => void; // optional if you implement password reset
}

const LoginForm: React.FC<Props> = ({ 
  formData, 
  onChange, 
  onSubmit, 
  loading, 
  onForgotPassword 
}) => {
  const { language } = useLanguage();

  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return {
          email: ru.auth.email,
          password: ru.auth.password,
          loginButton: ru.auth.loginButton,
          forgotPassword: ru.auth.forgotPassword
        };
      case "kz":
        return {
          email: kz.auth.email,
          password: kz.auth.password,
          loginButton: kz.auth.loginButton,
          forgotPassword: kz.auth.forgotPassword
        };
      case "en":
        return {
          email: en.auth.email,
          password: en.auth.password,
          loginButton: en.auth.loginButton,
          forgotPassword: en.auth.forgotPassword
        };
      default:
        return {
          email: en.auth.email,
          password: en.auth.password,
          loginButton: en.auth.loginButton,
          forgotPassword: en.auth.forgotPassword
        };
    }
  };

  const translations = getTranslations();

  return (
    <form onSubmit={onSubmit} className="text-black mt-4 md:mt-6">
      <input
        name="email"
        type="email"
        placeholder={translations.email}
        value={formData.email}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
        autoComplete="email"
      />
      <input
        name="password"
        type="password"
        placeholder={translations.password}
        value={formData.password}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
        autoComplete="current-password"
      />
      
      <div className="text-right text-sm mb-4">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-gray-500 hover:underline"
        >
          {translations.forgotPassword}
        </button>
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
    </form>
  );
};

export default LoginForm;