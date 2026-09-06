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
        currency: initial.currency || "", schedule_source: initial.schedule_source ?? "own",
        doctor_ids: initial.doctor_ids ?? [],
        capacity_per_slot: initial.capacity_per_slot ?? null,
      };
    }
    return { ...EMPTY_SERVICE_FORM, category: categories[0]?.slug ?? "" };
  });
  const [saving, setSaving] = useState(false);
  const [modalMouseDownTarget, setModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catDropdownRect, setCatDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const catBtnRef = useRef<HTMLButtonElement>(null);
  const [doctorDropdown, setDoctorDropdown] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const doctorSearchRef = useRef<HTMLInputElement>(null);
  const filteredStaff = staff.filter(d => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return true;
    return `${d.last_name} ${d.first_name} ${d.specialization ?? ""}`.toLowerCase().includes(q);
  });

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название услуги"); return; }
    if (form.schedule_source === "doctor" && form.doctor_ids.length === 0) {
      toast.error("Выберите хотя бы одного ответственного врача для расписания по графику врача");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price || null,
        currency: form.currency || clinicCurrency,
        doctor_ids: form.doctor_ids,
        capacity_per_slot: form.schedule_source === "doctor" ? null : form.capacity_per_slot,
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
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
              {mode === "edit" ? "Редактировать услугу" : "Добавить услугу"}
            </h2>
            <p className="text-gray-600 mt-1">Диагностическая услуга клиники</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-8 pt-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Категория</label>
              <div className="relative">
                <button ref={catBtnRef} type="button" title="Выбрать категорию"
                  onClick={() => {
                    if (catBtnRef.current) {
                      const r = catBtnRef.current.getBoundingClientRect();
                      setCatDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
                    }
                    setCatDropdownOpen(v => !v);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-300 focus:border-blue-500 transition-colors text-left">
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
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${sel ? 'bg-blue-50' : ''}`}>
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}20` }}>
                              <Icon size={14} style={{ color: cat.color }} />
                            </span>
                            <span className={`flex-1 ${sel ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>{cat.name}</span>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Название услуги <span className="text-red-500">*</span>
              </label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Например: Общий анализ крови"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Описание</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Краткое описание услуги..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Цена</label>
                <div className="relative">
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 pointer-events-none">
                    {getCurrencySymbol(form.currency || clinicCurrency)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Длительность (мин)</label>
                <input type="number" min="5" max="480" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors" />
              </div>
            </div>

            {/* Currency selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Валюта цены
                {!form.currency && <span className="ml-1.5 font-normal text-gray-400">(по умолчанию клиники: {clinicCurrency})</span>}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map(cur => {
                  const active = (form.currency || clinicCurrency) === cur.value;
                  return (
                    <button key={cur.value} type="button"
                      onClick={() => setForm(f => ({ ...f, currency: cur.value }))}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}>
                      <span className={`text-sm leading-none ${active ? 'text-blue-600' : 'text-gray-400'}`}>{cur.symbol}</span>
                      {cur.value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule source toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Расписание услуги</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, schedule_source: "own" }))}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                    form.schedule_source === "own" ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                  Своё расписание
                  <span className="block text-xs font-normal mt-0.5 opacity-70">Настраивается отдельно для услуги</span>
                </button>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, schedule_source: "doctor" }))}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                    form.schedule_source === "doctor" ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                  По графику врача
                  <span className="block text-xs font-normal mt-0.5 opacity-70">Следует расписанию назначенных врачей</span>
                </button>
              </div>
            </div>

            {/* Doctor picker — searchable multi-select with removable tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ответственные врачи {form.schedule_source === "doctor" && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div
                  onClick={() => { setDoctorDropdown(true); doctorSearchRef.current?.focus(); }}
                  className="relative z-[151] w-full min-h-[48px] px-3 py-2 rounded-xl border-2 border-gray-200 bg-white focus-within:border-blue-500 transition-colors flex flex-wrap items-center gap-1.5 cursor-text"
                >
                  {form.doctor_ids.map(id => {
                    const d = staff.find(s => s.id === id);
                    if (!d) return null;
                    return (
                      <span key={id}
                        className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 whitespace-nowrap">
                        <Stethoscope size={11} className="text-blue-400 flex-shrink-0" />
                        {d.last_name} {d.first_name}
                        <button type="button"
                          onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, doctor_ids: f.doctor_ids.filter(x => x !== id) })); }}
                          className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                  <input
                    ref={doctorSearchRef}
                    value={doctorSearch}
                    onChange={e => { setDoctorSearch(e.target.value); setDoctorDropdown(true); }}
                    onFocus={() => setDoctorDropdown(true)}
                    placeholder={form.doctor_ids.length === 0 ? "Начните вводить имя врача..." : ""}
                    className="flex-1 min-w-[140px] outline-none text-sm bg-transparent py-1"
                  />
                </div>
                {doctorDropdown && (
                  <>
                    <div className="fixed inset-0 z-[150]" onClick={() => { setDoctorDropdown(false); setDoctorSearch(""); }} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-[151] bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
                      {filteredStaff.length === 0 ? (
                        <p className="text-sm text-gray-400 px-4 py-3">Врачи не найдены</p>
                      ) : filteredStaff.map(d => {
                        const checked = form.doctor_ids.includes(d.id);
                        return (
                          <button key={d.id} type="button"
                            onClick={() => {
                              setForm(f => ({
                                ...f,
                                doctor_ids: checked ? f.doctor_ids.filter(id => id !== d.id) : [...f.doctor_ids, d.id],
                              }));
                              setDoctorSearch("");
                              doctorSearchRef.current?.focus();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${checked ? 'bg-blue-50' : ''}`}
                          >
                            <Stethoscope size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${checked ? 'text-blue-700' : 'text-gray-800'}`}>
                                {d.last_name} {d.first_name}
                              </p>
                              {d.specialization && <p className="text-xs text-gray-400 mt-0.5 truncate">{d.specialization}</p>}
                            </span>
                            {checked && <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              {form.schedule_source === "doctor" && (
                <p className="text-xs text-gray-400 mt-1.5">Расписание услуги = объединённые графики выбранных врачей.</p>
              )}
            </div>

            {/* Slot limit — meaningless in doctor-mode, capacity is decided by which assigned doctors are free */}
            {form.schedule_source === "own" && (
              <div className={`p-4 rounded-2xl border-2 transition-all ${form.capacity_per_slot !== null ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className={`text-sm font-semibold mb-0.5 ${form.capacity_per_slot !== null ? 'text-blue-700' : 'text-gray-700'}`}>
                      Лимит пациентов на слот
                    </p>
                    <p className={`text-xs ${form.capacity_per_slot !== null ? 'text-blue-500' : 'text-gray-400'}`}>
                      {form.capacity_per_slot !== null ? 'Ограничено' : 'Без ограничений'}
                    </p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, capacity_per_slot: f.capacity_per_slot !== null ? null : 1 }))}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.capacity_per_slot !== null ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.capacity_per_slot !== null ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
                {form.capacity_per_slot !== null && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-blue-700 font-semibold">Количество:</span>
                    <input type="number" min="1" max="999" value={form.capacity_per_slot}
                      onChange={e => setForm(f => ({ ...f, capacity_per_slot: Math.max(1, Number(e.target.value)) }))}
                      className="w-20 text-center px-2 py-1.5 rounded-lg border-2 border-blue-300 text-sm font-bold text-blue-700 outline-none focus:border-blue-500 transition-colors bg-white" />
                    <span className="text-sm text-blue-500">
                      {form.capacity_per_slot === 1 ? 'пациент' : form.capacity_per_slot < 5 ? 'пациента' : 'пациентов'} на слот
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Clinic binding */}
            <div className="rounded-2xl p-4 border-2 border-blue-100 bg-blue-50">
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
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mode === "edit" ? 'Услуга привязана к этой клинике' : 'Услуга будет автоматически привязана к вашей клинике'}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 z-10 -mx-8 mt-8 flex gap-4 rounded-b-3xl border-t-2 border-gray-100 bg-white px-8 pt-6 pb-8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "edit" ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {mode === "edit" ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
