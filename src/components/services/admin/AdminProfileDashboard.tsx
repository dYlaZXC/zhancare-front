"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Building2,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Shield,
  Camera,
  Trash2,
  CheckCircle2,
  Sparkles,
  Lock,
  Clock,
  AlignLeft,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import BannerPicker, { useBanner } from "@/components/profile/BannerPicker";
import PhoneInput from "@/components/ui/PhoneInput";
import { CURRENCIES } from "@/utils/currency";
import { phoneEntryToString } from "@/utils/phoneFormat";
import { useClinicCurrency } from "@/context/BrandContext";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://127.0.0.1:8000';
function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND}${url}`;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string | null;
  role?: string;
  roles?: string[];
}

interface AdminProfileDashboardProps {
  user: User;
}

interface ClinicInfo {
  id: number;
  name: string;
  description?: string;
  address: string;
  city?: string;
  working_hours?: string;
  phones?: Array<{ number: string } | string> | null;
  rating: number;
  logo?: string | null;
  currency?: string | null;
}
interface ClinicStats {
  is_super_admin: boolean;
  clinic_info?: ClinicInfo | null;
}

const InputField = ({
  label, value, onChange, icon: Icon, placeholder, type = "text"
}: {
  label: string; value: string; onChange: (v: string) => void;
  icon: React.ElementType; placeholder?: string; type?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10" />
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm hover:border-gray-300"
      />
    </div>
  </div>
);

export default function AdminProfileDashboard({ user }: AdminProfileDashboardProps) {
  const { updateUser, user: authUser } = useAuth();
  const { setClinicCurrency } = useClinicCurrency();
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [personalForm, setPersonalForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone || "",
  });
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savedPersonal, setSavedPersonal] = useState(false);

  const [clinicForm, setClinicForm] = useState({ name: "", description: "", address: "", working_hours: "", phone: "", city_name: "", currency: "KZT" });
  const [savingClinic, setSavingClinic] = useState(false);
  const [savedClinic, setSavedClinic] = useState(false);
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(resolveAvatarUrl(user.avatar));
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarViewOpen, setAvatarViewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarMenuOpen]);

  useEffect(() => { fetchClinicStats(); }, []);

  const fetchClinicStats = async () => {
    try {
      const res = await api.get("/clinic-stats/");
      setStats(res.data);
      if (res.data.clinic_info) {
        const ci = res.data.clinic_info;
        const firstPhone = Array.isArray(ci.phones) && ci.phones.length > 0
          ? phoneEntryToString(ci.phones[0])
          : '';
        setClinicForm({
          name: ci.name || "",
          description: ci.description || "",
          address: ci.address || "",
          working_hours: ci.working_hours || "",
          phone: firstPhone,
          city_name: ci.city || "",
          currency: ci.currency || "KZT",
        });
        setClinicLogo(ci.logo || null);
      }
    } catch {
      setStats({ is_super_admin: false, clinic_info: { id: 1, name: "Демо Клиника", description: "", address: "Алматы, ул. Демонстрационная 123", city: "Алматы", working_hours: "", phones: [], rating: 4.8 } });
    }
  };

  const cleanPayload = (obj: Record<string, string>) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]));

  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    try {
      await api.patch("/user-profile/profile/", cleanPayload(personalForm));
      toast.success("Личные данные обновлены");
      setSavedPersonal(true);
      setTimeout(() => setSavedPersonal(false), 2500);
    } catch (e: any) {
      const detail = e?.response?.data;
      toast.error(detail ? JSON.stringify(detail) : "Не удалось сохранить данные");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveClinic = async () => {
    if (!stats?.clinic_info?.id) return;
    setSavingClinic(true);
    try {
      await api.patch(`/clinic-update/${stats.clinic_info.id}/`, clinicForm);
      setClinicCurrency(clinicForm.currency);
      toast.success("Данные клиники обновлены");
      setSavedClinic(true);
      setTimeout(() => setSavedClinic(false), 2500);
    } catch {
      toast.error("Не удалось сохранить данные клиники");
    } finally {
      setSavingClinic(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл слишком большой. Максимум 5 МБ."); return; }
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post("/user-profile/avatar/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setAvatarPreview(resolveAvatarUrl(res.data.avatar));
      updateUser({ avatar: res.data.avatar });
      toast.success("Фото обновлено");
    } catch {
      toast.error("Не удалось загрузить фото");
      setAvatarPreview(resolveAvatarUrl(user.avatar));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    setDeleting(true);
    try {
      await api.delete("/user-profile/avatar/");
      setAvatarPreview(null);
      updateUser({ avatar: null });
      toast.success("Фото удалено");
    } catch {
      toast.error("Не удалось удалить фото");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл слишком большой. Максимум 5 МБ."); return; }
    if (!stats?.clinic_info?.id) return;
    setClinicLogo(URL.createObjectURL(file));
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await api.post(`/clinic-logo/${stats.clinic_info.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setClinicLogo(res.data.logo);
      toast.success("Логотип обновлён");
    } catch {
      toast.error("Не удалось загрузить логотип");
      setClinicLogo(null);
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  };

  const handleDeleteLogo = async () => {
    if (!stats?.clinic_info?.id) return;
    setUploadingLogo(true);
    try {
      await api.delete(`/clinic-logo/${stats.clinic_info.id}/`);
      setClinicLogo(null);
      toast.success("Логотип удалён");
    } catch {
      toast.error("Не удалось удалить логотип");
    } finally {
      setUploadingLogo(false);
    }
  };

  const initials = `${personalForm.first_name?.[0] ?? ""}${personalForm.last_name?.[0] ?? ""}`.toUpperCase();
  const { banner, saveBanner } = useBanner(authUser?.id);

  return (
    <div className="w-full space-y-6">

      {/* ── HERO CARD ─────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={banner
          ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: 'linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)' }}>
        {banner && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}
        {!banner && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, #3772ff 0%, transparent 70%)' }} />
            <div className="absolute -bottom-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
            <div className="absolute top-8 right-1/3 w-40 h-40 rounded-full blur-2xl opacity-10" style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }} />
            <svg className="absolute right-0 top-0 h-full opacity-5" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
              <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
              <rect width="200" height="200" fill="url(#grid)" />
            </svg>
          </div>
        )}

        {/* Banner picker — top-right corner */}
        <div className="absolute top-4 right-4 z-10">
          <BannerPicker userId={authUser?.id ?? 0} onBannerChange={saveBanner} />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 px-8 py-8 sm:py-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0" ref={avatarMenuRef}>
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
                 style={{ background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #3772ff 0%, #8b5cf6 100%)' }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-black text-4xl drop-shadow">{initials || <User className="w-12 h-12" />}</span>
                </div>
              )}
              {(uploading || deleting) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Click overlay */}
            <button
              onClick={() => !uploading && !deleting && setAvatarMenuOpen(v => !v)}
              disabled={uploading || deleting}
              className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Camera className="w-6 h-6 text-white" />
              <span className="text-white text-[10px] font-bold">Изменить</span>
            </button>

            {/* Popup menu */}
            {avatarMenuOpen && (
              <div className="absolute top-0 left-full ml-3 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[170px]">
                {avatarPreview && (
                  <button
                    onClick={() => { setAvatarViewOpen(true); setAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Просмотреть фото
                  </button>
                )}
                <button
                  onClick={() => { fileRef.current?.click(); setAvatarMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${avatarPreview ? "border-t border-gray-100" : ""}`}
                >
                  <Camera className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {avatarPreview ? "Заменить фото" : "Загрузить фото"}
                </button>
                {avatarPreview && (
                  <button
                    onClick={() => { handleDeleteAvatar(); setAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    Удалить фото
                  </button>
                )}
              </div>
            )}

            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#1e263e] shadow-lg animate-pulse" />
          </div>

          {/* Name + info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {personalForm.first_name} {personalForm.last_name}
              </h1>
              {stats?.is_super_admin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-200 border border-purple-400/40"
                      style={{ background: 'rgba(139,92,246,0.25)' }}>
                  <Sparkles className="w-3 h-3" /> Супер Админ
                </span>
              )}
            </div>
            <p className="text-blue-200/80 text-sm mb-3">{personalForm.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white/90 border border-white/20"
                    style={{ background: 'rgba(55,114,255,0.3)' }}>
                <FontAwesomeIcon icon={faBolt} className="text-xs" /> Администратор
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-400/30"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Онлайн
              </span>
            </div>
          </div>

        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ── PERSONAL INFO ─────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Left accent bar */}
        <div className="absolute left-0 top-0 w-1.5 h-full" style={{ background: 'linear-gradient(to bottom, #3772ff, #6048f5)' }} />

        <div className="px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ebf1ff, #d6e4ff)' }}>
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Личные данные</h2>
                <p className="text-xs text-gray-400">Редактирование профиля администратора</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100">
              <Lock className="w-3 h-3" /> Защищено
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Имя" value={personalForm.first_name} onChange={v => setPersonalForm(p => ({ ...p, first_name: v }))} icon={User} />
            <InputField label="Фамилия" value={personalForm.last_name} onChange={v => setPersonalForm(p => ({ ...p, last_name: v }))} icon={User} />
            <InputField label="Email" value={personalForm.email} onChange={v => setPersonalForm(p => ({ ...p, email: v }))} icon={Mail} type="email" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Телефон</label>
              <PhoneInput
                value={personalForm.phone}
                onChange={(e164) => setPersonalForm(p => ({ ...p, phone: e164 }))}
                placeholder="+7 (___) ___-__-__"
                inputClassName="pl-10 pr-4 py-3 text-sm border-gray-200 bg-white text-gray-800 placeholder-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm hover:border-gray-300 rounded-xl"
              />
            </div>
          </div>

          {/* Save */}
          <div className="mt-6 flex justify-end">
            <motion.button
              onClick={handleSavePersonal}
              disabled={savingPersonal}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #6048f5 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
              {savingPersonal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedPersonal ? (
                <CheckCircle2 className="w-4 h-4 text-green-200" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {savedPersonal ? "Сохранено!" : "Сохранить"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── CLINIC INFO ───────────────────────────────────────── */}
      {stats && !stats.is_super_admin && stats.clinic_info && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Left accent bar */}
          <div className="absolute left-0 top-0 w-1.5 h-full" style={{ background: 'linear-gradient(to bottom, #10b981, #059669)' }} />

          <div className="px-8 py-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Данные клиники</h2>
                <p className="text-xs text-gray-400">Управление информацией о клинике</p>
              </div>
            </div>

            {/* Clinic logo upload */}
            <div className="flex items-center gap-5 mb-6 p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="relative flex-shrink-0 group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center shadow-sm">
                  {clinicLogo ? (
                    <img src={clinicLogo} alt="Логотип клиники" className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-300" />
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => logoRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-700 mb-0.5">Логотип / фото клиники</p>
                <p className="text-xs text-gray-400 mb-3">JPG, PNG, WEBP — до 5 МБ</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => logoRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-40"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {clinicLogo ? "Заменить" : "Загрузить"}
                  </button>
                  {clinicLogo && (
                    <button
                      onClick={handleDeleteLogo}
                      disabled={uploadingLogo}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Удалить
                    </button>
                  )}
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Row 1: name */}
              <div className="sm:col-span-2">
                <InputField label="Название клиники" value={clinicForm.name} onChange={v => setClinicForm(p => ({ ...p, name: v }))} icon={Building2} />
              </div>

              {/* Row 2: city + phone */}
              <InputField label="Город" value={clinicForm.city_name} onChange={v => setClinicForm(p => ({ ...p, city_name: v }))} icon={MapPin} placeholder="Алматы" />
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Телефон клиники</label>
                <PhoneInput
                  value={clinicForm.phone}
                  onChange={(e164) => setClinicForm(p => ({ ...p, phone: e164 }))}
                  placeholder="+7 (___) ___-__-__"
                  inputClassName="pl-10 pr-4 py-3 text-sm border-gray-200 bg-white text-gray-800 placeholder-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm hover:border-gray-300 rounded-xl"
                />
              </div>

              {/* Row 3: address */}
              <div className="sm:col-span-2">
                <InputField label="Адрес" value={clinicForm.address} onChange={v => setClinicForm(p => ({ ...p, address: v }))} icon={MapPin} />
              </div>

              {/* Row 4: working hours */}
              <InputField label="Часы работы" value={clinicForm.working_hours} onChange={v => setClinicForm(p => ({ ...p, working_hours: v }))} icon={Clock} placeholder="Пн-Пт: 9:00–18:00, Сб: 10:00–15:00" />

              {/* Row 4b: currency */}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Валюта клиники</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CURRENCIES.map(cur => {
                    const active = clinicForm.currency === cur.value;
                    return (
                      <button
                        key={cur.value}
                        type="button"
                        onClick={() => setClinicForm(p => ({ ...p, currency: cur.value }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          active
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className={`text-base leading-none ${active ? 'text-emerald-600' : 'text-gray-400'}`}>{cur.symbol}</span>
                        <span>{cur.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: description */}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Описание клиники</label>
                <div className="relative group">
                  <AlignLeft className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <textarea
                    rows={3}
                    value={clinicForm.description}
                    onChange={e => setClinicForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Краткое описание клиники, специализации, особенностей..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm hover:border-gray-300 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <motion.button
                onClick={handleSaveClinic}
                disabled={savingClinic}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
                {savingClinic ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedClinic ? (
                  <CheckCircle2 className="w-4 h-4 text-green-100" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savedClinic ? "Сохранено!" : "Сохранить"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SUPER ADMIN BADGE ─────────────────────────────────── */}
      {stats?.is_super_admin && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative rounded-3xl p-6 flex items-center gap-5 overflow-hidden border border-purple-200/50"
          style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%)' }}>
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-black text-base text-purple-900">Системный Администратор</h3>
            <p className="text-sm text-purple-700 mt-0.5">Полный доступ ко всем клиникам и ресурсам платформы</p>
          </div>
        </motion.div>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

      {/* Photo viewer modal */}
      {avatarViewOpen && avatarPreview && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setAvatarViewOpen(false)}>
          <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <img src={avatarPreview} alt="avatar" className="w-full rounded-3xl shadow-2xl object-cover" />
            <button onClick={() => setAvatarViewOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
