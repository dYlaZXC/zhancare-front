// components/consultations/SelectedDoctorSummary.tsx
"use client";

import React from "react";

interface Props {
  name: string;
  specialty: string;
}

const SelectedDoctorSummary: React.FC<Props> = ({ name, specialty }) => {
  return (
    <div className="border border-green-200 bg-green-50 rounded-lg p-4 shadow-sm mt-4">
      <p className="text-green-800 font-semibold">✅ Вы выбрали врача:</p>
      <p className="text-sm text-gray-800 mt-1">
        <strong>{name}</strong> <em>({specialty})</em>
      </p>
    </div>
  );
};

export default SelectedDoctorSummary;
