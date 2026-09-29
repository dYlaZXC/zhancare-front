"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, CalendarDays, ClipboardList, Clock, Banknote } from "lucide-react";
import { formatPrice } from "@/utils/currency";
import type { ServiceCategory } from "../types/serviceTypes";
import { getCategoryIcon } from "../types/serviceTypes";

const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function pluralizeServices(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "услуга";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "услуги";
  return "услуг";
}

// Same card shape as ServiceCard (icon avatar, name + colored pill, meta row,
// status chips, right-hand action rail) so the two tabs read as one catalog.
export function CategoryCard({
  category,
  clinicCurrency,
  onEdit,
  onToggle,
  onSchedule,
  onDelete,
}: {
  category: ServiceCategory;
  clinicCurrency?: string;
  onEdit: (category: ServiceCategory) => void;
  onToggle: (category: ServiceCategory) => void;
  onSchedule: (category: ServiceCategory) => void;
  onDelete: (category: ServiceCategory) => void;
}) {
  const Icon = getCategoryIcon(category.icon);
  const color = category.color || "#6366f1";
  const servicesCount = category.services_count ?? 0;
  const weekdays = category.schedule_weekdays ?? [];
  const hasSchedule = weekdays.length > 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-3xl p-6 border-2 border-gray-100 hover:border-sky-200 transition-all bg-white shadow-sm hover:shadow-md ${!category.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}>
            <Icon className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-white font-mono"
                style={{ background: color }}>
                {category.slug}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
              <span className="flex items-center gap-1">
                <ClipboardList className="w-4 h-4" /> {servicesCount} {pluralizeServices(servicesCount)}
              </span>
              {/* This clinic's defaults for new services — same meta as a service card */}
              {category.settings?.default_duration_minutes ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {category.settings.default_duration_minutes} мин
                </span>
              ) : null}
              {category.settings?.default_price ? (
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <Banknote className="w-4 h-4" />
                  {formatPrice(category.settings.default_price, category.settings.default_currency || clinicCurrency || 'KZT')}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                category.is_active
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : 'text-gray-500 bg-gray-50 border-gray-100'
              }`}>
                {category.is_active ? '✓ Активна' : 'Неактивна'}
              </span>
              {hasSchedule ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100"
                  title="Общее расписание категории — действует для услуг без собственного расписания">
                  <CalendarDays className="w-3 h-3" />
                  {weekdays.map(d => WEEKDAY_SHORT[d]).join(" · ")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                  Нет расписания
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => onToggle(category)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md ${
              category.is_active
                ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300'
            }`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${category.is_active ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
            {category.is_active ? 'Активна' : 'Выкл'}
          </button>

          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(category)} className="p-2.5 rounded-lg hover:bg-white transition-all group" title="Редактировать">
              <Pencil className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => onSchedule(category)} className="p-2.5 rounded-lg hover:bg-white transition-all group" title="Расписание категории">
              <CalendarDays className="w-5 h-5 text-gray-500 group-hover:text-sky-600 transition-colors" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(category)} className="p-2.5 rounded-lg hover:bg-white transition-all group" title="Удалить">
              <Trash2 className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
