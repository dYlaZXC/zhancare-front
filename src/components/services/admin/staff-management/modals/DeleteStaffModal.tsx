"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { api } from "@/utils/api";
import type { StaffMember } from "../types/staffTypes";

// ─── Delete Staff Modal ──────────────────────────────────────────────────────

export function DeleteStaffModal({
  member,
  onClose,
  onDeleted,
}: {
  member: StaffMember;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.patch(`/staff/${member.id}/`, { is_deleted: true });
      toast.success(`${member.first_name} ${member.last_name} успешно удален(а)!`);
      onDeleted();
    } catch (err: any) {
      console.error("Error deleting staff:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || "Не удалось удалить сотрудника";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setMouseDownTarget(e.target);
  };
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownTarget === e.target) onClose();
    setMouseDownTarget(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
      >
        {/* Modal Header */}
        <div className="px-8 py-6 border-b-2 border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Подтверждение удаления
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Это действие можно отменить
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8">
          <div className="rounded-2xl p-4 bg-red-50 border-2 border-red-100 mb-6">
            <p className="text-gray-800 text-center">
              Вы уверены, что хотите удалить{' '}
              <span className="font-bold text-gray-900">
                {member.first_name} {member.last_name}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-600 text-center mt-2">
              {member.role === 'doctor' ? 'Доктор' : 'Медсестра'} •{' '}
              {member.specialization || 'Без специализации'}
            </p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Информация
                </p>
                <p className="text-sm text-amber-800">
                  Сотрудник будет помечен как удаленный и больше не будет отображаться в основном списке. Вы сможете просмотреть удаленных сотрудников отдельно.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
        </div>
      </motion.div>
    </motion.div>
  );
}
