"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
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

const FullVideoCallPage: React.FC = () => {
  const router = useRouter();

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [doctor, setDoctor] = useState("Неизвестный врач");
  const [userRole, setUserRole] = useState("patient");
  const [userName, setUserName] = useState("Гость");

  const isDoctor = userRole === "doctor";
  const safeUserName = userName || "guest";
  const userEmail = `${safeUserName.toLowerCase().replace(/\s+/g, "")}@example.com`;

  const [callActive, setCallActive] = useState(true);
  const [otherPartyJoined, setOtherPartyJoined] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ user: string; response: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const t = language === "ru" ? ru.chat : kz.chat;

  // ✅ Use client-only params safely
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMeetingId(params.get("meetingId"));
    setDoctor(params.get("doctor") || "Неизвестный врач");
    setUserRole(params.get("role") || "patient");
    setUserName(params.get("name") || "Гость");
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

  // ⏳ Until meetingId is available
  if (!meetingId) {
    return (
      <div className="flex items-center justify-center h-screen text-blue-700 text-lg font-semibold">
        ⏳ Загрузка параметров встречи...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900 relative">
      <FloatingBadge isDoctor={isDoctor} doctor={doctor} />
      <VideoHeader meetingId={meetingId} isDoctor={isDoctor} doctor={doctor} />

      {callActive ? (
        <>
          <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {/* Видео */}
            <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden relative">
              <VideoFrame
                meetingId={meetingId}
                safeUserName={safeUserName}
                userEmail={userEmail}
                isDoctor={isDoctor}
                otherPartyJoined={otherPartyJoined}
              />
            </div>

            {/* AI-чат */}
            <div className="col-span-1 bg-white rounded-2xl shadow-md flex flex-col overflow-hidden">
              <div className="bg-blue-700 text-white px-4 py-3 text-sm font-semibold">
                🤖 {t.title}
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
            </div>
          </main>
          <CallFooter handleEndCall={handleEndCall} />
        </>
      ) : (
        <div className="text-center mt-20 text-xl font-semibold text-gray-700">
          📞 Звонок завершен
        </div>
      )}
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
