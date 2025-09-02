"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { api } from "@/utils/api";
import { Loader2, RefreshCw } from "lucide-react";

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
  const [loading, setLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ Stable identity generation
  const identity = useMemo(() => {
    const key = `lk-id:${meetingId}`;
    let cached = localStorage.getItem(key);
    if (cached) return cached;

    const role = isDoctor ? "doctor" : "patient";
    const clean = safeUserName.toLowerCase().replace(/[^a-z0-9]/g, "") || "guest";
    const hash = Math.random().toString(36).substring(2, 8);
    const newId = `${meetingId}-${role}-${clean}-${hash}`;
    localStorage.setItem(key, newId);
    return newId;
  }, [meetingId, safeUserName, isDoctor]);

  // ✅ Cleanup on unmount (optional)
  useEffect(() => {
    return () => {
      localStorage.removeItem(`lk-id:${meetingId}`);
    };
  }, [meetingId]);

  // ✅ Token fetching logic
  const fetchToken = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get(`/consultations/${meetingId}/video-token/`, {
        params: { identity },
      });
      setToken(res.data.token);
      setLivekitUrl(res.data.url);
    } catch (err) {
      console.error("❌ Failed to fetch LiveKit token:", err);
      setError("Не удалось получить токен доступа к конференции.");
    } finally {
      setLoading(false);
    }
  }, [meetingId, identity]);

  // ✅ Initial + retry fetch
  useEffect(() => {
    if (meetingId) {
      fetchToken();
    }
  }, [meetingId, fetchToken, retryCount]);

  // ✅ Optional auto-retry every 5s
  useEffect(() => {
    if (!token && !loading) {
      const interval = setInterval(() => {
        setRetryCount((c) => c + 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token, loading]);

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
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect
        video
        audio
        onDisconnected={(reason) => {
          console.warn("🚨 Disconnected:", reason);
          setToken(null); // 🔁 trigger retry
        }}
        data-lk-theme="default"
        style={{ height: "100%", width: "100%" }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default VideoFrame;

/* ✅ Reusable placeholder UI */
interface PlaceholderProps {
  icon: React.ReactNode;
  headline: string;
  sub?: React.ReactNode;
}
const Placeholder: React.FC<PlaceholderProps> = ({ icon, headline, sub }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-700 p-4">
    {icon}
    <p className="text-xl font-medium">{headline}</p>
    {sub && <p className="text-sm text-gray-500 mt-2">{sub}</p>}
  </div>
);
