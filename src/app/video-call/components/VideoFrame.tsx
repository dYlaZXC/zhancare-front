"use client";

import React, { useEffect, useState, useMemo } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { api } from "@/utils/api";
import { Loader2, RefreshCw } from "lucide-react";
import PiPLayout from "./PiPLayout";

const Placeholder: React.FC<{
  icon: React.ReactNode;
  headline: string;
  sub?: React.ReactNode;
}> = ({ icon, headline, sub }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gray-100">
    {icon}
    <div className="text-xl font-semibold mt-2">{headline}</div>
    {sub && <div className="text-sm text-gray-500 mt-2">{sub}</div>}
  </div>
);

interface VideoFrameProps {
  meetingId: string;
  safeUserName: string;
  isDoctor: boolean;
  otherPartyJoined: boolean;
  userEmail: string;
}

const VideoFrame: React.FC<VideoFrameProps> = ({
  meetingId,
  safeUserName,
  isDoctor,
  otherPartyJoined,
}) => {
  const [token, setToken] = useState<string>();
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [retry, setRetry] = useState(0);

  const identity = useMemo(() => {
    const role = isDoctor ? "doctor" : "patient";
    const clean = safeUserName.toLowerCase().replace(/\W+/g, "") || "guest";
    const hash = Math.random().toString(36).substr(2, 6);
    return `${meetingId}-${role}-${clean}-${hash}`;
  }, [meetingId, safeUserName, isDoctor]);

  useEffect(() => {
    if (!meetingId || !identity) return;

    const fetchToken = async () => {
      try {
        setError(undefined);
        const response = await api.get(`/consultations/${meetingId}/video-token/`, {
          params: { identity },
        });

        setToken(response.data.token);
        setUrl(response.data.url);
      } catch (e) {
        console.error("❌ Failed to fetch token:", e);
        setError("Не удалось получить токен доступа к видеовстрече.");
      }
    };

    fetchToken();
  }, [meetingId, identity, retry]);

  if (!otherPartyJoined) {
    return (
      <Placeholder
        icon={<Loader2 className="animate-spin w-8 h-8 text-gray-500" />}
        headline={isDoctor ? "⏳ Ожидаем пациента…" : "⏳ Ожидаем врача…"}
        sub="Мы уведомили второго участника. Пожалуйста, оставайтесь на линии."
      />
    );
  }

  if (!token || !url) {
    return error ? (
      <Placeholder
        icon={<RefreshCw className="w-8 h-8 text-red-500" />}
        headline="Ошибка подключения"
        sub={
          <button
            className="mt-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            onClick={() => setRetry((prev) => prev + 1)}
          >
            Повторить попытку
          </button>
        }
      />
    ) : (
      <Placeholder
        icon={<Loader2 className="animate-spin w-8 h-8 text-blue-600" />}
        headline="🔄 Получаем доступ к видеовстрече..."
      />
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded overflow-hidden shadow-md">
      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect
        video
        audio
        data-lk-theme="default"
        onDisconnected={(reason) => console.warn("🔌 Disconnected:", reason)}
        style={{ width: "100%", height: "100%" }}
      >
        <PiPLayout />
      </LiveKitRoom>
    </div>
  );
};

export default VideoFrame;
