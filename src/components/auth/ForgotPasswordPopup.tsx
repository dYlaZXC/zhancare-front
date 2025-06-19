"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";

interface ForgotPasswordPopupProps {
  onClose: () => void;
}

const CODE_LENGTH = 6;
const CODE_EXPIRATION_SECONDS = 15 * 60;

const ForgotPasswordPopup: React.FC<ForgotPasswordPopupProps> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "code" || countdown === null) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async () => {
    if (!email) return toast.error("Введите ваш email");
    try {
      setLoading(true);
      await api.post("/auth/forgot-password/", { email });
      toast.success("📧 Код отправлен на вашу почту");
      setStep("code");
      setCountdown(CODE_EXPIRATION_SECONDS);
      setCode(Array(CODE_LENGTH).fill(""));
      codeRefs.current[0]?.focus();
    } catch {
      toast.error("Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (val: string, index: number) => {
    const char = val.toUpperCase();
    if (/^[a-zA-Z0-9]?$/.test(char)) {
      const updated = [...code];
      updated[index] = char;
      setCode(updated);
      setCodeError(null);

      if (char && index < CODE_LENGTH - 1) {
        codeRefs.current[index + 1]?.focus();
      }

      const fullCode = updated.join("");
      if (fullCode.length === CODE_LENGTH && !updated.includes("")) {
        verifyCode(fullCode);
      }
    }
  };

  const verifyCode = async (codeStr: string) => {
    try {
      setLoading(true);
      await api.post("/auth/verify-reset-code/", { email, reset_code: codeStr });
      setStep("password");
    } catch {
      setCode(Array(CODE_LENGTH).fill(""));
      setCodeError("Неверный код. Попробуйте снова.");
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const fullCode = code.join("");
    if (!newPassword || !confirmPassword) return toast.error("Заполните все поля");
    if (newPassword !== confirmPassword) return toast.error("Пароли не совпадают");

    try {
      setLoading(true);
      await api.post("/auth/reset-password/", {
        email,
        reset_code: fullCode,
        new_password: newPassword,
      });
      toast.success("✅ Пароль обновлён");
      setTimeout(() => onClose(), 2000);
    } catch {
      toast.error("Ошибка при сбросе пароля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-xl p-6 w-full max-w-md relative shadow-xl"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-600 text-2xl hover:text-gray-800"
          >
            &times;
          </button>

          <h2 className="text-xl font-semibold mb-6 text-gray-800">Восстановление пароля</h2>

          {step === "email" && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите ваш email"
                className="w-full px-4 py-3 mb-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
              />
              <button
                onClick={handleSendCode}
                className="w-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
              >
                {loading ? "Отправка..." : "Отправить код на почту"}
              </button>
            </>
          )}

          {step === "code" && (
            <>
              <div className="flex gap-2 justify-center mb-4">
                {code.map((char, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={char}
                    onChange={(e) => handleCodeChange(e.target.value, i)}
                    ref={(el) => {
                      codeRefs.current[i] = el;
                    }}
                    className="w-10 h-12 text-center text-lg border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                  />
                ))}
              </div>
              {codeError && (
                <p className="text-red-500 text-center text-sm mb-3">{codeError}</p>
              )}

              <div className="flex justify-between text-sm text-gray-600 mb-4">
                {countdown !== null ? (
                  <span>Код истечёт через: {formatCountdown(countdown)}</span>
                ) : (
                  <span className="text-red-500">Код истёк</span>
                )}
                <button
                  onClick={handleSendCode}
                  className="text-blue-600 hover:underline font-medium"
                  disabled={loading}
                >
                  Отправить снова
                </button>
              </div>
            </>
          )}

          {step === "password" && (
            <>
              <input
                type="password"
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 mb-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
              />
              <input
                type="password"
                placeholder="Подтвердите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 mb-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
              />
              <button
                onClick={handleResetPassword}
                className="w-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
              >
                {loading ? "Обновление..." : "Сбросить пароль"}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ForgotPasswordPopup;
