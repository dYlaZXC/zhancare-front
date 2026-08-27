"use client";

import { motion } from "framer-motion";
import { ClipboardList, Plus } from "lucide-react";

export function ServicesHeader({
  onOpenCreate,
}: {
  onOpenCreate: () => void;
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
    </div>
  );
}

export function ServicesStatsCards({
  total,
  active,
  inactive,
}: {
  total: number;
  active: number;
  inactive: number;
}) {
  const stats = [
    { label: "Всего услуг", value: total, icon: ClipboardList, color: "#0ea5e9", bg: "#e0f2fe" },
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
