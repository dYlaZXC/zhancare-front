"use client";

import { useState, useCallback, FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Shield } from "lucide-react";
import AuthInput from "./AuthInput";

interface LoginFormProps {
  translations: any;
  onSubmit: (data: LoginFormData) => Promise<void>;
  onForgotPassword: () => void;
  loading: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginForm = ({ translations, onSubmit, onForgotPassword, loading }: LoginFormProps) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<LoginFormData>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = useCallback((): boolean => {
    const errors: Partial<LoginFormData> = {};

    if (!formData.email || !validateEmail(formData.email)) {
      errors.email = "Введите корректный email адрес";
    }

    if (!formData.password || !validatePassword(formData.password)) {
      errors.password = "Пароль должен содержать минимум 8 символов";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (validationErrors[name as keyof LoginFormData]) {
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

      <AuthInput
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
        onTogglePassword={() => setShowPassword(prev => !prev)}
      />

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-sm pt-2">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 text-[#3772ff] border-[#e8e8e8] rounded focus:ring-2 focus:ring-[#ebf1ff] cursor-pointer"
            checked={formData.rememberMe}
            onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
          />
          <span className="ml-2.5 text-[#1b1b1b] font-medium group-hover:text-[#3772ff] transition-colors">
            {translations.rememberMe}
          </span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-[#3772ff] hover:text-[#3267e6] font-medium transition-colors hover:underline"
        >
          {translations.forgotPassword}
        </button>
      </div>

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
              {translations.loginButton}
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

export default LoginForm;
