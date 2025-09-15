"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faUser, faStethoscope, faIdCard } from "@fortawesome/free-solid-svg-icons";

interface VideoHeaderProps {
  meetingId: string;
  isDoctor: boolean;
  doctor: string;
}

const VideoHeader: React.FC<VideoHeaderProps> = ({ meetingId, isDoctor, doctor }) => {
  return (
    <header className="relative backdrop-blur-md border-b border-white/10 p-6 text-center z-10"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(255, 255, 255, 0.1) 0%,
                  rgba(255, 255, 255, 0.05) 50%,
                  rgba(55, 114, 255, 0.1) 100%
                )
              `
            }}>
      {/* Main Title Section */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg"
             style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
          <FontAwesomeIcon
            icon={isDoctor ? faStethoscope : faVideo}
            className="text-white text-lg"
          />
        </div>

        <div className="text-left">
          <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            {isDoctor ? (
              <>
                <FontAwesomeIcon icon={faStethoscope} className="text-blue-300" />
                Вы ведете консультацию
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUser} className="text-blue-300" />
                Звонок с доктором {doctor}
              </>
            )}
          </h1>

          <div className="flex items-center gap-2 text-white/70 text-sm">
            <FontAwesomeIcon icon={faIdCard} className="text-xs" />
            <span>ID встречи: </span>
            <code className="px-2 py-1 rounded-lg backdrop-blur-sm border border-white/20 text-white font-mono text-xs"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              {meetingId}
            </code>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
        <span className="text-white/80 text-sm font-medium">
          {isDoctor ? "Консультация активна" : "Подключено к консультации"}
        </span>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-full animate-shimmer opacity-0 hover:opacity-100 transition-opacity duration-1000"></div>

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
    </header>
  );
};

export default VideoHeader;
