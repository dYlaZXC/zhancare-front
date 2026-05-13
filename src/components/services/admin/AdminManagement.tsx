"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import PhoneInput from "@/components/ui/PhoneInput";
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
} from "lucide-react";

const PAGE_SIZE = 15;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Clinic {
  id: number;
  name: string;
}

interface Admin {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  admin_type: "super" | "clinic" | "manager";
  clinic: { id: number; name: string } | null;
  can_manage_staff: boolean;
  can_manage_patients: boolean;
  can_view_reports: boolean;
  can_manage_settings: boolean;
  department: string;
  notes: string;
  created_at: string | null;
}

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  clinic_id: string;
  admin_type: "clinic" | "manager";
  can_manage_staff: boolean;
  can_manage_patients: boolean;
  can_view_reports: boolean;
  can_manage_settings: boolean;
  department: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  clinic_id: "",
  admin_type: "clinic",
  can_manage_staff: true,
  can_manage_patients: true,
  can_view_reports: true,
  can_manage_settings: false,
  department: "",
  notes: "",
};

const ADMIN_TYPE_LABELS: Record<string, string> = {
  super: "Супер-администратор",
  clinic: "Администратор клиники",
  manager: "Менеджер",
};

const ADMIN_TYPE_COLORS: Record<string, string> = {
  super: "bg-purple-100 text-purple-700",
  clinic: "bg-blue-100 text-blue-700",
  manager: "bg-green-100 text-green-700",
};

// ─── Permission Toggle ────────────────────────────────────────────────────────

const PermToggle = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
      value
        ? "bg-blue-50 border-blue-300 text-blue-700"
        : "bg-gray-50 border-gray-200 text-gray-500"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}`}
  >
    {value ? (
      <CheckCircle className="w-4 h-4 text-blue-500" />
    ) : (
      <XCircle className="w-4 h-4 text-gray-400" />
    )}
    {label}
  </button>
);

// ─── Filter Type Dropdown (includes "All" option) ────────────────────────────

const FilterTypeDropdown = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: "", label: "Все типы", color: "text-gray-700", bg: "" },
    { value: "clinic", label: "Администратор клиники", color: "text-blue-700", bg: "bg-blue-50" },
    { value: "manager", label: "Менеджер", color: "text-green-700", bg: "bg-green-50" },
  ];
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border-2 text-left text-sm transition-all bg-white ${
          open ? "border-blue-400 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className={`font-medium ${value ? selected.color : "text-gray-500"}`}>
          {selected.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 right-0 mt-1.5 z-[60] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  value === opt.value ? opt.bg || "bg-gray-50" : ""
                }`}
              >
                <span className={value === opt.value ? `font-semibold ${opt.color}` : "text-gray-700"}>
                  {opt.label}
                </span>
                {value === opt.value && (
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 ${opt.color || "text-gray-400"}`} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Searchable Clinic Dropdown ───────────────────────────────────────────────

const ClinicSearchDropdown = ({
  clinics,
  value,
  onChange,
  nullLabel = "— Без клиники —",
}: {
  clinics: Clinic[];
  value: string;
  onChange: (val: string) => void;
  nullLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = clinics.find((c) => String(c.id) === String(value));
  const searchTrimmed = search.trim();
  const filtered = searchTrimmed
    ? clinics.filter((c) => c.name.toLowerCase().includes(searchTrimmed.toLowerCase()))
    : clinics.slice(0, 60);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
          open
            ? "border-blue-400 bg-white ring-2 ring-blue-500/20"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Building2 className={`w-4 h-4 flex-shrink-0 ${selected ? "text-blue-500" : "text-gray-300"}`} />
          <span className={`truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
            {selected ? selected.name : nullLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="w-4 h-4 rounded-full hover:bg-red-100 flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5 text-gray-400 hover:text-red-500" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 right-0 mt-1.5 z-[60] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}
          >
            <div className="p-2.5 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск клиники..."
                  className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 px-0.5">
                {searchTrimmed
                  ? `${filtered.length} из ${clinics.length} клиник`
                  : `${filtered.length} из ${clinics.length} — введите для поиска`}
              </p>
            </div>
            <div className="overflow-y-auto max-h-52">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  !value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-3 h-3 text-gray-400" />
                </div>
                {nullLabel}
              </button>
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">Не найдено</div>
              ) : (
                filtered.map((clinic) => {
                  const isSelected = String(clinic.id) === String(value);
                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      onClick={() => { onChange(String(clinic.id)); setOpen(false); setSearch(""); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {clinic.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm truncate ${isSelected ? "text-blue-700 font-semibold" : "text-gray-700"}`}>
                        {clinic.name}
                      </span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-blue-500" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Searchable Type Dropdown ─────────────────────────────────────────────────

const TypeSearchDropdown = ({
  value,
  onChange,
}: {
  value: "clinic" | "manager";
  onChange: (val: "clinic" | "manager") => void;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options: { value: "clinic" | "manager"; label: string; color: string; bg: string }[] = [
    { value: "clinic", label: "Администратор клиники", color: "text-blue-700", bg: "bg-blue-50" },
    { value: "manager", label: "Менеджер", color: "text-green-700", bg: "bg-green-50" },
  ];
  const selected = options.find((o) => o.value === value)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
          open
            ? "border-blue-400 bg-white ring-2 ring-blue-500/20"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <span className={`font-medium ${selected.color}`}>{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 right-0 mt-1.5 z-[60] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  value === opt.value ? opt.bg : ""
                }`}
              >
                <span className={value === opt.value ? `font-semibold ${opt.color}` : "text-gray-700"}>
                  {opt.label}
                </span>
                {value === opt.value && <CheckCircle className={`w-4 h-4 ${opt.color}`} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Admin Form Modal ─────────────────────────────────────────────────────────

const AdminFormModal = ({
  mode,
  initial,
  clinics,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: Admin | null;
  clinics: Clinic[];
  onClose: () => void;
  onSaved: (admin: Admin) => void;
}) => {
  const [form, setForm] = useState<FormData>(() => {
    if (mode === "edit" && initial) {
      return {
        first_name: initial.first_name,
        last_name: initial.last_name,
        email: initial.email,
        password: "",
        phone: initial.phone || "",
        clinic_id: initial.clinic ? String(initial.clinic.id) : "",
        admin_type: initial.admin_type === "super" ? "clinic" : initial.admin_type,
        can_manage_staff: initial.can_manage_staff,
        can_manage_patients: initial.can_manage_patients,
        can_view_reports: initial.can_view_reports,
        can_manage_settings: initial.can_manage_settings,
        department: initial.department || "",
        notes: initial.notes || "",
      };
    }
    return { ...EMPTY_FORM };
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: keyof FormData, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) {
      toast.error("Имя и email обязательны");
      return;
    }
    if (mode === "create" && !form.password.trim()) {
      toast.error("Пароль обязателен");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        clinic_id: form.clinic_id ? Number(form.clinic_id) : null,
        admin_type: form.admin_type,
        can_manage_staff: form.can_manage_staff,
        can_manage_patients: form.can_manage_patients,
        can_view_reports: form.can_view_reports,
        can_manage_settings: form.can_manage_settings,
        department: form.department.trim(),
        notes: form.notes.trim(),
      };
      if (mode === "create") payload.password = form.password;
      if (mode === "edit" && form.password.trim()) payload.password = form.password.trim();

      let res;
      if (mode === "create") {
        res = await api.post("/admins/", payload);
        toast.success("Администратор создан");
      } else {
        res = await api.patch(`/admins/${initial!.id}/`, payload);
        toast.success("Данные обновлены");
      }
      onSaved(res.data.admin);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || "Ошибка при сохранении";
      toast.error(msg);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              {mode === "create" ? (
                <UserPlus className="w-5 h-5 text-blue-600" />
              ) : (
                <Edit className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === "create" ? "Новый администратор" : "Редактировать"}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === "create"
                  ? "Создание учётной записи"
                  : `${initial?.first_name} ${initial?.last_name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder="Алексей"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder="Иванов"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={mode === "edit"}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="admin@clinic.kz"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль{" "}
              {mode === "create" ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="text-gray-400 font-normal">(оставьте пустым, чтобы не менять)</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 pr-10"
                placeholder={mode === "create" ? "Минимум 8 символов" : "••••••••"}
                required={mode === "create"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <PhoneInput
              value={form.phone}
              onChange={(e164) => set("phone", e164)}
              defaultCountry="KZ"
              inputClassName="py-2.5"
            />
          </div>

          {/* Clinic + type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Клиника
              </label>
              <ClinicSearchDropdown
                clinics={clinics}
                value={form.clinic_id}
                onChange={(v) => set("clinic_id", v)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип
              </label>
              <TypeSearchDropdown
                value={form.admin_type}
                onChange={(v) => set("admin_type", v)}
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Права доступа
            </label>
            <div className="grid grid-cols-2 gap-2">
              <PermToggle
                label="Персонал"
                value={form.can_manage_staff}
                onChange={(v) => set("can_manage_staff", v)}
              />
              <PermToggle
                label="Пациенты"
                value={form.can_manage_patients}
                onChange={(v) => set("can_manage_patients", v)}
              />
              <PermToggle
                label="Отчёты"
                value={form.can_view_reports}
                onChange={(v) => set("can_view_reports", v)}
              />
              <PermToggle
                label="Настройки"
                value={form.can_manage_settings}
                onChange={(v) => set("can_manage_settings", v)}
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Отдел
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="Регистратура"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Примечания
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
              placeholder="Любые дополнительные сведения..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "create" ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {saving ? "Сохранение..." : mode === "create" ? "Создать" : "Сохранить"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Admin Row ────────────────────────────────────────────────────────────────

const AdminRow = ({
  admin,
  onEdit,
  onToggleActive,
  toggling,
}: {
  admin: Admin;
  onEdit: (a: Admin) => void;
  onToggleActive: (a: Admin) => void;
  toggling: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <tr className={`transition-colors ${admin.is_active ? "hover:bg-gray-50" : "bg-gray-50/60 hover:bg-gray-100/60"}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-all ${admin.is_active ? "bg-gradient-to-br from-blue-500 to-blue-700" : "bg-gray-300"}`}>
            {admin.first_name.charAt(0)}
          </div>
          <div>
            <div className={`font-medium text-sm ${admin.is_active ? "text-gray-900" : "text-gray-400"}`}>
              {admin.first_name} {admin.last_name}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Mail className="w-3 h-3" />
              {admin.email}
            </div>
            {admin.phone && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Phone className="w-3 h-3" />
                {admin.phone}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {admin.clinic ? (
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {admin.clinic.name}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
        {admin.department && (
          <div className="text-xs text-gray-400 mt-0.5">{admin.department}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            ADMIN_TYPE_COLORS[admin.admin_type] || "bg-gray-100 text-gray-600"
          }`}
        >
          {ADMIN_TYPE_LABELS[admin.admin_type] || admin.admin_type}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {admin.can_manage_staff && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">Персонал</span>
          )}
          {admin.can_manage_patients && (
            <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded">Пациенты</span>
          )}
          {admin.can_view_reports && (
            <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded">Отчёты</span>
          )}
          {admin.can_manage_settings && (
            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">Настройки</span>
          )}
        </div>
      </td>

      {/* Status dropdown */}
      <td className="px-4 py-3">
        {admin.admin_type === "super" ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            Активен
          </span>
        ) : (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => !toggling && setOpen((o) => !o)}
              disabled={toggling}
              className={`flex items-center gap-1.5 w-32 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                admin.is_active
                  ? "bg-green-50 border-green-200 text-green-700 hover:border-green-300"
                  : "bg-red-50 border-red-200 text-red-500 hover:border-red-300"
              }`}
            >
              {toggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : admin.is_active ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {admin.is_active ? "Активен" : "Неактивен"}
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 mt-1 z-30 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36"
                >
                  <button
                    onClick={() => { setOpen(false); if (!admin.is_active) onToggleActive(admin); }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors ${
                      admin.is_active
                        ? "bg-green-50 text-green-700 cursor-default"
                        : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Активен
                    {admin.is_active && <CheckCircle className="w-3 h-3 ml-auto text-green-500" />}
                  </button>
                  <button
                    onClick={() => { setOpen(false); if (admin.is_active) onToggleActive(admin); }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors ${
                      !admin.is_active
                        ? "bg-red-50 text-red-500 cursor-default"
                        : "text-gray-600 hover:bg-red-50 hover:text-red-500"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Неактивен
                    {!admin.is_active && <CheckCircle className="w-3 h-3 ml-auto text-red-400" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <button
          onClick={() => onEdit(admin)}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          title="Редактировать"
        >
          <Edit className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterClinic, setFilterClinic] = useState<string>("");

  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Admin | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterClinic) params.set("clinic_id", filterClinic);
      if (filterType) params.set("admin_type", filterType);
      const res = await api.get(`/admins/${params.toString() ? `?${params}` : ""}`);
      setAdmins(res.data.admins || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Не удалось загрузить администраторов");
    } finally {
      setLoading(false);
    }
  }, [filterClinic, filterType]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    api
      .get("/clinics/")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) setClinics(data);
        else if (Array.isArray(data?.clinics)) setClinics(data.clinics);
        else if (Array.isArray(data?.results)) setClinics(data.results);
      })
      .catch(() => {});
  }, []);

  const handleSaved = (admin: Admin) => {
    setAdmins((prev) => {
      const exists = prev.find((a) => a.id === admin.id);
      if (exists) return prev.map((a) => (a.id === admin.id ? admin : a));
      return [admin, ...prev];
    });
    setShowCreate(false);
    setEditTarget(null);
  };

  const handleToggleActive = async (admin: Admin) => {
    if (togglingId) return;
    setTogglingId(admin.id);
    try {
      const res = await api.delete(`/admins/${admin.id}/`);
      const updated: Admin = res.data.admin;
      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success(updated.is_active ? "Администратор активирован" : "Администратор деактивирован");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка изменения статуса");
    } finally {
      setTogglingId(null);
    }
  };

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, filterType, filterClinic]);

  const filtered = admins.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.clinic?.name || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (safePage > 3) pageNumbers.push("…");
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pageNumbers.push(i);
    if (safePage < totalPages - 2) pageNumbers.push("…");
    pageNumbers.push(totalPages);
  }

  const stats = [
    {
      label: "Всего",
      value: admins.length,
      icon: Users,
      color: "#93c5fd",
      bg: "#1e3a6e",
      border: "#2d52a0",
    },
    {
      label: "Активных",
      value: admins.filter((a) => a.is_active).length,
      icon: CheckCircle,
      color: "#6ee7b7",
      bg: "#064e3b",
      border: "#0d6e52",
    },
    {
      label: "Клиник",
      value: new Set(admins.filter((a) => a.clinic).map((a) => a.clinic!.id)).size,
      icon: Building2,
      color: "#c4b5fd",
      bg: "#3b1f6e",
      border: "#5b3aa0",
    },
    {
      label: "Менеджеров",
      value: admins.filter((a) => a.admin_type === "manager").length,
      icon: Lock,
      color: "#fcd34d",
      bg: "#78350f",
      border: "#a35c15",
    },
  ];

  return (
    <div className="min-h-screen -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]" style={{ background: "#f8fafc" }}>

      {/* ── Gradient Hero Header ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20"
               style={{ background: "radial-gradient(circle, #3772ff 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-2xl opacity-10"
               style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 px-6 pt-8 pb-6 lg:px-10">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                   style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight">
                  Администраторы клиник
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Управление учётными записями и правами доступа
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={fetchAdmins}
                className="p-2.5 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                title="Обновить"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg transition-all"
                style={{ background: "rgba(255,255,255,0.95)", color: "#1e263e" }}
              >
                <UserPlus className="w-4 h-4" />
                Создать администратора
              </motion.button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: "rgba(0,0,0,0.2)" }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white leading-none">{stat.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, email, клинике..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Type filter */}
          <div className="min-w-[200px]">
            <FilterTypeDropdown value={filterType} onChange={setFilterType} />
          </div>

          {/* Clinic filter */}
          {clinics.length > 0 && (
            <div className="min-w-[220px]">
              <ClinicSearchDropdown
                clinics={clinics}
                value={filterClinic}
                onChange={setFilterClinic}
                nullLabel="Все клиники"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Table Area ────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#3772ff" }} />
            <span className="text-gray-500 font-medium">Загрузка администраторов...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-700 font-medium">{error}</p>
            <button
              onClick={fetchAdmins}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">Администраторы не найдены</p>
            <p className="text-sm text-gray-400">
              {search ? "Попробуйте изменить поисковый запрос" : "Создайте первого администратора"}
            </p>
            {!search && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-md"
                style={{ background: "linear-gradient(135deg, #29358f, #3772ff)" }}
              >
                <UserPlus className="w-4 h-4" />
                Создать администратора
              </motion.button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100"
                      style={{ background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Администратор
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Клиника
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Тип
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Права
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Статус
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((admin) => (
                    <AdminRow
                      key={admin.id}
                      admin={admin}
                      onEdit={setEditTarget}
                      onToggleActive={handleToggleActive}
                      toggling={togglingId === admin.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3.5 border-t-2 border-gray-100 flex items-center justify-between gap-4"
                 style={{ background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)" }}>
              <p className="text-xs text-gray-400 font-medium shrink-0">
                {filtered.length === 0
                  ? "0 записей"
                  : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} из ${filtered.length}`}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {pageNumbers.map((n, i) =>
                    typeof n === "string" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400 select-none">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          safePage === n ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex gap-1 shrink-0">
                {stats.slice(0, 3).map((s) => (
                  <span key={s.label} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {s.label}: {s.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showCreate || editTarget) && (
          <AdminFormModal
            key="form"
            mode={showCreate ? "create" : "edit"}
            initial={editTarget}
            clinics={clinics}
            onClose={() => {
              setShowCreate(false);
              setEditTarget(null);
            }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
