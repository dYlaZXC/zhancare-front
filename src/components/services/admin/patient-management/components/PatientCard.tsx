"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import {
  Mail, Phone, MapPin, Building, Edit2, Trash2,
  Stethoscope, Home, Clock, FolderOpen, Cake, Briefcase, Globe, Heart, User, IdCard,
} from "lucide-react";
import type { Patient } from "../types/patientTypes";
import { ContactMenu } from "./ContactMenu";

function ClinicBadge({ clinic }: { clinic: { id: number; name: string } }) {
  return (
    <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-green-200 bg-green-50/60">
      <Building className="w-4 h-4 text-green-600 flex-shrink-0" />
      <span className="text-sm font-medium text-green-700">{clinic.name}</span>
    </div>
  );
}

function InfoChip({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

const GENDER_LABEL: Record<string, string> = { male: 'Мужской', female: 'Женский', other: 'Другое' };
const MARITAL_STATUS_LABEL: Record<string, string> = {
  single: 'Не женат/не замужем', married: 'Женат/замужем', divorced: 'Разведен(а)', widowed: 'Вдовец/вдова',
};
function pluralYears(age: number): string {
  const mod10 = age % 10, mod100 = age % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'лет';
  if (mod10 === 1) return 'год';
  if (mod10 >= 2 && mod10 <= 4) return 'года';
  return 'лет';
}

export function PatientCard({
  patient,
  initial,
  index,
  onEdit,
  onDelete,
  onDocs,
  onSubscriptions,
}: {
  patient: Patient;
  initial: boolean;
  index: number;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onDocs: (patient: Patient) => void;
  onSubscriptions?: (patient: Patient) => void;
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
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 lg:w-[34%] flex-shrink-0">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
          >
            {patient.first_name?.[0] ?? "?"}{patient.last_name?.[0] ?? "?"}
          </div>

          {/* Identity */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-gray-800">
                {patient.first_name} {patient.last_name}
              </h3>
              {patient.is_active ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Активен
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  Неактивен
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 text-sm text-gray-600">
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{patient.email}</span>
              </span>
              {patient.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  {patient.phone}
                </span>
              )}
              {patient.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {patient.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Additional info — fills the space between identity and actions */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-stretch gap-3">
            {(() => {
              const age = calculateAge(patient.birth_date);
              const hasDemographics = age !== null || patient.gender || patient.profession || patient.marital_status || patient.citizenship;
              return hasDemographics ? (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 flex flex-wrap items-center content-center gap-2">
                  {age !== null && <InfoChip icon={Cake} label={`${age} ${pluralYears(age)}`} />}
                  {patient.gender && <InfoChip icon={User} label={GENDER_LABEL[patient.gender] ?? patient.gender} />}
                  {patient.profession && <InfoChip icon={Briefcase} label={patient.profession} />}
                  {patient.marital_status && <InfoChip icon={Heart} label={MARITAL_STATUS_LABEL[patient.marital_status] ?? patient.marital_status} />}
                  {patient.citizenship && <InfoChip icon={Globe} label={patient.citizenship} />}
                </div>
              ) : null;
            })()}

            {/* Last visit + visits count */}
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 flex flex-wrap items-center content-center gap-2">
              {patient.last_visit ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-blue-700 border border-blue-100">
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-gray-400 border border-gray-100">
                  <Clock className="w-3 h-3" />
                  Визитов нет
                </span>
              )}
              {(patient.visits_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-white text-emerald-700 border border-emerald-100">
                  {patient.visits_count} {patient.visits_count === 1 ? 'визит' : 'визитов'}
                </span>
              )}
            </div>
          </div>

          {(patient.clinic || (patient.additional_clinics && patient.additional_clinics.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2">
              {[patient.clinic, ...(patient.additional_clinics ?? [])]
                .filter((c): c is { id: number; name: string } => !!c)
                .map((c) => (
                  <ClinicBadge key={c.id} clinic={c} />
                ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
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

          {/* Subscriptions Button */}
          {onSubscriptions && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSubscriptions(patient)}
              className="p-2 rounded-xl bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors"
              title="Абонементы"
            >
              <IdCard className="w-5 h-5" />
            </motion.button>
          )}

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
