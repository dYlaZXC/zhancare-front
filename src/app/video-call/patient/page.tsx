"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Mail, Lock, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { Consultation } from "@/types/consultation";
import { motion, AnimatePresence } from "framer-motion";
import { useMagicLinkAuth } from "@/hooks/useMagicLinkAuth";

// Patient-specific components
import PatientVideoHeader from "./components/PatientVideoHeader";
import PatientVideoFrame from "./components/PatientVideoFrame";
import PatientCallFooter from "./components/PatientCallFooter";

const PatientVideoCallPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  // 🔐 Production-grade magic link authentication
  const magicLinkAuth = useMagicLinkAuth();

  // Redirect if not a patient
  useEffect(() => {
    if (user && user.role !== "patient") {
      router.push(`/video-call/doctor?${window.location.search}`);
      return;
    }
  }, [user, router]);

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(true);
  const [consultationError, setConsultationError] = useState<string | null>(null);

  // Access code modal state
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [accessCodeEmail, setAccessCodeEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const safeUserName = user?.first_name || user?.email?.split("@")[0] || "patient";
  const userEmail = user?.email || `${safeUserName.toLowerCase().replace(/\s+/g, "")}@example.com`;

  // Get doctor name for patient interface
  const doctorName = consultation
    ? `${consultation.doctor_first_name} ${consultation.doctor_last_name}`.trim() || "Доктор"
    : "Доктор";

  // Fetch consultation data from API using meetingId
  // ⚠️ Wait for magic link auth to complete before fetching
  useEffect(() => {
    // Don't fetch if magic link auth is still in progress
    if (magicLinkAuth.isAuthenticating) {
      return;
    }

    // Don't fetch if magic link auth failed (will redirect to login)
    if (magicLinkAuth.error) {
      return;
    }

    const fetchConsultationData = async () => {
      try {
        setConsultationLoading(true);
        setConsultationError(null);

        // Get meetingId from URL
        const params = new URLSearchParams(window.location.search);
        const meetingIdParam = params.get("meetingId");

        if (!meetingIdParam) {
          // Show access code modal if no meetingId in URL
          setShowAccessCodeModal(true);
          setConsultationLoading(false);
          return;
        }

        setMeetingId(meetingIdParam);

        // ✅ Always fetch fresh consultation data from API
        // This ensures we have the most up-to-date doctor information
        console.log('🔄 Fetching fresh consultation data from API...');
        const response = await api.get(`/consultations/?meeting_id=${meetingIdParam}`);

        if (response.data && response.data.length > 0) {
          const consultationData = response.data[0];

          // ⏰ Check if user is trying to connect before scheduled time
          if (consultationData.scheduled_at) {
            const scheduledTime = new Date(consultationData.scheduled_at);
            const now = new Date();
            const timeDiff = scheduledTime.getTime() - now.getTime();

            // Allow access 5 minutes before scheduled time (grace period)
            const gracePeriodMs = 5 * 60 * 1000; // 5 minutes in milliseconds

            if (timeDiff > gracePeriodMs) {
              const scheduledTimeStr = scheduledTime.toLocaleString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Almaty',
              });

              setConsultationError(
                `Консультация запланирована на ${scheduledTimeStr}.`
              );
              return;
            }
          }

          setConsultation(consultationData);
        } else {
          setConsultationError("Консультация не найдена");
        }
      } catch (err: any) {
        console.error('Error fetching consultation data:', err);

        // Handle 403 error (early access blocked)
        if (err.response?.status === 403) {
          const errorMessage = err.response?.data?.error || "Доступ к консультации ограничен по времени";
          setConsultationError(errorMessage);
        } else {
          setConsultationError(err.response?.data?.error || "Ошибка загрузки данных консультации");
        }
      } finally {
        setConsultationLoading(false);
      }
    };

    fetchConsultationData();
  }, [magicLinkAuth.isAuthenticating, magicLinkAuth.error, magicLinkAuth.isAuthenticated, magicLinkAuth.authMethod]);

  // Handle access code verification
  const handleVerifyAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingCode(true);
    setCodeError(null);

    try {
      const response = await api.post('/consultations/verify-access-code/', {
        access_code: accessCode.toUpperCase().trim()
      });

      if (response.data.success) {
        const { access_token, refresh_token, user, consultation } = response.data;

        // 🔐 Store authentication tokens (same as magic link auth)
        sessionStorage.setItem('access_token', access_token);
        sessionStorage.setItem('refresh_token', refresh_token);
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('consultation', JSON.stringify(consultation));

        // Also set in localStorage for backward compatibility
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Access code verified and authenticated');
        console.log('🔑 Access token:', access_token.substring(0, 20) + '...');
        console.log('🔄 Refresh token:', refresh_token.substring(0, 20) + '...');
        console.log('👤 User:', user.email);
        console.log('🏥 Consultation:', consultation.meeting_id);

        // Verify tokens were stored
        console.log('📦 Verifying localStorage...');
        console.log('  - access_token:', localStorage.getItem('access_token') ? 'STORED ✅' : 'MISSING ❌');
        console.log('  - refresh_token:', localStorage.getItem('refresh_token') ? 'STORED ✅' : 'MISSING ❌');

        // Small delay to ensure localStorage write completes before redirect
        setTimeout(() => {
          console.log('🚀 Redirecting to video call...');
          window.location.href = `/video-call/patient?meetingId=${consultation.meeting_id}`;
        }, 100);
      } else {
        setCodeError(response.data.error || "Неверный код доступа");
      }
    } catch (err: any) {
      console.error('Error verifying access code:', err);
      setCodeError(err.response?.data?.error || "Ошибка проверки кода доступа");
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleEndCall = () => {
    router.push("/patient/video");
  };

  // 🔐 Magic Link Authentication States
  // Show authenticating state while magic link auth is in progress
  if (magicLinkAuth.isAuthenticating) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-blue-600/30 border-2 border-blue-400/50 backdrop-blur-sm shadow-xl shadow-blue-500/20">
            <Lock className="w-12 h-12 text-blue-300 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Безопасная аутентификация</h2>
          <p className="text-lg text-blue-200 mb-6">Проверяем ваш магический линк...</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50"></div>
            <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-75 shadow-lg shadow-indigo-400/50"></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-150 shadow-lg shadow-purple-400/50"></div>
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if magic link auth failed - with access code fallback
  if (magicLinkAuth.error) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-rose-900 to-orange-900 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content - Error message + Access code form */}
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 max-w-md w-full mx-4"
          >
            {/* Error Alert */}
            <div className="bg-red-600/20 border-2 border-red-400/30 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Ошибка магической ссылки</h3>
                  <p className="text-red-200/90 text-sm">{magicLinkAuth.error}</p>
                </div>
              </div>
            </div>

            {/* Access Code Form as Fallback */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Используйте код доступа</h2>
                <p className="text-gray-600 text-sm">Введите код из письма для входа в консультацию</p>
              </div>

              {/* Form */}
              <form onSubmit={handleVerifyAccessCode} className="space-y-5">
                {/* Access Code Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Код доступа (6 символов)
                  </label>
                  <input
                    type="text"
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-center text-2xl font-bold tracking-widest uppercase"
                  />
                </div>

                {/* Error Message */}
                {codeError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3"
                  >
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{codeError}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={verifyingCode || accessCode.length !== 6}
                  className="w-full px-6 py-4 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
                >
                  {verifyingCode ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Проверка кода...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Войти в консультацию
                    </>
                  )}
                </button>
              </form>

              {/* Help Text */}
              <p className="text-xs text-gray-500 text-center mt-6">
                Код доступа отправлен на ваш email при создании консультации
              </p>

              {/* Login Link */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors underline"
                >
                  Вернуться на страницу входа
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  // Access Code Modal
  if (showAccessCodeModal) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Вход в консультацию</h2>
              <p className="text-gray-600">Введите email и код доступа из письма</p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerifyAccessCode} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={accessCodeEmail}
                    onChange={(e) => setAccessCodeEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Access Code Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Код доступа (6 символов)
                </label>
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-center text-2xl font-bold tracking-widest uppercase"
                />
              </div>

              {/* Error Message */}
              {codeError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{codeError}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={verifyingCode || accessCode.length !== 6}
                className="w-full px-6 py-4 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
              >
                {verifyingCode ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Проверка кода...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Войти в консультацию
                  </>
                )}
              </button>
            </form>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Код доступа отправлен на ваш email при создании консультации
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  // Loading or error states
  if (consultationLoading) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-blue-600/30 border-2 border-blue-400/50 backdrop-blur-sm shadow-xl shadow-blue-500/20">
            <Loader2 className="animate-spin w-12 h-12 text-blue-300" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Загрузка консультации</h2>
          <p className="text-lg text-slate-200 mb-6">Получаем информацию о вашей встрече...</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-500/50"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-75 shadow-lg shadow-indigo-500/50"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-150 shadow-lg shadow-purple-500/50"></div>
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  if (consultationError) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl px-8">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-blue-600/30 border-2 border-blue-400/50 backdrop-blur-sm shadow-xl">
            <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-lg">Вы зашли раньше времени</h2>

          {/* Info message box with better visibility */}
          <div className="bg-black/40 backdrop-blur-md border-2 border-blue-400/30 rounded-2xl p-6 mb-6">
            <p className="text-lg text-white font-medium leading-relaxed drop-shadow-md mb-4">{consultationError}</p>
            <p className="text-base text-blue-200 font-normal drop-shadow-md">
              💡 Вы сможете зайти за 5 минут до назначенного времени
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 border-2 border-blue-400/50 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить страницу
          </button>
          <p className="text-xs text-white/60 mt-6">
            Если проблема повторяется, обратитесь в службу поддержки
          </p>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  if (!meetingId || !consultation) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-indigo-900/20 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border-2 border-blue-400/30 backdrop-blur-sm">
            <Loader2 className="animate-spin w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Подготовка встречи</h2>
          <p className="text-blue-200/90 mb-6">Загружаем данные встречи...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                 `,
                 backgroundSize: '24px 24px'
               }}>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col">
      <div className="sticky top-0 z-20">
        <PatientVideoHeader
          meetingId={meetingId}
          doctorName={doctorName}
          consultation={consultation}
        />
      </div>

      <div className="w-full p-4" style={{ height: 'calc(100vh - 180px)' }}>
        <PatientVideoFrame
          meetingId={meetingId}
          safeUserName={safeUserName}
          userEmail={userEmail}
          onDisconnect={handleEndCall}
          doctorName={doctorName}
        />
      </div>

      <PatientCallFooter
        handleEndCall={handleEndCall}
        consultation={consultation}
      />
    </div>
  );
};

const PatientVideoCall: React.FC = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-screen text-blue-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        Подключение к консультации...
      </div>
    }
  >
    <PatientVideoCallPage />
  </Suspense>
);

export default PatientVideoCall;
