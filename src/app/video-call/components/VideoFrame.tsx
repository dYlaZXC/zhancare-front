"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useTracks,
  TrackReferenceOrPlaceholder,
  ParticipantTile,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { api } from "@/utils/api";
import { Loader2, RefreshCw } from "lucide-react";
import { Placeholder } from "./Placeholder";
import { PiPLayout } from "./PiPLayout";

interface VideoFrameProps {
  meetingId: string;
  safeUserName: string;
  userEmail: string;
  isDoctor: boolean;
  otherPartyJoined: boolean;
}

const VideoFrame: React.FC<VideoFrameProps> = ({
  meetingId,
  safeUserName,
  userEmail,
  isDoctor,
  otherPartyJoined,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const identity = useMemo(() => {
    const role = isDoctor ? "doctor" : "patient";
    const clean = safeUserName.toLowerCase().replace(/[^a-z0-9]/g, "") || "guest";
    const hash = Math.random().toString(36).substring(2, 8);
    return `${meetingId}-${role}-${clean}-${hash}`;
  }, [meetingId, safeUserName, isDoctor]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setError(null);
        const res = await api.get(`/consultations/${meetingId}/video-token/`, {
          params: { identity },
        });
        const data = res.data;
        setToken(data.token);
        setLivekitUrl(data.url);
      } catch (err) {
        console.error("❌ Failed to fetch LiveKit token:", err);
        setError("Не удалось получить токен доступа к конференции.");
      }
    };

    if (meetingId && identity) fetchToken();
  }, [meetingId, identity, retryCount]);

  if (!otherPartyJoined) {
    return (
      <Placeholder
        icon={<Loader2 className="animate-spin w-8 h-8 mb-4 text-gray-500" />}
        headline={isDoctor ? "⏳ Ожидание пациента..." : "⏳ Ожидание врача..."}
        sub="Мы уведомили второго участника. Пожалуйста, оставайтесь на линии."
      />
    );
  }

  if (!token || !livekitUrl) {
    return error ? (
      <Placeholder
        icon={<RefreshCw className="w-8 h-8 mb-4 text-red-500" />}
        headline="Ошибка подключения"
        sub={
          <>
            <span className="block mb-2">{error}</span>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Повторить попытку
            </button>
          </>
        }
      />
    ) : (
      <Placeholder
        icon={<Loader2 className="animate-spin w-8 h-8 mb-4 text-blue-600" />}
        headline="🔄 Получение доступа к конференции..."
      />
    );
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect
        video
        audio
        onDisconnected={(reason) => console.warn("🚨 Disconnected:", reason)}
        data-lk-theme="default"
        style={{ height: "100%", width: "100%" }}
      >
        <PiPLayout />
      </LiveKitRoom>
    </div>
  );
};

export default VideoFrame;
