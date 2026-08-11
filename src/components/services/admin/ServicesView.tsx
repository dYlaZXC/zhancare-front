"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { CURRENCIES, getCurrencySymbol, formatPrice } from "@/utils/currency";
import {
  Plus, Pencil, Trash2, Loader2, X, CheckCircle2, Save,
  FlaskConical, ScanLine, Heart, Brain, Bone, Eye, Baby, Microscope,
  ClipboardList, Clock, Banknote, ToggleLeft, ToggleRight,
  CalendarDays, Search, Stethoscope, ChevronDown, Tag, Settings,
  ChevronLeft, ChevronRight, RotateCcw, Users,
  type LucideIcon,
} from "lucide-react";

const TRANSLIT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};
function toSlug(name: string): string {
  return name.toLowerCase()
    .split('').map(c => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

// Map icon slug stored in DB → Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  'flask-conical': FlaskConical,
  'scan-line':     ScanLine,
  'heart':         Heart,
  'brain':         Brain,
  'bone':          Bone,
  'eye':           Eye,
  'baby':          Baby,
  'microscope':    Microscope,
  'clipboard-list': ClipboardList,
  'stethoscope':   Stethoscope,
  'tag':           Tag,
};

const ICON_OPTIONS = [
  { value: 'flask-conical',  label: 'Колба' },
  { value: 'scan-line',      label: 'Сканер' },
  { value: 'heart',          label: 'Сердце' },
  { value: 'brain',          label: 'Мозг' },
  { value: 'bone',           label: 'Кость' },
  { value: 'eye',            label: 'Глаз' },
  { value: 'baby',           label: 'Ребёнок' },
  { value: 'microscope',     label: 'Микроскоп' },
  { value: 'clipboard-list', label: 'Список' },
  { value: 'stethoscope',    label: 'Стетоскоп' },
  { value: 'tag',            label: 'Тег' },
];

function getCategoryIcon(iconSlug: string): LucideIcon {
  return ICON_MAP[iconSlug] ?? ClipboardList;
}

interface ServiceCategory {
  id: number;
  slug: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  is_active: boolean;
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

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string | null;
  role: string;
}

interface DayAvailability {
  id: number | null;
  date: string; // YYYY-MM-DD
  weekday: number; // 0=Mon..6=Sun
  is_day_off: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string;
  source: 'availability' | 'template' | 'empty';
}

function getMonday(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

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
  doctor_id?: number | null;
  doctor_name?: string | null;
}

const EMPTY_FORM = {
  name: "", description: "", price: "", duration_minutes: 30, category: "",
  currency: "", doctor_id: null as number | null,
  capacity_per_slot: null as number | null,
};

const EMPTY_CATEGORY_FORM = {
  slug: "", name: "", icon: "clipboard-list", color: "#6366f1", order: 0, is_active: true,
};

export function ServicesView({ user }: { user: any }) {
  const [catFilter, setCatFilter] = useState("all");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [showModal, setShowModal] = useState(false);
  const [modalMouseDownTarget, setModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [scheduleService, setScheduleService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [doctorDropdown, setDoctorDropdown] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalMouseDownTarget, setCategoryModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [savingCategory, setSavingCategory] = useState(false);
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);
  const [iconDropdownRect, setIconDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const iconBtnRef = useRef<HTMLButtonElement>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catDropdownRect, setCatDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const catBtnRef = useRef<HTMLButtonElement>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/diagnostics/categories/");
      const list: ServiceCategory[] = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setCategories(list);
      // Default form category to first available slug
      setForm(f => ({ ...f, category: f.category || list[0]?.slug || "" }));
    } catch {
      // non-fatal: category picker will just be empty
    }
  }, []);

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

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchServices(); }, [fetchServices]);

  useEffect(() => {
    api.get('/staff/').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setStaff(list.filter((m: StaffMember) => m.role === 'doctor'));
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?.slug ?? "" });
    setDoctorDropdown(false);
    setShowModal(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name, description: s.description || "", price: s.price || "",
      duration_minutes: s.duration_minutes, category: s.category,
      currency: s.currency || "", doctor_id: s.doctor_id ?? null,
      capacity_per_slot: s.capacity_per_slot ?? null,
    });
    setDoctorDropdown(false);
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
        doctor_id: form.doctor_id ?? null,
        capacity_per_slot: form.capacity_per_slot,
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

  // Category CRUD
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ ...EMPTY_CATEGORY_FORM, order: categories.length });
    setShowCategoryModal(true);
  };
  const openEditCategory = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setCategoryForm({ slug: cat.slug, name: cat.name, icon: cat.icon, color: cat.color, order: cat.order, is_active: cat.is_active });
    setShowCategoryModal(true);
  };
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) { toast.error("Введите название категории"); return; }
    if (!categoryForm.slug.trim()) { setCategoryForm(f => ({ ...f, slug: toSlug(f.name) })); }
    setSavingCategory(true);
    try {
      if (editingCategory) {
        const res = await api.patch(`/diagnostics/categories/${editingCategory.id}/`, categoryForm);
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? res.data : c));
        toast.success("Категория обновлена");
      } else {
        const res = await api.post("/diagnostics/categories/", categoryForm);
        setCategories(prev => [...prev, res.data].sort((a, b) => a.order - b.order));
        toast.success("Категория добавлена");
      }
      setShowCategoryModal(false);
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
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      if (catFilter === cat.slug) setCatFilter("all");
      toast.success("Категория удалена");
    } catch {
      toast.error("Не удалось удалить категорию");
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
          <div className="flex items-center gap-2">
            {/* Category filter dropdown */}
            <div className="relative flex-shrink-0" ref={filterDropdownRef}>
              {(() => {
                const selectedCat = catFilter === "all" ? null : categories.find(c => c.slug === catFilter);
                const SelIcon = selectedCat ? getCategoryIcon(selectedCat.icon) : ClipboardList;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setFilterDropdownOpen(v => !v)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all min-w-[140px]"
                      style={selectedCat ? { borderColor: selectedCat.color + '60', background: selectedCat.color + '10', color: selectedCat.color } : {}}
                    >
                      <SelIcon size={12} />
                      <span className="flex-1 text-left">{selectedCat ? selectedCat.name : 'Все категории'}</span>
                      <ChevronDown size={12} className={`transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {filterDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[180px]"
                        onMouseLeave={() => setFilterDropdownOpen(false)}>
                        <button
                          onClick={() => { setCatFilter("all"); setFilterDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${catFilter === "all" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          <ClipboardList size={12} />
                          Все категории
                        </button>
                        {categories.map(cat => {
                          const Icon = getCategoryIcon(cat.icon);
                          const active = catFilter === cat.slug;
                          return (
                            <button key={cat.id}
                              onClick={() => { setCatFilter(cat.slug); setFilterDropdownOpen(false); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${active ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                              style={active ? { background: cat.color } : {}}
                            >
                              <Icon size={12} />
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex gap-2 ml-auto">
              <button onClick={openCreateCategory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                title="Управление категориями">
                <Settings size={13} />
                Категории
              </button>
              <button onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                <Plus size={15} /> Добавить услугу
              </button>
            </div>
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
            <div className="space-y-3">
              {filtered.map(s => {
                const catInfo = categories.find(c => c.slug === s.category);
                const Icon = getCategoryIcon(catInfo?.icon ?? "clipboard-list");
                const catColor = catInfo?.color ?? "#6366f1";
                const hasSchedule = !!(s.schedules && s.schedules.some(sc => sc.is_active));
                return (
                  <motion.div key={s.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all px-5 py-4 ${!s.is_active ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-4">

                      {/* Category icon — mirrors the avatar in personnel cards */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${catColor}cc, ${catColor})` }}>
                        <Icon size={20} className="text-white" />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        {/* Name + badges row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base font-bold text-gray-900">{s.name}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: catColor }}>
                            {s.category_label}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            s.is_active
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-gray-500 bg-gray-100 border-gray-200'
                          }`}>
                            {s.is_active ? '✓ Активна' : 'Неактивна'}
                          </span>
                          {!hasSchedule && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                              Нет расписания
                            </span>
                          )}
                        </div>

                        {/* Doctor — mirrors specialty line in personnel */}
                        {s.doctor_name && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-600 mb-1.5">
                            <Stethoscope size={11} />
                            <span className="font-semibold">{s.doctor_name}</span>
                          </div>
                        )}

                        {/* Meta row — mirrors email/phone/date in personnel */}
                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {s.duration_minutes} мин
                          </span>
                          {s.price && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                              <Banknote size={11} /> {formatPrice(s.price, clinicCurrency)}
                            </span>
                          )}
                          {s.capacity_per_slot && (
                            <span className="flex items-center gap-1">
                              <Users size={11} /> {s.capacity_per_slot} на слот
                            </span>
                          )}
                          {s.description && (
                            <span className="hidden md:block italic truncate max-w-[220px]">{s.description}</span>
                          )}
                        </div>
                      </div>

                      {/* Right: status toggle + action buttons — mirrors "В сети" + icons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleToggle(s)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            s.is_active
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              : 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {s.is_active ? 'Активна' : 'Выкл'}
                        </button>
                        <button onClick={() => openEdit(s)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" title="Редактировать">
                          <Pencil size={14} className="text-gray-400" />
                        </button>
                        <button onClick={() => setScheduleService(s)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-sky-50 transition-colors" title="Расписание">
                          <CalendarDays size={14} className="text-gray-400" />
                        </button>
                        <button onClick={() => handleDelete(s)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors" title="Удалить">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
      </div>

      {/* ADD / EDIT SERVICE MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onMouseDown={e => setModalMouseDownTarget(e.target)}
            onClick={e => {
              if (e.target === e.currentTarget && modalMouseDownTarget === e.currentTarget) setShowModal(false);
              setModalMouseDownTarget(null);
            }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 rounded-t-3xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)" }}>
                <div>
                  <h3 className="text-base font-black text-gray-800">{editing ? "Редактировать услугу" : "Добавить услугу"}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Диагностическая услуга клиники</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Категория</label>
                  {(() => {
                    const selected = categories.find(c => c.slug === form.category);
                    const SelIcon = selected ? getCategoryIcon(selected.icon) : ClipboardList;
                    return (
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
                    );
                  })()}
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
                    {editing ? 'Услуга привязана к этой клинике' : 'Услуга будет автоматически привязана к вашей клинике'}
                  </p>
                </div>

              </div>
              <div className="px-6 pb-5 pt-2 flex gap-3 rounded-b-3xl bg-white">
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

      {/* CATEGORY MANAGEMENT MODAL */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onMouseDown={e => setCategoryModalMouseDownTarget(e.target)}
            onClick={e => {
              if (e.target === e.currentTarget && categoryModalMouseDownTarget === e.currentTarget) setShowCategoryModal(false);
              setCategoryModalMouseDownTarget(null);
            }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                <div>
                  <h3 className="text-base font-black text-gray-800">Категории услуг</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Добавляйте и редактируйте категории</p>
                </div>
                <button onClick={() => setShowCategoryModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
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

const MONTHS_SHORT_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DAYS_FULL_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const DAYS_SHORT_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function ServiceScheduleModal({
  service, onClose, onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (updated: Service) => void;
}) {
  const [tab, setTab] = useState<'dates' | 'template'>('dates');
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  // --- Template tab ---
  const [weeklySchedule, setWeeklySchedule] = useState(DEFAULT_WEEKLY_SCHEDULE);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // --- Dates tab ---
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [localDays, setLocalDays] = useState<DayAvailability[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const [savingWeek, setSavingWeek] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!service) return;
    setWeeklySchedule(schedulesToWeeklyMap(service.schedules));
    setWeekStart(getMonday(new Date()));
    setTab('dates');
  }, [service]);

  useEffect(() => {
    if (!service || tab !== 'dates') return;
    let cancelled = false;
    const ws = weekStart.toLocaleDateString('sv-SE');
    setLoadingDates(true);
    api.get(`/diagnostics/services/${service.id}/availability/?week_start=${ws}`)
      .then(res => { if (!cancelled) setLocalDays(res.data); })
      .catch(() => { if (!cancelled) toast.error('Не удалось загрузить расписание'); })
      .finally(() => { if (!cancelled) setLoadingDates(false); });
    return () => { cancelled = true; };
  }, [service?.id, weekStart, tab]);

  if (!service) return null;

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const res = await api.patch(`/diagnostics/services/${service.id}/`, {
        schedules: weeklyMapToSchedules(weeklySchedule),
      });
      toast.success('Шаблон сохранён');
      onSaved(res.data);
    } catch {
      toast.error('Не удалось сохранить шаблон');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSaveDay = async (day: DayAvailability) => {
    setSavingDay(day.date);
    try {
      const res = await api.post(`/diagnostics/services/${service.id}/availability/`, {
        date: day.date,
        is_day_off: day.is_day_off,
        start_time: day.is_day_off ? null : (day.start_time ?? '09:00'),
        end_time:   day.is_day_off ? null : (day.end_time   ?? '18:00'),
        note: '',
      });
      setLocalDays(prev => prev.map(d =>
        d.date === day.date ? { ...res.data, source: 'availability' as const } : d
      ));
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSavingDay(null);
    }
  };

  const handleSaveWeek = async () => {
    setSavingWeek(true);
    try {
      for (const day of localDays) {
        await api.post(`/diagnostics/services/${service.id}/availability/`, {
          date: day.date,
          is_day_off: day.is_day_off,
          start_time: day.is_day_off ? null : (day.start_time ?? '09:00'),
          end_time:   day.is_day_off ? null : (day.end_time   ?? '18:00'),
          note: '',
        });
      }
      const ws = weekStart.toLocaleDateString('sv-SE');
      const res = await api.get(`/diagnostics/services/${service.id}/availability/?week_start=${ws}`);
      setLocalDays(res.data);
      toast.success('Расписание недели сохранено');
    } catch {
      toast.error('Не удалось сохранить неделю');
    } finally {
      setSavingWeek(false);
    }
  };

  const handleCopyWeek = async () => {
    setCopying(true);
    try {
      const from = weekStart.toLocaleDateString('sv-SE');
      const nextWeek = new Date(weekStart);
      nextWeek.setDate(weekStart.getDate() + 7);
      const to = nextWeek.toLocaleDateString('sv-SE');
      const res = await api.post(`/diagnostics/services/${service.id}/availability/copy-week/`, { from, to });
      toast.success(`Скопировано ${res.data.copied} дней на следующую неделю`);
    } catch {
      toast.error('Не удалось скопировать');
    } finally {
      setCopying(false);
    }
  };

  const handleResetDay = async (day: DayAvailability) => {
    if (!day.id) return;
    try {
      await api.delete(`/diagnostics/services/${service.id}/availability/${day.id}/`);
      const ws = weekStart.toLocaleDateString('sv-SE');
      const res = await api.get(`/diagnostics/services/${service.id}/availability/?week_start=${ws}`);
      setLocalDays(res.data);
    } catch {
      toast.error('Не удалось сбросить');
    }
  };

  const goWeek = (delta: number) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta * 7);
      return next;
    });
  };

  const updateDay = (date: string, changes: Partial<DayAvailability>) => {
    setLocalDays(prev => prev.map(d => d.date === date ? { ...d, ...changes } : d));
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const fmtD = (d: Date) => `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
  const weekLabel = `${fmtD(weekStart)} — ${fmtD(weekEnd)}`;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isCurrentWeek = weekStart.toDateString() === getMonday(new Date()).toDateString();

  const TABS = [
    { key: 'dates' as const,    label: 'По датам',    Icon: CalendarDays },
    { key: 'template' as const, label: 'Постоянное',  Icon: RotateCcw },
  ];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onMouseDown={e => setMouseDownTarget(e.target)}
        onClick={e => {
          if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) onClose();
          setMouseDownTarget(null);
        }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[610px] max-h-[90vh] flex flex-col">

          {/* ── Header ── */}
          <div className="px-7 py-5 flex items-center gap-4 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3772FF, #6366f1)' }}>
              <CalendarDays size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-gray-900">Расписание</h3>
              <p className="text-xs text-gray-400 truncate">{service.name}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* ── Underline tabs ── */}
          <div className="border-b border-gray-100 flex-shrink-0">
            <div className="flex px-7">
              {TABS.map(({ key, label, Icon }) => (
                <button key={key} type="button" onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 py-3 mr-7 text-sm font-bold border-b-2 transition-all ${
                    tab === key
                      ? 'border-[#3772FF] text-[#3772FF]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── DATES TAB ── */}
          {tab === 'dates' && (
            <div className="flex-1 overflow-y-auto">
              {/* Week navigator */}
              <div className="px-6 py-4 flex items-center gap-3">
                <button type="button" onClick={() => goWeek(-1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
                  <ChevronLeft size={14} className="text-gray-600" />
                </button>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <CalendarDays size={14} className="text-[#3772FF] flex-shrink-0" />
                  <span className="text-sm font-bold text-gray-800">{weekLabel}</span>
                  {isCurrentWeek && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Текущая
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => goWeek(1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
                  <ChevronRight size={14} className="text-gray-600" />
                </button>
              </div>

              {loadingDates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#3772FF]" />
                </div>
              ) : (
                <div className="px-5 pb-5 space-y-2">
                  {localDays.map(day => {
                    const isToday = day.date === todayStr;
                    const isSavingThis = savingDay === day.date;
                    const hasEntry = day.source === 'availability';
                    const working = !day.is_day_off;
                    const dayNum = parseInt(day.date.slice(8), 10);
                    const monthIdx = parseInt(day.date.slice(5, 7), 10) - 1;

                    return (
                      <div key={day.date}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                          working
                            ? hasEntry
                              ? 'border-[#3772FF]/25 bg-blue-50/50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50/60'
                        }`}>

                        {/* Day pill */}
                        <button type="button"
                          onClick={() => updateDay(day.date, {
                            is_day_off: !day.is_day_off,
                            start_time: day.start_time ?? '09:00',
                            end_time:   day.end_time   ?? '18:00',
                          })}
                          title={working ? 'Отметить как выходной' : 'Отметить как рабочий'}
                          className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-all ${
                            working ? 'text-white shadow-md' : 'bg-gray-150 text-gray-400 border border-gray-200'
                          }`}
                          style={working ? { background: 'linear-gradient(135deg, #3772FF, #6366f1)' } : { background: '#f3f4f6' }}>
                          <span className="text-[10px] font-bold leading-none">{DAYS_SHORT_RU[day.weekday]}</span>
                          <span className="text-[17px] font-black leading-tight">{dayNum}</span>
                        </button>

                        {/* Info block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-sm font-bold ${working ? 'text-gray-800' : 'text-gray-400'}`}>
                              {DAYS_FULL_RU[day.weekday]}
                            </span>
                            <span className={`text-xs ${working ? 'text-gray-400' : 'text-gray-300'}`}>
                              {dayNum} {MONTHS_SHORT_RU[monthIdx]}.
                            </span>
                            {isToday && (
                              <span className="text-[9px] font-bold bg-[#3772FF]/10 text-[#3772FF] px-1.5 py-0.5 rounded-full">
                                Сегодня
                              </span>
                            )}
                          </div>

                          {working ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <input type="time" value={day.start_time ?? '09:00'}
                                onChange={e => updateDay(day.date, { start_time: e.target.value })}
                                step="900"
                                className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                              <span className="text-gray-400 text-xs font-bold">—</span>
                              <input type="time" value={day.end_time ?? '18:00'}
                                onChange={e => updateDay(day.date, { end_time: e.target.value })}
                                step="900"
                                className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                              {hasEntry && (
                                <span className="text-[10px] text-[#3772FF] font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#3772FF] inline-block flex-shrink-0" />
                                  Сохранено
                                </span>
                              )}
                              {!hasEntry && day.source === 'template' && (
                                <span className="text-[10px] text-gray-400 italic">из шаблона</span>
                              )}
                              {service.capacity_per_slot && (
                                <span className="text-[10px] text-[#3772FF]/60 font-semibold flex items-center gap-1">
                                  <Users size={10} /> {service.capacity_per_slot}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400">
                              {day.source === 'template' ? 'шаблон — выключен' : 'выходной'}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button type="button" onClick={() => handleSaveDay(day)} disabled={!!savingDay || savingWeek}
                            title="Сохранить день"
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 ${
                              isSavingThis ? 'bg-[#3772FF]/10' : 'bg-[#3772FF] hover:bg-[#2a5ce0] shadow-sm'
                            }`}>
                            {isSavingThis
                              ? <Loader2 size={13} className="animate-spin text-[#3772FF]" />
                              : <CheckCircle2 size={14} className="text-white" />
                            }
                          </button>
                          {hasEntry && (
                            <button type="button" onClick={() => handleResetDay(day)}
                              title="Сбросить к шаблону"
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                              <RotateCcw size={12} className="text-gray-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TEMPLATE TAB ── */}
          {tab === 'template' && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {service.capacity_per_slot && (
                <div className="flex items-center gap-2 px-1 pb-2 text-xs text-[#3772FF]/70 font-semibold">
                  <Users size={12} />
                  Лимит: {service.capacity_per_slot} {service.capacity_per_slot === 1 ? 'пациент' : service.capacity_per_slot < 5 ? 'пациента' : 'пациентов'} на слот
                </div>
              )}
              {WEEKDAYS.map(day => {
                const daySchedule = weeklySchedule[day.value] ?? DEFAULT_WEEKLY_SCHEDULE[day.value];
                const enabled = daySchedule.enabled;
                return (
                  <div key={day.value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                      enabled ? 'border-[#3772FF]/25 bg-blue-50/50' : 'border-gray-100 bg-gray-50/60'
                    }`}>
                    <button type="button"
                      onClick={() => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, enabled: !enabled } }))}
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-all text-xs font-bold ${
                        enabled ? 'text-white shadow-md' : 'text-gray-400'
                      }`}
                      style={enabled ? { background: 'linear-gradient(135deg, #3772FF, #6366f1)' } : { background: '#f3f4f6' }}>
                      {day.labelShort}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold mb-1 ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>{day.labelRu}</p>
                      {enabled ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="time" value={daySchedule.start}
                            onChange={e => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, start: e.target.value } }))}
                            step="900"
                            className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                          <span className="text-gray-400 text-xs font-bold">—</span>
                          <input type="time" value={daySchedule.end}
                            onChange={e => setWeeklySchedule(ws => ({ ...ws, [day.value]: { ...daySchedule, end: e.target.value } }))}
                            step="900"
                            className="w-[90px] px-2 py-1 rounded-lg border border-gray-200 focus:border-[#3772FF] outline-none text-xs bg-white font-medium" />
                          {service.capacity_per_slot && (
                            <span className="text-[10px] text-[#3772FF]/60 font-semibold flex items-center gap-1">
                              <Users size={10} /> {service.capacity_per_slot}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400">выходной</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2.5 flex-shrink-0">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              Закрыть
            </button>

            {tab === 'dates' && (
              <>
                <button onClick={handleCopyWeek} disabled={copying}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all">
                  {copying ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  Копировать
                </button>
                <button onClick={handleSaveWeek} disabled={savingWeek || loadingDates}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #3772FF, #6366f1)' }}>
                  {savingWeek ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
                  Сохранить
                </button>
              </>
            )}

            {tab === 'template' && (
              <button onClick={handleSaveTemplate} disabled={savingTemplate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #3772FF, #6366f1)' }}>
                {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Сохранить шаблон
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ServicesView;
