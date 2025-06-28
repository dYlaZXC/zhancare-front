"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  LiveKitRoom,
  useTracks,
  ParticipantTile,
  TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
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
  const [retryCount, setRetryCount] = useState(0);

  const identity = useMemo(() => {
    const key = `lk_identity_${meetingId}_${isDoctor ? "dr" : "pt"}`;
    const cached = typeof window !== "undefined" ? localStorage.getItem(key) : null;

    if (cached) return cached;

    const role = isDoctor ? "doctor" : "patient";
    const clean = safeUserName.toLowerCase().replace(/[^a-z0-9]/g, "") || "guest";
    const hash = Math.random().toString(36).slice(2, 8);

    const newId = `${meetingId}-${role}-${clean}-${hash}`;
    if (typeof window !== "undefined") localStorage.setItem(key, newId);
    return newId;
  }, [meetingId, safeUserName, isDoctor]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setError(null);
        const { data } = await api.get(`/consultations/${meetingId}/video-token/`, {
          params: { identity },
        });
        setToken(data.token);
        setLivekitUrl(data.url);
      } catch (err) {
        console.error("❌ Token fetch failed:", err);
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
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect
        video
        audio
        onConnected={() => console.log("✅ Connected  ➜", identity)}
        onDisconnected={(reason) => console.warn("❌ Disconnected:", reason)}
        data-lk-theme="default"
        style={{ height: "100%", width: "100%" }}
      >
        <PiPLayout />
      </LiveKitRoom>
    </div>
  );
};

export default VideoFrame;

/* ---------------- Custom PiP Layout ---------------- */

const PiPLayout: React.FC = () => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: true },
    ],
    { onlySubscribed: false }
  );

  const localCam = tracks.find((t) => t.participant.isLocal);
  const remoteCam = tracks.find((t) => !t.participant.isLocal);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Remote (doctor or patient) - fullscreen */}
      {remoteCam && (
        <ParticipantTile
          trackRef={remoteCam as TrackReferenceOrPlaceholder}
          className="absolute inset-0 w-full h-full object-cover z-0"
          disableSpeakingIndicator
        />
      )}

      {/* Local self-view - small window */}
      {localCam && (
        <div className="absolute bottom-4 right-4 w-40 h-32 z-10 shadow-lg border border-gray-800 rounded overflow-hidden bg-black">
          <ParticipantTile
            trackRef={localCam as TrackReferenceOrPlaceholder}
            className="w-full h-full object-cover"
            disableSpeakingIndicator
          />
        </div>
      )}
    </div>
  );
};

/* ---------------- Placeholder UI ---------------- */

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
