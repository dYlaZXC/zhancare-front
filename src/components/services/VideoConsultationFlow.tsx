"use client";

import React, { useState } from "react";
import ClinicsSelection from "./ClinicsSelection";
import VideoConsultation from "./VideoConsultation";

/**
 * VideoConsultationFlow - Shows clinic selection first, then video consultation
 */
const VideoConsultationFlow: React.FC = () => {
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [skippedClinicSelection, setSkippedClinicSelection] = useState(false);
  const [skipAIRecommendation, setSkipAIRecommendation] = useState(false);

  const handleSelectClinic = (clinicId: number, skipAI: boolean = false) => {
    setSelectedClinicId(clinicId);
    setSkipAIRecommendation(skipAI);
    localStorage.setItem("selectedClinicId", String(clinicId));
  };

  const handleSkipClinicSelection = () => {
    setSkippedClinicSelection(true);
    localStorage.removeItem("selectedClinicId");
  };

  const handleBackToClinics = () => {
    setSelectedClinicId(null);
    setSkippedClinicSelection(false);
    setSkipAIRecommendation(false);
    localStorage.removeItem("selectedClinicId");
  };

  // Show clinic selection if no clinic selected and not skipped
  if (!selectedClinicId && !skippedClinicSelection) {
    return (
      <ClinicsSelection
        onSelectClinic={handleSelectClinic}
        onSkip={handleSkipClinicSelection}
      />
    );
  }

  // Show video consultation with back button
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
      <VideoConsultation skipAI={skipAIRecommendation} />
    </div>
  );
};

export default VideoConsultationFlow;
