"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStethoscope,
  faUser,
  faIdCard,
  faRecordVinyl,
  faFileAlt,
  faClock,
  faSignal,
  faUserMd,
  faHeartbeat,
  faEye,
  faNotesMedical,
  faHeart,
  faShieldAlt,
  faHeadset,
  faWifi,
  faFlask
} from "@fortawesome/free-solid-svg-icons";

// Using shared Consultation type from @/types/consultation

interface MediaStatus {
  video: boolean;
  audio: boolean;
  screen?: boolean;
}

interface DoctorVideoHeaderProps {
  meetingId: string;
  patientName: string;
  consultation: Consultation;
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
  onOpenChart?: () => void;
  mediaStatus?: MediaStatus;
}

const DoctorVideoHeader: React.FC<DoctorVideoHeaderProps> = ({
  meetingId,
  patientName,
  consultation,
  onToggleVideo,
  onToggleAudio,
  onOpenChart,
  mediaStatus = { video: true, audio: true }
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [isExpanded, setIsExpanded] = useState(false);
  const [networkLatency, setNetworkLatency] = useState(38);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Performance optimized timer using RAF
  useEffect(() => {
    const updateDuration = () => {
      setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    };

    intervalRef.current = setInterval(updateDuration, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Simulate connection quality changes
  useEffect(() => {
    const qualityInterval = setInterval(() => {
      const qualities: Array<'excellent' | 'good' | 'poor'> = ['excellent', 'good', 'poor'];
      setConnectionQuality(qualities[Math.floor(Math.random() * qualities.length)]);
      setNetworkLatency(Math.floor(Math.random() * 80) + 25);
    }, 12000);

    return () => clearInterval(qualityInterval);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getConnectionColor = useCallback(() => {
    switch (connectionQuality) {
      case 'excellent': return 'text-emerald-400';
      case 'good': return 'text-amber-400';
      case 'poor': return 'text-red-400';
      default: return 'text-slate-400';
    }
  }, [connectionQuality]);

  const getConnectionBgColor = useCallback(() => {
    switch (connectionQuality) {
      case 'excellent': return 'bg-emerald-400';
      case 'good': return 'bg-amber-400';
      case 'poor': return 'bg-red-400';
      default: return 'bg-slate-400';
    }
  }, [connectionQuality]);

  const connectionBars = useMemo(() => {
    const bars = [];
    const maxBars = 4;
    const activeBars = connectionQuality === 'excellent' ? 4 : connectionQuality === 'good' ? 3 : 1;

    for (let i = 0; i < maxBars; i++) {
      bars.push(
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-500 ease-out transform ${
            i < activeBars ? getConnectionBgColor() + ' scale-110' : 'bg-slate-600 scale-90'
          }`}
          style={{
            height: `${6 + i * 3}px`,
            animationDelay: `${i * 100}ms`
          }}
        />
      );
    }
    return bars;
  }, [connectionQuality, getConnectionBgColor]);

  const getConsultationTheme = () => {
    switch (consultation.consultation_type) {
      case 'cardiology':
        return {
          primary: 'rgba(239, 68, 68, 0.2)',
          accent: 'border-red-400',
          icon: faHeart
        };
      case 'psychiatry':
        return {
          primary: 'rgba(168, 85, 247, 0.2)',
          accent: 'border-purple-400',
          icon: faHeadset
        };
      case 'pediatric':
        return {
          primary: 'rgba(34, 197, 94, 0.2)',
          accent: 'border-green-400',
          icon: faHeart
        };
      default:
        return {
          primary: 'rgba(16, 185, 129, 0.2)',
          accent: 'border-emerald-400',
          icon: faStethoscope
        };
    }
  };

  const theme = getConsultationTheme();

  if (isLoading) {
    return (
      <header className="relative backdrop-blur-md border-b border-white/10 p-3 sm:p-4 lg:p-6 z-10 bg-gradient-to-br from-emerald-900/90 to-teal-800/90">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-700"></div>
              <div className="space-y-2">
                <div className="h-5 sm:h-6 bg-emerald-700 rounded w-48 sm:w-64"></div>
                <div className="h-3 sm:h-4 bg-emerald-700 rounded w-24 sm:w-32"></div>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-700 self-center sm:self-auto"></div>
            <div className="flex gap-2 sm:gap-4 justify-center sm:justify-start">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-12 sm:w-12 sm:h-16 bg-emerald-700 rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex justify-center gap-4 lg:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-emerald-700 rounded w-20 sm:w-24"></div>
            ))}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`relative backdrop-blur-xl border-b border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 z-10 transition-all duration-700 ease-out ${
        isExpanded ? 'pb-4' : ''
      }`}
      style={{
        background: `
          linear-gradient(135deg,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.08) 50%,
            ${theme.primary} 100%
          )
        `
      }}
    >

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Main Header Section */}
      <div className="flex items-center justify-between gap-2 relative">
        {/* Left Section - Icon + Patient Name */}
        <div className="flex items-center gap-2 group flex-1 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg transition-all duration-300 group-hover:scale-110 bg-white/20 flex-shrink-0`}
          >
            <FontAwesomeIcon
              icon={theme.icon}
              className="text-white text-sm transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          <div className="text-left flex-1 min-w-0">
            {/* Patient Name */}
            <h1 className="text-sm sm:text-base font-bold text-white mb-0 flex items-center gap-1.5 transition-all duration-300 hover:text-emerald-200">
              <FontAwesomeIcon icon={faUserMd} className="text-emerald-200 transition-colors duration-300 text-xs" />
              <span className="truncate">{patientName}</span>
            </h1>

            {/* Status + Timer Row */}
            <div className="flex items-center gap-2 text-white/80">
              <div className="text-emerald-200 text-[10px]">
                Online
              </div>
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} className="text-[9px] animate-pulse" />
                <span className="font-mono tabular-nums text-[10px]">{formatDuration(callDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Connection Quality */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Connection Quality Bars */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer group" title={`${connectionQuality} (${networkLatency}ms)`}>
            <div className="flex items-end gap-0.5 h-3 transition-transform duration-300 group-hover:scale-110">
              {connectionBars}
            </div>
          </div>

          {/* Network Latency */}
          <div className="flex flex-col items-center gap-0.5">
            <FontAwesomeIcon icon={faWifi} className={`${getConnectionColor()} text-xs`} />
            <span className="text-[9px] font-medium text-white/80">{networkLatency}ms</span>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      {/* <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
          <span className="text-white/80 text-sm font-medium">Консультация активна</span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faRecordVinyl} className="text-red-400 text-sm animate-pulse" />
            <span className="text-red-300 text-sm font-medium">Идет запись</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faHeartbeat} className="text-emerald-400 text-sm animate-pulse" />
          <span className="text-white/80 text-sm font-medium">Мониторинг пациента</span>
        </div>
      </div> */}

      {/* Expanded Section */}
      {/* <div className={`transition-all duration-500 ease-out overflow-hidden ${isExpanded ? 'max-h-32 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-emerald-400 font-semibold">Качество</div>
              <div className="text-white/80 text-sm">{connectionQuality === 'excellent' ? 'Отличное' : connectionQuality === 'good' ? 'Хорошее' : 'Слабое'}</div>
            </div>
            <div>
              <div className="text-green-400 font-semibold">Задержка</div>
              <div className="text-white/80 text-sm">{networkLatency}ms</div>
            </div>
            <div>
              <div className="text-purple-400 font-semibold">Статус</div>
              <div className="text-white/80 text-sm capitalize">{consultation.status}</div>
            </div>
            <div>
              <div className="text-orange-400 font-semibold">Тип</div>
              <div className="text-white/80 text-sm capitalize">{consultation.consultation_type || 'Общий'}</div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Enhanced shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -skew-x-12 transform -translate-x-full animate-shimmer"></div>

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-t-lg"></div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </header>
  );
};

export default DoctorVideoHeader;