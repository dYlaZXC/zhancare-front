"use client";

import React, { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles"; // ✅ Import LiveKit styles
import { api } from "@/utils/api";
import { Loader2 } from "lucide-react";

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

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await api.get(`/consultations/${meetingId}/video-token/`);
        const data = res.data;
        setToken(data.token);
        setLivekitUrl(data.url);
      } catch (error) {
        console.error("❌ Failed to fetch LiveKit token:", error);
      }
    };

    if (meetingId) fetchToken();
  }, [meetingId]);

  if (!otherPartyJoined) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-700">
        <Loader2 className="animate-spin w-8 h-8 mb-4 text-gray-500" />
        <p className="text-xl font-medium">
          {isDoctor ? "⏳ Ожидание пациента..." : "⏳ Ожидание врача..."}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Мы уведомили второго участника. Пожалуйста, оставайтесь на линии.
        </p>
      </div>
    );
  }

  if (!token || !livekitUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center text-blue-700">
        <Loader2 className="animate-spin w-8 h-8 mb-4" />
        <p className="text-lg font-semibold">🔄 Получение доступа к конференции...</p>
      </div>
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
        data-lk-theme="default"
        style={{ height: "100%", width: "100%" }}
      >
        {/* 🔒 Must only pass ONE child — this is valid */}
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default VideoFrame;
