"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  User, Mail, Phone, Stethoscope, GraduationCap,
  MapPin, Save, Camera, Trash2, CheckCircle2,
  Loader2, Lock, AlignLeft, Award, Building2, Clock,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserMd } from "@fortawesome/free-solid-svg-icons";
import PhoneInput from "@/components/ui/PhoneInput";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://127.0.0.1:8000';
const resolveAvatar = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BACKEND}${url}`;
};

interface DoctorProfile {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience?: number;
  education?: string;
  bio?: string;
  avatar?: string | null;
  clinic?: { name: string; city?: string; address?: string; working_hours?: string };
}

const InputField = ({ label, value, onChange, icon: Icon, placeholder, type = "text", readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  icon: React.ElementType; placeholder?: string; type?: string; readOnly?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" />
      <input
        type={type} value={value} placeholder={placeholder} readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 shadow-sm ${
          readOnly
            ? 'border-dashed border-gray-200 bg-gray-50 text-gray-400 cursor-default'
            : 'border-gray-200 bg-white text-gray-800 placeholder-gray-300 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
        }`}
      />
      {readOnly && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">Не изменяется</span>}
    </div>
  </div>
);

const TextareaField = ({ label, value, onChange, icon: Icon, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  icon: React.ElementType; placeholder?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
      <textarea rows={3} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm hover:border-gray-300 resize-none" />
    </div>
  </div>
);

const Card = ({ children, accentColor, delay = 0 }: { children: React.ReactNode; accentColor: string; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="absolute left-0 top-0 w-1.5 h-full" style={{ background: accentColor }} />
    <div className="px-8 py-6">{children}</div>
  </motion.div>
);

const CardHeader = ({ icon: Icon, title, subtitle, iconBg, badge }: {
  icon: React.ElementType; title: string; subtitle: string; iconBg: string; badge?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        <Icon className="w-4 h-4" style={{ color: iconBg.includes('ebf1ff') ? '#3772ff' : iconBg.includes('ede9fe') ? '#8b5cf6' : '#10b981' }} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
    {badge}
  </div>
);

export default function DoctorProfileInfo() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", specialization: "", experience: "", education: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user-profile/profile/");
      const d = res.data;
      setProfile(d);
      setForm({
        first_name: d.first_name || "",
        last_name: d.last_name || "",
        phone: d.phone || "",
        specialization: d.specialization || "",
        experience: d.experience?.toString() || "",
        education: d.education || "",
        bio: d.bio || "",
      });
      setAvatarPreview(resolveAvatar(d.avatar));
    } catch { toast.error("Не удалось загрузить профиль"); }
  };

  const cleanPayload = (obj: Record<string, any>) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/user-profile/profile/", cleanPayload({
        ...form,
        experience: form.experience ? parseInt(form.experience) : "",
      }));
      toast.success("Профиль обновлён");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      const detail = e?.response?.data;
      toast.error(detail ? JSON.stringify(detail) : "Не удалось сохранить");
    } finally { setSaving(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Максимум 5 МБ"); return; }
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("avatar", file);
      const res = await api.post("/user-profile/avatar/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setAvatarPreview(resolveAvatar(res.data.avatar));
      toast.success("Фото обновлено");
    } catch { toast.error("Не удалось загрузить фото"); setAvatarPreview(resolveAvatar(profile?.avatar)); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDeleteAvatar = async () => {
    setDeleting(true);
    try { await api.delete("/user-profile/avatar/"); setAvatarPreview(null); toast.success("Фото удалено"); }
    catch { toast.error("Не удалось удалить"); } finally { setDeleting(false); }
  };

  if (!profile) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  const initials = `${form.first_name?.[0] ?? ""}${form.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="w-full space-y-6">

      {/* ── HERO ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, #3772ff, transparent)' }} />
          <div className="absolute -bottom-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #6048f5, transparent)' }} />
          <svg className="absolute right-0 top-0 h-full opacity-5" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
            <rect width="200" height="200" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 px-8 py-8 sm:py-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0 group">
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
                 style={{ background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #3772ff 0%, #6048f5 100%)' }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><span className="text-white font-black text-4xl">{initials}</span></div>}
              {(uploading || deleting) && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading || deleting}
              className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer">
              <Camera className="w-6 h-6 text-white" /><span className="text-white text-[10px] font-bold">Изменить</span>
            </button>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#1e263e] shadow-lg animate-pulse" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              {form.first_name} {form.last_name}
            </h1>
            <p className="text-blue-200/80 text-sm mb-3">{profile.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white/90 border border-white/20"
                    style={{ background: 'rgba(55,114,255,0.3)' }}>
                <FontAwesomeIcon icon={faUserMd} className="text-xs" /> Доктор
              </span>
              {form.specialization && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 border border-indigo-400/30"
                      style={{ background: 'rgba(96,72,245,0.2)' }}>
                  <Stethoscope className="w-3 h-3" /> {form.specialization}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-400/30"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Онлайн
              </span>
            </div>
          </div>

          {/* Avatar buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => fileRef.current?.click()} disabled={uploading || deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/20 hover:bg-white/10 transition-all disabled:opacity-40"
              style={{ background: 'rgba(55,114,255,0.3)' }}>
              <Camera className="w-3.5 h-3.5" /> {avatarPreview ? "Заменить" : "Загрузить"}
            </button>
            {avatarPreview && (
              <button onClick={handleDeleteAvatar} disabled={uploading || deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-300 border border-red-400/30 hover:bg-red-500/10 transition-all disabled:opacity-40">
                <Trash2 className="w-3.5 h-3.5" /> Удалить
              </button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ── PERSONAL INFO ── */}
      <Card accentColor="linear-gradient(to bottom, #3772ff, #6048f5)" delay={0.05}>
        <CardHeader icon={User} title="Личные данные" subtitle="Основная информация профиля"
          iconBg="linear-gradient(135deg, #ebf1ff, #d6e4ff)"
          badge={<div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100"><Lock className="w-3 h-3" /> Защищено</div>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Имя" value={form.first_name} onChange={v => setForm(p => ({ ...p, first_name: v }))} icon={User} />
          <InputField label="Фамилия" value={form.last_name} onChange={v => setForm(p => ({ ...p, last_name: v }))} icon={User} />
          <InputField label="Email" value={profile.email} icon={Mail} readOnly />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Телефон</label>
            <PhoneInput
              value={form.phone}
              onChange={(e164) => setForm(p => ({ ...p, phone: e164 }))}
              placeholder="+7 (___) ___-__-__"
              inputClassName="pl-10 pr-4 py-3 text-sm border-gray-200 bg-white text-gray-800 placeholder-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm hover:border-gray-300 rounded-xl"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} color="linear-gradient(135deg, #3772ff 0%, #6048f5 100%)" />
        </div>
      </Card>

      {/* ── PROFESSIONAL INFO ── */}
      <Card accentColor="linear-gradient(to bottom, #6048f5, #8b5cf6)" delay={0.1}>
        <CardHeader icon={Stethoscope} title="Профессиональная информация" subtitle="Специализация, опыт и образование"
          iconBg="linear-gradient(135deg, #ede9fe, #ddd6fe)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Специализация" value={form.specialization} onChange={v => setForm(p => ({ ...p, specialization: v }))} icon={Stethoscope} placeholder="Кардиология" />
          <InputField label="Опыт работы (лет)" value={form.experience} onChange={v => setForm(p => ({ ...p, experience: v }))} icon={Award} placeholder="5" type="number" />
          <div className="sm:col-span-2">
            <TextareaField label="Образование" value={form.education} onChange={v => setForm(p => ({ ...p, education: v }))} icon={GraduationCap} placeholder="Укажите ваше образование..." />
          </div>
          <div className="sm:col-span-2">
            <TextareaField label="О себе" value={form.bio} onChange={v => setForm(p => ({ ...p, bio: v }))} icon={AlignLeft} placeholder="Расскажите о себе..." />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} color="linear-gradient(135deg, #6048f5 0%, #8b5cf6 100%)" />
        </div>
      </Card>

      {/* ── CLINIC INFO (read-only) ── */}
      {profile.clinic && (
        <Card accentColor="linear-gradient(to bottom, #10b981, #059669)" delay={0.15}>
          <CardHeader icon={Building2} title="Клиника" subtitle="Информация о вашем месте работы"
            iconBg="linear-gradient(135deg, #d1fae5, #a7f3d0)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField label="Название клиники" value={profile.clinic.name} icon={Building2} readOnly />
            </div>
            {profile.clinic.city && <InputField label="Город" value={profile.clinic.city} icon={MapPin} readOnly />}
            {profile.clinic.working_hours && <InputField label="Часы работы" value={profile.clinic.working_hours} icon={Clock} readOnly />}
            {profile.clinic.address && (
              <div className="sm:col-span-2">
                <InputField label="Адрес" value={profile.clinic.address} icon={MapPin} readOnly />
              </div>
            )}
          </div>
        </Card>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

function SaveButton({ saving, saved, onClick, color }: { saving: boolean; saved: boolean; onClick: () => void; color: string }) {
  return (
    <motion.button onClick={onClick} disabled={saving} whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all overflow-hidden"
      style={{ background: color }}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 text-green-200" /> : <Save className="w-4 h-4" />}
      {saved ? "Сохранено!" : "Сохранить"}
    </motion.button>
  );
}
