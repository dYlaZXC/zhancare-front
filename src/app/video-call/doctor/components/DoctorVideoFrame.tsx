"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LiveKitRoom,
  TrackToggle,
  ChatToggle,
  DisconnectButton,
  LayoutContextProvider,
  Chat,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import PiPLayout from "../../components/PiPLayout";
import "@livekit/components-styles";
import { api } from "@/utils/api";
import { Loader2, RefreshCw } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeartbeat,
  faSignal,
  faRecordVinyl,
  faComments
} from "@fortawesome/free-solid-svg-icons";

interface DoctorVideoFrameProps {
  meetingId: string;
  safeUserName: string;
  userEmail: string;
  otherPartyJoined: boolean;
  onDisconnect: () => void;
  isRecording: boolean;
  patientName: string;
}

// Medical Placeholder Component
const MedicalPlaceholder: React.FC<{
  icon: React.ReactNode;
  headline: string;
  sub: React.ReactNode;
  isRecording: boolean;
  meetingId: string;
}> = ({ icon, headline, sub, isRecording, meetingId }) => (
  <div className="relative w-full h-full min-h-[600px] rounded-2xl overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        {icon}
        <h2 className="text-xl font-semibold text-white mb-3">{headline}</h2>
        <div className="text-emerald-300 text-sm">{sub}</div>
        <div className="mt-4 text-xs text-white/70">Meeting ID: {meetingId}</div>
      </div>
    </div>
    {isRecording && (
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-red-600/90 backdrop-blur-sm rounded-lg border border-red-400">
        <FontAwesomeIcon icon={faRecordVinyl} className="text-white animate-pulse" />
        <span className="text-white text-sm font-medium">REC</span>
      </div>
    )}
  </div>
);

const DoctorVideoFrame: React.FC<DoctorVideoFrameProps> = ({
  meetingId,
  safeUserName,
  userEmail,
  otherPartyJoined,
  onDisconnect,
  isRecording,
  patientName
}) => {
  // LiveKit states
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  // UI states
  const [patientVitals, setPatientVitals] = useState({
    heartRate: 72,
    bloodPressure: "120/80",
    temperature: "36.6"
  });

  // Stable identity generation for LiveKit
  const identity = useMemo(() => {
    const key = `lk-id:${meetingId}`;
    let cached = localStorage.getItem(key);
    if (cached) return cached;

    const clean = safeUserName.toLowerCase().replace(/[^a-z0-9]/g, "") || "doctor";
    const hash = Math.random().toString(36).substring(2, 8);
    const newId = `${meetingId}-doctor-${clean}-${hash}`;
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

  // Mock vital signs updates for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setPatientVitals({
        heartRate: Math.floor(Math.random() * 20) + 65,
        bloodPressure: `${Math.floor(Math.random() * 30) + 110}/${Math.floor(Math.random() * 20) + 70}`,
        temperature: (Math.random() * 2 + 36).toFixed(1)
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Loading states
  if (!otherPartyJoined) {
    return (
      <MedicalPlaceholder
        icon={<Loader2 className="animate-spin w-8 h-8 mb-4 text-emerald-500" />}
        headline="⏳ Ожидание пациента..."
        sub="Мы уведомили пациента. Пожалуйста, оставайтесь на линии."
        isRecording={isRecording}
        meetingId={meetingId}
      />
    );
  }

  if (!token || !livekitUrl) {
    return error ? (
      <MedicalPlaceholder
        icon={<RefreshCw className="w-8 h-8 mb-4 text-red-500" />}
        headline="Ошибка подключения к видеоконференции"
        sub={
          <>
            <span className="block mb-2">{error}</span>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors border-2 border-emerald-400"
            >
              Повторить попытку
            </button>
          </>
        }
        isRecording={isRecording}
        meetingId={meetingId}
      />
    ) : (
      <MedicalPlaceholder
        icon={<Loader2 className="animate-spin w-8 h-8 mb-4 text-emerald-600" />}
        headline="🔄 Подключение к видеоконференции..."
        sub="Получение доступа..."
        isRecording={isRecording}
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
          video
          audio
          onDisconnected={(reason) => {
            console.warn("🚨 Doctor disconnected:", reason);
            setToken(null); // trigger retry
            onDisconnect?.();
          }}
          onConnected={() => {
            console.log("✅ Doctor connected to LiveKit room");
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
            <div className={`absolute top-0 right-0 w-80 h-full bg-slate-900/95 backdrop-blur-sm border-l border-emerald-400/30 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
              chatOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
              <div className="flex items-center justify-between p-4 border-b border-emerald-400/20">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FontAwesomeIcon icon={faComments} className="text-emerald-400" />
                  Чат с пациентом
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
                    '--lk-accent': '#10b981',
                    height: '100%',
                    background: 'transparent',
                    border: 'none'
                  } as React.CSSProperties}
                />
              </div>
            </div>

            {/* LiveKit Control Panel - Inside LayoutContextProvider */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 backdrop-blur-sm border-t border-emerald-400/20 p-4 rounded-b-2xl z-30">
              <div className="flex items-center justify-center gap-4">
                <TrackToggle
                  source={Track.Source.Microphone}
                  className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-400 transition-all duration-300 flex items-center justify-center text-white"
                />
                <TrackToggle
                  source={Track.Source.Camera}
                  className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-400 transition-all duration-300 flex items-center justify-center text-white"
                />
                <TrackToggle
                  source={Track.Source.ScreenShare}
                  className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-400 transition-all duration-300 flex items-center justify-center text-white"
                />
                <ChatToggle
                  className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-400 transition-all duration-300 flex items-center justify-center text-white"
                  onClick={() => setChatOpen(!chatOpen)}
                />
                <DisconnectButton className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 border-2 border-red-400 transition-all duration-300 flex items-center justify-center text-white" />
              </div>
            </div>
          </LayoutContextProvider>
        </LiveKitRoom>

        {/* Medical Overlays - Outside LiveKit context */}
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-red-600/90 backdrop-blur-sm rounded-lg border border-red-400 z-30">
            <FontAwesomeIcon icon={faRecordVinyl} className="text-white animate-pulse" />
            <span className="text-white text-sm font-medium">REC</span>
          </div>
        )}

        {/* Connection Quality Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-emerald-600/90 backdrop-blur-sm rounded-lg border border-emerald-400 z-30">
          <FontAwesomeIcon icon={faSignal} className="text-white" />
          <span className="text-white text-sm font-medium">HD</span>
        </div>

        {/* Patient Vitals Overlay */}
        {/* {otherPartyJoined && (
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-xl p-4 border border-emerald-400/30 z-30">
            <h4 className="text-emerald-300 font-semibold text-sm mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faHeartbeat} className="animate-pulse" />
              Показатели пациента
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/70">Пульс:</span>
                <span className="text-emerald-300 font-mono">{patientVitals.heartRate} уд/мин</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/70">Давление:</span>
                <span className="text-emerald-300 font-mono">{patientVitals.bloodPressure}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/70">Температура:</span>
                <span className="text-emerald-300 font-mono">{patientVitals.temperature}°C</span>
              </div>
            </div>
          </div>
        )} */}

      </div>

      {/* Subtle Medical Grid Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full"
             style={{
               backgroundImage: `
                 linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
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

export default DoctorVideoFrame;