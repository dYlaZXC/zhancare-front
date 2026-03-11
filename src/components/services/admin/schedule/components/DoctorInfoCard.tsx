"use client";

import { Stethoscope, Mail, Phone, Calendar as CalendarIcon, MapPin, User, Clock } from "lucide-react";
import type { Doctor } from "../types/scheduleTypes";

// Re-export the type for convenience
export type { Doctor };

interface DoctorInfoCardProps {
  doctor: Doctor | null;
}

export default function DoctorInfoCard({ doctor }: DoctorInfoCardProps) {
  if (!doctor) return null;

  return (
    <div className="mt-3 p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50/40">
      <div className="flex items-center gap-2 mb-2.5">
        <Stethoscope className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-bold text-emerald-700">Информация о докторе</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {doctor.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{doctor.email}</span>
          </div>
        )}
        {doctor.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{doctor.phone}</span>
          </div>
        )}
        {doctor.specialization && (
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{doctor.specialization}</span>
          </div>
        )}
        {doctor.years_of_experience != null && (
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{doctor.years_of_experience} лет опыта</span>
          </div>
        )}
        {doctor.schedule_type && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{doctor.schedule_type === 'weekly' ? 'Недельное расписание' : 'Постоянное расписание'}</span>
          </div>
        )}
        {(doctor.address || doctor.city) && (
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{[doctor.address, doctor.city].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {doctor.clinic && (
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{doctor.clinic.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
