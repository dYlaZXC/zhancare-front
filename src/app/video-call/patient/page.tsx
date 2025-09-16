"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import { Consultation } from "@/types/consultation";

// Patient-specific components
import PatientVideoHeader from "./components/PatientVideoHeader";
import PatientVideoFrame from "./components/PatientVideoFrame";
import PatientChatBox from "./components/PatientChatBox";
import PatientChatInput from "./components/PatientChatInput";
import PatientCallFooter from "./components/PatientCallFooter";
import PatientFloatingBadge from "./components/PatientFloatingBadge";

const API_KEY = "QqkMxELY0YVGkCx17Vya04Sq9nGvCahu";
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

// Using shared Consultation type from @/types/consultation

const PatientVideoCallPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

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

  const safeUserName = user?.first_name || user?.email?.split("@")[0] || "patient";
  const userEmail = user?.email || `${safeUserName.toLowerCase().replace(/\\s+/g, "")}@example.com`;

  // Get doctor name for patient interface
  const doctorName = consultation
    ? `${consultation.doctor_first_name} ${consultation.doctor_last_name}`.trim() || "Доктор"
    : "Доктор";

  const [callActive, setCallActive] = useState(true);
  const [otherPartyJoined, setOtherPartyJoined] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ user: string; response: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Patient-specific states
  const [patientNotes, setPatientNotes] = useState("");
  const [symptomsDescription, setSymptomsDescription] = useState("");

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
          { role: "system", content: "Вы помощник пациента. Отвечайте простым языком, будьте поддерживающими и дайте общую информацию о здоровье." },
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
      className="h-screen flex flex-col text-white relative overflow-hidden"
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

      {/* <PatientFloatingBadge
        doctorName={doctorName}
        consultationId={consultation.id}
      /> */}

      <PatientVideoHeader
        meetingId={meetingId}
        doctorName={doctorName}
        consultation={consultation}
      />

      {callActive ? (
        <>
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 p-6 relative z-10 min-h-0 overflow-hidden">
            {/* Video Section */}
            <div className="relative group min-w-0 h-full overflow-hidden">
              <PatientVideoFrame
                meetingId={meetingId}
                safeUserName={safeUserName}
                userEmail={userEmail}
                otherPartyJoined={otherPartyJoined}
                onDisconnect={handleEndCall}
                doctorName={doctorName}
              />
            </div>

            {/* Health Info Chat Section */}
            <div className="relative group h-full min-h-0 min-w-0 overflow-hidden">
              <div className="h-full max-h-full flex flex-col overflow-hidden rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/20"
                   style={{
                     background: `
                       linear-gradient(135deg,
                         rgba(255, 255, 255, 0.1) 0%,
                         rgba(255, 255, 255, 0.05) 50%,
                         rgba(55, 114, 255, 0.08) 100%
                       )
                     `
                   }}>

                {/* Health Chat Header */}
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
                      🏥
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-base">Помощник пациента</h3>
                      <p className="text-white/70 text-xs">Поддержка и информация о здоровье</p>
                    </div>
                  </div>
                </div>

                <PatientChatBox
                  messages={messages}
                  loading={loading}
                  error={error}
                  chatBoxRef={chatBoxRef}
                  t={t}
                />

                <PatientChatInput
                  userInput={userInput}
                  setUserInput={setUserInput}
                  sendMessage={sendMessage}
                  loading={loading}
                  t={t}
                />
              </div>
            </div>
          </main>

          <PatientCallFooter
            handleEndCall={handleEndCall}
            patientNotes={patientNotes}
            setPatientNotes={setPatientNotes}
            symptomsDescription={symptomsDescription}
            setSymptomsDescription={setSymptomsDescription}
            consultation={consultation}
          />
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
            <div className="text-6xl mb-4">🏥</div>
            <h2 className="text-2xl font-bold text-white mb-2">Консультация завершена</h2>
            <p className="text-white/70">Спасибо за использование нашего сервиса</p>
          </div>
        </div>
      )}
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