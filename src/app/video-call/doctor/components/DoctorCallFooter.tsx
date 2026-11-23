"use client";

import React, { useState } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faHeartbeat,
  faUserMd,
  faFileWaveform,
  faExclamationTriangle,
  faPhoneSlash
} from "@fortawesome/free-solid-svg-icons";

// Using shared Consultation type from @/types/consultation

interface DoctorCallFooterProps {
  handleEndCall: () => void;
  consultation: Consultation;
  onOpenConsultationSheet?: () => void;
  hasConsultationData?: boolean;
}

const DoctorCallFooter: React.FC<DoctorCallFooterProps> = ({
  handleEndCall,
  consultation,
  onOpenConsultationSheet,
  hasConsultationData = false
}) => {
  const [showWarning, setShowWarning] = useState(false);

  const handleEndCallClick = () => {
    // Show warning dialog
    setShowWarning(true);
  };

  const handleConfirmEnd = () => {
    setShowWarning(false);
    handleEndCall();
  };

  const handleCancelEnd = () => {
    setShowWarning(false);
    // Open consultation sheet
    if (onOpenConsultationSheet) {
      onOpenConsultationSheet();
    }
  };

  return (
    <>
      <footer className="relative bg-slate-900/90 backdrop-blur-lg border-t border-white/10 px-4 sm:px-6 py-3">
        {/* Simple subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

        <div className="relative">
          {/* Main Controls - Simplified */}
          <div className="flex items-center justify-center">

            {/* Buttons - Centered */}
            <div className="flex flex-row items-center justify-center gap-3 w-full sm:w-auto">
              {/* Consultation Sheet Button - Left side on mobile */}
              <button
                onClick={onOpenConsultationSheet}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-4 py-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm sm:text-sm font-semibold transition-all duration-200 shadow-lg hover:scale-105 relative"
              >
                <FontAwesomeIcon icon={faFileWaveform} className="text-base sm:text-sm" />
                <span className="whitespace-nowrap">Консультационный лист</span>
                {hasConsultationData && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
                )}
              </button>

              {/* End Call Button - Right side on mobile, larger circular button */}
              <button
                onClick={handleEndCallClick}
                className="w-16 h-16 sm:w-14 sm:h-14 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full text-2xl sm:text-xl font-semibold transition-all duration-200 shadow-lg hover:scale-110"
                title="Завершить консультацию"
              >
                <FontAwesomeIcon icon={faPhoneSlash} />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Warning Dialog */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-white/10 p-6 max-w-md mx-4 animate-scale-in">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-3xl" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white text-center mb-3">
              Завершить консультацию?
            </h3>

            {/* Message */}
            <p className="text-white/80 text-center mb-6">
              Вы заполнили консультационный лист и готовы завершить консультацию?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelEnd}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:scale-105"
              >
                Нет, заполнить
              </button>
              <button
                onClick={handleConfirmEnd}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:scale-105"
              >
                Да, завершить
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default DoctorCallFooter;
