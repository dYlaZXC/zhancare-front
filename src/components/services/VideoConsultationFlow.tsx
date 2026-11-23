"use client";

import React from "react";
import VideoConsultation from "./VideoConsultation";

/**
 * VideoConsultationFlow - Directly shows video consultation starting from symptoms input
 */
const VideoConsultationFlow: React.FC = () => {
  // Directly render VideoConsultation without clinic selection
  return <VideoConsultation skipAI={false} />;
};

export default VideoConsultationFlow;
