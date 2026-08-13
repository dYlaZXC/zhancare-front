"use client";

import { motion } from "framer-motion";
import { Users, CheckCircle, XCircle } from "lucide-react";

export function StatsCards({ total, active, inactive }: { total: number; active: number; inactive: number }) {
  const stats = [
    { label: "Всего", value: total, icon: Users, color: "#10b981", bg: "#d1fae5" },
    { label: "Активных", value: active, icon: CheckCircle, color: "#059669", bg: "#a7f3d0" },
    { label: "Неактивных", value: inactive, icon: XCircle, color: "#6b7280", bg: "#e5e7eb" },
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
