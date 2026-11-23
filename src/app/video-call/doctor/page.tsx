"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import { Consultation } from "@/types/consultation";
import { useDeepgram } from "@/hooks/useDeepgram";

// Doctor-specific components
import DoctorVideoHeader from "./components/DoctorVideoHeader";
import DoctorVideoFrame from "./components/DoctorVideoFrame";
import DoctorChatBox from "./components/DoctorChatBox";
import DoctorChatInput from "./components/DoctorChatInput";
import DoctorCallFooter from "./components/DoctorCallFooter";
import FloatingConsultationButton from "./components/FloatingConsultationButton";
import { isInjectionAttempt, CHAT_ENDPOINT } from "@/lib/ai";
// import DoctorFloatingBadge from "./components/DoctorFloatingBadge";

// Using shared Consultation type from @/types/consultation

const DoctorVideoCallPage: React.FC = () => {
  const router = useRouter();
  const { user, isDoctor, loading: authLoading } = useAuth();

  // Auth guards — run after auth is resolved
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Not logged in — redirect to home (auth popup will open there)
      router.push(`/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (!isDoctor) {
      router.push(`/video-call/patient?${window.location.search}`);
    }
  }, [user, isDoctor, authLoading, router]);

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(true);
  const [consultationError, setConsultationError] = useState<string | null>(null);

  const safeUserName = user?.first_name || user?.email?.split("@")[0] || "doctor";
  const userEmail = user?.email || `${safeUserName.toLowerCase().replace(/\s+/g, "")}@medical.com`;

  // Doctor's clinic id — already loaded onto the auth user via GET /user-profile/profile/,
  // just not reflected in the loosely-typed `profiles` field.
  const doctorClinicId = (user as any)?.profiles?.doctor?.clinic?.id as number | undefined;

  // Get patient name for doctor interface
  const patientName = consultation?.patient_name || "Пациент";

  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ user: string; response: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Doctor-specific states
  const [isRecording, setIsRecording] = useState(false);

  // Deepgram transcription
  const {
    transcript,
    isConnected: isTranscribing,
    error: transcriptionError,
    stream: micStream,
    duration: recordingDuration,
    startTranscription,
    stopTranscription,
    clearTranscript,
  } = useDeepgram();

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const consultationSheetRef = useRef<{ openSheet: () => void }>(null);
  const { language } = useLanguage();
  const t = language === "ru" ? ru.chat : kz.chat;

  // Fetch consultation data — only after auth is confirmed
  useEffect(() => {
    if (authLoading || !user || !isDoctor) return;

    const fetchConsultationData = async () => {
      try {
        setConsultationLoading(true);
        setConsultationError(null);

        const params = new URLSearchParams(window.location.search);
        const meetingIdParam = params.get("meetingId");

        if (!meetingIdParam) {
          setConsultationError("Meeting ID не найден в URL");
          return;
        }

        setMeetingId(meetingIdParam);

        const response = await api.get(`/consultations/?meeting_id=${meetingIdParam}`);

        if (response.data && response.data.length > 0) {
          setConsultation(response.data[0]);
        } else {
          setConsultationError("Консультация не найдена");
        }
      } catch (err: any) {
        console.error('Error fetching consultation data:', err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setConsultationError("Нет доступа. Войдите в систему как врач.");
        } else {
          setConsultationError("Ошибка загрузки данных консультации");
        }
      } finally {
        setConsultationLoading(false);
      }
    };

    fetchConsultationData();
  }, [authLoading, user, isDoctor]);

  const handleDisconnect = () => {
    router.push("/doctor/consultations");
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    // Start Deepgram transcription
    try {
      await startTranscription();
      console.log('Transcription started');
    } catch (err) {
      console.error('Error starting transcription:', err);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Stop Deepgram transcription
    stopTranscription();
    console.log('Transcription stopped');
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    if (isInjectionAttempt(userInput)) {
      setMessages(prev => [...prev, { user: userInput, response: "Я медицинский ассистент. Пожалуйста, задайте медицинский вопрос." }]);
      setUserInput("");
      return;
    }

    const newMessage = { user: userInput, response: "" };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userInput,
          language: "ru",
          context: "doctor_assistant",
        }),
      });

      if (!res.ok) throw new Error("Ошибка запроса");

      const data = await res.json();
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, response: data.text }];
      });
    } catch {
      setError("Ошибка получения ответа");
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Loading or error states
  if (consultationLoading) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-emerald-600/30 border-2 border-emerald-400/50 backdrop-blur-sm shadow-xl shadow-emerald-500/20">
            <Loader2 className="animate-spin w-12 h-12 text-emerald-300" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Загрузка консультации</h2>
          <p className="text-lg text-slate-200 mb-6">Получаем информацию о вашей встрече...</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-75 shadow-lg shadow-green-500/50"></div>
            <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce delay-150 shadow-lg shadow-teal-500/50"></div>
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
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-orange-900/20 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-600/20 border-2 border-red-400/30 backdrop-blur-sm">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Ошибка загрузки</h2>
          <p className="text-red-200/90 mb-6">{consultationError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 border-2 border-emerald-400/50 shadow-lg hover:shadow-emerald-500/50 hover:scale-105"
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
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-emerald-900/20 to-green-900/20 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-600/20 border-2 border-emerald-400/30 backdrop-blur-sm">
            <Loader2 className="animate-spin w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Подготовка встречи</h2>
          <p className="text-emerald-200/90 mb-6">Загружаем данные встречи...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-150"></div>
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

  const handleSaveConsultation = async (data: any) => {
    console.log("Saving consultation data:", data);

    if (!meetingId) {
      console.error("Meeting ID not available");
      toast.error("Ошибка: Meeting ID не найден");
      return;
    }

    try {
      // `data` is keyed by the clinic's own template sections (see
      // FloatingConsultationButton's sectionValues) plus `transcription` —
      // pass everything through as-is, the backend validates keys against
      // this consultation's own template_snapshot.
      const { transcription, ...structured_data } = data;
      const response = await api.patch(
        `/consultations/${meetingId}/save-consultation-form/`,
        { structured_data, transcription }
      );

      console.log("Consultation form saved successfully:", response.data);

      // Update the consultation state with the saved data
      if (response.data.consultation) {
        setConsultation(response.data.consultation);
      }

      // Show success toast
      toast.success("✅ Данные успешно сохранены!");
    } catch (error: any) {
      console.error("Failed to save consultation form:", error);
      console.error("Error response:", error?.response?.data);

      // Show error toast with specific error message if available
      const errorMessage = error?.response?.data?.error || "Ошибка при сохранении данных";
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const handleGenerateReport = (data: any) => {
    console.log("Generating report with data:", data);
  };

  const handleOpenConsultationSheet = () => {
    consultationSheetRef.current?.openSheet();
  };

  const handleStartCall = async () => {
    if (!meetingId) return;
    try {
      await api.post(`/consultations/${meetingId}/start-call/`);
      setConsultation((prev) => prev ? { ...prev, status: "ongoing", started_at: new Date().toISOString() } : prev);
      toast.success("Консультация начата");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось начать консультацию");
    }
  };

  const handleEndCall = async () => {
    if (!meetingId) return;
    try {
      await api.post(`/consultations/${meetingId}/end-call/`);
      setConsultation((prev) => prev ? { ...prev, status: "completed", ended_at: new Date().toISOString() } : prev);
      toast.success("Консультация завершена");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось завершить консультацию");
    }
    handleDisconnect();
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col">
      <div className="sticky top-0 z-20">
        <DoctorVideoHeader
          meetingId={meetingId}
          patientName={patientName}
          consultation={consultation}
        />
      </div>

      {/* Consultation status bar */}
      {consultation?.status === "pending" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
          <span className="text-amber-300 text-sm">Консультация ещё не начата</span>
          <button
            onClick={handleStartCall}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            ▶ Начать консультацию
          </button>
        </div>
      )}
      {consultation?.status === "completed" && (
        <div className="bg-gray-700/50 border-b border-gray-600 px-4 py-2 flex items-center gap-2">
          <span className="text-gray-400 text-sm">✓ Консультация завершена</span>
          {consultation.duration_seconds && (
            <span className="text-gray-500 text-sm">· {Math.floor(consultation.duration_seconds / 60)} мин</span>
          )}
        </div>
      )}

      <div className="w-full p-4" style={{ height: 'calc(100vh - 180px)' }}>
        <DoctorVideoFrame
          meetingId={meetingId}
          safeUserName={safeUserName}
          userEmail={userEmail}
          onDisconnect={handleDisconnect}
          isRecording={isRecording}
          patientName={patientName}
        />
      </div>

      <DoctorCallFooter
        handleEndCall={handleEndCall}
        consultation={consultation}
        onOpenConsultationSheet={handleOpenConsultationSheet}
        hasConsultationData={false}
      />

      {/* Consultation Sheet - No floating button, opened from footer */}
      <FloatingConsultationButton
        ref={consultationSheetRef}
        consultation={consultation}
        onSave={handleSaveConsultation}
        onGenerateReport={handleGenerateReport}
        transcript={transcript}
        isTranscribing={isTranscribing}
        micStream={micStream}
        recordingDuration={recordingDuration}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        doctorId={user?.id}
        doctorClinicId={doctorClinicId}
        patientId={consultation?.patient}
      />
    </div>
  );
};

const DoctorVideoCall: React.FC = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-screen text-emerald-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        Подключение к консультации...
      </div>
    }
  >
    <DoctorVideoCallPage />
  </Suspense>
);

export default DoctorVideoCall;