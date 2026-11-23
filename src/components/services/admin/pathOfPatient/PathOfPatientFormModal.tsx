"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Loader2, Handshake } from "lucide-react";
import type { AssignableAdmin } from "../tasks/types/taskTypes";
import type { PathOfPatient, PathOfPatientSource } from "./types";
import { SOURCE_LABELS } from "./types";

export function PathOfPatientFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (item: PathOfPatient) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<PathOfPatientSource>("other");
  const [assignedTo, setAssignedTo] = useState<number | "">("");
  const [admins, setAdmins] = useState<AssignableAdmin[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin-tasks/assignable_admins/")
      .then(res => setAdmins(res.data?.admins ?? []))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Введите имя / название карточки"); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/path-of-patient/", {
        name: name.trim(),
        phone: phone.trim(),
        amount: amount || "0",
        source,
        assigned_to: assignedTo || null,
      });
      toast.success("Карточка создана");
      onSaved(data);
    } catch (err: any) {
      const d = err?.response?.data;
      const msg = d?.assigned_to?.[0] || d?.name?.[0] || d?.error || "Не удалось создать карточку";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
          <div className="px-6 py-5 flex items-center gap-3 flex-shrink-0 border-b border-gray-100">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3772ff, #2c5bcc)" }}>
              <Handshake size={18} className="text-white" />
            </div>
            <h3 className="text-base font-black text-gray-900 flex-1">Новая карточка</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Имя / название</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Например: Иван Тестов"
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Телефон</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+7 (700) 000-00-00"
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Сумма</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Источник</label>
                <select value={source} onChange={e => setSource(e.target.value as PathOfPatientSource)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white">
                  {(Object.keys(SOURCE_LABELS) as PathOfPatientSource[]).map(s => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Ответственный</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white">
                <option value="">Не назначено</option>
                {admins.map(a => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border-2 border-gray-200 transition-colors">
              Отмена
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ background: "linear-gradient(135deg, #3772ff, #2c5bcc)" }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Создать
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PathOfPatientFormModal;
