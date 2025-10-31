"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  translations: any;
  onBack: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const CODE_LENGTH = 6;
const CODE_EXPIRATION_SECONDS = 15 * 60;
const RESEND_COOLDOWN_SECONDS = 15 * 60; // 15 minutes cooldown

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  translations,
  onBack,
  loading,
  setLoading,
}) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Code expiration countdown timer
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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown === null) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async () => {
    if (!email) return toast.error(translations.enterEmail || "Enter your email");

    // Check if resend cooldown is active
    if (resendCooldown !== null && resendCooldown > 0) {
      const minutesLeft = Math.ceil(resendCooldown / 60);
      toast.error(
        translations.resendCooldownMessage?.replace("{minutes}", minutesLeft.toString()) ||
        `Please wait ${minutesLeft} minutes before requesting a new code`
      );
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/forgot-password/", { email });
      toast.success(translations.codeSent || "Code sent to your email");
      setStep("code");
      setCountdown(CODE_EXPIRATION_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS); // Start 15-minute cooldown
      setCode(Array(CODE_LENGTH).fill(""));
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      toast.error(translations.failedToSend || "Failed to send code");
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
      setCodeError(translations.incorrectCode || "Incorrect code. Try again.");
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const fullCode = code.join("");
    if (!newPassword || !confirmPassword)
      return toast.error(translations.fillAllFields || "Fill all fields");
    if (newPassword !== confirmPassword)
      return toast.error(translations.passwordsMismatch || "Passwords don't match");

    try {
      setLoading(true);
      await api.post("/auth/reset-password/", {
        email,
        reset_code: fullCode,
        new_password: newPassword,
      });
      toast.success(translations.passwordUpdated || "Password updated successfully");
      setTimeout(() => onBack(), 2000);
    } catch {
      toast.error(translations.resetError || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#3772ff] transition-colors duration-200 font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
        {translations.backToLogin || "Back to login"}
      </button>

      {/* Title */}
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          {translations.forgotPasswordTitle || "Password Recovery"}
        </h3>
        <div className="w-12 h-1 bg-gradient-to-r from-[#3772ff] to-[#2956bf] rounded-full mx-auto"></div>
      </div>

      {/* Email Step */}
      {step === "email" && (
        <div className="space-y-4">
          <div className="relative group">
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200"
              style={{
                background: email
                  ? "rgba(55, 114, 255, 0.1)"
                  : "rgba(156, 163, 175, 0.1)",
              }}
            >
              <Mail
                className={`w-4 h-4 transition-colors duration-200 ${
                  email ? "text-[#3772ff]" : "text-gray-500"
                }`}
              />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={translations.enterEmail || "Enter your email"}
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3772ff] focus:ring-4 focus:ring-[#3772ff]/10 transition-all duration-200 outline-none bg-white text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSendCode}
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#3772ff]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{translations.sending || "Sending..."}</span>
              </>
            ) : (
              <span>{translations.sendCode || "Send code to email"}</span>
            )}
          </button>
        </div>
      )}

      {/* Code Step */}
      {step === "code" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            {translations.codeDescription ||
              "Enter the 6-digit code sent to your email"}
          </p>

          <div className="flex gap-2 justify-center">
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
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 ${
                  char
                    ? "border-2 border-[#3772ff] bg-[#3772ff]/5 text-[#3772ff]"
                    : codeError
                    ? "border-2 border-red-300 bg-red-50 text-red-900"
                    : "border-2 border-gray-200 bg-white text-gray-900"
                }`}
                disabled={loading}
              />
            ))}
          </div>

          {codeError && (
            <div className="text-center">
              <p className="text-red-600 text-sm font-medium">{codeError}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-gray-50 border border-gray-200">
              {countdown !== null ? (
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
                  {translations.codeExpiresIn || "Code expires in:"}{" "}
                  <span className="font-mono text-[#3772ff]">
                    {formatCountdown(countdown)}
                  </span>
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                  {translations.codeExpired || "Code expired"}
                </span>
              )}
              <button
                onClick={handleSendCode}
                className={`font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  resendCooldown && resendCooldown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[#3772ff] hover:text-[#2956bf] hover:bg-[#3772ff]/5"
                }`}
                disabled={loading || (resendCooldown !== null && resendCooldown > 0)}
              >
                {translations.sendAgain || "Send again"}
              </button>
            </div>

            {/* Resend Cooldown Display */}
            {resendCooldown !== null && resendCooldown > 0 && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                <div className="text-sm text-orange-700 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse inline-block"></span>
                  {translations.resendAvailableIn || "Resend available in:"}{" "}
                  <span className="font-mono text-orange-600">
                    {formatCountdown(resendCooldown)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Step */}
      {step === "password" && (
        <div className="space-y-4">
          {/* New Password */}
          <div className="relative group">
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200"
              style={{
                background: newPassword
                  ? "rgba(55, 114, 255, 0.1)"
                  : "rgba(156, 163, 175, 0.1)",
              }}
            >
              <Lock
                className={`w-4 h-4 transition-colors duration-200 ${
                  newPassword ? "text-[#3772ff]" : "text-gray-500"
                }`}
              />
            </div>

            <input
              type={showPassword ? "text" : "password"}
              placeholder={translations.newPassword || "New password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3772ff] focus:ring-4 focus:ring-[#3772ff]/10 transition-all duration-200 outline-none bg-white text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative group">
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200"
              style={{
                background: confirmPassword
                  ? "rgba(55, 114, 255, 0.1)"
                  : "rgba(156, 163, 175, 0.1)",
              }}
            >
              <Lock
                className={`w-4 h-4 transition-colors duration-200 ${
                  confirmPassword ? "text-[#3772ff]" : "text-gray-500"
                }`}
              />
            </div>

            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder={translations.confirmPassword || "Confirm password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3772ff] focus:ring-4 focus:ring-[#3772ff]/10 transition-all duration-200 outline-none bg-white text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#3772ff]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{translations.updating || "Updating..."}</span>
              </>
            ) : (
              <span>{translations.resetPassword || "Reset password"}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
