"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ErrorAlertProps {
  error: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  const { language } = useLanguage();

  if (!error) {
    return <div className="min-h-[3rem]"></div>;
  }

  // Get common error translations
  const getErrorTranslations = () => {
    const commonErrors = {
      ru: {
        "Invalid email or password": "Неверный email или пароль",
        "Email already exists": "Email уже существует",
        "Password too weak": "Пароль слишком слабый",
        "Network error": "Ошибка сети",
        "Server error": "Ошибка сервера",
        "Required field": "Обязательное поле",
        "Invalid email format": "Неверный формат email",
        "Passwords do not match": "Пароли не совпадают",
        "User not found": "Пользователь не найден",
        "Account locked": "Аккаунт заблокирован",
        "Session expired": "Сессия истекла"
      },
      kz: {
        "Invalid email or password": "Қате email немесе құпия сөз",
        "Email already exists": "Email бұрын тіркелген",
        "Password too weak": "Құпия сөз тым әлсіз",
        "Network error": "Желі қатесі",
        "Server error": "Сервер қатесі",
        "Required field": "Міндетті өріс",
        "Invalid email format": "Қате email форматы",
        "Passwords do not match": "Құпия сөздер сәйкес келмейді",
        "User not found": "Қолданушы табылмады",
        "Account locked": "Аккаунт бұғатталған",
        "Session expired": "Сессия мерзімі бітті"
      },
      en: {
        "Invalid email or password": "Invalid email or password",
        "Email already exists": "Email already exists",
        "Password too weak": "Password too weak",
        "Network error": "Network error",
        "Server error": "Server error",
        "Required field": "Required field",
        "Invalid email format": "Invalid email format",
        "Passwords do not match": "Passwords do not match",
        "User not found": "User not found",
        "Account locked": "Account locked",
        "Session expired": "Session expired"
      }
    };

    return commonErrors[language as keyof typeof commonErrors] || commonErrors.en;
  };

  // Translate error message if it matches common errors
  const translateError = (errorText: string) => {
    const translations = getErrorTranslations();
    
    // Check if the error matches any common error patterns
    for (const [englishError, translatedError] of Object.entries(translations)) {
      if (errorText.toLowerCase().includes(englishError.toLowerCase())) {
        return translatedError;
      }
    }
    
    // If no translation found, return original error
    return errorText;
  };

  const lines = error.split(/[.]\s*/).filter(Boolean); // split by period & trim

  return (
    <div className="bg-red-100 text-red-700 rounded-lg p-3 text-sm shadow-sm min-h-[3rem] flex flex-col justify-center">
      {lines.map((line, index) => (
        <p key={index} className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 mt-[2px] flex-shrink-0" />
          <span className="leading-tight">{translateError(line.trim())}</span>
        </p>
      ))}
    </div>
  );
};

export default ErrorAlert;