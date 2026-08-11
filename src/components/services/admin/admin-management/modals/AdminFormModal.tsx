"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import PhoneInput from "@/components/ui/PhoneInput";
import { UserPlus, Edit, X, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import type { Admin, Clinic, FormData } from "../types/adminTypes";
import { EMPTY_FORM } from "../types/adminTypes";
import ClinicSearchDropdown from "../components/ClinicSearchDropdown";
import TypeSearchDropdown from "../components/TypeSearchDropdown";
import PermToggle from "../components/PermToggle";

// ─── Admin Form Modal ─────────────────────────────────────────────────────────

const AdminFormModal = ({
  mode,
  initial,
  clinics,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: Admin | null;
  clinics: Clinic[];
  onClose: () => void;
  onSaved: (admin: Admin) => void;
}) => {
  const [form, setForm] = useState<FormData>(() => {
    if (mode === "edit" && initial) {
      return {
        first_name: initial.first_name,
        last_name: initial.last_name,
        email: initial.email,
        password: "",
        phone: initial.phone || "",
        clinic_id: initial.clinic ? String(initial.clinic.id) : "",
        admin_type: initial.admin_type === "super" ? "clinic" : initial.admin_type,
        can_manage_staff: initial.can_manage_staff,
        can_manage_patients: initial.can_manage_patients,
        can_view_reports: initial.can_view_reports,
        can_manage_settings: initial.can_manage_settings,
        department: initial.department || "",
        notes: initial.notes || "",
      };
    }
    return { ...EMPTY_FORM };
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: keyof FormData, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) {
      toast.error("Имя и email обязательны");
      return;
    }
    if (mode === "create" && !form.password.trim()) {
      toast.error("Пароль обязателен");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        clinic_id: form.clinic_id ? Number(form.clinic_id) : null,
        admin_type: form.admin_type,
        can_manage_staff: form.can_manage_staff,
        can_manage_patients: form.can_manage_patients,
        can_view_reports: form.can_view_reports,
        can_manage_settings: form.can_manage_settings,
        department: form.department.trim(),
        notes: form.notes.trim(),
      };
      if (mode === "create") payload.password = form.password;
      if (mode === "edit" && form.password.trim()) payload.password = form.password.trim();

      let res;
      if (mode === "create") {
        res = await api.post("/admins/", payload);
        toast.success("Администратор создан");
      } else {
        res = await api.patch(`/admins/${initial!.id}/`, payload);
        toast.success("Данные обновлены");
      }
      onSaved(res.data.admin);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || "Ошибка при сохранении";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              {mode === "create" ? (
                <UserPlus className="w-5 h-5 text-blue-600" />
              ) : (
                <Edit className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === "create" ? "Новый администратор" : "Редактировать"}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === "create"
                  ? "Создание учётной записи"
                  : `${initial?.first_name} ${initial?.last_name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder="Алексей"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder="Иванов"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={mode === "edit"}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="admin@clinic.kz"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль{" "}
              {mode === "create" ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="text-gray-400 font-normal">(оставьте пустым, чтобы не менять)</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 pr-10"
                placeholder={mode === "create" ? "Минимум 8 символов" : "••••••••"}
                required={mode === "create"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <PhoneInput
              value={form.phone}
              onChange={(e164) => set("phone", e164)}
              defaultCountry="KZ"
              inputClassName="py-2.5"
            />
          </div>

          {/* Clinic + type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Клиника
              </label>
              <ClinicSearchDropdown
                clinics={clinics}
                value={form.clinic_id}
                onChange={(v) => set("clinic_id", v)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип
              </label>
              <TypeSearchDropdown
                value={form.admin_type}
                onChange={(v) => set("admin_type", v)}
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Права доступа
            </label>
            <div className="grid grid-cols-2 gap-2">
              <PermToggle
                label="Персонал"
                value={form.can_manage_staff}
                onChange={(v) => set("can_manage_staff", v)}
              />
              <PermToggle
                label="Пациенты"
                value={form.can_manage_patients}
                onChange={(v) => set("can_manage_patients", v)}
              />
              <PermToggle
                label="Отчёты"
                value={form.can_view_reports}
                onChange={(v) => set("can_view_reports", v)}
              />
              <PermToggle
                label="Настройки"
                value={form.can_manage_settings}
                onChange={(v) => set("can_manage_settings", v)}
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Отдел
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="Регистратура"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Примечания
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
              placeholder="Любые дополнительные сведения..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "create" ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {saving ? "Сохранение..." : mode === "create" ? "Создать" : "Сохранить"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminFormModal;
