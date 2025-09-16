"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faHeartbeat,
  faUser,
  faUserDoctor,
  faClock,
  faWifi,
  faShieldAlt,
  faHandHoldingMedical,
  faComments,
  faPhone,
  faChevronUp,
  faChevronDown,
  faHeadset,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";

interface PatientFloatingBadgeProps {
  doctorName: string;
  consultationId: number;
}

const PatientFloatingBadge: React.FC<PatientFloatingBadgeProps> = ({
  doctorName,
  consultationId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [consultationTime, setConsultationTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [supportTip, setSupportTip] = useState("Расскажите врачу о всех симптомах");

  // Timer for consultation duration
  useEffect(() => {
    const interval = setInterval(() => {
      setConsultationTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cycling support tips
  useEffect(() => {
    const tips = [
      "Расскажите врачу о всех симптомах",
      "Не стесняйтесь задавать вопросы",
      "Опишите когда начались проблемы",
      "Упомяните принимаемые лекарства",
      "Ваше здоровье - наша забота"
    ];

    const interval = setInterval(() => {
      setSupportTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Mock connection quality changes
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: ('excellent' | 'good' | 'poor')[] = ['excellent', 'good', 'poor'];
      setConnectionStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'excellent': return 'text-blue-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'excellent': return 'Отличное';
      case 'good': return 'Хорошее';
      case 'poor': return 'Слабое';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="fixed top-6 left-6 z-50 select-none">
      <div className={`
        backdrop-blur-md border border-blue-400/30 shadow-2xl transition-all duration-500 ease-in-out overflow-hidden
        ${isExpanded ? 'rounded-3xl' : 'rounded-2xl'}
      `}
      style={{
        background: `
          linear-gradient(135deg,
            rgba(55, 114, 255, 0.15) 0%,
            rgba(50, 103, 230, 0.1) 50%,
            rgba(41, 53, 143, 0.08) 100%
          )
        `
      }}>

        {/* Compact Badge */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-all duration-300"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Health Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border border-blue-400/20"
               style={{ background: 'rgba(55, 114, 255, 0.2)' }}>
            <FontAwesomeIcon
              icon={faHeart}
              className="text-blue-300 text-lg animate-pulse"
              style={{ animationDuration: '2s' }}
            />
          </div>

          {/* Main Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon icon={faUser} className="text-blue-300 text-sm" />
              <h3 className="text-white font-bold text-sm truncate max-w-[120px]">
                Консультация
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-white/70">
                <FontAwesomeIcon icon={faClock} />
                <span className="font-mono">{formatTime(consultationTime)}</span>
              </div>

              <div className={`flex items-center gap-1 ${getConnectionColor()}`}>
                <FontAwesomeIcon icon={faWifi} />
                <span className="font-medium">{getConnectionText()}</span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          <div className="text-blue-300">
            <FontAwesomeIcon
              icon={isExpanded ? faChevronUp : faChevronDown}
              className="transition-transform duration-300"
            />
          </div>
        </div>

        {/* Expanded Content */}
        <div className={`
          transition-all duration-500 ease-in-out
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="border-t border-blue-400/20 p-4 space-y-4">

            {/* Doctor Info */}
            <div className="bg-blue-900/20 rounded-xl p-3 border border-blue-400/20">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faUserDoctor} className="text-blue-300 text-sm" />
                <span className="text-white font-medium text-sm">Ваш врач</span>
              </div>
              <p className="text-blue-200 font-semibold truncate">{doctorName}</p>
              <p className="text-blue-300 text-xs">ID: {consultationId}</p>
            </div>

            {/* Patient Support Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-blue-300 text-sm" />
                  <span className="text-white text-xs font-medium">Защищено</span>
                </div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mx-auto"></div>
              </div>

              <div className="bg-black/20 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FontAwesomeIcon icon={faHeadset} className="text-green-300 text-sm" />
                  <span className="text-white text-xs font-medium">Поддержка</span>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto"></div>
              </div>
            </div>

            {/* Patient Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/70">
                  <FontAwesomeIcon icon={faHeartbeat} className="text-blue-300" />
                  <span>Состояние</span>
                </div>
                <span className="text-blue-300 font-mono">На связи</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/70">
                  <FontAwesomeIcon icon={faPhone} className="text-green-300" />
                  <span>Связь</span>
                </div>
                <span className="text-green-300 font-mono">Активна</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/70">
                  <FontAwesomeIcon icon={faComments} className="text-purple-300" />
                  <span>Чат</span>
                </div>
                <span className="text-purple-300 font-mono">Доступен</span>
              </div>
            </div>

            {/* Support Tip */}
            <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-xl p-3 border border-blue-400/20">
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-300 text-sm mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-xs font-medium mb-1">Совет пациенту:</p>
                  <p className="text-blue-200 text-xs leading-relaxed">{supportTip}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/30 rounded-lg p-2 transition-all duration-300">
                <FontAwesomeIcon icon={faHandHoldingMedical} className="text-blue-300 text-sm" />
              </button>

              <button className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-400/30 rounded-lg p-2 transition-all duration-300">
                <FontAwesomeIcon icon={faHeadset} className="text-green-300 text-sm" />
              </button>

              <button className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/30 rounded-lg p-2 transition-all duration-300">
                <FontAwesomeIcon icon={faComments} className="text-purple-300 text-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-full animate-shimmer opacity-0 hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>
      </div>
    </div>
  );
};

export default PatientFloatingBadge;