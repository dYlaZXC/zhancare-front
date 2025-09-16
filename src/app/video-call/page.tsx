"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";

// Components
import VideoHeader from "./components/VideoHeader";
import FloatingBadge from "./components/FloatingBadge";
import VideoFrame from "./components/VideoFrame";
import ChatBox from "./components/ChatBox";
import ChatInput from "./components/ChatInput";
import CallFooter from "./components/CallFooter";

const API_KEY = "QqkMxELY0YVGkCx17Vya04Sq9nGvCahu";
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

interface ConsultationData {
  id: number;
  patient_name: string;
  patient_email: string;
  doctor_first_name: string;
  doctor_last_name: string;
  meeting_id: string;
  status: string;
}

const FullVideoCallPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Auto-redirect based on user role
  useEffect(() => {
    if (user?.role === "doctor") {
      router.push(`/video-call/doctor${window.location.search}`);
      return;
    } else if (user?.role === "patient") {
      router.push(`/video-call/patient${window.location.search}`);
      return;
    }
  }, [user, router]);

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(true);
  const [consultationError, setConsultationError] = useState<string | null>(null);

  const isDoctor = user?.role === "doctor";
  const safeUserName = user?.first_name || user?.email?.split("@")[0] || "guest";
  const userEmail = user?.email || `${safeUserName.toLowerCase().replace(/\s+/g, "")}@example.com`;

  // Get the display name for the other party
  const otherPartyName = consultation
    ? (isDoctor
        ? consultation.patient_name || "Пациент"
        : `${consultation.doctor_first_name} ${consultation.doctor_last_name}`.trim() || "Доктор"
      )
    : (isDoctor ? "Пациент" : "Доктор");

  const [callActive, setCallActive] = useState(true);
  const [otherPartyJoined, setOtherPartyJoined] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ user: string; response: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    router.push("/profile");
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
          { role: "system", content: t.assistantInstruction },
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

      if (!res.ok) throw new Error(t.fetchError);

      const data = await res.json();
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, response: data.choices[0].message.content }];
      });
    } catch {
      setError(t.genericError);
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  const formatResponse = (text: string): string => {
    return text
      .replace(/\n/g, "<br/>")
      .replace(/([•\\-–]\\s+)/g, "<br/><strong>$1</strong>")
      .replace(/(\\d+\\.\\s+)/g, "<br/><strong>$1</strong>")
      .replace(/([А-ЯA-Z][^:]{2,}):/g, "<br/><strong>$1:</strong>");
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

  // ⏳ Loading or error states
  if (consultationLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-blue-700 text-lg font-semibold">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        ⏳ Загрузка данных консультации...
      </div>
    );
  }

  if (consultationError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600 text-lg font-semibold">
        ❌ {consultationError}
      </div>
    );
  }

  if (!meetingId || !consultation) {
    return (
      <div className="flex items-center justify-center h-screen text-blue-700 text-lg font-semibold">
        ⏳ Загрузка данных встречи...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col text-white relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 50%, rgba(55, 114, 255, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(50, 103, 230, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(41, 53, 143, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0f1419 0%, #1a2332 25%, #243447 50%, #2d4a6b 75%, #3772ff 100%)
        `
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-xl animate-pulse"
             style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.15) 0%, rgba(41, 53, 143, 0.1) 100%)', animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full blur-lg animate-bounce"
             style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.2) 0%, rgba(30, 38, 62, 0.1) 100%)', animationDuration: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full blur-md animate-ping"
             style={{ background: 'radial-gradient(circle, rgba(67, 126, 255, 0.25) 0%, transparent 70%)', animationDuration: '2s' }}></div>
      </div>

      <FloatingBadge isDoctor={isDoctor} doctor={otherPartyName} />
      <VideoHeader meetingId={meetingId} isDoctor={isDoctor} doctor={otherPartyName} />

      {callActive ? (
        <>
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 relative z-10">
            {/* Video Section */}
            <div className="col-span-1 lg:col-span-2 relative group">
              <div className="relative overflow-hidden rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/20 h-full min-h-[600px]"
                   style={{
                     background: `
                       linear-gradient(135deg,
                         rgba(255, 255, 255, 0.1) 0%,
                         rgba(255, 255, 255, 0.05) 50%,
                         rgba(55, 114, 255, 0.1) 100%
                       )
                     `
                   }}>
                <VideoFrame
                  meetingId={meetingId}
                  safeUserName={safeUserName}
                  userEmail={userEmail}
                  isDoctor={isDoctor}
                  otherPartyJoined={otherPartyJoined}
                  onDisconnect={handleEndCall}
                />

                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-3xl"></div>

                {/* Hover glow effect */}
                <div className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-lg"
                     style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
              </div>
            </div>

            {/* AI Chat Section */}
            <div className="col-span-1 relative group">
              <div className="h-full flex flex-col overflow-hidden rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/20"
                   style={{
                     background: `
                       linear-gradient(135deg,
                         rgba(255, 255, 255, 0.1) 0%,
                         rgba(255, 255, 255, 0.05) 50%,
                         rgba(55, 114, 255, 0.08) 100%
                       )
                     `
                   }}>

                {/* Chat Header */}
                <div className="relative px-6 py-4 border-b border-white/10 backdrop-blur-sm"
                     style={{
                       background: `
                         linear-gradient(135deg,
                           rgba(55, 114, 255, 0.2) 0%,
                           rgba(50, 103, 230, 0.15) 50%,
                           rgba(41, 53, 143, 0.1) 100%
                         )
                       `
                     }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg backdrop-blur-sm border border-white/20"
                         style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                      🤖
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-base">{t.title}</h3>
                      <p className="text-white/70 text-xs">AI медицинский ассистент</p>
                    </div>
                  </div>

                  {/* Header shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                </div>

                <ChatBox
                  messages={messages}
                  loading={loading}
                  error={error}
                  chatBoxRef={chatBoxRef}
                  t={t}
                  formatResponse={formatResponse}
                />

                <ChatInput
                  userInput={userInput}
                  setUserInput={setUserInput}
                  sendMessage={sendMessage}
                  loading={loading}
                  t={t}
                />

                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-3xl"></div>

                {/* Hover glow effect */}
                <div className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-lg"
                     style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
              </div>
            </div>
          </main>
          <CallFooter handleEndCall={handleEndCall} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl"
               style={{
                 background: `
                   linear-gradient(135deg,
                     rgba(255, 255, 255, 0.1) 0%,
                     rgba(255, 255, 255, 0.05) 50%,
                     rgba(55, 114, 255, 0.1) 100%
                   )
                 `
               }}>
            <div className="text-6xl mb-4">📞</div>
            <h2 className="text-2xl font-bold text-white mb-2">Звонок завершен</h2>
            <p className="text-white/70">Спасибо за использование нашего сервиса</p>
          </div>
        </div>
      )}

      {/* Premium Glass Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
    </div>
  );
};

const VideoCallPage: React.FC = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-screen text-[#001E80]">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        Подключение к встрече...
      </div>
    }
  >
    <FullVideoCallPage />
  </Suspense>
);

export default VideoCallPage;
