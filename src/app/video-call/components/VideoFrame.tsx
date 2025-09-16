"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LiveKitRoom,
  LayoutContextProvider,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { api } from "@/utils/api";
import { Loader2, RefreshCw } from "lucide-react";
import PiPLayout from "./PiPLayout";

interface VideoFrameProps {
  meetingId: string;
  safeUserName: string;
  userEmail: string;
  isDoctor: boolean;
  otherPartyJoined: boolean;
  onDisconnect?: () => void;
  showMeetingId?: boolean;
}

const VideoFrame: React.FC<VideoFrameProps> = ({
  meetingId,
  safeUserName,
  userEmail,
  isDoctor,
  otherPartyJoined,
  onDisconnect,
  showMeetingId = false,
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
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm"
         style={{
           background: 'rgba(0, 0, 0, 0.3)',
           minHeight: '500px',
           position: 'relative'
         }}>
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect
        video={true}
        audio={true}
        onDisconnected={(reason) => {
          console.warn("🚨 Disconnected:", reason);
          setToken(null); // 🔁 trigger retry
          // Call onDisconnect for any disconnection reason
          onDisconnect?.();
        }}
        onConnected={() => {
          console.log("✅ Connected to LiveKit room");
        }}
        onError={(error) => {
          console.error("❌ LiveKit room error:", error);
          setError(`LiveKit error: ${error.message}`);
        }}
        data-lk-theme="default"
        style={{
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0
        }}
      >
        <LayoutContextProvider>
          <PiPLayout />
        </LayoutContextProvider>
      </LiveKitRoom>

      {/* Optional subtle meeting ID corner badge */}
      {showMeetingId && (
        <div className="absolute top-4 right-4 z-20">
          <div className="px-3 py-1 rounded-lg backdrop-blur-md border border-white/20 shadow-lg text-xs text-white/80 font-mono"
               style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
            {meetingId}
          </div>
        </div>
      )}

      {/* LiveKit CSS overrides */}
      <style jsx global>{`
        .lk-disconnect-button {
          display: none !important;
        }

        /* Hide meeting ID overlay from video */
        .lk-room-info,
        .lk-room-metadata,
        .lk-participant-metadata,
        .lk-room-name {
          display: none !important;
        }

        /* Ensure video elements are visible and properly sized */
        .lk-video-conference {
          width: 100% !important;
          height: 100% !important;
          min-height: 600px !important;
          position: relative !important;
          background: transparent !important;
        }

        .lk-room-container {
          width: 100% !important;
          height: 100% !important;
          min-height: 600px !important;
          background: transparent !important;
        }

        .lk-grid-layout {
          width: 100% !important;
          height: 100% !important;
          min-height: 500px !important;
          display: flex !important;
          flex-direction: column !important;
          background: transparent !important;
        }

        .lk-focus-layout {
          width: 100% !important;
          height: 100% !important;
          min-height: 500px !important;
          position: relative !important;
          background: transparent !important;
        }

        .lk-participant-tile {
          width: 100% !important;
          height: 100% !important;
          min-height: 400px !important;
          flex-shrink: 0 !important;
          background: #000 !important;
          border-radius: 0 !important;
        }

        .lk-participant-tile video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          background: #000 !important;
          display: block !important;
          opacity: 1 !important;
        }

        .lk-participant-placeholder {
          width: 100% !important;
          height: 100% !important;
          min-height: 400px !important;
          background: #1a1a1a !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* Ensure track elements are visible */
        .lk-track {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Remove any conflicting transforms or animations */
        .lk-participant-tile,
        .lk-participant-placeholder,
        .lk-grid-layout,
        .lk-focus-layout,
        .lk-video-conference {
          transition: none !important;
          animation: none !important;
          transform: none !important;
        }
      `}</style>
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
  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 relative overflow-hidden"
       style={{
         background: `
           radial-gradient(circle at center, rgba(55, 114, 255, 0.1) 0%, transparent 50%),
           linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(55, 114, 255, 0.05) 100%)
         `
       }}>

    {/* Background animated elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-10 left-10 w-16 h-16 rounded-full blur-lg animate-pulse"
           style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.2) 0%, transparent 70%)', animationDuration: '3s' }}></div>
      <div className="absolute bottom-10 right-10 w-12 h-12 rounded-full blur-md animate-bounce"
           style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.15) 0%, transparent 70%)', animationDuration: '2s' }}></div>
    </div>

    {/* Icon container */}
    <div className="relative mb-6 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg"
         style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
      <div className="text-white text-4xl">
        {icon}
      </div>
    </div>

    {/* Text content */}
    <div className="relative z-10">
      <h3 className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
        {headline}
      </h3>
      {sub && (
        <div className="text-white/70 text-sm leading-relaxed max-w-md">
          {sub}
        </div>
      )}
    </div>

    {/* Glass effect overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
  </div>
);
