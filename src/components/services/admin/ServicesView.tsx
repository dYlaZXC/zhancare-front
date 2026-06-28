"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { CURRENCIES, getCurrencySymbol, formatPrice } from "@/utils/currency";
import {
  Plus, Pencil, Trash2, Loader2, X, CheckCircle2, Save,
  FlaskConical, ScanLine, Heart, Brain, Bone, Eye, Baby, Microscope,
  ClipboardList, Clock, Banknote, ToggleLeft, ToggleRight,
  CalendarDays, Search,
} from "lucide-react";

const CATEGORIES = [
  { id: "all",     label: "Все",           icon: ClipboardList, color: "#6366f1" },
  { id: "lab",     label: "Анализы",       icon: FlaskConical,  color: "#ef4444" },
  { id: "imaging", label: "Визуализация",  icon: ScanLine,      color: "#8b5cf6" },
  { id: "cardio",  label: "Кардиология",   icon: Heart,         color: "#f43f5e" },
  { id: "neuro",   label: "Неврология",    icon: Brain,         color: "#3b82f6" },
  { id: "ortho",   label: "Ортопедия",     icon: Bone,          color: "#f59e0b" },
  { id: "ophtha",  label: "Офтальмология", icon: Eye,           color: "#10b981" },
  { id: "peds",    label: "Педиатрия",     icon: Baby,          color: "#ec4899" },
  { id: "micro",   label: "Микробиология", icon: Microscope,    color: "#0ea5e9" },
];

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  duration_minutes: number;
  category: string;
  category_label: string;
  is_active: boolean;
  schedules?: Array<{ id: number; weekday: number; start_time: string; end_time: string; is_active: boolean }>;
  capacity_per_slot?: number;
  currency?: string;
}

const WEEKDAYS = [
  { value: "monday",    labelRu: "Понедельник", labelShort: "Пн" },
  { value: "tuesday",   labelRu: "Вторник",     labelShort: "Вт" },
  { value: "wednesday", labelRu: "Среда",       labelShort: "Ср" },
  { value: "thursday",  labelRu: "Четверг",     labelShort: "Чт" },
  { value: "friday",    labelRu: "Пятница",     labelShort: "Пт" },
  { value: "saturday",  labelRu: "Суббота",     labelShort: "Сб" },
  { value: "sunday",    labelRu: "Воскресенье", labelShort: "Вс" },
];

const DEFAULT_WEEKLY_SCHEDULE: Record<string, { enabled: boolean; start: string; end: string }> = {
  monday:    { enabled: false, start: "09:00", end: "18:00" },
  tuesday:   { enabled: false, start: "09:00", end: "18:00" },
  wednesday: { enabled: false, start: "09:00", end: "18:00" },
  thursday:  { enabled: false, start: "09:00", end: "18:00" },
  friday:    { enabled: false, start: "09:00", end: "18:00" },
  saturday:  { enabled: false, start: "10:00", end: "14:00" },
  sunday:    { enabled: false, start: "10:00", end: "14:00" },
};

// Matches the weekday convention used by DoctorSchedule on the backend (0=Monday..6=Sunday)
const DAY_TO_WEEKDAY: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};
const WEEKDAY_TO_DAY: Record<number, string> = {
  0: "monday", 1: "tuesday", 2: "wednesday", 3: "thursday", 4: "friday", 5: "saturday", 6: "sunday",
};

function schedulesToWeeklyMap(
  schedules: Service["schedules"]
): Record<string, { enabled: boolean; start: string; end: string }> {
  const map = { ...DEFAULT_WEEKLY_SCHEDULE };
  for (const row of schedules ?? []) {
    const day = WEEKDAY_TO_DAY[row.weekday];
    if (day) map[day] = { enabled: true, start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5) };
  }
  return map;
}

function weeklyMapToSchedules(
  weeklySchedule: Record<string, { enabled: boolean; start: string; end: string }>
): Array<{ weekday: number; start_time: string; end_time: string; is_active: boolean }> {
  return Object.entries(weeklySchedule)
    .filter(([, cfg]) => cfg.enabled)
    .map(([day, cfg]) => ({
      weekday: DAY_TO_WEEKDAY[day],
      start_time: cfg.start,
      end_time: cfg.end,
      is_active: true,
    }));
}

const EMPTY_FORM = {
  name: "", description: "", price: "", duration_minutes: 30, category: "lab",
  currency: "",
};

export function ServicesView({ user }: { user: any }) {
  const [catFilter, setCatFilter] = useState("all");
  const [services, setServices] = useState<Service[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [scheduleService, setScheduleService] = useState<Service | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/diagnostics/services/");
      setServices(res.data);
    } catch {
      toast.error("Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/clinic-stats/').then(res => {
      if (res.data?.clinic_info?.currency) setClinicCurrency(res.data.clinic_info.currency);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name, description: s.description || "", price: s.price || "",
      duration_minutes: s.duration_minutes, category: s.category,
      currency: s.currency || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название услуги"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price || null,
        currency: form.currency || clinicCurrency,
      };
      if (editing) {
        const res = await api.patch(`/diagnostics/services/${editing.id}/`, payload);
        setServices(prev => prev.map(s => s.id === editing.id ? res.data : s));
        toast.success("Услуга обновлена");
      } else {
        const res = await api.post("/diagnostics/services/", payload);
        setServices(prev => [res.data, ...prev]);
        toast.success("Услуга добавлена");
      }
      setShowModal(false);
    } catch {
      toast.error("Не удалось сохранить услугу");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s: Service) => {
    try {
      const res = await api.patch(`/diagnostics/services/${s.id}/toggle-active/`);
      setServices(prev => prev.map(x => x.id === s.id ? res.data : x));
    } catch {
      toast.error("Не удалось изменить статус");
    }
  };

  const handleDelete = async (s: Service) => {
    if (!confirm(`Деактивировать услугу «${s.name}»?`)) return;
    try {
      await api.delete(`/diagnostics/services/${s.id}/`);
      setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: false } : x));
      toast.success("Услуга деактивирована");
    } catch {
      toast.error("Не удалось удалить услугу");
    }
  };

  const serviceSearchLower = serviceSearch.trim().toLowerCase();
  const filtered = services.filter(s => {
    if (catFilter !== "all" && s.category !== catFilter) return false;
    if (!serviceSearchLower) return true;
    return s.name.toLowerCase().includes(serviceSearchLower);
  });
  const totalActive = services.filter(s => s.is_active).length;

  return (
    <div className="w-full space-y-5">

      {/* HEADER */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #3772ff, transparent)" }} />
        </div>
        <div className="relative px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">Услуги клиники</h1>
            </div>
            <p className="text-[#c1d3ff] text-sm">Управление диагностическими услугами клиники</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center px-5 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-2xl font-black text-white">{totalActive}</p>
              <p className="text-[#c1d3ff] text-xs mt-0.5">Активных услуг</p>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5 flex-1">
              {CATEGORIES.map(cat => {
                const active = catFilter === cat.id;
                return (
                  <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${active ? "text-white border-transparent shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                    style={active ? { background: cat.id === "all" ? "#6366f1" : cat.color } : {}}>
                    <cat.icon size={11} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
              <Plus size={15} /> Добавить услугу
            </button>
          </div>

          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
              placeholder="Поиск по названию услуги..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: "#e8e8e8", color: "#1b1b1b" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#3772ff"; e.currentTarget.style.boxShadow = "0 0 0 4px #ebf1ff"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.boxShadow = "none"; }} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Нет услуг в этой категории</p>
              <p className="text-sm mt-1">Нажмите «Добавить услугу» чтобы создать первую</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(s => {
                const catInfo = CATEGORIES.find(c => c.id === s.category) ?? CATEGORIES[0];
                return (
                  <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${!s.is_active ? "opacity-60" : ""}`}>
                    <div className="h-1" style={{ background: catInfo.color }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${catInfo.color}18` }}>
                            <catInfo.icon size={16} style={{ color: catInfo.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 leading-tight">{s.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{s.category_label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors" title="Редактировать">
                            <Pencil size={12} className="text-gray-400" />
                          </button>
                          <button onClick={() => setScheduleService(s)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-sky-50 transition-colors" title="Расписание">
                            <CalendarDays size={12} className="text-gray-400" />
                          </button>
                          <button onClick={() => handleDelete(s)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors" title="Удалить">
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                      {s.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>}
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={10} /> {s.duration_minutes} мин</span>
                        {s.price && <span className="flex items-center gap-1 font-semibold text-emerald-600"><Banknote size={10} /> {formatPrice(s.price, clinicCurrency)}</span>}
                      </div>
                      <button onClick={() => handleToggle(s)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${s.is_active ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>
                        {s.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        {s.is_active ? "Активна" : "Неактивна"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100"
                style={{ background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)" }}>
                <div>
                  <h3 className="text-base font-black text-gray-800">{editing ? "Редактировать услугу" : "Добавить услугу"}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Диагностическая услуга клиники</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Категория</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CATEGORIES.filter(c => c.id !== "all").map(cat => {
                      const sel = form.category === cat.id;
                      return (
                        <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                          className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${sel ? "border-transparent text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"}`}
                          style={sel ? { background: cat.color } : {}}>
                          <cat.icon size={14} />
                          <span className="truncate w-full text-center px-1">{cat.label.split(" ")[0]}</span>
                        </button>
                      );
                    })}
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
                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Длит. (мин)</label>
                    <input type="number" min="5" max="480" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all" />
                  </div>
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

              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  Отмена
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-md"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : editing ? <CheckCircle2 size={14} /> : <Save size={14} />}
                  {editing ? "Сохранить" : "Добавить"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCHEDULE MODAL */}
      <ServiceScheduleModal
        service={scheduleService}
        onClose={() => setScheduleService(null)}
        onSaved={(updated) => {
          setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
          setScheduleService(null);
        }}
      />
    </div>
  );
}

function ServiceScheduleModal({
  service, onClose, onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (updated: Service) => void;
}) {
  const [weeklySchedule, setWeeklySchedule] = useState(DEFAULT_WEEKLY_SCHEDULE);
  const [capacityPerSlot, setCapacityPerSlot] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!service) return;
    setWeeklySchedule(schedulesToWeeklyMap(service.schedules));
    setCapacityPerSlot(service.capacity_per_slot ?? 1);
  }, [service]);

  if (!service) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/diagnostics/services/${service.id}/`, {
        schedules: weeklyMapToSchedules(weeklySchedule),
        capacity_per_slot: capacityPerSlot,
      });
      toast.success("Расписание сохранено");
      onSaved(res.data);
    } catch {
      toast.error("Не удалось сохранить расписание");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)" }}>
            <div>
              <h3 className="text-base font-black text-gray-800">Расписание услуги</h3>
              <p className="text-xs text-gray-500 mt-0.5">{service.name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 overflow-y-auto">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Лимит пациентов на слот</label>
              <input type="number" min="1" max="99" value={capacityPerSlot}
                onChange={e => setCapacityPerSlot(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 transition-all bg-white" />
            </div>

            <div className="space-y-2">
              {WEEKDAYS.map(day => {
                const daySchedule = weeklySchedule[day.value] ?? DEFAULT_WEEKLY_SCHEDULE[day.value];
                const enabled = daySchedule.enabled;
                return (
                  <div key={day.value}
                    className={`rounded-xl border-2 p-3 transition-all bg-white ${enabled ? 'border-sky-300' : 'border-gray-200'}`}>
                    <button type="button"
                      onClick={() => setWeeklySchedule(ws => ({
                        ...ws,
                        [day.value]: { ...daySchedule, enabled: !enabled },
                      }))}
                      className="w-full flex items-center gap-3">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold flex-shrink-0 ${
                        enabled ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {day.labelShort}
                      </div>
                      <p className={`flex-1 text-sm font-semibold text-left ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                        {day.labelRu}
                      </p>
                    </button>
                    {enabled && (
                      <div className="grid grid-cols-2 gap-2 mt-2.5">
                        <input type="time" value={daySchedule.start}
                          onChange={e => setWeeklySchedule(ws => ({
                            ...ws,
                            [day.value]: { ...daySchedule, start: e.target.value },
                          }))}
                          step="900"
                          className="w-full px-2.5 py-1.5 rounded-lg border-2 border-gray-200 focus:border-sky-400 outline-none text-xs bg-white" />
                        <input type="time" value={daySchedule.end}
                          onChange={e => setWeeklySchedule(ws => ({
                            ...ws,
                            [day.value]: { ...daySchedule, end: e.target.value },
                          }))}
                          step="900"
                          className="w-full px-2.5 py-1.5 rounded-lg border-2 border-gray-200 focus:border-sky-400 outline-none text-xs bg-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 pb-5 pt-2 flex gap-3 flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              Отмена
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-md"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Сохранить
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ServicesView;
