"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import { RoomOptions, VideoPresets } from "livekit-client";
import "@livekit/components-styles";
import { api } from "@/utils/api";
import { Loader2, RefreshCw, MessageSquare } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignal,
  faShieldAlt
} from "@fortawesome/free-solid-svg-icons";

interface PatientVideoFrameProps {
  meetingId: string;
  safeUserName: string;
  userEmail: string;
  onDisconnect: () => void;
  doctorName: string;
}

// Patient-friendly Placeholder Component
const PatientPlaceholder: React.FC<{
  icon: React.ReactNode;
  headline: string;
  sub: React.ReactNode;
  meetingId: string;
  type?: 'loading' | 'error';
}> = ({ icon, headline, sub, meetingId, type = 'loading' }) => (
  <div className="relative w-full h-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] rounded-2xl overflow-hidden">
    {/* Animated gradient background */}
    <div className={`absolute inset-0 ${
      type === 'error'
        ? 'bg-gradient-to-br from-red-900/30 via-gray-900/40 to-orange-900/30'
        : 'bg-gradient-to-br from-blue-900/30 via-indigo-900/40 to-purple-900/30'
    } flex items-center justify-center`}>

      {/* Animated circles background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${
          type === 'error' ? 'bg-red-500/10' : 'bg-blue-500/10'
        } rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${
          type === 'error' ? 'bg-orange-500/10' : 'bg-indigo-500/10'
        } rounded-full blur-3xl animate-pulse delay-1000`}></div>
      </div>

      {/* Content card */}
      <div className="relative z-10 text-center max-w-md mx-auto p-8">
        <div className={`mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl ${
          type === 'error'
            ? 'bg-red-600/20 border-2 border-red-400/30'
            : 'bg-blue-600/20 border-2 border-blue-400/30'
        } backdrop-blur-sm`}>
          {icon}
        </div>

        <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{headline}</h2>

        <div className="text-base text-blue-200 mb-6 leading-relaxed">{sub}</div>

        {/* Meeting ID Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-white/90 font-medium">ID: {meetingId}</span>
        </div>

        {/* Decorative line */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className={`h-1 w-12 rounded-full ${
            type === 'error' ? 'bg-red-400/30' : 'bg-blue-400/30'
          }`}></div>
          <div className={`h-1 w-1 rounded-full ${
            type === 'error' ? 'bg-red-400/50' : 'bg-blue-400/50'
          }`}></div>
          <div className={`h-1 w-12 rounded-full ${
            type === 'error' ? 'bg-red-400/30' : 'bg-blue-400/30'
          }`}></div>
        </div>
      </div>
    </div>

    {/* Grid overlay */}
    <div className="absolute inset-0 opacity-5 pointer-events-none">
      <div className="w-full h-full"
           style={{
             backgroundImage: `
               linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
             `,
             backgroundSize: '24px 24px'
           }}>
      </div>
    </div>
  </div>
);

const PatientVideoFrame: React.FC<PatientVideoFrameProps> = ({
  meetingId,
  safeUserName,
  userEmail,
  onDisconnect,
  doctorName
}) => {
  // LiveKit states
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Debug logging helper
  const addDebugLog = useCallback((message: string) => {
    console.log(`🎯 Patient Audio Debug: ${message}`);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  // Check browser permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        addDebugLog("Checking audio permissions...");

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          addDebugLog("❌ getUserMedia not available");
          return;
        }

        // Request audio permission
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        addDebugLog("✅ Audio permission granted");
        setAudioPermissionGranted(true);

        // Check audio tracks
        const audioTracks = stream.getAudioTracks();
        addDebugLog(`Found ${audioTracks.length} audio tracks`);

        audioTracks.forEach((track, index) => {
          addDebugLog(`Audio track ${index}: ${track.label}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
        });

        // Clean up
        stream.getTracks().forEach(track => track.stop());

      } catch (error: any) {
        addDebugLog(`❌ Audio permission error: ${error.message}`);
        setAudioPermissionGranted(false);
      }
    };

    checkPermissions();
  }, [addDebugLog]);

  // LiveKit room options with HIGH QUALITY video configuration
  const roomOptions = useMemo<RoomOptions>(() => ({
    adaptiveStream: true, // Automatically adjusts quality based on network
    dynacast: true, // Dynamic broadcasting for better performance
    publishDefaults: {
      audioPreset: {
        maxBitrate: 64_000, // Increased from 20_000 for better audio quality
      },
      videoPreset: VideoPresets.h1080, // Upgraded to 1080p (Full HD)
      // Alternative options:
      // VideoPresets.h720 - 720p HD (current)
      // VideoPresets.h1080 - 1080p Full HD (recommended)
      // VideoPresets.h1440 - 1440p 2K (very high quality, requires good network)
      // VideoPresets.h2160 - 2160p 4K (ultra quality, requires excellent network)
      videoEncoding: {
        maxBitrate: 3_000_000, // 3 Mbps for crisp 1080p video
        maxFramerate: 30, // Smooth 30 fps
      },
    },
    videoCaptureDefaults: {
      resolution: VideoPresets.h1080.resolution, // Match video preset
      deviceId: undefined, // Use default camera
    },
    audioCaptureDefaults: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 48000, // High quality audio sampling
      channelCount: 1, // Mono for voice calls
    },
  }), []);

  // Connect options to force audio publishing
  const connectOptions = useMemo(() => ({
    autoSubscribe: true,
    publishAudio: true,
    publishVideo: true,
    metadata: JSON.stringify({
      displayName: safeUserName,
      role: 'patient'
    })
  }), [safeUserName]);

  // Consistent identity generation for LiveKit (prevents multiple device connections)
  const identity = useMemo(() => {
    // const emailHash = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const emailHash = "Пациент";
    return emailHash;
  }, []);


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
  if (!token || !livekitUrl) {
    return error ? (
      <PatientPlaceholder
        icon={<RefreshCw className="w-10 h-10 text-red-400" />}
        headline="Не удалось подключиться"
        sub={
          <div className="space-y-4">
            <p className="text-red-200/90">{error}</p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 border-2 border-blue-400/50 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              Повторить попытку
            </button>
            <p className="text-xs text-white/60 mt-4">
              Проверьте подключение к интернету или обратитесь в поддержку
            </p>
          </div>
        }
        meetingId={meetingId}
        type="error"
      />
    ) : (
      <PatientPlaceholder
        icon={<Loader2 className="animate-spin w-10 h-10 text-blue-400" />}
        headline="Подключение к видеоконференции"
        sub={
          <div className="space-y-4">
            <p className="text-blue-200/90">Устанавливаем защищенное соединение...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
            </div>
            <p className="text-xs text-white/60 mt-4">
              Пожалуйста, подождите. Это может занять несколько секунд
            </p>
          </div>
        }
        meetingId={meetingId}
        type="loading"
      />
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden group bg-gray-800">
      {/* LiveKit Video Conference with PiP Layout */}
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        video={true}
        audio={true}
        options={roomOptions}
        connectOptions={connectOptions}
        onDisconnected={(reason) => {
          console.warn("🚨 Patient disconnected:", reason);
          setToken(null); // trigger retry
          onDisconnect?.();
        }}
        onConnected={() => {
          console.log("✅ Patient connected to LiveKit room");
          addDebugLog("✅ Connected to LiveKit room");
        }}
        onError={(error) => {
          // Don't log client-initiated disconnects as errors
          if (error.message?.includes('Client initiated disconnect')) {
            console.log("ℹ️ Patient client disconnected normally");
            addDebugLog("ℹ️ Client disconnected normally");
            return;
          }

          // Only log actual errors
          console.error("❌ Patient LiveKit room error:", error);
          addDebugLog(`❌ LiveKit error: ${error.message}`);
          setError(`LiveKit error: ${error.message}`);
        }}
        data-lk-theme="default"
        style={{
          height: "100%",
          width: "100%",
        }}
      >
          <VideoConference />

          {/* Responsive CSS for Patient View: Doctor Large, Patient Small */}
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
                  top: 6rem !important;
                  right: 0.5rem !important;
                  width: 8rem !important;
                  height: 6rem !important;
                  border-radius: 0.5rem !important;
                  max-width: 40vw !important;
                  max-height: 30vh !important;
                }

                /* Ensure main video doesn't overflow */
                .lk-video-conference .lk-participant-tile[data-lk-local-participant="false"] {
                  overflow: hidden !important;
                }

                .lk-video-conference video {
                  max-width: 100% !important;
                  max-height: 100% !important;
                }
              }

              /* Medium screens */
              @media (min-width: 641px) and (max-width: 1024px) {
                .lk-video-conference .lk-participant-tile[data-lk-local-participant="true"] {
                  top: 0.75rem !important;
                  right: 0.75rem !important;
                  width: 12rem !important;
                  height: 9rem !important;
                  border-radius: 0.5rem !important;
                }
              }

              /* Large screens */
              @media (min-width: 1025px) {
                .lk-video-conference .lk-participant-tile[data-lk-local-participant="true"] {
                  top: 1rem !important;
                  right: 1rem !important;
                  width: 16rem !important;
                  height: 12rem !important;
                  border-radius: 0.75rem !important;
                }
              }

              .lk-video-conference .lk-grid-layout {
                position: relative !important;
              }

              /* Fix video object-fit to prevent different zooming on different screens */
              .lk-video-conference video {
                object-fit: contain !important;
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

      {/* Patient-friendly Overlays - Outside LiveKit context */}
      {/* Security Badge */}
      {/* <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-green-600/90 backdrop-blur-sm rounded-lg border border-green-400 z-30">
        <FontAwesomeIcon icon={faShieldAlt} className="text-white" />
        <span className="text-white text-sm font-medium">Защищено</span>
      </div> */}

      {/* Audio Debug Overlay */}
      {/* <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-blue-400/30 z-30 max-w-sm">
        <h4 className="text-blue-300 font-semibold text-xs mb-2 flex items-center gap-2">
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
            <div key={index} className="text-blue-300 text-xs font-mono">
              {log}
            </div>
          ))}
        </div>
      </div> */}

      {/* Connection Quality Indicator */}
      {/* <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-blue-600/90 backdrop-blur-sm rounded-lg border border-blue-400 z-30">
        <FontAwesomeIcon icon={faSignal} className="text-white" />
        <span className="text-white text-sm font-medium">HD</span>
      </div> */}

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