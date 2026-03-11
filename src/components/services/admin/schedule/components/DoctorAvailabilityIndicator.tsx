"use client";

import { Loader2 } from "lucide-react";

interface DoctorAvailabilityIndicatorProps {
  availableDoctorIds: Set<number>;
  formData: {
    date: string;
    time: string;
  };
  loadingAvailableDoctors: boolean;
}

export default function DoctorAvailabilityIndicator({
  availableDoctorIds,
  formData,
  loadingAvailableDoctors
}: DoctorAvailabilityIndicatorProps) {
  if (!formData.date || !formData.time || loadingAvailableDoctors) {
    return null;
  }

  return (
    <div className="mt-2 text-sm">
      {availableDoctorIds.size > 0 ? (
        <p className="text-emerald-600">
          ✅ {availableDoctorIds.size} {availableDoctorIds.size === 1 ? 'доктор доступен' : 'докторов доступно'} на {formData.time}
        </p>
      ) : (
        <p className="text-amber-600">
          ⚠️ Нет доступных докторов на выбранное время
        </p>
      )}
    </div>
  );
}
