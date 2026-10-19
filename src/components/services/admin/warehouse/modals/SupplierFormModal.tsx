"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { Truck, X, Loader2, CheckCircle } from "lucide-react";
import { WarehouseSupplier } from "../types";

export default function SupplierFormModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: WarehouseSupplier | null;
  onClose: () => void;
  onSaved: (supplier: WarehouseSupplier) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [contactPerson, setContactPerson] = useState(initial?.contact_person || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Название обязательно");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(), contact_person: contactPerson.trim(), phone: phone.trim(),
        email: email.trim(), is_active: isActive, notes: notes.trim(),
      };
      const res = mode === "create"
        ? await api.post("/warehouse/suppliers/", payload)
        : await api.patch(`/warehouse/suppliers/${initial!.id}/`, payload);
      toast.success(mode === "create" ? "Поставщик добавлен" : "Данные обновлены");
      onSaved(res.data);
    } catch {
      toast.error("Ошибка при сохранении");
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {mode === "create" ? "Новый поставщик" : "Редактировать поставщика"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Контактное лицо</label>
            <input
              type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
              <input
                type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
            Активен
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? "Сохранение..." : mode === "create" ? "Создать" : "Сохранить"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
