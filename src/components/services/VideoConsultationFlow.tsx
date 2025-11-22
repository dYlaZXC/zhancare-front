"use client";

import React, { useState } from "react";
import ClinicsSelection from "./ClinicsSelection";
import VideoConsultation from "./VideoConsultation";

/**
 * VideoConsultationFlow - обёртка, которая показывает:
 * 1. Сначала страницу выбора клиники (ClinicsSelection)
 * 2. После выбора - страницу видео-консультации (VideoConsultation)
 */
const VideoConsultationFlow: React.FC = () => {
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [skippedClinicSelection, setSkippedClinicSelection] = useState(false);

  const handleSelectClinic = (clinicId: number) => {
    setSelectedClinicId(clinicId);
    // Можно сохранить в localStorage для persistence
    localStorage.setItem("selectedClinicId", String(clinicId));
  };

  const handleSkipClinicSelection = () => {
    setSkippedClinicSelection(true);
    localStorage.removeItem("selectedClinicId");
  };

  const handleBackToClinics = () => {
    setSelectedClinicId(null);
    setSkippedClinicSelection(false);
    localStorage.removeItem("selectedClinicId");
  };

  // Если клиника не выбрана и пользователь не пропустил - показываем страницу выбора клиники
  if (!selectedClinicId && !skippedClinicSelection) {
    return (
      <ClinicsSelection
        onSelectClinic={handleSelectClinic}
        onSkip={handleSkipClinicSelection}
      />
    );
  }

  // Если клиника выбрана - показываем VideoConsultation
  return (
    <div>
      {/* Back button to clinics */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <button
          onClick={handleBackToClinics}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">Выбрать другую клинику</span>
        </button>
      </div>
      <VideoConsultation />
    </div>
  );
};

export default VideoConsultationFlow;
