"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Pencil, Trash2, Plus, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import type { ServiceCategory, CategoryFormData } from "../types/serviceTypes";
import { EMPTY_CATEGORY_FORM, ICON_OPTIONS, getCategoryIcon, toSlug } from "../types/serviceTypes";

// ─── Category Management Modal ─────────────────────────────────────────────
// Combined list + inline add/edit form, matching the original single-modal UX:
// clicking "edit" on a list row swaps the inline form into edit mode without
// closing/reopening the modal.

export function CategoryFormModal({
  categories,
  onClose,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
}: {
  categories: ServiceCategory[];
  onClose: () => void;
  onCategoryCreated: (cat: ServiceCategory) => void;
  onCategoryUpdated: (cat: ServiceCategory) => void;
  onCategoryDeleted: (cat: ServiceCategory) => void;
}) {
  const [modalMouseDownTarget, setModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ ...EMPTY_CATEGORY_FORM, order: categories.length });
  const [savingCategory, setSavingCategory] = useState(false);
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);
  const [iconDropdownRect, setIconDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const iconBtnRef = useRef<HTMLButtonElement>(null);

  const openEditCategory = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setCategoryForm({ slug: cat.slug, name: cat.name, icon: cat.icon, color: cat.color, order: cat.order, is_active: cat.is_active });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) { toast.error("Введите название категории"); return; }
    if (!categoryForm.slug.trim()) { setCategoryForm(f => ({ ...f, slug: toSlug(f.name) })); }
    setSavingCategory(true);
    try {
      if (editingCategory) {
        const res = await api.patch(`/diagnostics/categories/${editingCategory.id}/`, categoryForm);
        toast.success("Категория обновлена");
        onCategoryUpdated(res.data);
      } else {
        const res = await api.post("/diagnostics/categories/", categoryForm);
        toast.success("Категория добавлена");
        onCategoryCreated(res.data);
      }
      onClose();
    } catch {
      toast.error("Не удалось сохранить категорию");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: ServiceCategory) => {
    if (!confirm(`Удалить категорию «${cat.name}»?`)) return;
    try {
      await api.delete(`/diagnostics/categories/${cat.id}/`);
      toast.success("Категория удалена");
      onCategoryDeleted(cat);
    } catch {
      toast.error("Не удалось удалить категорию");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={e => setModalMouseDownTarget(e.target)}
      onClick={e => {
        if (e.target === e.currentTarget && modalMouseDownTarget === e.currentTarget) onClose();
        setModalMouseDownTarget(null);
      }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
          <div>
            <h3 className="text-base font-black text-gray-800">Категории услуг</h3>
            <p className="text-xs text-gray-500 mt-0.5">Добавляйте и редактируйте категории</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Existing categories list */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {categories.map(cat => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}20` }}>
                    <Icon size={15} style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{cat.name}</p>
                    <p className="text-[10px] text-gray-400">{cat.slug} · порядок: {cat.order}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {cat.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEditCategory(cat)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Pencil size={11} className="text-gray-400" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                      <Trash2 size={11} className="text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Нет категорий</p>
            )}
          </div>

          {/* Add / Edit category form */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
              {editingCategory ? `Редактировать: ${editingCategory.name}` : "Новая категория"}
            </p>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Название *</label>
              <input
                value={categoryForm.name}
                onChange={e => {
                  const name = e.target.value;
                  setCategoryForm(f => ({
                    ...f,
                    name,
                    slug: editingCategory ? f.slug : toSlug(name),
                  }));
                }}
                placeholder="Например: Гастроэнтерология"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-400/10 transition-all"
              />
              {categoryForm.slug && (
                <p className="text-[10px] text-gray-400 mt-1 font-mono">slug: {categoryForm.slug}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Иконка</label>
                <div className="relative">
                  <button ref={iconBtnRef} type="button"
                    onClick={() => {
                      if (iconBtnRef.current) {
                        const r = iconBtnRef.current.getBoundingClientRect();
                        setIconDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
                      }
                      setIconDropdownOpen(v => !v);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:border-violet-400 transition-all text-left">
                    {(() => { const Icon = getCategoryIcon(categoryForm.icon); return <Icon size={15} className="text-gray-600 flex-shrink-0" />; })()}
                    <span className="flex-1 text-sm text-gray-700">{ICON_OPTIONS.find(o => o.value === categoryForm.icon)?.label ?? 'Выбрать'}</span>
                    <ChevronDown size={12} className={`text-gray-400 transition-transform flex-shrink-0 ${iconDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {iconDropdownOpen && createPortal(
                    <>
                      <div className="fixed inset-0 z-[998]" onClick={() => setIconDropdownOpen(false)} />
                      <div style={{ position: 'fixed', top: iconDropdownRect.top, left: iconDropdownRect.left, width: iconDropdownRect.width, zIndex: 999 }}
                        className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-52 overflow-y-auto">
                        {ICON_OPTIONS.map(opt => {
                          const Icon = getCategoryIcon(opt.value);
                          const sel = categoryForm.icon === opt.value;
                          return (
                            <button key={opt.value} type="button"
                              onClick={() => { setCategoryForm(f => ({ ...f, icon: opt.value })); setIconDropdownOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${sel ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-gray-700'}`}>
                              <Icon size={14} style={{ color: sel ? '#7c3aed' : '#6b7280' }} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Цвет</label>
                <div className="relative w-full h-[38px] rounded-xl overflow-hidden cursor-pointer border border-gray-200 shadow-sm"
                  style={{ background: categoryForm.color }}>
                  <input type="color" value={categoryForm.color}
                    onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[11px] font-bold tracking-wider drop-shadow-sm"
                      style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                      {categoryForm.color.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Порядок</label>
                <input type="number" min="0" value={categoryForm.order} onChange={e => setCategoryForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 transition-all" />
              </div>
              <div className="flex items-end">
                <button onClick={() => setCategoryForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-full py-2 rounded-xl border-2 text-xs font-bold transition-all ${categoryForm.is_active ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                  {categoryForm.is_active ? '✓ Активна' : 'Неактивна'}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              {editingCategory && (
                <button onClick={() => { setEditingCategory(null); setCategoryForm({ ...EMPTY_CATEGORY_FORM, order: categories.length }); }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">
                  Отмена
                </button>
              )}
              <button onClick={handleSaveCategory} disabled={savingCategory}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-sm"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                {savingCategory ? <Loader2 size={13} className="animate-spin" /> : editingCategory ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                {editingCategory ? "Сохранить" : "Добавить категорию"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
