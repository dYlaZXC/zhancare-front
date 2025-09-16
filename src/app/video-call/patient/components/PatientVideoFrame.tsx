"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LiveKitRoom,
  TrackToggle,
  ChatToggle,
  LayoutContextProvider,
  Chat,
  useChat,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import PiPLayout from "../../components/PiPLayout";
import "@livekit/components-styles";
import { api } from "@/utils/api";
import { Loader2, RefreshCw, MessageSquare } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignal,
  faShieldAlt,
  faComments
} from "@fortawesome/free-solid-svg-icons";

interface PatientVideoFrameProps {
  meetingId: string;
  safeUserName: string;
  userEmail: string;
  otherPartyJoined: boolean;
  onDisconnect: () => void;
  doctorName: string;
}

// Patient-friendly Placeholder Component
const PatientPlaceholder: React.FC<{
  icon: React.ReactNode;
  headline: string;
  sub: React.ReactNode;
  meetingId: string;
}> = ({ icon, headline, sub, meetingId }) => (
  <div className="relative w-full h-full min-h-[600px] rounded-2xl overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        {icon}
        <h2 className="text-xl font-semibold text-white mb-3">{headline}</h2>
        <div className="text-blue-300 text-sm">{sub}</div>
        <div className="mt-4 text-xs text-white/70">ID встречи: {meetingId}</div>
      </div>
    </div>
  </div>
);

const PatientVideoFrame: React.FC<PatientVideoFrameProps> = ({
  meetingId,
  safeUserName,
  userEmail,
  otherPartyJoined,
  onDisconnect,
  doctorName
}) => {
  // LiveKit states
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  // Stable identity generation for LiveKit
  const identity = useMemo(() => {
    const key = `lk-id:${meetingId}`;
    let cached = localStorage.getItem(key);
    if (cached) return cached;

    const clean = safeUserName.toLowerCase().replace(/[^a-z0-9]/g, "") || "patient";
    const hash = Math.random().toString(36).substring(2, 8);
    const newId = `${meetingId}-patient-${clean}-${hash}`;
    localStorage.setItem(key, newId);
    return newId;
  }, [meetingId, safeUserName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem(`lk-id:${meetingId}`);
    };
  }, [meetingId]);

  // Token fetching logic
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
      setError("Не удалось получить токен доступа к видеоконференции.");
    } finally {
      setLoading(false);
    }
  }, [meetingId, identity]);

  // Initial + retry fetch
  useEffect(() => {
    if (meetingId) {
      fetchToken();
    }
  }, [meetingId, fetchToken, retryCount]);

  // Optional auto-retry every 5s
  useEffect(() => {
    if (!token && !loading) {
      const interval = setInterval(() => {
        setRetryCount((c) => c + 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token, loading]);

  // Loading states
  if (!otherPartyJoined) {
    return (
      <PatientPlaceholder
        icon={<Loader2 className="animate-spin w-8 h-8 mb-4 text-blue-500" />}
        headline="⏳ Ожидаем врача..."
        sub="Врач подключится в ближайшее время. Пожалуйста, оставайтесь на линии."
        meetingId={meetingId}
      />
    );
  }

  if (!token || !livekitUrl) {
    return error ? (
      <PatientPlaceholder
        icon={<RefreshCw className="w-8 h-8 mb-4 text-red-500" />}
        headline="Ошибка подключения к видеоконференции"
        sub={
          <>
            <span className="block mb-2">{error}</span>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors border-2 border-blue-400"
            >
              Повторить попытку
            </button>
          </>
        }
        meetingId={meetingId}
      />
    ) : (
      <PatientPlaceholder
        icon={<Loader2 className="animate-spin w-8 h-8 mb-4 text-blue-600" />}
        headline="🔄 Подключение к видеоконференции..."
        sub="Получение доступа..."
        meetingId={meetingId}
      />
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-2xl overflow-hidden group">
      {/* LiveKit Video Conference with PiP Layout */}
      <div className="relative w-full h-full">
        <LiveKitRoom
          token={token}
          serverUrl={livekitUrl}
          connect
          video={true}
          audio={true}
          onDisconnected={(reason) => {
            console.warn("🚨 Patient disconnected:", reason);
            setToken(null); // trigger retry
            onDisconnect?.();
          }}
          onConnected={() => {
            console.log("✅ Patient connected to LiveKit room");
          }}
          onError={(error) => {
            console.error("❌ Patient LiveKit room error:", error);
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

            {/* Official LiveKit Chat Panel */}
            <div className={`absolute top-0 right-0 w-80 h-full bg-slate-900/95 backdrop-blur-sm border-l border-blue-400/30 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
              chatOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
              <div className="flex items-center justify-between p-4 border-b border-blue-400/20">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FontAwesomeIcon icon={faComments} className="text-blue-400" />
                  Чат с врачом
                </h3>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat
                  className="h-full"
                  style={{
                    '--lk-bg': 'transparent',
                    '--lk-fg': '#ffffff',
                    '--lk-accent': '#3b82f6',
                    height: '100%',
                    background: 'transparent',
                    border: 'none'
                  } as React.CSSProperties}
                />
              </div>
            </div>

            {/* LiveKit Control Panel - Removed DisconnectButton */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 backdrop-blur-sm border-t border-blue-400/20 p-4 rounded-b-2xl z-30">
              <div className="flex items-center justify-center gap-4">
                <TrackToggle
                  source={Track.Source.Microphone}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 transition-all duration-300 flex items-center justify-center text-white"
                />
                <TrackToggle
                  source={Track.Source.Camera}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 transition-all duration-300 flex items-center justify-center text-white"
                />
                <TrackToggle
                  source={Track.Source.ScreenShare}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 transition-all duration-300 flex items-center justify-center text-white"
                />
                {/* Official LiveKit Chat Toggle */}
                <ChatToggle
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 transition-all duration-300 flex items-center justify-center text-white"
                  onClick={() => setChatOpen(!chatOpen)}
                />
              </div>
            </div>
          </LayoutContextProvider>
        </LiveKitRoom>

        {/* Patient-friendly Overlays - Outside LiveKit context */}
        {/* Security Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-green-600/90 backdrop-blur-sm rounded-lg border border-green-400 z-30">
          <FontAwesomeIcon icon={faShieldAlt} className="text-white" />
          <span className="text-white text-sm font-medium">Защищено</span>
        </div>

        {/* Connection Quality Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-blue-600/90 backdrop-blur-sm rounded-lg border border-blue-400 z-30">
          <FontAwesomeIcon icon={faSignal} className="text-white" />
          <span className="text-white text-sm font-medium">HD</span>
        </div>

      </div>

      {/* Subtle Patient-Friendly Grid Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full"
             style={{
               backgroundImage: `
                 linear-gradient(rgba(55, 114, 255, 0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(55, 114, 255, 0.1) 1px, transparent 1px)
               `,
               backgroundSize: '20px 20px'
             }}>
        </div>
      </div>

      {/* Hover Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
    </div>
  );
};

export default PatientVideoFrame;