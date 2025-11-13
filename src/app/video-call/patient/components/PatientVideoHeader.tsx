"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserDoctor,
  faIdCard,
  faClock,
  faSignal,
  faWifi,
  faCircle
} from "@fortawesome/free-solid-svg-icons";

interface PatientVideoHeaderProps {
  meetingId: string;
  doctorName: string;
  consultation: Consultation;
}

const PatientVideoHeader: React.FC<PatientVideoHeaderProps> = ({
  meetingId,
  doctorName,
  consultation
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [networkLatency, setNetworkLatency] = useState(42);
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  // Timer
  useEffect(() => {
    const updateDuration = () => {
      setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    };

    intervalRef.current = setInterval(updateDuration, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Simulate connection quality
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

  const connectionBars = [];
  const maxBars = 4;
  const activeBars = connectionQuality === 'excellent' ? 4 : connectionQuality === 'good' ? 3 : 1;

  for (let i = 0; i < maxBars; i++) {
    connectionBars.push(
      <div
        key={i}
        className={`w-1 rounded-full transition-all duration-500 ${
          i < activeBars ? getConnectionBgColor() : 'bg-slate-600'
        }`}
        style={{ height: `${6 + i * 3}px` }}
      />
    );
  }

  return (
    <header className="relative backdrop-blur-lg border-b border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/90">
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

      <div className="relative flex items-center justify-between gap-3">
        {/* Left - Doctor Info + Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-400/30">
            <FontAwesomeIcon icon={faUserDoctor} className="text-blue-400 text-sm sm:text-base" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">{doctorName}</h1>
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faCircle} className="text-[6px] text-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 hidden sm:inline">Online</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs text-white/70">
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faIdCard} className="text-[10px]" />
                <span className="truncate max-w-[80px] sm:max-w-none">{meetingId}</span>
              </div>
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} />
                <span className="font-mono">{formatDuration(callDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Connection Quality */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Bars */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 h-4">
              {connectionBars}
            </div>
            <span className={`text-[10px] sm:text-xs ${getConnectionColor()} hidden sm:block`}>
              {connectionQuality === 'excellent' ? 'Отлично' :
               connectionQuality === 'good' ? 'Хорошо' : 'Слабо'}
            </span>
          </div>

          {/* Network Latency */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={faWifi} className={`${getConnectionColor()} text-sm`} />
              <span className="text-xs text-white font-medium">{networkLatency}ms</span>
            </div>
            <span className="text-[10px] text-white/60 hidden sm:block">Задержка</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PatientVideoHeader;
