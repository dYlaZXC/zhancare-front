"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Phone, Building2, CheckCircle, XCircle, Loader2, ChevronDown, Edit } from "lucide-react";
import type { Admin } from "../types/adminTypes";
import { ADMIN_TYPE_LABELS, ADMIN_TYPE_COLORS } from "../types/adminTypes";

// ─── Admin Row ────────────────────────────────────────────────────────────────

const AdminRow = ({
  admin,
  onEdit,
  onToggleActive,
  toggling,
}: {
  admin: Admin;
  onEdit: (a: Admin) => void;
  onToggleActive: (a: Admin) => void;
  toggling: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <tr className={`transition-colors ${admin.is_active ? "hover:bg-gray-50" : "bg-gray-50/60 hover:bg-gray-100/60"}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-all ${admin.is_active ? "bg-gradient-to-br from-blue-500 to-blue-700" : "bg-gray-300"}`}>
            {admin.first_name.charAt(0)}
          </div>
          <div>
            <div className={`font-medium text-sm ${admin.is_active ? "text-gray-900" : "text-gray-400"}`}>
              {admin.first_name} {admin.last_name}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Mail className="w-3 h-3" />
              {admin.email}
            </div>
            {admin.phone && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Phone className="w-3 h-3" />
                {admin.phone}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {admin.clinic ? (
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {admin.clinic.name}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
        {admin.department && (
          <div className="text-xs text-gray-400 mt-0.5">{admin.department}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            ADMIN_TYPE_COLORS[admin.admin_type] || "bg-gray-100 text-gray-600"
          }`}
        >
          {ADMIN_TYPE_LABELS[admin.admin_type] || admin.admin_type}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {admin.can_manage_staff && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">Персонал</span>
          )}
          {admin.can_manage_patients && (
            <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded">Пациенты</span>
          )}
          {admin.can_view_reports && (
            <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded">Отчёты</span>
          )}
          {admin.can_manage_settings && (
            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">Настройки</span>
          )}
        </div>
      </td>

      {/* Status dropdown */}
      <td className="px-4 py-3">
        {admin.admin_type === "super" ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            Активен
          </span>
        ) : (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => !toggling && setOpen((o) => !o)}
              disabled={toggling}
              className={`flex items-center gap-1.5 w-32 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                admin.is_active
                  ? "bg-green-50 border-green-200 text-green-700 hover:border-green-300"
                  : "bg-red-50 border-red-200 text-red-500 hover:border-red-300"
              }`}
            >
              {toggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : admin.is_active ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {admin.is_active ? "Активен" : "Неактивен"}
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 mt-1 z-30 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36"
                >
                  <button
                    onClick={() => { setOpen(false); if (!admin.is_active) onToggleActive(admin); }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors ${
                      admin.is_active
                        ? "bg-green-50 text-green-700 cursor-default"
                        : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Активен
                    {admin.is_active && <CheckCircle className="w-3 h-3 ml-auto text-green-500" />}
                  </button>
                  <button
                    onClick={() => { setOpen(false); if (admin.is_active) onToggleActive(admin); }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors ${
                      !admin.is_active
                        ? "bg-red-50 text-red-500 cursor-default"
                        : "text-gray-600 hover:bg-red-50 hover:text-red-500"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Неактивен
                    {!admin.is_active && <CheckCircle className="w-3 h-3 ml-auto text-red-400" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <button
          onClick={() => onEdit(admin)}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          title="Редактировать"
        >
          <Edit className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export default AdminRow;
