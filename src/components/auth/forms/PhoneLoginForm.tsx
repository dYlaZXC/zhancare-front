"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, Shield } from "lucide-react";
import AuthInput from "./AuthInput";
import PhoneInput from "@/components/ui/PhoneInput";
import { isPhoneComplete } from "@/utils/phoneFormat";
import { api } from "@/utils/api";

interface PhoneLoginFormProps {
  onSuccess: (accessToken: string, refreshToken: string, user: any) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export default function PhoneLoginForm({ onSuccess, loading, setLoading }: PhoneLoginFormProps) {
  // phone is always stored as E.164 (+7XXXXXXXXXX) — PhoneAuthInput emits that
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]     = useState<{ phone?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!isPhoneComplete(phone)) next.phone = "Введите корректный номер телефона";
    if (password.length < 8)    next.password = "Пароль должен содержать минимум 8 символов";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // phone is already E.164 — send directly
      const res = await api.post("/auth/login/", { phone, password });
      onSuccess(res.data.access_token, res.data.refresh_token, res.data.user ?? null);
    } catch (err: any) {
      const msg = err?.response?.status === 403
        ? "Извините, ваш аккаунт был деактивирован. Обратитесь к администратору."
        : err?.response?.data?.error ?? "Неправильный номер телефона или пароль.";
      setErrors({ phone: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhoneInput
        name="phone"
        value={phone}
        onChange={(e164) => {
          setPhone(e164);
          if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
        }}
        error={errors.phone}
        disabled={loading}
        defaultCountry="KZ"
      />

      <AuthInput
        name="password"
        placeholder="Пароль"
        icon={Lock}
        value={password}
        autoComplete="current-password"
        showPasswordToggle
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(p => !p)}
        onChange={e => {
          setPassword(e.target.value);
          if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
        }}
        validationError={errors.password}
        loading={loading}
      />

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="relative w-full mt-2 px-6 py-4 bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:from-[#3267e6] hover:to-[#214499] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3772ff]/30 flex items-center justify-center gap-2.5 overflow-hidden group"
      >
        <span className="relative z-10 text-base sm:text-lg flex items-center gap-2.5">
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>Загрузка...</span></>
          ) : (
            <><Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" /><span>Войти</span></>
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </motion.button>

      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
        <Shield className="w-4 h-4 text-green-600" />
        <span>Защищенное соединение 256-bit SSL</span>
      </div>
    </form>
  );
}
