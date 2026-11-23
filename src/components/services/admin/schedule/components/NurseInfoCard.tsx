"use client";

import { User, Mail, Phone, Calendar as CalendarIcon, MapPin, Stethoscope } from "lucide-react";
import type { Nurse } from "../types/scheduleTypes";

// Re-export the type for convenience
export type { Nurse };

interface NurseInfoCardProps {
  nurse: Nurse | null;
}

export default function NurseInfoCard({ nurse }: NurseInfoCardProps) {
  if (!nurse) return null;

  return (
    <div className="mt-3 p-4 rounded-2xl border-2 border-violet-100 bg-violet-50/40">
      <div className="flex items-center gap-2 mb-2.5">
        <User className="w-4 h-4 text-violet-600" />
        <span className="text-sm font-bold text-violet-700">Информация о медсестре</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {nurse.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span className="truncate">{nurse.email}</span>
          </div>
        )}
        {nurse.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span>{nurse.phone}</span>
          </div>
        )}
        {nurse.specialization && (
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <Stethoscope className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span>{nurse.specialization}</span>
          </div>
        )}
        {nurse.years_of_experience != null && (
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span>{nurse.years_of_experience} лет опыта</span>
          </div>
        )}
        {(nurse.address || nurse.city) && (
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <MapPin className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span>{[nurse.address, nurse.city].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {nurse.clinic && (
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <User className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span>{nurse.clinic.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
