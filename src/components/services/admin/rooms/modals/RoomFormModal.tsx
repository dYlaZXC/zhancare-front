"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Loader2, CheckCircle2, Save, ChevronDown, DoorOpen } from "lucide-react";
import type { ClinicRoom, RoomFormData } from "../types/roomTypes";
import { EMPTY_ROOM_FORM, ROOM_TYPE_OPTIONS, ROOM_STATUS_OPTIONS } from "../types/roomTypes";

export function RoomFormModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: ClinicRoom | null;
  onClose: () => void;
  onSaved: (room: ClinicRoom) => void;
}) {
  const [form, setForm] = useState<RoomFormData>(() => {
    if (mode === "edit" && initial) {
      return {
        name: initial.name,
        number: initial.number || "",
        floor: initial.floor || "",
        room_type: initial.room_type,
        specialization_name: initial.specialization_name || "",
        status: initial.status,
        capacity: initial.capacity,
        description: initial.description || "",
      };
    }
    return { ...EMPTY_ROOM_FORM };
  });
  const [saving, setSaving] = useState(false);
  const [modalMouseDownTarget, setModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название кабинета"); return; }
    if (!form.capacity || form.capacity < 1) { toast.error("Вместимость должна быть не менее 1"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        number: form.number.trim() || null,
        floor: form.floor.trim() || null,
        room_type: form.room_type,
        specialization_name: form.specialization_name.trim(),
        status: form.status,
        capacity: form.capacity,
        description: form.description.trim() || null,
      };
      let res;
      if (mode === "edit") {
        res = await api.patch(`/clinic-rooms/${initial!.id}/`, payload);
        toast.success("Кабинет обновлён");
      } else {
        res = await api.post("/clinic-rooms/", payload);
        toast.success("Кабинет добавлен");
      }
      onSaved(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.response?.data?.detail || "Не удалось сохранить кабинет");
    } finally {
      setSaving(false);
    }
  };

  const selectedType = ROOM_TYPE_OPTIONS.find(t => t.value === form.room_type);
  const selectedStatus = ROOM_STATUS_OPTIONS.find(s => s.value === form.status);

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setModalMouseDownTarget(e.target);
  };
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && modalMouseDownTarget === e.target) onClose();
    setModalMouseDownTarget(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#1e263e" }}>
              {mode === "edit" ? "Редактировать кабинет" : "Добавить кабинет"}
            </h2>
            <p className="text-gray-600 mt-1">Кабинет клиники</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="px-8 pt-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Название кабинета <span className="text-red-500">*</span>
              </label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Например: Кабинет №203"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Номер</label>
                <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                  placeholder="203"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Этаж</label>
                <input value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                  placeholder="2"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors" />
              </div>
            </div>

            {/* Room type dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Тип кабинета</label>
              <div className="relative">
                <button type="button" onClick={() => setTypeDropdownOpen(v => !v)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-300 focus:border-orange-500 transition-colors text-left">
                  <DoorOpen size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-800">{selectedType?.label ?? "Выберите тип"}</span>
                  <ChevronDown size={13} className={`text-gray-400 transition-transform flex-shrink-0 ${typeDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {typeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[998]" onClick={() => setTypeDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-[999] bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
                      {ROOM_TYPE_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => { setForm(f => ({ ...f, room_type: opt.value })); setTypeDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${form.room_type === opt.value ? "bg-orange-50 font-semibold text-orange-700" : "text-gray-700"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Специализация</label>
              <input value={form.specialization_name} onChange={e => setForm(f => ({ ...f, specialization_name: e.target.value }))}
                placeholder="Например: Кардиология (необязательно)"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors" />
              <p className="text-xs text-gray-400 mt-1.5">Справочная метка — не влияет на доступность кабинета.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Вместимость <span className="text-red-500">*</span>
                </label>
                <input type="number" min="1" max="999" value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: Math.max(1, Number(e.target.value)) }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors" />
                <p className="text-xs text-gray-400 mt-1.5">Сколько врачей могут одновременно вести приём в кабинете.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Статус</label>
                <div className="relative">
                  <button type="button" onClick={() => setStatusDropdownOpen(v => !v)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-300 focus:border-orange-500 transition-colors text-left">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: selectedStatus ? undefined : "#9ca3af" }} />
                    <span className="flex-1 text-sm text-gray-800">{selectedStatus?.label ?? "Выберите статус"}</span>
                    <ChevronDown size={13} className={`text-gray-400 transition-transform flex-shrink-0 ${statusDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {statusDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[998]" onClick={() => setStatusDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 z-[999] bg-white border border-gray-100 rounded-xl shadow-xl py-1">
                        {ROOM_STATUS_OPTIONS.map(opt => (
                          <button key={opt.value} type="button"
                            onClick={() => { setForm(f => ({ ...f, status: opt.value })); setStatusDropdownOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${form.status === opt.value ? "font-semibold" : "text-gray-700"}`}
                            style={form.status === opt.value ? { color: opt.color, background: `${opt.color}14` } : {}}>
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Описание</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Оборудование, заметки..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors resize-none" />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-8 mt-8 flex gap-4 rounded-b-3xl border-t-2 border-gray-100 bg-white px-8 pt-6 pb-8">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
              Отмена
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "edit" ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {mode === "edit" ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
