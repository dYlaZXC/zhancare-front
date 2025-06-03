"use client";

import React from "react";

interface FloatingBadgeProps {
  isDoctor: boolean;
  doctor: string;
}

const FloatingBadge: React.FC<FloatingBadgeProps> = ({ isDoctor, doctor }) => {
  return (
    <div className="absolute top-4 left-4 bg-blue-700 text-white px-4 py-2 rounded-full shadow-md text-xs sm:text-sm z-10">
      {isDoctor ? "👨‍⚕️ Вы врач" : `👨‍⚕️ Врач: ${doctor}`}
    </div>
  );
};

export default FloatingBadge;
