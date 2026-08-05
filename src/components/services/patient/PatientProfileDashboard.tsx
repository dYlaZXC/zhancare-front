"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
import { useLanguage } from "@/context/LanguageContext";
import BannerPicker, { useBanner } from "@/components/profile/BannerPicker";
import PhoneInput from "@/components/ui/PhoneInput";

const SELECT_TEXT = {
  ru: { notSpecified: "Не указано", nothingFound: "Ничего не найдено" },
  kz: { notSpecified: "Көрсетілмеген", nothingFound: "Ештеңе табылмады" },
  en: { notSpecified: "Not specified", nothingFound: "Nothing found" },
  uz: { notSpecified: "Ko'rsatilmagan", nothingFound: "Hech narsa topilmadi" },
} as const;

const READONLY_TEXT = {
  ru: "Не изменяется",
  kz: "Өзгертілмейді",
  en: "Read-only",
  uz: "O'zgartirilmaydi",
} as const;

const SAVE_BUTTON_TEXT = {
  ru: { saved: "Сохранено!", save: "Сохранить" },
  kz: { saved: "Сақталды!", save: "Сақтау" },
  en: { saved: "Saved!", save: "Save" },
  uz: { saved: "Saqlandi!", save: "Saqlash" },
} as const;

const PATIENT_PROFILE_TEXT = {
  ru: {
    loadProfileError: "Не удалось загрузить профиль",
    personalDataUpdated: "Личные данные обновлены",
    saveFailed: "Не удалось сохранить",
    medicalDataUpdated: "Медицинские данные обновлены",
    maxFileSize: "Максимум 5 МБ",
    photoUpdated: "Фото обновлено",
    photoUploadFailed: "Не удалось загрузить фото",
    photoDeleted: "Фото удалено",
    photoDeleteFailed: "Не удалось удалить",
    profileLoadError: "Ошибка загрузки профиля",
    yearWord: (n: number) => (n === 1 ? "год" : "лет"),
    yearsInSystem: "в системе",
    change: "Изменить",
    viewPhoto: "Просмотреть фото",
    replacePhoto: "Заменить фото",
    uploadPhoto: "Загрузить фото",
    deletePhoto: "Удалить фото",
    patient: "Пациент",
    online: "Видеоконсультация",
    personalData: "Личные данные",
    personalDataSubtitle: "Персональная информация пациента",
    protected: "Защищено",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    birthDate: "Дата рождения",
    gender: "Пол",
    address: "Адрес",
    addressPlaceholder: "Улица, дом, квартира",
    city: "Город",
    cityPlaceholder: "Алматы",
    language: "Язык",
    citizenship: "Гражданство",
    maritalStatus: "Семейное положение",
    profession: "Профессия",
    professionPlaceholder: "Укажите вашу профессию",
    searchGender: "Поиск пола...",
    searchLanguage: "Поиск языка...",
    searchCountry: "Поиск страны...",
    search: "Поиск...",
    medicalData: "Медицинские данные",
    medicalFilled: "Заполнено",
    of: "из",
    fields: "полей",
    bloodType: "Группа крови",
    rhesusFactor: "Резус-фактор",
    fluorographyStatus: "Статус флюорографии",
    fluorographyDate: "Дата флюорографии",
    immunizationStatus: "Статус иммунизации",
    immunizationDate: "Дата последней иммунизации",
    searchBloodType: "Поиск группы...",
    searchRhesus: "Поиск...",
    searchStatus: "Поиск статуса...",
    genderOpts: [
      { value: "male", label: "Мужской", hint: "♂" },
      { value: "female", label: "Женский", hint: "♀" },
      { value: "other", label: "Другой" },
    ],
    languageOpts: [
      { value: "kz", label: "Казахский", hint: "🇰🇿" },
      { value: "ru", label: "Русский", hint: "🇷🇺" },
      { value: "en", label: "Английский", hint: "🇬🇧" },
      { value: "other", label: "Другой" },
    ],
    citizenshipOpts: [
      { value: "Казахстан", label: "Казахстан", hint: "🇰🇿" },
      { value: "Россия", label: "Россия", hint: "🇷🇺" },
      { value: "США", label: "США", hint: "🇺🇸" },
      { value: "Германия", label: "Германия", hint: "🇩🇪" },
      { value: "Другое", label: "Другое" },
    ],
    maritalOpts: [
      { value: "single", label: "Не женат / не замужем" },
      { value: "married", label: "Женат / замужем" },
      { value: "divorced", label: "Разведён / разведена" },
      { value: "widowed", label: "Вдовец / вдова" },
    ],
    rhesusOpts: [
      { value: "positive", label: "Положительный", hint: "Rh+" },
      { value: "negative", label: "Отрицательный", hint: "Rh−" },
    ],
    fluorOpts: [
      { value: "normal", label: "Норма" },
      { value: "abnormal", label: "Отклонения" },
      { value: "pending", label: "Ожидает результата" },
      { value: "expired", label: "Просрочена" },
    ],
    immunOpts: [
      { value: "up_to_date", label: "Актуальная" },
      { value: "partial", label: "Частичная" },
      { value: "expired", label: "Просрочена" },
      { value: "none", label: "Отсутствует" },
    ],
  },
  kz: {
    loadProfileError: "Профильді жүктеу мүмкін болмады",
    personalDataUpdated: "Жеке деректер жаңартылды",
    saveFailed: "Сақтау мүмкін болмады",
    medicalDataUpdated: "Медициналық деректер жаңартылды",
    maxFileSize: "Ең көбі 5 МБ",
    photoUpdated: "Фото жаңартылды",
    photoUploadFailed: "Фотоны жүктеу мүмкін болмады",
    photoDeleted: "Фото жойылды",
    photoDeleteFailed: "Жою мүмкін болмады",
    profileLoadError: "Профильді жүктеу қатесі",
    yearWord: (n: number) => (n === 1 ? "жыл" : "жыл"),
    yearsInSystem: "жүйеде",
    change: "Өзгерту",
    viewPhoto: "Фотоны қарау",
    replacePhoto: "Фотоны ауыстыру",
    uploadPhoto: "Фото жүктеу",
    deletePhoto: "Фотоны жою",
    patient: "Пациент",
    online: "Желіде",
    personalData: "Жеке деректер",
    personalDataSubtitle: "Пациенттің жеке ақпараты",
    protected: "Қорғалған",
    firstName: "Аты",
    lastName: "Тегі",
    phone: "Телефон",
    birthDate: "Туған күні",
    gender: "Жынысы",
    address: "Мекенжай",
    addressPlaceholder: "Көше, үй, пәтер",
    city: "Қала",
    cityPlaceholder: "Алматы",
    language: "Тіл",
    citizenship: "Азаматтығы",
    maritalStatus: "Отбасы жағдайы",
    profession: "Мамандығы",
    professionPlaceholder: "Мамандығыңызды көрсетіңіз",
    searchGender: "Жынысты іздеу...",
    searchLanguage: "Тілді іздеу...",
    searchCountry: "Елді іздеу...",
    search: "Іздеу...",
    medicalData: "Медициналық деректер",
    medicalFilled: "Толтырылды",
    of: "/",
    fields: "өрістен",
    bloodType: "Қан тобы",
    rhesusFactor: "Резус-фактор",
    fluorographyStatus: "Флюорография мәртебесі",
    fluorographyDate: "Флюорография күні",
    immunizationStatus: "Иммундау мәртебесі",
    immunizationDate: "Соңғы иммундау күні",
    searchBloodType: "Топты іздеу...",
    searchRhesus: "Іздеу...",
    searchStatus: "Мәртебені іздеу...",
    genderOpts: [
      { value: "male", label: "Ер", hint: "♂" },
      { value: "female", label: "Әйел", hint: "♀" },
      { value: "other", label: "Басқа" },
    ],
    languageOpts: [
      { value: "kz", label: "Қазақша", hint: "🇰🇿" },
      { value: "ru", label: "Орысша", hint: "🇷🇺" },
      { value: "en", label: "Ағылшынша", hint: "🇬🇧" },
      { value: "other", label: "Басқа" },
    ],
    citizenshipOpts: [
      { value: "Казахстан", label: "Қазақстан", hint: "🇰🇿" },
      { value: "Россия", label: "Ресей", hint: "🇷🇺" },
      { value: "США", label: "АҚШ", hint: "🇺🇸" },
      { value: "Германия", label: "Германия", hint: "🇩🇪" },
      { value: "Другое", label: "Басқа" },
    ],
    maritalOpts: [
      { value: "single", label: "Үйленбеген / тұрмыс құрмаған" },
      { value: "married", label: "Үйленген / тұрмыста" },
      { value: "divorced", label: "Ажырасқан" },
      { value: "widowed", label: "Жесір" },
    ],
    rhesusOpts: [
      { value: "positive", label: "Оң", hint: "Rh+" },
      { value: "negative", label: "Теріс", hint: "Rh−" },
    ],
    fluorOpts: [
      { value: "normal", label: "Норма" },
      { value: "abnormal", label: "Ауытқулар" },
      { value: "pending", label: "Нәтиже күтілуде" },
      { value: "expired", label: "Мерзімі өткен" },
    ],
    immunOpts: [
      { value: "up_to_date", label: "Өзекті" },
      { value: "partial", label: "Жартылай" },
      { value: "expired", label: "Мерзімі өткен" },
      { value: "none", label: "Жоқ" },
    ],
  },
  en: {
    loadProfileError: "Failed to load profile",
    personalDataUpdated: "Personal data updated",
    saveFailed: "Failed to save",
    medicalDataUpdated: "Medical data updated",
    maxFileSize: "Maximum 5 MB",
    photoUpdated: "Photo updated",
    photoUploadFailed: "Failed to upload photo",
    photoDeleted: "Photo deleted",
    photoDeleteFailed: "Failed to delete",
    profileLoadError: "Profile loading error",
    yearWord: (n: number) => (n === 1 ? "year" : "years"),
    yearsInSystem: "in the system",
    change: "Change",
    viewPhoto: "View photo",
    replacePhoto: "Replace photo",
    uploadPhoto: "Upload photo",
    deletePhoto: "Delete photo",
    patient: "Patient",
    online: "Online",
    personalData: "Personal data",
    personalDataSubtitle: "Patient's personal information",
    protected: "Protected",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    birthDate: "Date of birth",
    gender: "Gender",
    address: "Address",
    addressPlaceholder: "Street, house, apartment",
    city: "City",
    cityPlaceholder: "Almaty",
    language: "Language",
    citizenship: "Citizenship",
    maritalStatus: "Marital status",
    profession: "Profession",
    professionPlaceholder: "Specify your profession",
    searchGender: "Search gender...",
    searchLanguage: "Search language...",
    searchCountry: "Search country...",
    search: "Search...",
    medicalData: "Medical data",
    medicalFilled: "Filled",
    of: "of",
    fields: "fields",
    bloodType: "Blood type",
    rhesusFactor: "Rhesus factor",
    fluorographyStatus: "Fluorography status",
    fluorographyDate: "Fluorography date",
    immunizationStatus: "Immunization status",
    immunizationDate: "Last immunization date",
    searchBloodType: "Search type...",
    searchRhesus: "Search...",
    searchStatus: "Search status...",
    genderOpts: [
      { value: "male", label: "Male", hint: "♂" },
      { value: "female", label: "Female", hint: "♀" },
      { value: "other", label: "Other" },
    ],
    languageOpts: [
      { value: "kz", label: "Kazakh", hint: "🇰🇿" },
      { value: "ru", label: "Russian", hint: "🇷🇺" },
      { value: "en", label: "English", hint: "🇬🇧" },
      { value: "other", label: "Other" },
    ],
    citizenshipOpts: [
      { value: "Казахстан", label: "Kazakhstan", hint: "🇰🇿" },
      { value: "Россия", label: "Russia", hint: "🇷🇺" },
      { value: "США", label: "USA", hint: "🇺🇸" },
      { value: "Германия", label: "Germany", hint: "🇩🇪" },
      { value: "Другое", label: "Other" },
    ],
    maritalOpts: [
      { value: "single", label: "Single" },
      { value: "married", label: "Married" },
      { value: "divorced", label: "Divorced" },
      { value: "widowed", label: "Widowed" },
    ],
    rhesusOpts: [
      { value: "positive", label: "Positive", hint: "Rh+" },
      { value: "negative", label: "Negative", hint: "Rh−" },
    ],
    fluorOpts: [
      { value: "normal", label: "Normal" },
      { value: "abnormal", label: "Abnormal" },
      { value: "pending", label: "Pending result" },
      { value: "expired", label: "Expired" },
    ],
    immunOpts: [
      { value: "up_to_date", label: "Up to date" },
      { value: "partial", label: "Partial" },
      { value: "expired", label: "Expired" },
      { value: "none", label: "None" },
    ],
  },
  uz: {
    loadProfileError: "Profilni yuklab bo'lmadi",
    personalDataUpdated: "Shaxsiy ma'lumotlar yangilandi",
    saveFailed: "Saqlab bo'lmadi",
    medicalDataUpdated: "Tibbiy ma'lumotlar yangilandi",
    maxFileSize: "Maksimum 5 MB",
    photoUpdated: "Surat yangilandi",
    photoUploadFailed: "Suratni yuklab bo'lmadi",
    photoDeleted: "Surat o'chirildi",
    photoDeleteFailed: "O'chirib bo'lmadi",
    profileLoadError: "Profilni yuklashda xatolik",
    yearWord: (n: number) => (n === 1 ? "yil" : "yil"),
    yearsInSystem: "tizimda",
    change: "O'zgartirish",
    viewPhoto: "Suratni ko'rish",
    replacePhoto: "Suratni almashtirish",
    uploadPhoto: "Surat yuklash",
    deletePhoto: "Suratni o'chirish",
    patient: "Bemor",
    online: "Onlayn",
    personalData: "Shaxsiy ma'lumotlar",
    personalDataSubtitle: "Bemorning shaxsiy ma'lumotlari",
    protected: "Himoyalangan",
    firstName: "Ism",
    lastName: "Familiya",
    phone: "Telefon",
    birthDate: "Tug'ilgan sana",
    gender: "Jinsi",
    address: "Manzil",
    addressPlaceholder: "Ko'cha, uy, kvartira",
    city: "Shahar",
    cityPlaceholder: "Almati",
    language: "Til",
    citizenship: "Fuqaroligi",
    maritalStatus: "Oilaviy holati",
    profession: "Kasbi",
    professionPlaceholder: "Kasbingizni kiriting",
    searchGender: "Jinsni qidirish...",
    searchLanguage: "Tilni qidirish...",
    searchCountry: "Davlatni qidirish...",
    search: "Qidirish...",
    medicalData: "Tibbiy ma'lumotlar",
    medicalFilled: "To'ldirilgan",
    of: "dan",
    fields: "maydon",
    bloodType: "Qon guruhi",
    rhesusFactor: "Rezus-faktor",
    fluorographyStatus: "Flyuorografiya holati",
    fluorographyDate: "Flyuorografiya sanasi",
    immunizationStatus: "Immunizatsiya holati",
    immunizationDate: "So'nggi immunizatsiya sanasi",
    searchBloodType: "Guruhni qidirish...",
    searchRhesus: "Qidirish...",
    searchStatus: "Holatni qidirish...",
    genderOpts: [
      { value: "male", label: "Erkak", hint: "♂" },
      { value: "female", label: "Ayol", hint: "♀" },
      { value: "other", label: "Boshqa" },
    ],
    languageOpts: [
      { value: "kz", label: "Qozoq tili", hint: "🇰🇿" },
      { value: "ru", label: "Rus tili", hint: "🇷🇺" },
      { value: "en", label: "Ingliz tili", hint: "🇬🇧" },
      { value: "other", label: "Boshqa" },
    ],
    citizenshipOpts: [
      { value: "Казахстан", label: "Qozog'iston", hint: "🇰🇿" },
      { value: "Россия", label: "Rossiya", hint: "🇷🇺" },
      { value: "США", label: "AQSh", hint: "🇺🇸" },
      { value: "Германия", label: "Germaniya", hint: "🇩🇪" },
      { value: "Другое", label: "Boshqa" },
    ],
    maritalOpts: [
      { value: "single", label: "Turmush qurmagan" },
      { value: "married", label: "Turmush qurgan" },
      { value: "divorced", label: "Ajrashgan" },
      { value: "widowed", label: "Beva/bevoyaman" },
    ],
    rhesusOpts: [
      { value: "positive", label: "Musbat", hint: "Rh+" },
      { value: "negative", label: "Manfiy", hint: "Rh−" },
    ],
    fluorOpts: [
      { value: "normal", label: "Normal" },
      { value: "abnormal", label: "Og'ishlar" },
      { value: "pending", label: "Natija kutilmoqda" },
      { value: "expired", label: "Muddati o'tgan" },
    ],
    immunOpts: [
      { value: "up_to_date", label: "Dolzarb" },
      { value: "partial", label: "Qisman" },
      { value: "expired", label: "Muddati o'tgan" },
      { value: "none", label: "Yo'q" },
    ],
  },
} as const;

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
  label, value, onChange, icon: Icon, options, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  icon: React.ElementType; options: SelectOption[]; placeholder?: string;
}) {
  const { language } = useLanguage();
  const st = SELECT_TEXT[language as keyof typeof SELECT_TEXT] ?? SELECT_TEXT.ru;
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
          {selected ? selected.label : st.notSpecified}
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
                  <span className="italic">{st.notSpecified}</span>
                </button>
              )}

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-2">
                  <Search className="w-5 h-5 text-gray-300" />
                  <span className="text-sm text-gray-400">{st.nothingFound}</span>
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
}) => {
  const { language } = useLanguage();
  const readonlyLabel = READONLY_TEXT[language as keyof typeof READONLY_TEXT] ?? READONLY_TEXT.ru;
  return (
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
          {readonlyLabel}
        </span>
      )}
    </div>
  </div>
  );
};

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
  const { language } = useLanguage();
  const sb = SAVE_BUTTON_TEXT[language as keyof typeof SAVE_BUTTON_TEXT] ?? SAVE_BUTTON_TEXT.ru;
  return (
    <motion.button
      onClick={onClick} disabled={saving} whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all overflow-hidden"
      style={{ background: color }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 text-green-200" /> : <Save className="w-4 h-4" />}
      {saved ? sb.saved : sb.save}
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function PatientProfileDashboard() {
  const { updateUser } = useAuth();
  const { language } = useLanguage();
  const t = PATIENT_PROFILE_TEXT[language as keyof typeof PATIENT_PROFILE_TEXT] ?? PATIENT_PROFILE_TEXT.ru;
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
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarViewOpen, setAvatarViewOpen] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setAvatarBroken(false); }, [avatarPreview]);

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
    } catch { toast.error(t.loadProfileError); }
    finally { setLoading(false); }
  };

  // Convert empty strings to null so DRF DateField/ChoiceField don't reject them
  const cleanPayload = (obj: Record<string, string>) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]));

  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    try {
      await api.patch("/user-profile/profile/", cleanPayload(personalForm));
      toast.success(t.personalDataUpdated);
      setSavedPersonal(true); setTimeout(() => setSavedPersonal(false), 2500);
    } catch (e: any) {
      const detail = e?.response?.data;
      toast.error(detail ? JSON.stringify(detail) : t.saveFailed);
    }
    finally { setSavingPersonal(false); }
  };

  const handleSaveMedical = async () => {
    setSavingMedical(true);
    try {
      await api.patch("/user-profile/profile/", cleanPayload(medicalForm));
      toast.success(t.medicalDataUpdated);
      setSavedMedical(true); setTimeout(() => setSavedMedical(false), 2500);
    } catch (e: any) {
      const detail = e?.response?.data;
      toast.error(detail ? JSON.stringify(detail) : t.saveFailed);
    }
    finally { setSavingMedical(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.maxFileSize); return; }
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("avatar", file);
      const res = await api.post("/user-profile/avatar/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const resolvedUrl = resolveAvatar(res.data.avatar);
      setAvatarPreview(resolvedUrl);
      updateUser({ avatar: res.data.avatar });
      toast.success(t.photoUpdated);
    } catch {
      toast.error(t.photoUploadFailed);
      setAvatarPreview(resolveAvatar(profile?.avatar));
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDeleteAvatar = async () => {
    setDeleting(true);
    try {
      await api.delete("/user-profile/avatar/");
      setAvatarPreview(null);
      updateUser({ avatar: null });
      toast.success(t.photoDeleted);
    }
    catch { toast.error(t.photoDeleteFailed); }
    finally { setDeleting(false); }
  };

  const { banner, saveBanner } = useBanner(profile?.id);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!profile) return <div className="flex items-center justify-center py-20"><p className="text-red-500 text-sm">{t.profileLoadError}</p></div>;

  const initials = `${personalForm.first_name?.[0] ?? ""}${personalForm.last_name?.[0] ?? ""}`.toUpperCase();
  const yearsInSystem = profile.date_joined
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.date_joined).getTime()) / (1000 * 60 * 60 * 24 * 365)))
    : 0;
  const medFields = Object.values(medicalForm).filter(Boolean).length;
  const medTotal = Object.keys(medicalForm).length;
  const medPct = Math.round((medFields / medTotal) * 100);

  // ── Option sets ──────────────────────────────────────────────
  const genderOpts: SelectOption[] = [...t.genderOpts];
  const languageOpts: SelectOption[] = [...t.languageOpts];
  const citizenshipOpts: SelectOption[] = [...t.citizenshipOpts];
  const maritalOpts: SelectOption[] = [...t.maritalOpts];
  const bloodTypeOpts: SelectOption[] = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"].map((b) => ({
    value: b.replace("−", "-"), label: b,
    hint: b.includes("+") ? "Rh+" : "Rh−",
  }));
  const rhesusOpts: SelectOption[] = [...t.rhesusOpts];
  const fluorOpts: SelectOption[] = [...t.fluorOpts];
  const immunOpts: SelectOption[] = [...t.immunOpts];

  return (
    <div className="w-full space-y-6">

      {/* ── HERO ── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={banner
          ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg, #12263a 0%, #1e263e 30%, #29358f 70%, #3772ff 100%)" }}>
        {banner && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}
        <div className="absolute top-4 right-4 z-10">
          <BannerPicker userId={profile?.id ?? 0} onBannerChange={saveBanner} />
        </div>
        {!banner && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30"
                 style={{ background: "radial-gradient(circle, #3772ff, transparent)" }} />
            <div className="absolute -bottom-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-20"
                 style={{ background: "radial-gradient(circle, #2956bf, transparent)" }} />
            <svg className="absolute right-0 top-0 h-full opacity-5" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
              <defs><pattern id="grid-patient" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
              <rect width="200" height="200" fill="url(#grid-patient)" />
            </svg>
          </div>
        )}

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 px-8 py-8 sm:py-10">
          <div className="relative flex-shrink-0" ref={avatarMenuRef}>
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
                 style={{ background: avatarPreview && !avatarBroken ? "transparent" : "linear-gradient(135deg, #3772ff 0%, #29358f 100%)" }}>
              {avatarPreview && !avatarBroken
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover rounded-[inherit]" onError={() => setAvatarBroken(true)} />
                : <div className="w-full h-full flex items-center justify-center"><span className="text-white font-black text-4xl">{initials}</span></div>}
              {(uploading || deleting) && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>}
            </div>
            <button onClick={() => !uploading && !deleting && setAvatarMenuOpen(v => !v)} disabled={uploading || deleting}
              className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <span className="text-white text-[10px] font-bold">{t.change}</span>
            </button>
            {avatarMenuOpen && (
              <div className="absolute top-0 left-full ml-3 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[170px]">
                {avatarPreview && (
                  <button onClick={() => { setAvatarViewOpen(true); setAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    {t.viewPhoto}
                  </button>
                )}
                <button onClick={() => { fileRef.current?.click(); setAvatarMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${avatarPreview ? "border-t border-gray-100" : ""}`}>
                  <Camera className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {avatarPreview ? t.replacePhoto : t.uploadPhoto}
                </button>
                {avatarPreview && (
                  <button onClick={() => { handleDeleteAvatar(); setAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100">
                    <Trash2 className="w-4 h-4 flex-shrink-0" /> {t.deletePhoto}
                  </button>
                )}
              </div>
            )}
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
                <FontAwesomeIcon icon={faUserInjured} className="text-xs" /> {t.patient}
              </span>
              {yearsInSystem > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 border border-indigo-400/30"
                      style={{ background: "rgba(96,72,245,0.2)" }}>
                  <Clock className="w-3 h-3" /> {yearsInSystem} {t.yearWord(yearsInSystem)} {t.yearsInSystem}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-400/30"
                    style={{ background: "rgba(16,185,129,0.15)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t.online}
              </span>
            </div>
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
              <h2 className="text-sm font-bold text-gray-800">{t.personalData}</h2>
              <p className="text-xs text-gray-400">{t.personalDataSubtitle}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100">
            <Lock className="w-3 h-3" /> {t.protected}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label={t.firstName} value={personalForm.first_name} onChange={(v) => setPersonalForm((p) => ({ ...p, first_name: v }))} icon={User} />
          <InputField label={t.lastName} value={personalForm.last_name} onChange={(v) => setPersonalForm((p) => ({ ...p, last_name: v }))} icon={User} />
          <InputField label="Email" value={profile.email} icon={Mail} readOnly />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.phone}</label>
            <PhoneInput
              value={personalForm.phone ?? ""}
              onChange={(e164) => setPersonalForm((p) => ({ ...p, phone: e164 }))}
              defaultCountry="KZ"
            />
          </div>
          <InputField label={t.birthDate} value={personalForm.birth_date} onChange={(v) => setPersonalForm((p) => ({ ...p, birth_date: v }))} icon={Calendar} type="date" />

          <SelectWrapper>
            <SearchableSelect label={t.gender} value={personalForm.gender} onChange={(v) => setPersonalForm((p) => ({ ...p, gender: v }))} icon={Users} options={genderOpts} placeholder={t.searchGender} />
          </SelectWrapper>

          <InputField label={t.address} value={personalForm.address} onChange={(v) => setPersonalForm((p) => ({ ...p, address: v }))} icon={MapPin} placeholder={t.addressPlaceholder} />
          <InputField label={t.city} value={personalForm.city} onChange={(v) => setPersonalForm((p) => ({ ...p, city: v }))} icon={MapPin} placeholder={t.cityPlaceholder} />

          <SelectWrapper>
            <SearchableSelect label={t.language} value={personalForm.language} onChange={(v) => setPersonalForm((p) => ({ ...p, language: v }))} icon={Languages} options={languageOpts} placeholder={t.searchLanguage} />
          </SelectWrapper>

          <SelectWrapper>
            <SearchableSelect label={t.citizenship} value={personalForm.citizenship} onChange={(v) => setPersonalForm((p) => ({ ...p, citizenship: v }))} icon={Flag} options={citizenshipOpts} placeholder={t.searchCountry} />
          </SelectWrapper>

          <SelectWrapper>
            <SearchableSelect label={t.maritalStatus} value={personalForm.marital_status} onChange={(v) => setPersonalForm((p) => ({ ...p, marital_status: v }))} icon={Heart} options={maritalOpts} placeholder={t.search} />
          </SelectWrapper>

          <InputField label={t.profession} value={personalForm.profession} onChange={(v) => setPersonalForm((p) => ({ ...p, profession: v }))} icon={Briefcase} placeholder={t.professionPlaceholder} />
        </div>

        <div className="mt-6 flex justify-end">
          <SaveButton saving={savingPersonal} saved={savedPersonal} onClick={handleSavePersonal} color="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
        </div>
      </Card>

      {/* ── MEDICAL DETAILS ── */}
      <Card accentColor="linear-gradient(to bottom, #3772ff, #2956bf)" delay={0.1}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ebf1ff, #d6e4ff)" }}>
              <Droplet className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">{t.medicalData}</h2>
              <p className="text-xs text-gray-400">{t.medicalFilled} {medPct}% · {medFields} {t.of} {medTotal} {t.fields}</p>
            </div>
          </div>
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${medPct}%`, background: "linear-gradient(135deg, #3772ff, #2956bf)" }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectWrapper>
            <SearchableSelect label={t.bloodType} value={medicalForm.blood_type} onChange={(v) => setMedicalForm((p) => ({ ...p, blood_type: v }))} icon={Droplet} options={bloodTypeOpts} placeholder={t.searchBloodType} />
          </SelectWrapper>

          <SelectWrapper>
            <SearchableSelect label={t.rhesusFactor} value={medicalForm.rhesus_factor} onChange={(v) => setMedicalForm((p) => ({ ...p, rhesus_factor: v }))} icon={Droplet} options={rhesusOpts} placeholder={t.searchRhesus} />
          </SelectWrapper>

          <SelectWrapper>
            <SearchableSelect label={t.fluorographyStatus} value={medicalForm.fluorography_status} onChange={(v) => setMedicalForm((p) => ({ ...p, fluorography_status: v }))} icon={FileText} options={fluorOpts} placeholder={t.searchStatus} />
          </SelectWrapper>

          <InputField label={t.fluorographyDate} value={medicalForm.fluorography_date} onChange={(v) => setMedicalForm((p) => ({ ...p, fluorography_date: v }))} icon={Calendar} type="date" />

          <SelectWrapper>
            <SearchableSelect label={t.immunizationStatus} value={medicalForm.immunization_status} onChange={(v) => setMedicalForm((p) => ({ ...p, immunization_status: v }))} icon={Shield} options={immunOpts} placeholder={t.searchStatus} />
          </SelectWrapper>

          <InputField label={t.immunizationDate} value={medicalForm.immunization_date} onChange={(v) => setMedicalForm((p) => ({ ...p, immunization_date: v }))} icon={Calendar} type="date" />
        </div>

        <div className="mt-6 flex justify-end">
          <SaveButton saving={savingMedical} saved={savedMedical} onClick={handleSaveMedical} color="linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" />
        </div>
      </Card>

      {/* ── INSURANCE STATUS (hidden until backend support is added) ── */}
      {/* <motion.div ...> ... </motion.div> */}

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
