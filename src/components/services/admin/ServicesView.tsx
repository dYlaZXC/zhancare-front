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
  CalendarCheck, User, ChevronDown, CalendarDays,
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

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:   { label: "Запланировано",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  confirmed:   { label: "Подтверждено",   color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  in_progress: { label: "В процессе",     color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  completed:   { label: "Завершено",      color: "text-gray-600",   bg: "bg-gray-100 border-gray-200" },
  cancelled:   { label: "Отменено",       color: "text-red-600",    bg: "bg-red-50 border-red-200" },
};

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  duration_minutes: number;
  category: string;
  category_label: string;
  is_active: boolean;
  has_custom_schedule?: boolean;
  schedule_days?: string[];
  schedule_start?: string;
  schedule_end?: string;
  capacity_per_slot?: number;
  currency?: string;
}

interface Appointment {
  id: number;
  patient_name: string;
  service_name: string;
  category: string;
  appointment_time: string;
  status: string;
  notes: string;
}

const WEEKDAYS = [
  { id: "1", label: "Пн" }, { id: "2", label: "Вт" }, { id: "3", label: "Ср" },
  { id: "4", label: "Чт" }, { id: "5", label: "Пт" }, { id: "6", label: "Сб" },
  { id: "0", label: "Вс" },
];

const EMPTY_FORM = {
  name: "", description: "", price: "", duration_minutes: 30, category: "lab",
  currency: "",
  has_custom_schedule: false,
  schedule_days: [] as string[],
  schedule_start: "09:00",
  schedule_end: "18:00",
  capacity_per_slot: 1,
};

export function ServicesView({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"services" | "appointments">("services");
  const [catFilter, setCatFilter] = useState("all");
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [apptLoading, setApptLoading] = useState(false);
  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [apptStatusFilter, setApptStatusFilter] = useState("all");

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

  const fetchAppointments = useCallback(async () => {
    setApptLoading(true);
    try {
      const res = await api.get("/diagnostics/appointments/clinic-appointments/");
      setAppointments(res.data);
    } catch {
      toast.error("Не удалось загрузить записи");
    } finally {
      setApptLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/clinic-stats/').then(res => {
      if (res.data?.clinic_info?.currency) setClinicCurrency(res.data.clinic_info.currency);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);
  useEffect(() => {
    if (activeTab === "appointments") fetchAppointments();
  }, [activeTab, fetchAppointments]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name, description: s.description || "", price: s.price || "",
      duration_minutes: s.duration_minutes, category: s.category,
      currency: s.currency || "",
      has_custom_schedule: s.has_custom_schedule ?? false,
      schedule_days: s.schedule_days ?? [],
      schedule_start: s.schedule_start ?? "09:00",
      schedule_end: s.schedule_end ?? "18:00",
      capacity_per_slot: s.capacity_per_slot ?? 1,
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
        // Only send schedule fields when custom schedule is enabled
        schedule_days:      form.has_custom_schedule ? form.schedule_days : [],
        schedule_start:     form.has_custom_schedule ? form.schedule_start : null,
        schedule_end:       form.has_custom_schedule ? form.schedule_end : null,
        capacity_per_slot:  form.has_custom_schedule ? form.capacity_per_slot : null,
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

  const handleApptStatus = async (id: number, newStatus: string) => {
    try {
      const res = await api.patch(`/diagnostics/appointments/${id}/update-status/`, { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: res.data.status } : a));
    } catch {
      toast.error("Не удалось обновить статус");
    }
  };

  const filtered = services.filter(s => catFilter === "all" || s.category === catFilter);
  const filteredAppts = appointments.filter(a => apptStatusFilter === "all" || a.status === apptStatusFilter);
  const totalActive = services.filter(s => s.is_active).length;
  const pendingAppts = appointments.filter(a => ["scheduled", "confirmed"].includes(a.status)).length;

  return (
    <div className="w-full space-y-5">

      {/* HEADER */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0c1445 0%, #1e2a5e 40%, #0ea5e9 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }} />
        </div>
        <div className="relative px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">Услуги клиники</h1>
            </div>
            <p className="text-sky-200/80 text-sm">Управление диагностическими услугами и записями пациентов</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center px-5 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-2xl font-black text-white">{totalActive}</p>
              <p className="text-sky-200 text-xs mt-0.5">Активных услуг</p>
            </div>
            <div className="text-center px-5 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-2xl font-black text-white">{pendingAppts}</p>
              <p className="text-sky-200 text-xs mt-0.5">Ожидают записи</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
        {([
          { id: "services", label: "Услуги", Icon: ClipboardList },
          { id: "appointments", label: "Записи пациентов", Icon: CalendarCheck },
        ] as const).map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${active ? "text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
              style={active ? { background: "linear-gradient(135deg, #0ea5e9, #6366f1)" } : {}}>
              <t.Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* SERVICES TAB */}
      {activeTab === "services" && (
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
                          <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <Pencil size={12} className="text-gray-400" />
                          </button>
                          <button onClick={() => handleDelete(s)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                      {s.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>}
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={10} /> {s.duration_minutes} мин</span>
                        {s.price && <span className="flex items-center gap-1 font-semibold text-emerald-600"><Banknote size={10} /> {formatPrice(s.price, clinicCurrency)}</span>}
                        {s.has_custom_schedule && (
                          <span className="flex items-center gap-1 font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                            <CalendarDays size={9} /> Расписание
                          </span>
                        )}
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
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {[{ id: "all", label: "Все" }, ...Object.entries(STATUS_MAP).map(([id, v]) => ({ id, label: v.label }))].map(f => (
              <button key={f.id} onClick={() => setApptStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${apptStatusFilter === f.id ? "bg-sky-500 text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                {f.label}
              </button>
            ))}
          </div>
          {apptLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
          ) : filteredAppts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Нет записей</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppts.map(a => {
                const st = STATUS_MAP[a.status] ?? STATUS_MAP.scheduled;
                const catInfo = CATEGORIES.find(c => c.id === a.category);
                const dt = new Date(a.appointment_time);
                return (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                        <User size={15} className="text-sky-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{a.patient_name}</p>
                        <p className="text-xs text-gray-500 truncate">{a.service_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                      {catInfo && (
                        <div className="flex items-center gap-1">
                          <catInfo.icon size={11} style={{ color: catInfo.color }} />
                          <span>{catInfo.label}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CalendarCheck size={11} />
                        <span>{dt.toLocaleDateString("ru-RU")} {dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${st.bg} ${st.color}`}>{st.label}</span>
                      <div className="relative group">
                        <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:bg-gray-100 transition-all">
                          <ChevronDown size={11} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-20 min-w-[160px] hidden group-hover:block">
                          {Object.entries(STATUS_MAP).map(([sid, sv]) => (
                            <button key={sid} onClick={() => handleApptStatus(a.id, sid)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                              <span className={`font-semibold ${sv.color}`}>{sv.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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

                {/* Schedule toggle */}
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, has_custom_schedule: !f.has_custom_schedule }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    form.has_custom_schedule ? 'border-sky-300 bg-sky-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                  <div className="flex items-center gap-2.5 text-left">
                    <CalendarDays size={16} className={form.has_custom_schedule ? 'text-sky-500' : 'text-gray-400'} />
                    <div>
                      <p className={`text-sm font-bold leading-tight ${form.has_custom_schedule ? 'text-sky-700' : 'text-gray-600'}`}>
                        Ограниченное расписание
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {form.has_custom_schedule ? 'Услуга доступна только в заданные дни и часы' : 'По умолчанию — рабочие часы клиники'}
                      </p>
                    </div>
                  </div>
                  {form.has_custom_schedule
                    ? <ToggleRight size={22} className="text-sky-500 flex-shrink-0" />
                    : <ToggleLeft  size={22} className="text-gray-300 flex-shrink-0" />}
                </button>

                {/* Schedule details — shown when toggle is ON */}
                {form.has_custom_schedule && (
                  <div className="space-y-3 px-4 py-4 rounded-xl border-2 border-sky-200 bg-sky-50/50">

                    {/* Days of week */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Дни работы</label>
                      <div className="flex gap-1.5">
                        {WEEKDAYS.map(day => {
                          const active = form.schedule_days.includes(day.id);
                          return (
                            <button key={day.id} type="button"
                              onClick={() => setForm(f => ({
                                ...f,
                                schedule_days: active
                                  ? f.schedule_days.filter(d => d !== day.id)
                                  : [...f.schedule_days, day.id],
                              }))}
                              className={`flex-1 py-2 rounded-xl text-[11px] font-bold border-2 transition-all ${
                                active ? 'text-white border-transparent shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-sky-300 hover:text-sky-500'
                              }`}
                              style={active ? { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' } : {}}>
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time range + capacity */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Начало</label>
                        <input type="time" value={form.schedule_start}
                          onChange={e => setForm(f => ({ ...f, schedule_start: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 transition-all bg-white" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Конец</label>
                        <input type="time" value={form.schedule_end}
                          onChange={e => setForm(f => ({ ...f, schedule_end: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 transition-all bg-white" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Лимит/слот</label>
                        <input type="number" min="1" max="99" value={form.capacity_per_slot}
                          onChange={e => setForm(f => ({ ...f, capacity_per_slot: Number(e.target.value) }))}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 transition-all bg-white" />
                      </div>
                    </div>
                  </div>
                )}
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
    </div>
  );
}

export default ServicesView;
