"use client";

import React from "react";
import { Consultation } from "@/types/consultation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStethoscope,
  faCalendar,
  faHeartbeat,
  faUserMd
} from "@fortawesome/free-solid-svg-icons";

// Using shared Consultation type from @/types/consultation

interface DoctorCallFooterProps {
  handleEndCall: () => void;
  consultation: Consultation;
}

const DoctorCallFooter: React.FC<DoctorCallFooterProps> = ({
  handleEndCall,
  consultation
}) => {

  return (
    <footer className="relative bg-slate-900/90 backdrop-blur-lg border-t border-white/10 px-4 sm:px-6 py-3">
      {/* Simple subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

      <div className="relative">
        {/* Main Controls - Simplified */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          {/* Left Side - Patient Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUserMd} className="text-emerald-400" />
              <span>Пациент: {consultation.patient_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendar} className="text-blue-400" />
              <span>{new Date().toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faHeartbeat} className="text-rose-400" />
              <span>ID: {consultation.meeting_id}</span>
            </div>
          </div>

          {/* Right Side - End Call */}
          <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:scale-105"
            >
              <FontAwesomeIcon icon={faStethoscope} className="text-sm" />
              <span>Завершить консультацию</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DoctorCallFooter;