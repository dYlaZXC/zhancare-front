"use client";

import React, { useState } from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhoneSlash,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

interface PatientCallFooterProps {
  handleEndCall: () => void;
  consultation: Consultation;
}

const PatientCallFooter: React.FC<PatientCallFooterProps> = ({
  handleEndCall,
  consultation
}) => {
  const [showWarning, setShowWarning] = useState(false);

  const handleEndCallClick = () => {
    setShowWarning(true);
  };

  const handleConfirmEnd = () => {
    setShowWarning(false);
    handleEndCall();
  };

  const handleCancelEnd = () => {
    setShowWarning(false);
  };

  return (
    <>
      <footer className="relative bg-slate-900/90 backdrop-blur-lg border-t border-white/10 px-4 sm:px-6 py-3">
        {/* Simple subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

        <div className="relative">
          {/* Main Controls - Centered */}
          <div className="flex items-center justify-center">

            {/* End Call Button - Centered, larger circular button */}
            <button
              onClick={handleEndCallClick}
              className="w-16 h-16 sm:w-14 sm:h-14 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full text-2xl sm:text-xl font-semibold transition-all duration-200 shadow-lg hover:scale-110"
              title="Завершить консультацию"
            >
              <FontAwesomeIcon icon={faPhoneSlash} />
            </button>
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
              Вы уверены, что хотите завершить видеозвонок с врачом?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelEnd}
                className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:scale-105"
              >
                Отмена
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

export default PatientCallFooter;
