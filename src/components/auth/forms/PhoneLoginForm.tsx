"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, KeyRound, Loader2, Shield, ArrowLeft, RefreshCw } from "lucide-react";
import AuthInput from "./AuthInput";
import { api } from "@/utils/api";

interface PhoneLoginFormProps {
  onSuccess: (accessToken: string, refreshToken: string, user: any) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export default function PhoneLoginForm({ onSuccess, loading, setLoading }: PhoneLoginFormProps) {
  const [step, setStep]           = useState<"phone" | "code">("phone");
  const [phone, setPhone]         = useState("");
  const [code, setCode]           = useState("");
  const [error, setError]         = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Format as user types: +7 (777) 123 45 67
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

  const startCooldown = () => {
    setResendCooldown(60);
    const iv = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    const clean = e164(phone);
    if (clean.length < 11) { setError("Введите корректный номер телефона"); return; }

    setLoading(true);
    try {
      await api.post("/auth/send-otp/", { phone: clean });
      setStep("code");
      startCooldown();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Не удалось отправить код. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length < 4) { setError("Введите код из SMS"); return; }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp/", { phone: e164(phone), code });
      onSuccess(res.data.access_token, res.data.refresh_token, res.data.user ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Неверный или просроченный код.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {step === "phone" ? (
        <motion.form
          key="phone-step"
          onSubmit={handleSendOtp}
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
        >
          <AuthInput
            name="phone"
            type="tel"
            placeholder="+7 (777) 123 45 67"
            icon={Phone}
            value={phone}
            autoComplete="tel"
            onChange={e => setPhone(formatPhone(e.target.value))}
            validationError={error}
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
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Отправка...</span></>
              ) : (
                <><Phone className="w-5 h-5" /><span>Получить код</span></>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>

          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Код придёт через SMS</span>
          </div>
        </motion.form>
      ) : (
        <motion.form
          key="code-step"
          onSubmit={handleVerifyOtp}
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Back + phone hint */}
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => { setStep("phone"); setCode(""); setError(""); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm text-gray-500">
              Код отправлен на <span className="font-semibold text-gray-700">{phone}</span>
            </span>
          </div>

          <AuthInput
            name="code"
            type="text"
            placeholder="Введите 6-значный код"
            icon={KeyRound}
            value={code}
            autoComplete="one-time-code"
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            validationError={error}
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
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Проверка...</span></>
              ) : (
                <><Shield className="w-5 h-5" /><span>Войти</span></>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>

          {/* Resend */}
          <div className="text-center text-sm">
            {resendCooldown > 0 ? (
              <span className="text-gray-400">Отправить повторно через {resendCooldown}с</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-[#3772ff] hover:underline font-medium flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Отправить код повторно
              </button>
            )}
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
