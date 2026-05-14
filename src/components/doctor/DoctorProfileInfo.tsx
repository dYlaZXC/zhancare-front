"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  User, Mail, Phone, Stethoscope, GraduationCap,
  MapPin, Save, Camera, Trash2, CheckCircle2,
  Loader2, Lock, AlignLeft, Award, Building2, Clock,
  DoorOpen, CreditCard, Globe,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserMd } from "@fortawesome/free-solid-svg-icons";
import PhoneInput from "@/components/ui/PhoneInput";
import BannerPicker, { useBanner } from "@/components/profile/BannerPicker";

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
  language?: string;
  avatar?: string | null;
  profiles?: {
    doctor?: {
      doctor_type?: string;
      specialization?: string;
      specializations?: string[];
      years_of_experience?: number;
      online_consultation_price?: string;
      offline_consultation_price?: string;
      room_number?: string;
      education?: string;
      bio?: string;
      rating?: number;
      reviews_count?: number;
      clinic?: { id: number; name: string; address?: string; city?: string; gis2_url?: string };
    };
  };
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
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", language: "",
    doctor_type: "", years_of_experience: "",
    online_consultation_price: "", offline_consultation_price: "",
    room_number: "", education: "", bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarViewOpen, setAvatarViewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) setAvatarMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarMenuOpen]);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user-profile/profile/");
      const d = res.data;
      setProfile(d);
      const dp = d.profiles?.doctor;
      setForm({
        first_name: d.first_name || "",
        last_name: d.last_name || "",
        phone: d.phone || "",
        language: d.language || "",
        doctor_type: dp?.doctor_type || "",
        years_of_experience: dp?.years_of_experience?.toString() || "",
        online_consultation_price: dp?.online_consultation_price || "",
        offline_consultation_price: dp?.offline_consultation_price || "",
        room_number: dp?.room_number || "",
        education: dp?.education || "",
        bio: dp?.bio || "",
      });
      setAvatarPreview(resolveAvatar(d.avatar));
    } catch { toast.error("Не удалось загрузить профиль"); }
  };

  const cleanPayload = (obj: Record<string, any>) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]));

  const handleSave = async () => {
    setSaving(true);
    try {
      const isClinicDoctor = !!profile?.profiles?.doctor?.clinic;
      await api.patch("/user-profile/profile/", cleanPayload({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        language: form.language,
        doctor_type: form.doctor_type,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : null,
        // Only independent doctors can change prices
        ...(!isClinicDoctor && {
          online_consultation_price: form.online_consultation_price ? parseFloat(form.online_consultation_price) : null,
          offline_consultation_price: form.offline_consultation_price ? parseFloat(form.offline_consultation_price) : null,
        }),
        room_number: form.room_number,
        education: form.education,
        bio: form.bio,
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

  const { banner, saveBanner } = useBanner(authUser?.id);

  if (!profile) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  const initials = `${form.first_name?.[0] ?? ""}${form.last_name?.[0] ?? ""}`.toUpperCase();
  const hasClinic = !!profile?.profiles?.doctor?.clinic;

  return (
    <div className="w-full space-y-6">

      {/* ── HERO ── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={banner
          ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: 'linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)' }}>
        {banner && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}
        <div className="absolute top-4 right-4 z-10">
          <BannerPicker userId={authUser?.id ?? 0} onBannerChange={saveBanner} />
        </div>
        {!banner && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, #3772ff, transparent)' }} />
            <div className="absolute -bottom-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #6048f5, transparent)' }} />
            <svg className="absolute right-0 top-0 h-full opacity-5" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
              <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
              <rect width="200" height="200" fill="url(#grid)" />
            </svg>
          </div>
        )}

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 px-8 py-8 sm:py-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0" ref={avatarMenuRef}>
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
                 style={{ background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #3772ff 0%, #6048f5 100%)' }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><span className="text-white font-black text-4xl">{initials}</span></div>}
              {(uploading || deleting) && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>}
            </div>
            <button onClick={() => !uploading && !deleting && setAvatarMenuOpen(v => !v)} disabled={uploading || deleting}
              className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer">
              <Camera className="w-6 h-6 text-white" /><span className="text-white text-[10px] font-bold">Изменить</span>
            </button>
            {avatarMenuOpen && (
              <div className="absolute top-0 left-full ml-3 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[170px]">
                {avatarPreview && (
                  <button onClick={() => { setAvatarViewOpen(true); setAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Просмотреть фото
                  </button>
                )}
                <button onClick={() => { fileRef.current?.click(); setAvatarMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${avatarPreview ? "border-t border-gray-100" : ""}`}>
                  <Camera className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {avatarPreview ? "Заменить фото" : "Загрузить фото"}
                </button>
                {avatarPreview && (
                  <button onClick={() => { handleDeleteAvatar(); setAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100">
                    <Trash2 className="w-4 h-4 flex-shrink-0" /> Удалить фото
                  </button>
                )}
              </div>
            )}
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
              {(form.doctor_type || profile?.profiles?.doctor?.specialization) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 border border-indigo-400/30"
                      style={{ background: 'rgba(96,72,245,0.2)' }}>
                  <Stethoscope className="w-3 h-3" /> {form.doctor_type || profile?.profiles?.doctor?.specialization}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-400/30"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Онлайн
              </span>
            </div>
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
          <InputField label="Тип врача / Должность" value={form.doctor_type} onChange={v => setForm(p => ({ ...p, doctor_type: v }))} icon={Stethoscope} placeholder="Кардиолог, Терапевт..." />
          <InputField label="Опыт работы (лет)" value={form.years_of_experience} onChange={v => setForm(p => ({ ...p, years_of_experience: v }))} icon={Award} placeholder="5" type="number" />
          {(() => {
            const specs = profile?.profiles?.doctor?.specializations;
            const primary = profile?.profiles?.doctor?.specialization;
            const all = specs && specs.length > 0 ? specs : primary ? [primary] : [];
            return all.length > 0 ? (
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Специализации</label>
                <div className="flex flex-wrap gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50 min-h-[44px]">
                  {all.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Stethoscope className="w-3 h-3" />{s}
                    </span>
                  ))}
                  <span className="ml-auto text-[10px] text-gray-300 font-semibold self-center">Не изменяется</span>
                </div>
                <p className="text-[10px] text-gray-400">Специализации устанавливаются администратором клиники</p>
              </div>
            ) : null;
          })()}
          <InputField label="Кабинет №" value={form.room_number} onChange={v => setForm(p => ({ ...p, room_number: v }))} icon={DoorOpen} placeholder="101" />
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

      {/* ── PRICING ── */}
      <Card accentColor="linear-gradient(to bottom, #f59e0b, #d97706)" delay={0.15}>
        <CardHeader
          icon={CreditCard}
          title="Стоимость консультаций"
          subtitle={hasClinic ? "Цены устанавливаются клиникой" : "Укажите ваши цены на приёмы"}
          iconBg="linear-gradient(135deg, #fef3c7, #fde68a)"
          badge={
            hasClinic
              ? <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100"><Lock className="w-3 h-3" /> Только чтение</div>
              : undefined
          }
        />

        {hasClinic && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Вы прикреплены к клинике <span className="font-bold">{profile.profiles!.doctor!.clinic!.name}</span>. Стоимость консультаций устанавливается администратором клиники и недоступна для редактирования.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Онлайн консультация (₸)"
            value={form.online_consultation_price}
            onChange={hasClinic ? undefined : v => setForm(p => ({ ...p, online_consultation_price: v }))}
            icon={CreditCard}
            placeholder="5000"
            type="number"
            readOnly={hasClinic}
          />
          <InputField
            label="Оффлайн приём (₸)"
            value={form.offline_consultation_price}
            onChange={hasClinic ? undefined : v => setForm(p => ({ ...p, offline_consultation_price: v }))}
            icon={CreditCard}
            placeholder="8000"
            type="number"
            readOnly={hasClinic}
          />
        </div>

        {profile?.profiles?.doctor?.rating != null && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-amber-700 font-semibold">Рейтинг: {profile.profiles.doctor.rating.toFixed(1)}</span>
            {profile.profiles.doctor.reviews_count != null && (
              <span className="text-xs text-amber-500">· {profile.profiles.doctor.reviews_count} отзывов</span>
            )}
          </div>
        )}

        {!hasClinic && (
          <div className="mt-6 flex justify-end">
            <SaveButton saving={saving} saved={saved} onClick={handleSave} color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
          </div>
        )}
      </Card>

      {/* ── CLINIC INFO (read-only, set by admin) ── */}
      {profile?.profiles?.doctor?.clinic && (
        <Card accentColor="linear-gradient(to bottom, #10b981, #059669)" delay={0.2}>
          <CardHeader icon={Building2} title="Клиника" subtitle="Информация о вашем месте работы — устанавливается администратором"
            iconBg="linear-gradient(135deg, #d1fae5, #a7f3d0)"
            badge={<div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100"><Lock className="w-3 h-3" /> Только чтение</div>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField label="Название клиники" value={profile.profiles.doctor.clinic.name} icon={Building2} readOnly />
            </div>
            {profile.profiles.doctor.clinic.city && <InputField label="Город" value={profile.profiles.doctor.clinic.city} icon={MapPin} readOnly />}
            {profile.profiles.doctor.clinic.address && (
              <div className="sm:col-span-2">
                <InputField label="Адрес" value={profile.profiles.doctor.clinic.address} icon={MapPin} readOnly />
              </div>
            )}
          </div>
        </Card>
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
