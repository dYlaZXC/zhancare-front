"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserDoctor,
  faUser,
  faIdCard,
  faClock,
  faSignal,
  faHeart,
  faShieldAlt,
  faPhone,
  faVideo,
  faComments,
  faHeadset,
  faMicrophone,
  faMicrophoneSlash,
  faVideoSlash,
  faExpand,
  faWifi
} from "@fortawesome/free-solid-svg-icons";

// Using shared Consultation type from @/types/consultation

interface MediaStatus {
  video: boolean;
  audio: boolean;
  screen?: boolean;
}

interface PatientVideoHeaderProps {
  meetingId: string;
  doctorName: string;
  consultation: Consultation;
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
  onOpenChat?: () => void;
  onCallSupport?: () => void;
  mediaStatus?: MediaStatus;
}

const PatientVideoHeader: React.FC<PatientVideoHeaderProps> = ({
  meetingId,
  doctorName,
  consultation,
  onToggleVideo,
  onToggleAudio,
  onOpenChat,
  onCallSupport,
  mediaStatus = { video: true, audio: true }
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [isExpanded, setIsExpanded] = useState(false);
  const [networkLatency, setNetworkLatency] = useState(42);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
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
      setNetworkLatency(Math.floor(Math.random() * 100) + 20);
    }, 10000);

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
          primary: 'rgba(59, 130, 246, 0.2)',
          accent: 'border-blue-400',
          icon: faHeart
        };
    }
  };

  const theme = getConsultationTheme();

  if (isLoading) {
    return (
      <header className="relative backdrop-blur-md border-b border-white/10 p-3 sm:p-4 lg:p-6 z-10 bg-gradient-to-br from-slate-900/90 to-slate-800/90">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-700"></div>
              <div className="space-y-2">
                <div className="h-5 sm:h-6 bg-slate-700 rounded w-48 sm:w-64"></div>
                <div className="h-3 sm:h-4 bg-slate-700 rounded w-24 sm:w-32"></div>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-700 self-center sm:self-auto"></div>
            <div className="flex gap-2 sm:gap-4 justify-center sm:justify-start">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-12 sm:w-12 sm:h-16 bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex justify-center gap-4 lg:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-slate-700 rounded w-20 sm:w-24"></div>
            ))}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`relative backdrop-blur-xl border-b border-white/10 p-3 sm:p-4 lg:p-6 z-10 transition-all duration-700 ease-out ${
        isExpanded ? 'pb-6 sm:pb-8' : ''
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
      {/* Responsive Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float hidden sm:block"
            style={{
              left: `${25 + i * 20}%`,
              top: `${30 + (i % 2) * 30}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Responsive Main Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 relative">
        {/* Left Section - Patient Info */}
        <div className="flex items-center gap-3 sm:gap-4 group order-1 sm:order-1">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl bg-white/20`}
          >
            <FontAwesomeIcon
              icon={theme.icon}
              className="text-white text-base sm:text-lg transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          <div className="text-left flex-1 min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-1 flex items-center gap-2 transition-all duration-300 hover:text-blue-200">
              <FontAwesomeIcon icon={faUser} className="text-blue-200 transition-colors duration-300 text-sm sm:text-base" />
              <span className="truncate">Консультация с врачом</span>
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/80 text-xs sm:text-sm">
              <div className="flex items-center gap-2 group/id cursor-pointer" onClick={() => navigator.clipboard.writeText(meetingId)}>
                <FontAwesomeIcon icon={faIdCard} className="text-xs transition-colors duration-200 group-hover/id:text-blue-300" />
                <span className="transition-colors duration-200 group-hover/id:text-white">ID: </span>
                <code className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm border border-white/30 text-white font-mono text-xs transition-all duration-200 group-hover/id:border-blue-300 group-hover/id:bg-white/30 truncate max-w-[100px] sm:max-w-none"
                      style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                  {meetingId}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-xs animate-pulse" />
                <span className="font-mono tabular-nums">{formatDuration(callDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Doctor Info */}
        <div className="text-center order-3 sm:order-2">
          <div className="text-white font-bold text-lg sm:text-xl lg:text-2xl transition-colors duration-300 truncate">
            {doctorName}
          </div>
          <div className="text-blue-200 text-xs sm:text-sm transition-all duration-300">
            Врач • Online
          </div>
        </div>

        {/* Right Section - Connection Quality */}
        <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4 lg:gap-6 order-2 sm:order-3">
          {/* Connection Quality */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group" title={`${connectionQuality} (${networkLatency}ms)`}>
            <div className="flex items-end gap-0.5 h-4 sm:h-5 transition-transform duration-300 group-hover:scale-110">
              {connectionBars}
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${getConnectionColor()} hidden sm:block`}>
              {connectionQuality === 'excellent' ? 'Отлично' :
               connectionQuality === 'good' ? 'Хорошо' : 'Слабо'}
            </span>
          </div>

          {/* Network Info */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 sm:gap-2 text-white/80">
              <FontAwesomeIcon icon={faWifi} className={`${getConnectionColor()} text-sm`} />
              <span className="text-xs sm:text-sm font-medium">{networkLatency}ms</span>
            </div>
            <span className="text-xs text-white/60 hidden sm:block">Задержка</span>
          </div>
        </div>
      </div>





      {/* Responsive Expanded Section */}
      <div className={`transition-all duration-500 ease-out overflow-hidden ${isExpanded ? 'max-h-32 opacity-100 mt-3 sm:mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div>
              <div className="text-blue-400 font-semibold text-xs sm:text-sm">Качество</div>
              <div className="text-white/80 text-xs sm:text-sm">{connectionQuality === 'excellent' ? 'Отличное' : connectionQuality === 'good' ? 'Хорошее' : 'Слабое'}</div>
            </div>
            <div>
              <div className="text-green-400 font-semibold text-xs sm:text-sm">Задержка</div>
              <div className="text-white/80 text-xs sm:text-sm">{networkLatency}ms</div>
            </div>
            <div>
              <div className="text-purple-400 font-semibold text-xs sm:text-sm">Статус</div>
              <div className="text-white/80 text-xs sm:text-sm capitalize truncate">{consultation.status}</div>
            </div>
            <div>
              <div className="text-orange-400 font-semibold text-xs sm:text-sm">Тип</div>
              <div className="text-white/80 text-xs sm:text-sm capitalize truncate">{consultation.consultation_type || 'Общий'}</div>
            </div>
          </div>
        </div>
      </div>

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

export default PatientVideoHeader;