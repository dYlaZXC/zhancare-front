"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Plus, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import type { ServiceCategory, CategoryFormData } from "../types/serviceTypes";
import { EMPTY_CATEGORY_FORM, ICON_OPTIONS, getCategoryIcon, toSlug } from "../types/serviceTypes";

// Create / edit one category — opened from the "Добавить категорию" header
// button and each card's pencil, same pattern as ServiceFormModal.
export function CategoryFormModal({
  initial,
  nextOrder,
  onClose,
  onSaved,
}: {
  initial: ServiceCategory | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (cat: ServiceCategory, mode: "create" | "edit") => void;
}) {
  const editing = initial !== null;
  const [form, setForm] = useState<CategoryFormData>(
    initial
      ? { slug: initial.slug, name: initial.name, icon: initial.icon, color: initial.color, order: initial.order, is_active: initial.is_active }
      : { ...EMPTY_CATEGORY_FORM, order: nextOrder },
  );
  const [saving, setSaving] = useState(false);
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);
  const [iconDropdownRect, setIconDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const iconBtnRef = useRef<HTMLButtonElement>(null);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название категории"); return; }
    const payload = { ...form, slug: form.slug.trim() || toSlug(form.name) };
    setSaving(true);
    try {
      if (editing) {
        const res = await api.patch(`/diagnostics/categories/${initial!.id}/`, payload);
        toast.success("Категория обновлена");
        onSaved(res.data, "edit");
      } else {
        const res = await api.post("/diagnostics/categories/", payload);
        toast.success("Категория добавлена");
        onSaved(res.data, "create");
      }
    } catch {
      toast.error("Не удалось сохранить категорию");
    } finally {
      setSaving(false);
    }
  };

  const SelectedIcon = getCategoryIcon(form.icon);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={e => setMouseDownTarget(e.target)}
      onClick={e => {
        if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) onClose();
        setMouseDownTarget(null);
      }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-black text-gray-800">{editing ? "Редактировать категорию" : "Новая категория"}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{editing ? initial!.name : "Название, иконка и цвет"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Название *</label>
            <input
              value={form.name}
              onChange={e => {
                const name = e.target.value;
                setForm(f => ({ ...f, name, slug: editing ? f.slug : toSlug(name) }));
              }}
              placeholder="Например: Гастроэнтерология"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all"
            />
            {form.slug && <p className="text-[10px] text-gray-400 mt-1 font-mono">slug: {form.slug}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Иконка</label>
              <button ref={iconBtnRef} type="button"
                onClick={() => {
                  if (iconBtnRef.current) {
                    const r = iconBtnRef.current.getBoundingClientRect();
                    setIconDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
                  }
                  setIconDropdownOpen(v => !v);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-sky-400 transition-all text-left">
                <SelectedIcon size={15} className="text-gray-600 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700">{ICON_OPTIONS.find(o => o.value === form.icon)?.label ?? "Выбрать"}</span>
                <ChevronDown size={12} className={`text-gray-400 transition-transform flex-shrink-0 ${iconDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {iconDropdownOpen && createPortal(
                <>
                  <div className="fixed inset-0 z-[998]" onClick={() => setIconDropdownOpen(false)} />
                  <div style={{ position: "fixed", top: iconDropdownRect.top, left: iconDropdownRect.left, width: iconDropdownRect.width, zIndex: 999 }}
                    className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-52 overflow-y-auto">
                    {ICON_OPTIONS.map(opt => {
                      const Icon = getCategoryIcon(opt.value);
                      const sel = form.icon === opt.value;
                      return (
                        <button key={opt.value} type="button"
                          onClick={() => { setForm(f => ({ ...f, icon: opt.value })); setIconDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${sel ? "bg-sky-50 text-sky-700 font-semibold" : "text-gray-700"}`}>
                          <Icon size={14} style={{ color: sel ? "#0284c7" : "#6b7280" }} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </>,
                document.body,
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Цвет</label>
              <div className="relative w-full h-[42px] rounded-xl overflow-hidden cursor-pointer border border-gray-200 shadow-sm"
                style={{ background: form.color }}>
                <input type="color" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-bold tracking-wider"
                    style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                    {form.color.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Порядок</label>
              <input type="number" min="0" value={form.order}
                onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 transition-all" />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`w-full py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.is_active ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}>
                {form.is_active ? "✓ Активна" : "Неактивна"}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2.5 flex-shrink-0">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-md"
            style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : editing ? <CheckCircle2 size={14} /> : <Plus size={14} />}
            {editing ? "Сохранить" : "Добавить категорию"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
