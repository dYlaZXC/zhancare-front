"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import {
  Search,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Plus,
  Trash2,
  Phone,
  Mail,
  Globe,
  Building2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 15;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClinicData {
  id: number;
  name: string;
  description?: string;
  address?: string;
  working_hours?: string;
  phones?: string[];
  emails?: string[];
  websites?: string[];
  whatsapp?: string[];
  telegram?: string[];
  instagram?: string;
  facebook?: string;
  is_private: boolean;
  created_at?: string;
}

type ClinicFormData = {
  name: string;
  description: string;
  address: string;
  working_hours: string;
  is_private: boolean;
  phones: string[];
  emails: string[];
  websites: string[];
  instagram: string;
  facebook: string;
};

const EMPTY_FORM: ClinicFormData = {
  name: "",
  description: "",
  address: "",
  working_hours: "",
  is_private: false,
  phones: [],
  emails: [],
  websites: [],
  instagram: "",
  facebook: "",
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

// ─── Dynamic List Field ───────────────────────────────────────────────────────

const DynamicListField = ({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) => {
  const addItem = () => onChange([...values, ""]);
  const removeItem = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const updateItem = (i: number, val: string) =>
    onChange(values.map((v, idx) => (idx === i ? val : v)));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-3 h-3" />
          Добавить
        </button>
      </div>
      {values.length === 0 ? (
        <button
          type="button"
          onClick={addItem}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + Добавить
        </button>
      ) : (
        <div className="space-y-2">
          {values.map((val, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={val}
                onChange={(e) => updateItem(i, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder={placeholder}
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Clinic Form Modal ────────────────────────────────────────────────────────

const ClinicFormModal = ({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: ClinicData | null;
  onClose: () => void;
  onSaved: (clinic: ClinicData) => void;
}) => {
  const [form, setForm] = useState<ClinicFormData>(() => {
    if (mode === "edit" && initial) {
      return {
        name: initial.name,
        description: initial.description || "",
        address: initial.address || "",
        working_hours: initial.working_hours || "",
        is_private: initial.is_private,
        phones: initial.phones || [],
        emails: initial.emails || [],
        websites: initial.websites || [],
        instagram: initial.instagram || "",
        facebook: initial.facebook || "",
      };
    }
    return { ...EMPTY_FORM };
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ClinicFormData>(k: K, v: ClinicFormData[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Название клиники обязательно");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        working_hours: form.working_hours.trim() || null,
        is_private: form.is_private,
        phones: form.phones.filter((p) => p.trim()),
        emails: form.emails.filter((e) => e.trim()),
        websites: form.websites.filter((w) => w.trim()),
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
      };

      let res;
      if (mode === "create") {
        res = await api.post("/clinics/", payload);
        toast.success("Клиника создана");
      } else {
        res = await api.patch(`/clinics/${initial!.id}/`, payload);
        toast.success("Данные обновлены");
      }
      onSaved(res.data.clinic);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { error?: string } }; message?: string };
      const msg =
        anyErr?.response?.data?.error || anyErr?.message || "Ошибка при сохранении";
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              {mode === "create" ? (
                <Building2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Edit className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === "create" ? "Новая клиника" : "Редактировать клинику"}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === "create"
                  ? "Создание новой клиники"
                  : initial?.name || ""}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="Клиника Здоровье"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
              placeholder="Краткое описание клиники..."
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="ул. Абая 10, Алматы"
            />
          </div>

          {/* Working hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Часы работы
            </label>
            <input
              type="text"
              value={form.working_hours}
              onChange={(e) => set("working_hours", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="Пн-Пт 09:00–18:00"
            />
          </div>

          {/* is_private toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип клиники
            </label>
            <PermToggle
              label="Частная клиника"
              value={form.is_private}
              onChange={(v) => set("is_private", v)}
            />
          </div>

          {/* Phones */}
          <DynamicListField
            label="Телефоны"
            values={form.phones}
            onChange={(v) => set("phones", v)}
            placeholder="+7 (700) 000-00-00"
          />

          {/* Emails */}
          <DynamicListField
            label="Email адреса"
            values={form.emails}
            onChange={(v) => set("emails", v)}
            placeholder="info@clinic.kz"
          />

          {/* Websites */}
          <DynamicListField
            label="Сайты"
            values={form.websites}
            onChange={(v) => set("websites", v)}
            placeholder="https://clinic.kz"
          />

          {/* Instagram + Facebook */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder="@clinic_kz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <input
                type="text"
                value={form.facebook}
                onChange={(e) => set("facebook", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder="facebook.com/clinic"
              />
            </div>
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
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "create" ? (
                <Building2 className="w-4 h-4" />
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

// ─── Clinic Row ───────────────────────────────────────────────────────────────

const ClinicRow = ({
  clinic,
  onEdit,
}: {
  clinic: ClinicData;
  onEdit: (c: ClinicData) => void;
}) => (
  <tr className="hover:bg-gray-50 transition-colors">
    {/* Клиника */}
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {clinic.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-gray-900 text-sm">{clinic.name}</div>
          {clinic.address && (
            <div className="text-xs text-gray-400 mt-0.5">{clinic.address}</div>
          )}
          {clinic.working_hours && (
            <div className="text-xs text-gray-400">{clinic.working_hours}</div>
          )}
        </div>
      </div>
    </td>

    {/* Контакты */}
    <td className="px-4 py-3">
      <div className="space-y-0.5">
        {clinic.phones && clinic.phones.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-gray-400" />
            {clinic.phones[0]}
            {clinic.phones.length > 1 && (
              <span className="text-gray-400">+{clinic.phones.length - 1}</span>
            )}
          </div>
        )}
        {clinic.emails && clinic.emails.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Mail className="w-3 h-3 text-gray-400" />
            {clinic.emails[0]}
          </div>
        )}
        {clinic.websites && clinic.websites.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Globe className="w-3 h-3 text-gray-400" />
            {clinic.websites[0]}
          </div>
        )}
        {(!clinic.phones?.length && !clinic.emails?.length && !clinic.websites?.length) && (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    </td>

    {/* Соцсети */}
    <td className="px-4 py-3">
      <div className="space-y-0.5">
        {clinic.instagram && (
          <div className="text-xs text-gray-600">
            <span className="text-pink-500 font-medium">IG</span> {clinic.instagram}
          </div>
        )}
        {clinic.whatsapp && clinic.whatsapp.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="text-green-500 font-medium">WA</span> {clinic.whatsapp[0]}
          </div>
        )}
        {!clinic.instagram && (!clinic.whatsapp?.length) && (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    </td>

    {/* Статус */}
    <td className="px-4 py-3">
      {clinic.is_private ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          <Lock className="w-3 h-3" />
          Частная
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <Unlock className="w-3 h-3" />
          Публичная
        </span>
      )}
    </td>

    {/* Действия */}
    <td className="px-4 py-3">
      <button
        onClick={() => onEdit(clinic)}
        className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
        title="Редактировать"
      >
        <Edit className="w-4 h-4" />
      </button>
    </td>
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClinicManagement() {
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<ClinicData | null>(null);

  // keep ref to avoid stale deps warning
  const _ref = useRef<null>(null);
  void _ref;

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/clinics/");
      const data = res.data;
      if (Array.isArray(data)) {
        setClinics(data);
      } else if (Array.isArray(data?.clinics)) {
        setClinics(data.clinics);
      } else if (Array.isArray(data?.results)) {
        setClinics(data.results);
      } else {
        setClinics([]);
      }
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { error?: string } }; message?: string };
      setError(anyErr?.response?.data?.error || "Не удалось загрузить клиники");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const handleSaved = (clinic: ClinicData) => {
    setClinics((prev) => {
      const exists = prev.find((c) => c.id === clinic.id);
      if (exists) return prev.map((c) => (c.id === clinic.id ? clinic : c));
      return [clinic, ...prev];
    });
    setShowCreate(false);
    setEditTarget(null);
  };

  // Reset to page 1 whenever search changes
  useEffect(() => { setPage(1); }, [search]);

  const filtered = clinics.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.address || "").toLowerCase().includes(q)
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
      value: clinics.length,
      icon: Building2,
      color: "#93c5fd",
      bg: "#1e3a6e",
      border: "#2d52a0",
    },
    {
      label: "Активных",
      value: clinics.filter((c) => !c.is_private).length,
      icon: CheckCircle,
      color: "#6ee7b7",
      bg: "#064e3b",
      border: "#0d6e52",
    },
    {
      label: "Частных",
      value: clinics.filter((c) => c.is_private).length,
      icon: Lock,
      color: "#fdba74",
      bg: "#7c2d12",
      border: "#9a3412",
    },
    {
      label: "С телефоном",
      value: clinics.filter((c) => c.phones && c.phones.length > 0).length,
      icon: Phone,
      color: "#c4b5fd",
      bg: "#3b1f6e",
      border: "#5b3aa0",
    },
  ];

  return (
    <div
      className="min-h-screen -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]"
      style={{ background: "#f8fafc" }}
    >
      {/* ── Gradient Hero Header ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{
              background: "radial-gradient(circle, #3772ff 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-2xl opacity-10"
            style={{
              background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 px-6 pt-8 pb-6 lg:px-10">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight">
                  Управление клиниками
                </h1>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Создание и редактирование клиник
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={fetchClinics}
                className="p-2.5 rounded-xl transition-all"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
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
                <Plus className="w-4 h-4" />
                Создать клинику
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
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white leading-none">
                    {stat.value}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или адресу..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── Table Area ────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2
              className="w-10 h-10 animate-spin"
              style={{ color: "#3772ff" }}
            />
            <span className="text-gray-500 font-medium">Загрузка клиник...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-700 font-medium">{error}</p>
            <button
              onClick={fetchClinics}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
              <Building2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">Клиники не найдены</p>
            <p className="text-sm text-gray-400">
              {search
                ? "Попробуйте изменить поисковый запрос"
                : "Создайте первую клинику"}
            </p>
            {!search && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-md"
                style={{
                  background: "linear-gradient(135deg, #29358f, #3772ff)",
                }}
              >
                <Plus className="w-4 h-4" />
                Создать клинику
              </motion.button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className="border-b-2 border-gray-100"
                    style={{
                      background:
                        "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
                    }}
                  >
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Клиника
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Контакты
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Соцсети
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
                  {paginated.map((clinic) => (
                    <ClinicRow
                      key={clinic.id}
                      clinic={clinic}
                      onEdit={setEditTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="px-5 py-3.5 border-t-2 border-gray-100 flex items-center justify-between gap-4"
              style={{ background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)" }}
            >
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
                          safePage === n ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"
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
                  <span
                    key={s.label}
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                  >
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
          <ClinicFormModal
            key="form"
            mode={showCreate ? "create" : "edit"}
            initial={editTarget}
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
