"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { api, getAccessToken } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import PdfViewerModal from "./auth/PdfViewerModal";

export default function ForceChangePasswordModal() {
  const { mustChangePassword, clearMustChangePassword, updateUser, user } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [consentInformAgreement, setConsentInformAgreement] = useState(false);
  const [consentOffer, setConsentOffer] = useState(false);
  const allConsentsChecked = consentPersonalData && consentInformAgreement && consentOffer;

  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: "",
  });
  const openPdfModal = (docType: string, title: string) =>
    setPdfModal({ isOpen: true, url: `/docs/${docType}_rus.pdf`, title });
  const closePdfModal = () => setPdfModal({ isOpen: false, url: "", title: "" });

  if (!mustChangePassword) return null;

  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ["", "Слабый", "Средний", "Хороший", "Надёжный"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Минимум 8 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (!allConsentsChecked) {
      setError("Необходимо принять все условия ниже");
      return;
    }

    setLoading(true);
    try {
      // Ensure Authorization header is set before the call
      const token = getAccessToken();
      if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      await api.post("/auth/change-password/", { new_password: newPassword });
      updateUser({ must_change_password: false });
      clearMustChangePassword();
      toast.success("Пароль успешно изменён! Добро пожаловать!");

      const roles: string[] = user?.roles ?? [];
      let redirectUrl = "/patient/video";
      if (roles.includes("doctor")) redirectUrl = "/doctor/consultations";
      else if (roles.includes("nurse")) redirectUrl = "/nurse/home-visits";
      else if (roles.includes("admin")) redirectUrl = "/admin/profile";
      setTimeout(() => { window.location.href = redirectUrl; }, 800);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Ошибка при смене пароля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: "#ffffff" }}
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #3b82f6, #6366f1)" }} />

          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #eff6ff, #e0e7ff)" }}>
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Смена пароля</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Ваш аккаунт был создан администратором.<br />
              Пожалуйста, установите собственный пароль для продолжения.
            </p>
            {user?.first_name && (
              <p className="text-sm font-semibold text-blue-600 mt-1">
                Привет, {user.first_name}!
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {/* New password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Новый пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-sm font-mono"
                  placeholder="Минимум 8 символов"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Подтвердите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-sm font-mono"
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword && newPassword && (
                <p className={`text-xs mt-1 font-medium ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                  {newPassword === confirmPassword ? "✓ Пароли совпадают" : "✗ Пароли не совпадают"}
                </p>
              )}
            </div>

            {/* Consent checkboxes */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="fcp-consentPersonalData"
                  checked={consentPersonalData}
                  onChange={(e) => { setConsentPersonalData(e.target.checked); setError(null); }}
                  disabled={loading}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="fcp-consentPersonalData" className="text-sm text-gray-700 leading-tight cursor-pointer">
                  Я согласен с{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); openPdfModal("consent_to_the_collection_of_personal_data", "Согласие на сбор персональных данных"); }}
                    className="text-blue-600 hover:text-blue-700 underline focus:outline-none"
                  >
                    согласием на сбор персональных данных
                  </button>
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="fcp-consentInformAgreement"
                  checked={consentInformAgreement}
                  onChange={(e) => { setConsentInformAgreement(e.target.checked); setError(null); }}
                  disabled={loading}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="fcp-consentInformAgreement" className="text-sm text-gray-700 leading-tight cursor-pointer">
                  Я согласен с{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); openPdfModal("inform_aggrement", "Информированное согласие"); }}
                    className="text-blue-600 hover:text-blue-700 underline focus:outline-none"
                  >
                    информированным согласием
                  </button>
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="fcp-consentOffer"
                  checked={consentOffer}
                  onChange={(e) => { setConsentOffer(e.target.checked); setError(null); }}
                  disabled={loading}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="fcp-consentOffer" className="text-sm text-gray-700 leading-tight cursor-pointer">
                  Я согласен с{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); openPdfModal("offer", "Договор оферты"); }}
                    className="text-blue-600 hover:text-blue-700 underline focus:outline-none"
                  >
                    договором оферты
                  </button>
                </label>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || !allConsentsChecked}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохраняем...</>
                : <><ShieldCheck className="w-4 h-4" /> Сменить пароль и войти</>
              }
            </button>
          </form>
        </motion.div>
      </div>

      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={closePdfModal}
        pdfUrl={pdfModal.url}
        title={pdfModal.title}
      />
    </AnimatePresence>
  );
}
