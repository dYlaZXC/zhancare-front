"use client";

import { useState, useCallback, FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, User, Lock, Loader2, Shield } from "lucide-react";
import AuthInput from "./AuthInput";

interface RegisterFormProps {
  translations: any;
  onSubmit: (data: RegisterFormData) => Promise<void>;
  loading: boolean;
}

export interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const RegisterForm = ({ translations, onSubmit, loading }: RegisterFormProps) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterFormData>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = useCallback((): boolean => {
    const errors: Partial<RegisterFormData> = {};

    if (!formData.first_name.trim()) {
      errors.first_name = "Имя обязательно";
    }

    if (!formData.last_name.trim()) {
      errors.last_name = "Фамилия обязательна";
    }

    if (!formData.email || !validateEmail(formData.email)) {
      errors.email = "Введите корректный email адрес";
    }

    if (!formData.password || !validatePassword(formData.password)) {
      errors.password = "Пароль должен содержать минимум 8 символов";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (validationErrors[name as keyof RegisterFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [validationErrors]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <AuthInput
          name="first_name"
          placeholder={translations.firstName}
          icon={User}
          value={formData.first_name}
          autoComplete="given-name"
          onChange={handleChange}
          validationError={validationErrors.first_name}
          loading={loading}
        />
        <AuthInput
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

      {/* Email */}
      <AuthInput
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

      {/* Phone */}
      <AuthInput
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

      {/* Password */}
      <AuthInput
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
        onTogglePassword={() => setShowPassword(prev => !prev)}
      />

      {/* Confirm Password */}
      <AuthInput
        name="confirmPassword"
        placeholder={translations.confirmPassword}
        icon={Lock}
        value={formData.confirmPassword}
        autoComplete="new-password"
        showPasswordToggle
        onChange={handleChange}
        validationError={validationErrors.confirmPassword}
        loading={loading}
        showPassword={showConfirmPassword}
        onTogglePassword={() => setShowConfirmPassword(prev => !prev)}
      />

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="relative w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:from-[#3267e6] hover:to-[#214499] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3772ff]/30 hover:shadow-xl hover:shadow-[#3772ff]/40 flex items-center justify-center gap-2.5 group overflow-hidden"
      >
        <span className="relative z-10 text-base sm:text-lg flex items-center gap-2.5">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Загрузка...</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {translations.registerButton}
            </>
          )}
        </span>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </motion.button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
        <Shield className="w-4 h-4 text-green-600" />
        <span>Защищенное соединение 256-bit SSL</span>
      </div>
    </form>
  );
};

export default RegisterForm;
