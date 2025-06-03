"use client";

import React from "react";

interface VideoHeaderProps {
  meetingId: string;
  isDoctor: boolean;
  doctor: string;
}

const VideoHeader: React.FC<VideoHeaderProps> = ({ meetingId, isDoctor, doctor }) => {
  return (
    <header className="bg-white shadow p-4 text-center">
      <h1 className="text-xl font-bold">
        {isDoctor ? "Вы ведете консультацию" : `Звонок с доктором ${doctor}`}
      </h1>
      <p className="text-sm text-gray-500">ID встречи: {meetingId}</p>
    </header>
  );
};

export default VideoHeader;
