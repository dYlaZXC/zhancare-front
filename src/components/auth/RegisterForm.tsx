"use client";

import React from "react";
import PhoneInput from "@/components/ui/PhoneInput";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

interface Props {
  formData: {
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

const RegisterForm: React.FC<Props> = ({ 
  formData, 
  onChange, 
  onSubmit, 
  loading 
}) => {
  const { language } = useLanguage();

  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return {
          firstName: ru.auth.firstName,
          lastName: ru.auth.lastName,
          email: ru.auth.email,
          phone: ru.auth.phone,
          password: ru.auth.password,
          confirmPassword: ru.auth.confirmPassword,
          registerButton: ru.auth.registerButton
        };
      case "kz":
        return {
          firstName: kz.auth.firstName,
          lastName: kz.auth.lastName,
          email: kz.auth.email,
          phone: kz.auth.phone,
          password: kz.auth.password,
          confirmPassword: kz.auth.confirmPassword,
          registerButton: kz.auth.registerButton
        };
      case "en":
        return {
          firstName: en.auth.firstName,
          lastName: en.auth.lastName,
          email: en.auth.email,
          phone: en.auth.phone,
          password: en.auth.password,
          confirmPassword: en.auth.confirmPassword,
          registerButton: en.auth.registerButton
        };
      default:
        return {
          firstName: en.auth.firstName,
          lastName: en.auth.lastName,
          email: en.auth.email,
          phone: en.auth.phone,
          password: en.auth.password,
          confirmPassword: en.auth.confirmPassword,
          registerButton: en.auth.registerButton
        };
    }
  };

  const translations = getTranslations();

  return (
    <form onSubmit={onSubmit} className="text-black mt-4 md:mt-6">
      <input
        name="last_name"
        type="text"
        autoFocus
        placeholder={translations.lastName}
        value={formData.last_name}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
      />
      <input
        name="first_name"
        type="text"
        placeholder={translations.firstName}
        value={formData.first_name}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
      />
      <input
        name="email"
        type="email"
        placeholder={translations.email}
        value={formData.email}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
      />
      <PhoneInput
        name="phone"
        value={formData.phone}
        onChange={(e164) => {
          const syntheticEvent = { target: { name: "phone", value: e164 } } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }}
        defaultCountry="KZ"
        className="mb-3"
        inputClassName="py-3 md:py-4 bg-gray-100 border-gray-300"
      />
      <input
        name="password"
        type="password"
        placeholder={translations.password}
        value={formData.password}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
        autoComplete="new-password"
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder={translations.confirmPassword}
        value={formData.confirmPassword}
        onChange={onChange}
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
    </form>
  );
};

export default RegisterForm;