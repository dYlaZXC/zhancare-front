"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import { Consultation } from "@/types/consultation";

// Doctor-specific components
import DoctorVideoHeader from "./components/DoctorVideoHeader";
import DoctorVideoFrame from "./components/DoctorVideoFrame";
import DoctorChatBox from "./components/DoctorChatBox";
import DoctorChatInput from "./components/DoctorChatInput";
import DoctorCallFooter from "./components/DoctorCallFooter";
// import DoctorFloatingBadge from "./components/DoctorFloatingBadge";

const API_KEY = "QqkMxELY0YVGkCx17Vya04Sq9nGvCahu";
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

// Using shared Consultation type from @/types/consultation

const DoctorVideoCallPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if not a doctor
  useEffect(() => {
    if (user && user.role !== "doctor") {
      router.push(`/video-call/patient?${window.location.search}`);
      return;
    }
  }, [user, router]);

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(true);
  const [consultationError, setConsultationError] = useState<string | null>(null);

  const safeUserName = user?.first_name || user?.email?.split("@")[0] || "doctor";
  const userEmail = user?.email || `${safeUserName.toLowerCase().replace(/\s+/g, "")}@medical.com`;

  // Get patient name for doctor interface
  const patientName = consultation?.patient_name || "Пациент";

  const [callActive, setCallActive] = useState(true);
  const [otherPartyJoined, setOtherPartyJoined] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ user: string; response: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Doctor-specific states
  const [isRecording, setIsRecording] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [prescriptionMode, setPrescriptionMode] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const t = language === "ru" ? ru.chat : kz.chat;

  // Fetch consultation data from API using meetingId
  useEffect(() => {
    const fetchConsultationData = async () => {
      try {
        setConsultationLoading(true);
        setConsultationError(null);

        // Get meetingId from URL
        const params = new URLSearchParams(window.location.search);
        const meetingIdParam = params.get("meetingId");

        if (!meetingIdParam) {
          setConsultationError("Meeting ID не найден в URL");
          return;
        }

        setMeetingId(meetingIdParam);

        // Fetch consultation data from API
        const response = await api.get(`/consultations/?meeting_id=${meetingIdParam}`);

        if (response.data && response.data.length > 0) {
          setConsultation(response.data[0]);
        } else {
          setConsultationError("Консультация не найдена");
        }
      } catch (err: any) {
        console.error('Error fetching consultation data:', err);
        setConsultationError("Ошибка загрузки данных консультации");
      } finally {
        setConsultationLoading(false);
      }
    };

    fetchConsultationData();
  }, []);

  const handleEndCall = () => {
    setCallActive(false);
    router.push("/doctor-profile");
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Implement recording logic
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Implement stop recording logic
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = { user: userInput, response: "" };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);
    setError("");

    try {
      const payload = {
        model: "open-mistral-nemo",
        temperature: 0.3,
        top_p: 1,
        max_tokens: 500,
        messages: [
          { role: "system", content: "Вы медицинский ассистент врача. Предоставляйте профессиональные медицинские советы." },
          { role: "user", content: userInput },
        ],
      };

      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Ошибка запроса");

      const data = await res.json();
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, response: data.choices[0].message.content }];
      });
    } catch {
      setError("Ошибка получения ответа");
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setOtherPartyJoined(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Loading or error states
  if (consultationLoading) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
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
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-red-900/30 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-red-600/30 border-2 border-red-400/50 backdrop-blur-sm shadow-xl shadow-red-500/20">
            <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Ошибка загрузки</h2>
          <p className="text-lg text-red-200 mb-6">{consultationError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 border-2 border-emerald-400/50 shadow-lg hover:shadow-emerald-500/50 hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
            Обновить страницу
          </button>
          <p className="text-sm text-slate-300 mt-6">
            Если проблема повторяется, обратитесь в службу поддержки
          </p>
        </div>
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

  if (!meetingId || !consultation) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-emerald-600/30 border-2 border-emerald-400/50 backdrop-blur-sm shadow-xl shadow-emerald-500/20">
            <Loader2 className="animate-spin w-12 h-12 text-emerald-300" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Подготовка встречи</h2>
          <p className="text-lg text-slate-200 mb-6">Загружаем данные встречи...</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-75 shadow-lg shadow-green-500/50"></div>
            <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce delay-150 shadow-lg shadow-teal-500/50"></div>
          </div>
        </div>
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

  return (
    <div
      className="min-h-screen flex flex-col text-white relative"
      style={{
        background: `
          radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(21, 128, 61, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0f1419 0%, #1a2e23 25%, #234a35 50%, #2d6a4f 75%, #16a085 100%)
        `
      }}
    >
      {/* Responsive Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full blur-xl animate-pulse"
             style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(21, 128, 61, 0.1) 100%)', animationDuration: '4s' }}></div>
        <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-10 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 rounded-full blur-lg animate-bounce"
             style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%)', animationDuration: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full blur-md animate-ping"
             style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)', animationDuration: '2s' }}></div>
      </div>

      {/* <DoctorFloatingBadge
        patientName={patientName}
        isRecording={isRecording}
        consultationId={consultation.id}
      /> */}

      <div className="sticky top-0 z-20">
        <DoctorVideoHeader
          meetingId={meetingId}
          patientName={patientName}
          consultation={consultation}
          isRecording={isRecording}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
      </div>

      {callActive ? (
        <>
          <main className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-3 lg:gap-4 xl:gap-6 p-2 sm:p-3 lg:p-4 xl:p-6 pb-0 relative z-10">
            {/* Video Section - Takes more space on desktop */}
            <div className="relative group min-w-0 lg:flex-[2] xl:flex-[3]" style={{ minHeight: '400px' }}>
              <DoctorVideoFrame
                meetingId={meetingId}
                safeUserName={safeUserName}
                userEmail={userEmail}
                otherPartyJoined={otherPartyJoined}
                onDisconnect={handleEndCall}
                isRecording={isRecording}
                patientName={patientName}
              />
            </div>

            {/* Medical AI Chat Section - Constrained width on desktop */}
            {/* <div className="relative group flex-1 lg:flex-[1] xl:flex-[1] lg:h-full lg:max-w-[400px] xl:max-w-[450px] min-h-0 min-w-0 overflow-hidden">
              <div className="h-full max-h-full flex flex-col overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500 group-hover:shadow-emerald-500/20"
                   style={{
                     background: `
                       linear-gradient(135deg,
                         rgba(255, 255, 255, 0.1) 0%,
                         rgba(255, 255, 255, 0.05) 50%,
                         rgba(16, 185, 129, 0.08) 100%
                       )
                     `
                   }}> */}

                {/* Medical Chat Header */}
                {/* <div className="relative px-3 py-3 sm:px-4 sm:py-3 lg:px-4 lg:py-3 border-b border-white/10 backdrop-blur-sm flex-shrink-0"
                     style={{
                       background: `
                         linear-gradient(135deg,
                           rgba(16, 185, 129, 0.2) 0%,
                           rgba(34, 197, 94, 0.15) 50%,
                           rgba(21, 128, 61, 0.1) 100%
                         )
                       `
                     }}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-base backdrop-blur-sm border border-white/20"
                         style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                      🩺
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-base truncate">Медицинский ИИ-Ассистент</h3>
                      <p className="text-white/70 text-xs truncate">Профессиональная поддержка врача</p>
                    </div>
                  </div>
                </div> */}

                {/* Chat content container with proper flex */}
                {/* <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <DoctorChatBox
                    messages={messages}
                    loading={loading}
                    error={error}
                    chatBoxRef={chatBoxRef}
                    t={t}
                    prescriptionMode={prescriptionMode}
                  />

                  <div className="flex-shrink-0">
                    <DoctorChatInput
                      userInput={userInput}
                      setUserInput={setUserInput}
                      sendMessage={sendMessage}
                      loading={loading}
                      t={t}
                      prescriptionMode={prescriptionMode}
                      setPrescriptionMode={setPrescriptionMode}
                    />
                  </div>
                </div> */}
              {/* </div>
            </div> */}
          </main>

          <div className="relative z-20 mt-auto">
            <DoctorCallFooter
              handleEndCall={handleEndCall}
              sessionNotes={sessionNotes}
              setSessionNotes={setSessionNotes}
              consultation={consultation}
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl"
               style={{
                 background: `
                   linear-gradient(135deg,
                     rgba(255, 255, 255, 0.1) 0%,
                     rgba(255, 255, 255, 0.05) 50%,
                     rgba(16, 185, 129, 0.1) 100%
                   )
                 `
               }}>
            <div className="text-6xl mb-4">🩺</div>
            <h2 className="text-2xl font-bold text-white mb-2">Консультация завершена</h2>
            <p className="text-white/70">Сохраните заметки и назначения</p>
          </div>
        </div>
      )}
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