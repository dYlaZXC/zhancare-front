"use client";

import { motion } from "framer-motion";
import { ClipboardList, Plus, FileSpreadsheet } from "lucide-react";

export function ServicesHeader({
  onOpenCreate,
  onOpenBulkUpload,
  onOpenCreateCategory,
  tab = 'services',
}: {
  onOpenCreate: () => void;
  onOpenBulkUpload: () => void;
  onOpenCreateCategory: () => void;
  /** Each tab gets its own primary action — "Добавить услугу"/"Загрузить из
   * Excel" would be misleading on Категории, and vice versa. */
  tab?: 'services' | 'categories';
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
          Услуги Клиники
        </h1>
        <p className="text-gray-600">
          Управление диагностическими услугами клиники
        </p>
      </div>
      {tab === 'categories' ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenCreateCategory}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }}
        >
          <Plus className="w-5 h-5" />
          Добавить категорию
        </motion.button>
      ) : <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenBulkUpload}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sky-700 font-semibold border-2 border-sky-200 bg-white hover:bg-sky-50 shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Загрузить из Excel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenCreate}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }}
        >
          <Plus className="w-5 h-5" />
          Добавить услугу
        </motion.button>
      </div>}
    </div>
  );
}

export function ServicesStatsCards({
  total,
  active,
  inactive,
  totalLabel = "Всего услуг",
}: {
  total: number;
  active: number;
  inactive: number;
  totalLabel?: string;
}) {
  const stats = [
    { label: totalLabel, value: total, icon: ClipboardList, color: "#0ea5e9", bg: "#e0f2fe" },
    { label: "Активных", value: active, icon: ClipboardList, color: "#059669", bg: "#a7f3d0" },
    { label: "Неактивных", value: inactive, icon: ClipboardList, color: "#6b7280", bg: "#e5e7eb" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="rounded-2xl p-4 border border-gray-100 shadow-sm"
          style={{ backgroundColor: stat.bg }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
            <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
