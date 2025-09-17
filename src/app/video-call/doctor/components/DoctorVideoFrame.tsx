"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import { RoomOptions, VideoPresets } from "livekit-client";
import "@livekit/components-styles";
import { api } from "@/utils/api";
import { Loader2, RefreshCw } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeartbeat,
  faSignal,
  faRecordVinyl
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


  // LiveKit room options with explicit audio configuration
  const roomOptions = useMemo<RoomOptions>(() => ({
    adaptiveStream: true,
    dynacast: true,
    publishDefaults: {
      audioPreset: {
        maxBitrate: 20_000,
      },
      videoPreset: VideoPresets.h720,
    },
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },
    audioCaptureDefaults: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
    },
  }), []);

  // Connect options to force audio publishing
  const connectOptions = useMemo(() => ({
    autoSubscribe: true,
    publishAudio: true,
    publishVideo: true,
    metadata: JSON.stringify({
      displayName: safeUserName,
      role: 'doctor'
    })
  }), [safeUserName]);

  // UI states
  const [patientVitals, setPatientVitals] = useState({
    heartRate: 72,
    bloodPressure: "120/80",
    temperature: "36.6"
  });

  // Consistent identity generation for LiveKit (prevents multiple device connections)
  const identity = useMemo(() => {
    const clean = safeUserName.toLowerCase().replace(/[^a-z0-9]/g, "") || "doctor";
    const emailHash = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    return `${meetingId}-doctor-${clean}-${emailHash}`;
  }, [meetingId, safeUserName, userEmail]);


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
          connect={true}
          video={true}
          audio={true}
          options={roomOptions}
          connectOptions={connectOptions}
          onDisconnected={(reason) => {
            console.warn("🚨 Doctor disconnected:", reason);
            setToken(null); // trigger retry
            onDisconnect?.();
          }}
          onConnected={() => {
            console.log("✅ Doctor connected to LiveKit room");
          }}
          onError={(error) => {
            console.error("❌ Doctor LiveKit room error:", error);
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
          <VideoConference />

          {/* Responsive CSS for Doctor View: Patient Large, Doctor Small */}
          <style dangerouslySetInnerHTML={{
            __html: `
              .lk-video-conference .lk-focus-layout .lk-participant-tile {
                position: relative !important;
              }

              .lk-video-conference .lk-participant-tile[data-lk-local-participant="false"] {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 1 !important;
              }

              .lk-video-conference .lk-participant-tile[data-lk-local-participant="true"] {
                position: absolute !important;
                z-index: 10 !important;
                border: 2px solid white !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
              }

              /* Mobile and small screens */
              @media (max-width: 640px) {
                .lk-video-conference .lk-participant-tile[data-lk-local-participant="true"] {
                  top: 0.5rem !important;
                  right: 0.5rem !important;
                  width: 6rem !important;
                  height: 4.5rem !important;
                  border-radius: 0.375rem !important;
                }
              }

              /* Medium screens */
              @media (min-width: 641px) and (max-width: 1024px) {
                .lk-video-conference .lk-participant-tile[data-lk-local-participant="true"] {
                  top: 0.75rem !important;
                  right: 0.75rem !important;
                  width: 8rem !important;
                  height: 6rem !important;
                  border-radius: 0.5rem !important;
                }
              }

              /* Large screens */
              @media (min-width: 1025px) {
                .lk-video-conference .lk-participant-tile[data-lk-local-participant="true"] {
                  top: 1rem !important;
                  right: 1rem !important;
                  width: 12rem !important;
                  height: 9rem !important;
                  border-radius: 0.5rem !important;
                }
              }

              .lk-video-conference .lk-grid-layout {
                position: relative !important;
              }

              /* Hide leave button from LiveKit interface */
              .lk-video-conference .lk-button.lk-disconnect-button,
              .lk-video-conference button[data-lk-unpin-button],
              .lk-video-conference .lk-control-bar .lk-disconnect-button,
              .lk-video-conference .lk-control-bar button[aria-label="Leave"],
              .lk-video-conference .lk-control-bar button[aria-label*="disconnect"],
              .lk-video-conference .lk-control-bar button[aria-label*="leave"] {
                display: none !important;
              }
            `
          }} />
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

        {/* Audio Debug Overlay */}
        {/* <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-emerald-400/30 z-30 max-w-sm">
          <h4 className="text-emerald-300 font-semibold text-xs mb-2 flex items-center gap-2">
            🎵 Audio Debug
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/70">Permission:</span>
              <span className={`font-mono ${audioPermissionGranted === true ? 'text-green-400' : audioPermissionGranted === false ? 'text-red-400' : 'text-yellow-400'}`}>
                {audioPermissionGranted === true ? '✅ Granted' : audioPermissionGranted === false ? '❌ Denied' : '⏳ Checking...'}
              </span>
            </div>
            {debugInfo.map((log, index) => (
              <div key={index} className="text-emerald-300 text-xs font-mono">
                {log}
              </div>
            ))}
          </div>
        </div> */}

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