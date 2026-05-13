"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  User, Mail, Phone, Save, Camera, Trash2, CheckCircle2,
  Loader2, Lock, MapPin, Calendar, Users, Flag, Languages,
  Heart, Briefcase, Droplet, Shield, FileText, Clock,
  ExternalLink, AlertTriangle, CheckCircle, ChevronDown, Search, X,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserInjured } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import BannerPicker, { useBanner } from "@/components/profile/BannerPicker";
import PhoneInput from "@/components/ui/PhoneInput";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://127.0.0.1:8000";
const resolveAvatar = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND}${url}`;
};

interface PatientProfile {
  id?: number;
  first_name: string; last_name: string; email: string; phone?: string;
  avatar?: string | null; birth_date?: string; gender?: string;
  gender_display?: string; address?: string; city?: string;
  language?: string; language_display?: string; citizenship?: string;
  marital_status?: string; marital_status_display?: string; profession?: string;
  blood_type?: string; blood_type_display?: string;
  rhesus_factor?: string; rhesus_factor_display?: string;
  fluorography_status?: string; fluorography_status_display?: string;
  fluorography_date?: string; immunization_status?: string;
  immunization_status_display?: string; immunization_date?: string;
  date_joined?: string;
}

// ─── Premium searchable select ────────────────────────────────
interface SelectOption { value: string; label: string; hint?: string }

function SearchableSelect({
  label, value, onChange, icon: Icon, options, placeholder = "Поиск...",
}: {
  label: string; value: string; onChange: (v: string) => void;
  icon: React.ElementType; options: SelectOption[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className={`relative w-full flex items-center gap-3 pl-10 pr-10 py-3 rounded-xl border text-sm text-left transition-all duration-200 shadow-sm outline-none ${
          open
            ? "border-blue-500 ring-4 ring-blue-500/10 bg-white"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <Icon className={`absolute left-3.5 w-4 h-4 transition-colors duration-200 ${open ? "text-blue-500" : "text-gray-400"}`} />
        <span className={selected ? "text-gray-800 font-medium" : "text-gray-300"}>
          {selected ? selected.label : "Не указано"}
        </span>

        {/* Clear / chevron */}
        <div className="absolute right-3 flex items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            style={{ top: "100%", left: 0, minWidth: "100%" }}
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300 text-gray-800 transition-all"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto py-1.5">
              {/* Clear option */}
              {value && (
                <button
                  onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="italic">Не указано</span>
                </button>
              )}

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-2">
                  <Search className="w-5 h-5 text-gray-300" />
                  <span className="text-sm text-gray-400">Ничего не найдено</span>
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-all duration-150 ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-blue-500" : "text-gray-400"}`} />
                        <span className="truncate">{opt.label}</span>
                        {opt.hint && <span className="text-[10px] text-gray-400 flex-shrink-0">{opt.hint}</span>}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
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
}

// Wrapper to give SearchableSelect absolute positioning context
function SelectWrapper({ children }: { children: React.ReactNode }) {
  return <div className="relative">{children}</div>;
}

// ─── Regular input ────────────────────────────────────────────
const InputField = ({
  label, value, onChange, icon: Icon, placeholder, type = "text", readOnly = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  icon: React.ElementType; placeholder?: string; type?: string; readOnly?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" />
      <input
        type={type} value={value} placeholder={placeholder} readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 shadow-sm ${
          readOnly
            ? "border-dashed border-gray-200 bg-gray-50 text-gray-400 cursor-default"
            : "border-gray-200 bg-white text-gray-800 placeholder-gray-300 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        }`}
      />
      {readOnly && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
          Не изменяется
        </span>
      )}
    </div>
  </div>
);

// ─── Card ─────────────────────────────────────────────────────
const Card = ({ children, accentColor, delay = 0 }: { children: React.ReactNode; accentColor: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-visible"
  >
    {/* Separate overflow-hidden layer just for the accent bar so it's clipped by the card corners
        while the card itself stays overflow-visible for dropdown menus */}
    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
      <div className="absolute left-0 top-0 w-1.5 h-full" style={{ background: accentColor }} />
    </div>
    <div className="px-8 py-6">{children}</div>
  </motion.div>
);

// ─── Save button ──────────────────────────────────────────────
function SaveButton({ saving, saved, onClick, color }: { saving: boolean; saved: boolean; onClick: () => void; color: string }) {
  return (
    <motion.button
      onClick={onClick} disabled={saving} whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all overflow-hidden"
      style={{ background: color }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 text-green-200" /> : <Save className="w-4 h-4" />}
      {saved ? "Сохранено!" : "Сохранить"}
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function PatientProfileDashboard() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [personalForm, setPersonalForm] = useState({
    first_name: "", last_name: "", phone: "", birth_date: "",
    gender: "", address: "", city: "", language: "",
    citizenship: "", marital_status: "", profession: "",
  });
  const [medicalForm, setMedicalForm] = useState({
    blood_type: "", rhesus_factor: "", fluorography_status: "",
    fluorography_date: "", immunization_status: "", immunization_date: "",
  });

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savedPersonal, setSavedPersonal] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);
  const [savedMedical, setSavedMedical] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user-profile/profile/");
      const d: PatientProfile = res.data;
      setProfile(d);
      setPersonalForm({
        first_name: d.first_name || "", last_name: d.last_name || "",
        phone: d.phone || "", birth_date: d.birth_date || "",
        gender: d.gender || "", address: d.address || "",
        city: d.city || "", language: d.language || "",
        citizenship: d.citizenship || "", marital_status: d.marital_status || "",
        profession: d.profession || "",
      });
      setMedicalForm({
        blood_type: d.blood_type || "", rhesus_factor: d.rhesus_factor || "",
        fluorography_status: d.fluorography_status || "",
        fluorography_date: d.fluorography_date || "",
        immunization_status: d.immunization_status || "",
        immunization_date: d.immunization_date || "",
      });
      setAvatarPreview(resolveAvatar(d.avatar));
    } catch { toast.error("Не удалось загрузить профиль"); }
    finally { setLoading(false); }
  };

  // Convert empty strings to null so DRF DateField/ChoiceField don't reject them
  const cleanPayload = (obj: Record<string, string>) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]));

  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    try {
      await api.patch("/user-profile/profile/", cleanPayload(personalForm));
      toast.success("Личные данные обновлены");
      setSavedPersonal(true); setTimeout(() => setSavedPersonal(false), 2500);
    } catch (e: any) {
      const detail = e?.response?.data;
      toast.error(detail ? JSON.stringify(detail) : "Не удалось сохранить");
    }
    finally { setSavingPersonal(false); }
  };

  const handleSaveMedical = async () => {
    setSavingMedical(true);
    try {
      await api.patch("/user-profile/profile/", cleanPayload(medicalForm));
      toast.success("Медицинские данные обновлены");
      setSavedMedical(true); setTimeout(() => setSavedMedical(false), 2500);
    } catch (e: any) {
      const detail = e?.response?.data;
      toast.error(detail ? JSON.stringify(detail) : "Не удалось сохранить");
    }
    finally { setSavingMedical(false); }
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
      const resolvedUrl = resolveAvatar(res.data.avatar);
      setAvatarPreview(resolvedUrl);
      updateUser({ avatar: res.data.avatar });
      toast.success("Фото обновлено");
    } catch {
      toast.error("Не удалось загрузить фото");
      setAvatarPreview(resolveAvatar(profile?.avatar));
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDeleteAvatar = async () => {
    setDeleting(true);
    try {
      await api.delete("/user-profile/avatar/");
      setAvatarPreview(null);
      updateUser({ avatar: null });
      toast.success("Фото удалено");
    }
    catch { toast.error("Не удалось удалить"); }
    finally { setDeleting(false); }
  };

  const { banner, saveBanner } = useBanner(profile?.id);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!profile) return <div className="flex items-center justify-center py-20"><p className="text-red-500 text-sm">Ошибка загрузки профиля</p></div>;

  const initials = `${personalForm.first_name?.[0] ?? ""}${personalForm.last_name?.[0] ?? ""}`.toUpperCase();
  const yearsInSystem = profile.date_joined
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.date_joined).getTime()) / (1000 * 60 * 60 * 24 * 365)))
    : 0;
  const medFields = Object.values(medicalForm).filter(Boolean).length;
  const medTotal = Object.keys(medicalForm).length;
  const medPct = Math.round((medFields / medTotal) * 100);

  // ── Option sets ──────────────────────────────────────────────
  const genderOpts: SelectOption[] = [
    { value: "male", label: "Мужской", hint: "♂" },
    { value: "female", label: "Женский", hint: "♀" },
    { value: "other", label: "Другой" },
  ];
  const languageOpts: SelectOption[] = [
    { value: "kz", label: "Казахский", hint: "🇰🇿" },
    { value: "ru", label: "Русский", hint: "🇷🇺" },
    { value: "en", label: "Английский", hint: "🇬🇧" },
    { value: "other", label: "Другой" },
  ];
  const citizenshipOpts: SelectOption[] = [
    { value: "Казахстан", label: "Казахстан", hint: "🇰🇿" },
    { value: "Россия", label: "Россия", hint: "🇷🇺" },
    { value: "США", label: "США", hint: "🇺🇸" },
    { value: "Германия", label: "Германия", hint: "🇩🇪" },
    { value: "Другое", label: "Другое" },
  ];
  const maritalOpts: SelectOption[] = [
    { value: "single", label: "Не женат / не замужем" },
    { value: "married", label: "Женат / замужем" },
    { value: "divorced", label: "Разведён / разведена" },
    { value: "widowed", label: "Вдовец / вдова" },
  ];
  const bloodTypeOpts: SelectOption[] = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"].map((b) => ({
    value: b.replace("−", "-"), label: b,
    hint: b.includes("+") ? "Rh+" : "Rh−",
  }));
  const rhesusOpts: SelectOption[] = [
    { value: "positive", label: "Положительный", hint: "Rh+" },
    { value: "negative", label: "Отрицательный", hint: "Rh−" },
  ];
  const fluorOpts: SelectOption[] = [
    { value: "normal", label: "Норма" },
    { value: "abnormal", label: "Отклонения" },
    { value: "pending", label: "Ожидает результата" },
    { value: "expired", label: "Просрочена" },
  ];
  const immunOpts: SelectOption[] = [
    { value: "up_to_date", label: "Актуальная" },
    { value: "partial", label: "Частичная" },
    { value: "expired", label: "Просрочена" },
    { value: "none", label: "Отсутствует" },
  ];

  return (
    <div className="w-full space-y-6">

      {/* ── HERO ── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={banner
          ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)" }}>
        {banner && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}
        {!banner && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30"
                 style={{ background: "radial-gradient(circle, #3772ff, transparent)" }} />
            <div className="absolute -bottom-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-20"
                 style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
            <svg className="absolute right-0 top-0 h-full opacity-5" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
              <defs><pattern id="grid-patient" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
              <rect width="200" height="200" fill="url(#grid-patient)" />
            </svg>
          </div>
        )}

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 px-8 py-8 sm:py-10">
          <div className="relative flex-shrink-0 group">
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
                 style={{ background: avatarPreview ? "transparent" : "linear-gradient(135deg, #3772ff 0%, #29358f 100%)" }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><span className="text-white font-black text-4xl">{initials}</span></div>}
              {(uploading || deleting) && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading || deleting}
              className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <span className="text-white text-[10px] font-bold">Изменить</span>
            </button>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#1e263e] shadow-lg animate-pulse" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              {personalForm.first_name} {personalForm.last_name}
            </h1>
            <p className="text-blue-200/80 text-sm mb-3">{profile.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white/90 border border-white/20"
                    style={{ background: "rgba(55,114,255,0.3)" }}>
                <FontAwesomeIcon icon={faUserInjured} className="text-xs" /> Пациент
              </span>
              {yearsInSystem > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 border border-indigo-400/30"
                      style={{ background: "rgba(96,72,245,0.2)" }}>
                  <Clock className="w-3 h-3" /> {yearsInSystem} {yearsInSystem === 1 ? "год" : "лет"} в системе
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-400/30"
                    style={{ background: "rgba(16,185,129,0.15)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Онлайн
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button onClick={() => fileRef.current?.click()} disabled={uploading || deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/20 hover:bg-white/10 transition-all disabled:opacity-40"
              style={{ background: "rgba(55,114,255,0.3)" }}>
              <Camera className="w-3.5 h-3.5" /> {avatarPreview ? "Заменить" : "Загрузить"}
            </button>
            {avatarPreview && (
              <button onClick={handleDeleteAvatar} disabled={uploading || deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-300 border border-red-400/30 hover:bg-red-500/10 transition-all disabled:opacity-40">
                <Trash2 className="w-3.5 h-3.5" /> Удалить
              </button>
            )}
            <BannerPicker userId={profile?.id ?? 0} onBannerChange={saveBanner} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ── PERSONAL INFO ── */}
      <Card accentColor="linear-gradient(to bottom, #10b981, #059669)" delay={0.05}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Личные данные</h2>
              <p className="text-xs text-gray-400">Персональная информация пациента</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100">
            <Lock className="w-3 h-3" /> Защищено
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Имя" value={personalForm.first_name} onChange={(v) => setPersonalForm((p) => ({ ...p, first_name: v }))} icon={User} />
          <InputField label="Фамилия" value={personalForm.last_name} onChange={(v) => setPersonalForm((p) => ({ ...p, last_name: v }))} icon={User} />
          <InputField label="Email" value={profile.email} icon={Mail} readOnly />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Телефон</label>
            <PhoneInput
              value={personalForm.phone ?? ""}
              onChange={(e164) => setPersonalForm((p) => ({ ...p, phone: e164 }))}
              defaultCountry="KZ"
            />
          </div>
          <InputField label="Дата рождения" value={personalForm.birth_date} onChange={(v) => setPersonalForm((p) => ({ ...p, birth_date: v }))} icon={Calendar} type="date" />

          <SelectWrapper>
            <SearchableSelect label="Пол" value={personalForm.gender} onChange={(v) => setPersonalForm((p) => ({ ...p, gender: v }))} icon={Users} options={genderOpts} placeholder="Поиск пола..." />
          </SelectWrapper>

          <InputField label="Адрес" value={personalForm.address} onChange={(v) => setPersonalForm((p) => ({ ...p, address: v }))} icon={MapPin} placeholder="Улица, дом, квартира" />
          <InputField label="Город" value={personalForm.city} onChange={(v) => setPersonalForm((p) => ({ ...p, city: v }))} icon={MapPin} placeholder="Алматы" />

          <SelectWrapper>
            <SearchableSelect label="Язык" value={personalForm.language} onChange={(v) => setPersonalForm((p) => ({ ...p, language: v }))} icon={Languages} options={languageOpts} placeholder="Поиск языка..." />
          </SelectWrapper>

          <SelectWrapper>
            <SearchableSelect label="Гражданство" value={personalForm.citizenship} onChange={(v) => setPersonalForm((p) => ({ ...p, citizenship: v }))} icon={Flag} options={citizenshipOpts} placeholder="Поиск страны..." />
          </SelectWrapper>

          <SelectWrapper>
            <SearchableSelect label="Семейное положение" value={personalForm.marital_status} onChange={(v) => setPersonalForm((p) => ({ ...p, marital_status: v }))} icon={Heart} options={maritalOpts} placeholder="Поиск..." />
          </SelectWrapper>

          <InputField label="Профессия" value={personalForm.profession} onChange={(v) => setPersonalForm((p) => ({ ...p, profession: v }))} icon={Briefcase} placeholder="Укажите вашу профессию" />
        </div>

        <div className="mt-6 flex justify-end">
          <SaveButton saving={savingPersonal} saved={savedPersonal} onClick={handleSavePersonal} color="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
        </div>
      </Card>

      {/* ── MEDICAL DETAILS ── */}
      <Card accentColor="linear-gradient(to bottom, #3772ff, #6048f5)" delay={0.1}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ebf1ff, #d6e4ff)" }}>
              <Droplet className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Медицинские данные</h2>
              <p className="text-xs text-gray-400">Заполнено {medPct}% · {medFields} из {medTotal} полей</p>
            </div>
          </div>
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${medPct}%`, background: "linear-gradient(135deg, #3772ff, #6048f5)" }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectWrapper>
            <SearchableSelect label="Группа крови" value={medicalForm.blood_type} onChange={(v) => setMedicalForm((p) => ({ ...p, blood_type: v }))} icon={Droplet} options={bloodTypeOpts} placeholder="Поиск группы..." />
          </SelectWrapper>

          <SelectWrapper>
            <SearchableSelect label="Резус-фактор" value={medicalForm.rhesus_factor} onChange={(v) => setMedicalForm((p) => ({ ...p, rhesus_factor: v }))} icon={Droplet} options={rhesusOpts} placeholder="Поиск..." />
          </SelectWrapper>

          <SelectWrapper>
            <SearchableSelect label="Статус флюорографии" value={medicalForm.fluorography_status} onChange={(v) => setMedicalForm((p) => ({ ...p, fluorography_status: v }))} icon={FileText} options={fluorOpts} placeholder="Поиск статуса..." />
          </SelectWrapper>

          <InputField label="Дата флюорографии" value={medicalForm.fluorography_date} onChange={(v) => setMedicalForm((p) => ({ ...p, fluorography_date: v }))} icon={Calendar} type="date" />

          <SelectWrapper>
            <SearchableSelect label="Статус иммунизации" value={medicalForm.immunization_status} onChange={(v) => setMedicalForm((p) => ({ ...p, immunization_status: v }))} icon={Shield} options={immunOpts} placeholder="Поиск статуса..." />
          </SelectWrapper>

          <InputField label="Дата последней иммунизации" value={medicalForm.immunization_date} onChange={(v) => setMedicalForm((p) => ({ ...p, immunization_date: v }))} icon={Calendar} type="date" />
        </div>

        <div className="mt-6 flex justify-end">
          <SaveButton saving={savingMedical} saved={savedMedical} onClick={handleSaveMedical} color="linear-gradient(135deg, #3772ff 0%, #6048f5 100%)" />
        </div>
      </Card>

      {/* ── INSURANCE STATUS (hidden until backend support is added) ── */}
      {/* <motion.div ...> ... </motion.div> */}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
