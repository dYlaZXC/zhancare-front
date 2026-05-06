"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Phone, Lock, Loader2, Shield } from "lucide-react";
import AuthInput from "./AuthInput";
import { api } from "@/utils/api";

interface PhoneLoginFormProps {
  onSuccess: (accessToken: string, refreshToken: string, user: any) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export default function PhoneLoginForm({ onSuccess, loading, setLoading }: PhoneLoginFormProps) {
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]     = useState<{ phone?: string; password?: string }>({});

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("7") || digits.startsWith("8")) {
      const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
      const p = d.slice(1);
      let out = "+7";
      if (p.length > 0) out += " (" + p.slice(0, 3);
      if (p.length >= 3) out += ") " + p.slice(3, 6);
      if (p.length >= 6) out += " " + p.slice(6, 8);
      if (p.length >= 8) out += " " + p.slice(8, 10);
      return out;
    }
    return raw;
  };

  const e164 = (formatted: string) => "+" + formatted.replace(/\D/g, "");

  const validate = () => {
    const next: typeof errors = {};
    if (e164(phone).length < 11) next.phone = "Введите корректный номер телефона";
    if (password.length < 8)    next.password = "Пароль должен содержать минимум 8 символов";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/login/", { phone: e164(phone), password });
      onSuccess(res.data.access_token, res.data.refresh_token, res.data.user ?? null);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Неправильный номер телефона или пароль.";
      setErrors({ phone: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthInput
        name="phone"
        type="tel"
        placeholder="+7 (777) 123 45 67"
        icon={Phone}
        value={phone}
        autoComplete="tel"
        onChange={e => {
          setPhone(formatPhone(e.target.value));
          if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
        }}
        validationError={errors.phone}
        loading={loading}
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
