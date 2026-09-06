"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, CalendarDays, Clock, Banknote, Users, Stethoscope } from "lucide-react";
import { formatPrice } from "@/utils/currency";
import type { Service, ServiceCategory } from "../types/serviceTypes";
import { getCategoryIcon } from "../types/serviceTypes";

export function ServiceCard({
  service,
  category,
  clinicCurrency,
  onEdit,
  onToggle,
  onSchedule,
  onDelete,
}: {
  service: Service;
  category: ServiceCategory | undefined;
  clinicCurrency: string;
  onEdit: (service: Service) => void;
  onToggle: (service: Service) => void;
  onSchedule: (service: Service) => void;
  onDelete: (service: Service) => void;
}) {
  const Icon = getCategoryIcon(category?.icon ?? "clipboard-list");
  const catColor = category?.color ?? "#6366f1";
  const isDoctorMode = service.schedule_source === "doctor";
  const hasSchedule = isDoctorMode
    ? service.doctor_ids.length > 0
    : !!(service.schedules && service.schedules.some(sc => sc.is_active));

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-3xl p-6 border-2 border-gray-100 hover:border-sky-200 transition-all bg-white shadow-sm hover:shadow-md ${!service.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Category icon — mirrors the avatar in personnel cards */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${catColor}cc, ${catColor})` }}>
            <Icon className="w-7 h-7 text-white" />
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-gray-800">{service.name}</h3>
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ background: catColor }}>
                {service.category_label}
              </span>
            </div>

            {service.doctor_names.length > 0 && (
              <p className="text-sm font-medium text-indigo-600 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                {service.doctor_names.join(", ")}
              </p>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {service.duration_minutes} мин
              </span>
              {service.price && (
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <Banknote className="w-4 h-4" /> {formatPrice(service.price, clinicCurrency)}
                </span>
              )}
              {service.capacity_per_slot && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {service.capacity_per_slot} на слот
                </span>
              )}
              {service.description && (
                <span className="hidden md:block italic truncate max-w-[220px] text-gray-400">{service.description}</span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                service.is_active
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : 'text-gray-500 bg-gray-50 border-gray-100'
              }`}>
                {service.is_active ? '✓ Активна' : 'Неактивна'}
              </span>
              {isDoctorMode ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  По графику врача
                </span>
              ) : !hasSchedule && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                  Нет расписания
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status & Actions — mirrors PatientCard/StaffCard's right-hand action rail */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => onToggle(service)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md ${
              service.is_active
                ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300'
            }`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${service.is_active ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
            {service.is_active ? 'Активна' : 'Выкл'}
          </button>

          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(service)}
              className="p-2.5 rounded-lg hover:bg-white transition-all group"
              title="Редактировать"
            >
              <Pencil className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
            </motion.button>
            <motion.button
              whileHover={isDoctorMode ? undefined : { scale: 1.1 }}
              whileTap={isDoctorMode ? undefined : { scale: 0.9 }}
              onClick={() => !isDoctorMode && onSchedule(service)}
              disabled={isDoctorMode}
              className={`p-2.5 rounded-lg transition-all group ${isDoctorMode ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white'}`}
              title={isDoctorMode ? "Расписание определяется врачом" : "Расписание"}
            >
              <CalendarDays className="w-5 h-5 text-gray-500 group-hover:text-sky-600 transition-colors" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(service)}
              className="p-2.5 rounded-lg hover:bg-white transition-all group"
              title="Удалить"
            >
              <Trash2 className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
