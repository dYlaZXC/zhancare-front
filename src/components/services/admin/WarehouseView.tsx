"use client";

import { motion } from "framer-motion";
import { Warehouse, Hammer } from "lucide-react";

export function WarehouseView() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
          Склад
        </h1>
        <p className="text-gray-600">
          Учёт медицинских расходных материалов и оборудования клиники
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #78716c 0%, #57534e 100%)' }}
        >
          <Warehouse className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#1e263e' }}>
          Раздел в разработке
        </h2>
        <p className="text-gray-500 max-w-md text-center flex items-center gap-2 justify-center">
          <Hammer className="w-4 h-4 flex-shrink-0" />
          Скоро здесь появится учёт склада клиники
        </p>
      </motion.div>
    </div>
  );
}
