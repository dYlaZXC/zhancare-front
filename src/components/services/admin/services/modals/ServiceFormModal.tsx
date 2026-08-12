"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { CURRENCIES, getCurrencySymbol } from "@/utils/currency";
import {
  X, Loader2, CheckCircle2, Save, ChevronDown, ClipboardList, Stethoscope,
} from "lucide-react";
import type { Service, ServiceCategory, StaffMember, ServiceFormData } from "../types/serviceTypes";
import { EMPTY_SERVICE_FORM, getCategoryIcon } from "../types/serviceTypes";

// ─── Service Form Modal ─────────────────────────────────────────────────────

export function ServiceFormModal({
  mode,
  initial,
  categories,
  staff,
  clinicCurrency,
  user,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: Service | null;
  categories: ServiceCategory[];
  staff: StaffMember[];
  clinicCurrency: string;
  user: any;
  onClose: () => void;
  onSaved: (service: Service) => void;
}) {
  const [form, setForm] = useState<ServiceFormData>(() => {
    if (mode === "edit" && initial) {
      return {
        name: initial.name, description: initial.description || "", price: initial.price || "",
        duration_minutes: initial.duration_minutes, category: initial.category,
        currency: initial.currency || "", doctor_id: initial.doctor_id ?? null,
        capacity_per_slot: initial.capacity_per_slot ?? null,
      };
    }
    return { ...EMPTY_SERVICE_FORM, category: categories[0]?.slug ?? "" };
  });
  const [saving, setSaving] = useState(false);
  const [doctorDropdown, setDoctorDropdown] = useState(false);
  const [modalMouseDownTarget, setModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catDropdownRect, setCatDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const catBtnRef = useRef<HTMLButtonElement>(null);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название услуги"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price || null,
        currency: form.currency || clinicCurrency,
        doctor_id: form.doctor_id ?? null,
        capacity_per_slot: form.capacity_per_slot,
      };
      let res;
      if (mode === "edit") {
        res = await api.patch(`/diagnostics/services/${initial!.id}/`, payload);
        toast.success("Услуга обновлена");
      } else {
        res = await api.post("/diagnostics/services/", payload);
        toast.success("Услуга добавлена");
      }
      onSaved(res.data);
    } catch {
      toast.error("Не удалось сохранить услугу");
    } finally {
      setSaving(false);
    }
  };

  const selected = categories.find(c => c.slug === form.category);
  const SelIcon = selected ? getCategoryIcon(selected.icon) : ClipboardList;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={e => setModalMouseDownTarget(e.target)}
      onClick={e => {
        if (e.target === e.currentTarget && modalMouseDownTarget === e.currentTarget) onClose();
        setModalMouseDownTarget(null);
      }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 rounded-t-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)" }}>
          <div>
            <h3 className="text-base font-black text-gray-800">{mode === "edit" ? "Редактировать услугу" : "Добавить услугу"}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Диагностическая услуга клиники</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Категория</label>
            <div className="relative">
              <button ref={catBtnRef} type="button"
                onClick={() => {
                  if (catBtnRef.current) {
                    const r = catBtnRef.current.getBoundingClientRect();
                    setCatDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
                  }
                  setCatDropdownOpen(v => !v);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-sky-400 transition-all text-left">
                {selected
                  ? <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${selected.color}20` }}>
                      <SelIcon size={13} style={{ color: selected.color }} />
                    </span>
                  : <ClipboardList size={14} className="text-gray-400 flex-shrink-0" />
                }
                <span className="flex-1 text-sm" style={{ color: selected ? '#1b1b1b' : '#9ca3af' }}>
                  {selected ? selected.name : 'Выберите категорию'}
                </span>
                <ChevronDown size={13} className={`text-gray-400 transition-transform flex-shrink-0 ${catDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {catDropdownOpen && createPortal(
                <>
                  <div className="fixed inset-0 z-[998]" onClick={() => setCatDropdownOpen(false)} />
                  <div style={{ position: 'fixed', top: catDropdownRect.top, left: catDropdownRect.left, width: catDropdownRect.width, zIndex: 999 }}
                    className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-52 overflow-y-auto">
                    {categories.map(cat => {
                      const Icon = getCategoryIcon(cat.icon);
                      const sel = form.category === cat.slug;
                      return (
                        <button key={cat.id} type="button"
                          onClick={() => { setForm(f => ({ ...f, category: cat.slug })); setCatDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${sel ? 'bg-sky-50' : ''}`}>
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}20` }}>
                            <Icon size={14} style={{ color: cat.color }} />
                          </span>
                          <span className={`flex-1 ${sel ? 'font-semibold text-sky-700' : 'text-gray-700'}`}>{cat.name}</span>
                          {sel && <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: cat.color }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>}
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
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Название услуги *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Например: Общий анализ крови"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Описание</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Краткое описание услуги..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Цена</label>
            <div className="relative">
              <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0"
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 pointer-events-none">
                {getCurrencySymbol(form.currency || clinicCurrency)}
              </span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Длительность (мин)</label>
            <input type="number" min="5" max="480" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all" />
          </div>

          {/* Currency selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
              Валюта цены
              {!form.currency && <span className="ml-1.5 normal-case font-normal text-gray-400">(по умолчанию клиники: {clinicCurrency})</span>}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CURRENCIES.map(cur => {
                const active = (form.currency || clinicCurrency) === cur.value;
                return (
                  <button key={cur.value} type="button"
                    onClick={() => setForm(f => ({ ...f, currency: cur.value }))}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}>
                    <span className={`text-sm leading-none ${active ? 'text-emerald-600' : 'text-gray-400'}`}>{cur.symbol}</span>
                    {cur.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doctor picker */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
              Ответственный врач
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDoctorDropdown(v => !v)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white hover:border-sky-400 transition-all text-left"
              >
                <Stethoscope size={14} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 truncate">
                  {form.doctor_id
                    ? (() => {
                        const d = staff.find(s => s.id === form.doctor_id);
                        return d ? `${d.last_name} ${d.first_name}` : 'Врач не найден';
                      })()
                    : <span className="text-gray-400">Не назначен</span>
                  }
                </span>
                {form.doctor_id && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, doctor_id: null })); }}
                    className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100"
                  >
                    <X size={11} className="text-gray-400" />
                  </button>
                )}
                <ChevronDown size={13} className={`text-gray-400 transition-transform flex-shrink-0 ${doctorDropdown ? 'rotate-180' : ''}`} />
              </button>
              {doctorDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 z-[200] bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-52 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, doctor_id: null })); setDoctorDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${!form.doctor_id ? 'font-semibold text-sky-600' : 'text-gray-500'}`}
                  >
                    Не назначен
                  </button>
                  {staff.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, doctor_id: d.id })); setDoctorDropdown(false); }}
                      className={`w-full text-left px-4 py-2 transition-colors hover:bg-gray-50 ${form.doctor_id === d.id ? 'bg-sky-50' : ''}`}
                    >
                      <p className={`text-sm font-semibold ${form.doctor_id === d.id ? 'text-sky-700' : 'text-gray-800'}`}>
                        {d.last_name} {d.first_name}
                      </p>
                      {d.specialization && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{d.specialization}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Slot limit */}
          <div className={`p-3 rounded-2xl border transition-all ${form.capacity_per_slot !== null ? 'bg-blue-50/60 border-[#3772FF]/25' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${form.capacity_per_slot !== null ? 'text-[#3772FF]' : 'text-gray-500'}`}>
                  Лимит пациентов на слот
                </p>
                <p className={`text-[10px] ${form.capacity_per_slot !== null ? 'text-[#3772FF]/60' : 'text-gray-400'}`}>
                  {form.capacity_per_slot !== null ? 'Ограничено' : 'Без ограничений'}
                </p>
              </div>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, capacity_per_slot: f.capacity_per_slot !== null ? null : 1 }))}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.capacity_per_slot !== null ? 'bg-[#3772FF]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.capacity_per_slot !== null ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            {form.capacity_per_slot !== null && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-[#3772FF] font-semibold">Количество:</span>
                <input type="number" min="1" max="999" value={form.capacity_per_slot}
                  onChange={e => setForm(f => ({ ...f, capacity_per_slot: Math.max(1, Number(e.target.value)) }))}
                  className="w-20 text-center px-2 py-1.5 rounded-lg border-2 border-[#3772FF]/30 text-sm font-bold text-[#3772FF] outline-none focus:border-[#3772FF] transition-all bg-white" />
                <span className="text-xs text-[#3772FF]/70">
                  {form.capacity_per_slot === 1 ? 'пациент' : form.capacity_per_slot < 5 ? 'пациента' : 'пациентов'} на слот
                </span>
              </div>
            )}
          </div>

          {/* Clinic binding */}
          <div className="rounded-2xl p-3 border-2 border-blue-100 bg-blue-50">
            <div className="flex items-center gap-3">
              {user?.clinic?.logo ? (
                <div className="flex-shrink-0 bg-white p-1.5 rounded-xl border-2 border-blue-200 shadow-sm w-10 h-10 flex items-center justify-center">
                  <img
                    src={user.clinic.logo}
                    alt={user.clinic.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      (e.currentTarget.nextElementSibling as HTMLElement | null)?.style && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex');
                    }}
                  />
                  <div style={{ display: 'none' }} className="w-full h-full items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-800">{user?.clinic?.name || 'Ваша клиника'}</p>
                <p className="text-xs text-gray-500">Клиника услуги</p>
              </div>
            </div>
            <p className="text-[11px] text-blue-600 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {mode === "edit" ? 'Услуга привязана к этой клинике' : 'Услуга будет автоматически привязана к вашей клинике'}
            </p>
          </div>

        </div>
        <div className="px-6 pb-5 pt-2 flex gap-3 rounded-b-3xl bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-md"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : mode === "edit" ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {mode === "edit" ? "Сохранить" : "Добавить"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
