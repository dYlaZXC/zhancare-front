"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

interface AuthTabsProps {
  activeTab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
}

const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
  const { language } = useLanguage();

  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return {
          login: ru.auth.login,
          register: ru.auth.register
        };
      case "kz":
        return {
          login: kz.auth.login,
          register: kz.auth.register
        };
      case "en":
        return {
          login: en.auth.login,
          register: en.auth.register
        };
      default:
        return {
          login: en.auth.login,
          register: en.auth.register
        };
    }
  };

  const translations = getTranslations();

  return (
    <div className="flex border-b mb-4 w-full">
      <button
        className={`flex-1 text-center py-2 font-medium ${
          activeTab === "login"
            ? "border-b-2 border-black text-black"
            : "text-gray-500 hover:text-black"
        }`}
        onClick={() => onTabChange("login")}
      >
        {translations.login}
      </button>
      <button
        className={`flex-1 text-center py-2 font-medium ${
          activeTab === "register"
            ? "border-b-2 border-black text-black"
            : "text-gray-500 hover:text-black"
        }`}
        onClick={() => onTabChange("register")}
      >
        {translations.register}
      </button>
    </div>
  );
};

export default AuthTabs;