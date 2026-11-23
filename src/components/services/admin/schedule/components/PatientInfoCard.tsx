"use client";

import { User, Mail, Phone, Calendar as CalendarIcon, MapPin, Stethoscope } from "lucide-react";
import type { Patient } from "../types/scheduleTypes";

// Re-export the type for convenience
export type { Patient };

interface PatientInfoCardProps {
  patient: Patient | null;
}

export default function PatientInfoCard({ patient }: PatientInfoCardProps) {
  if (!patient) return null;

  return (
    <div className="mt-3 p-4 rounded-2xl border-2 border-blue-100 bg-blue-50/40">
      <div className="flex items-center gap-2 mb-2.5">
        <User className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-bold text-blue-700">Информация о пациенте</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {patient.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span className="truncate">{patient.email}</span>
          </div>
        )}
        {patient.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>{patient.phone}</span>
          </div>
        )}
        {patient.birth_date && (
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>{patient.birth_date}</span>
          </div>
        )}
        {patient.gender && (
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>{patient.gender === 'M' ? 'Мужчина' : patient.gender === 'F' ? 'Женщина' : patient.gender}</span>
          </div>
        )}
        {(patient.address || patient.city) && (
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>{[patient.address, patient.city].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {patient.clinic && (
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <Stethoscope className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>{patient.clinic.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
