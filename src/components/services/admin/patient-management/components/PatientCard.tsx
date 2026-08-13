"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Mail, Phone, MapPin, Building, Edit2, Trash2,
  Stethoscope, Home, Clock, FolderOpen,
} from "lucide-react";
import type { Patient } from "../types/patientTypes";
import { ContactMenu } from "./ContactMenu";

import bnClinicLogo from "@/assets/clinics_logos/bn-clinica.png";
import ayalaClinicLogo from "@/assets/clinics_logos/ayala_clinic.png";

export function PatientCard({
  patient,
  initial,
  index,
  onEdit,
  onDelete,
  onDocs,
}: {
  patient: Patient;
  initial: boolean;
  index: number;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onDocs: (patient: Patient) => void;
}) {
  return (
    <motion.div
      initial={initial ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={initial ? { delay: index * 0.05 } : { duration: 0.2 }}
      layout
      className="rounded-3xl p-6 border-2 border-gray-100 hover:border-green-200 transition-all bg-white shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
          >
            {patient.first_name?.[0] ?? "?"}{patient.last_name?.[0] ?? "?"}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {patient.first_name} {patient.last_name}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {patient.email}
              </span>
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {patient.phone}
                </span>
              )}
              {patient.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {patient.city}
                </span>
              )}
            </div>
            {/* Last visit + visits count */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {patient.last_visit ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {patient.last_visit_type === 'consultation'
                    ? <Stethoscope className="w-3 h-3" />
                    : <Home className="w-3 h-3" />
                  }
                  Последний визит:{' '}
                  {new Date(patient.last_visit).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-100">
                  <Clock className="w-3 h-3" />
                  Визитов нет
                </span>
              )}
              {(patient.visits_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {patient.visits_count} {patient.visits_count === 1 ? 'визит' : 'визитов'}
                </span>
              )}
            </div>

            {patient.clinic && (
              <div className="mt-2 flex items-center gap-2">
                {(patient.clinic.id === 913 || patient.clinic.name?.toLowerCase().includes('ayala')) ? (
                  <div className="bg-white px-1.5 py-0.5 rounded border border-green-200">
                    <Image src={ayalaClinicLogo} alt="Ayala Clinic" width={40} height={14} className="object-contain" priority={false} />
                  </div>
                ) : (patient.clinic.name?.toLowerCase().includes('bn') || patient.clinic.name?.toLowerCase().includes('бн')) ? (
                  <div className="bg-white px-1.5 py-0.5 rounded border border-green-200">
                    <Image src={bnClinicLogo} alt="BN Clinic" width={40} height={14} className="object-contain" priority={false} />
                  </div>
                ) : (
                  <Building className="w-4 h-4 text-green-600" />
                )}
                <span className="text-sm font-medium text-green-700">
                  {patient.clinic.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          {patient.is_active ? (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
              Активен
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
              Неактивен
            </span>
          )}

          {/* Contact Button */}
          <ContactMenu patient={patient} />

          {/* Documents Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDocs(patient)}
            className="p-2 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
            title="Документы пациента"
          >
            <FolderOpen className="w-5 h-5" />
          </motion.button>

          {/* Edit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(patient)}
            className="p-2 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            title="Редактировать"
          >
            <Edit2 className="w-5 h-5" />
          </motion.button>

          {/* Delete Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(patient)}
            className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
