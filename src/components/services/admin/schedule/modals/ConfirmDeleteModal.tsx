"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  patientName: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({ patientName, loading, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Icon */}
          <div className="flex flex-col items-center pt-8 pb-4 px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Удалить запись?</h3>
            <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
              Запись пациента <span className="font-semibold text-gray-700">{patientName}</span> будет скрыта.
              Данные сохранятся в системе.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6 pt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
