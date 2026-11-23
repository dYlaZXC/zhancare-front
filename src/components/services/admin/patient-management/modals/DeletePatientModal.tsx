"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { api } from "@/utils/api";
import type { Patient } from "../types/patientTypes";

// ─── Delete Patient Modal ───────────────────────────────────────────────────

export function DeletePatientModal({
  patient,
  onClose,
  onDeleted,
}: {
  patient: Patient;
  onClose: () => void;
  onDeleted: (patientId: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.patch(`/patients/${patient.id}/`, { is_active: false });
      toast.success("Пациент деактивирован и перемещён в Неактивные!");
      onDeleted(patient.id);
    } catch (err: any) {
      console.error("Error deleting patient:", err);
      toast.error(err.response?.data?.error || err.message || "Не удалось удалить пациента");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
      >
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-3" style={{ color: '#1e263e' }}>
          Удалить пациента?
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600 mb-6">
          Вы действительно хотите удалить пациента <span className="font-semibold">{patient.first_name} {patient.last_name}</span>?
          Это действие нельзя отменить.
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
          >
            {deleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Удаление...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Удалить
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
