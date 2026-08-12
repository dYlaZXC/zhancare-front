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
  const hasSchedule = !!(service.schedules && service.schedules.some(sc => sc.is_active));

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all px-5 py-4 ${!service.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-4">

        {/* Category icon — mirrors the avatar in personnel cards */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${catColor}cc, ${catColor})` }}>
          <Icon size={20} className="text-white" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          {/* Name + badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-base font-bold text-gray-900">{service.name}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: catColor }}>
              {service.category_label}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              service.is_active
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-gray-500 bg-gray-100 border-gray-200'
            }`}>
              {service.is_active ? '✓ Активна' : 'Неактивна'}
            </span>
            {!hasSchedule && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                Нет расписания
              </span>
            )}
          </div>

          {/* Doctor — mirrors specialty line in personnel */}
          {service.doctor_name && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mb-1.5">
              <Stethoscope size={11} />
              <span className="font-semibold">{service.doctor_name}</span>
            </div>
          )}

          {/* Meta row — mirrors email/phone/date in personnel */}
          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={11} /> {service.duration_minutes} мин
            </span>
            {service.price && (
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <Banknote size={11} /> {formatPrice(service.price, clinicCurrency)}
              </span>
            )}
            {service.capacity_per_slot && (
              <span className="flex items-center gap-1">
                <Users size={11} /> {service.capacity_per_slot} на слот
              </span>
            )}
            {service.description && (
              <span className="hidden md:block italic truncate max-w-[220px]">{service.description}</span>
            )}
          </div>
        </div>

        {/* Right: status toggle + action buttons — mirrors "В сети" + icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onToggle(service)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              service.is_active
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                : 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${service.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {service.is_active ? 'Активна' : 'Выкл'}
          </button>
          <button onClick={() => onEdit(service)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" title="Редактировать">
            <Pencil size={14} className="text-gray-400" />
          </button>
          <button onClick={() => onSchedule(service)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-sky-50 transition-colors" title="Расписание">
            <CalendarDays size={14} className="text-gray-400" />
          </button>
          <button onClick={() => onDelete(service)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors" title="Удалить">
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
