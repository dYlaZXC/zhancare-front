"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendar,
  faVideo,
  faHospital,
  faChevronRight,
  faChevronLeft,
  faCheckCircle,
  faSpinner,
  faUserMd,
  faStar,
  faClock,
  faStethoscope,
  faBriefcaseMedical,
  faSearch,
  faTimes,
  faSortAmountDown,
  faRightToBracket,
  faUserPlus,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────
type ConsultationType = "online" | "offline" | "diagnostics";

interface SlotInfo {
  start: string;
  end: string;
  status: "free" | "booked";
}

interface DoctorWithSlots {
  doctor_id: number;
  first_name: string;
  last_name: string;
  specialization: string | null;
  preferred_consultation_duration: number;
  slots: SlotInfo[];
  rating?: number;
  years_of_experience?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getNextDays(n = 14) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      value: d.toLocaleDateString("sv-SE"),
      dayLabel: d.toLocaleDateString("ru-RU", { weekday: "short" }),
      dateLabel: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      isToday: i === 0,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return days;
}

function formatScheduledAt(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`);
  return d.toLocaleString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-teal-500 to-cyan-600",
  "from-emerald-500 to-green-600",
];

function SpecDropdown({
  specializations,
  value,
  onChange,
}: {
  specializations: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      query.trim()
        ? specializations.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
        : specializations,
    [specializations, query]
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => { setOpen((o) => !o); setQuery(""); }}
        className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
          value
            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        <FontAwesomeIcon icon={faStethoscope} className="text-[10px]" />
        <span className="truncate">{value ?? "Специализация"}</span>
        {value ? (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="ml-auto w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center shrink-0"
          >
            <FontAwesomeIcon icon={faTimes} className="text-[8px]" />
          </span>
        ) : (
          <FontAwesomeIcon icon={faChevronRight} className={`ml-auto text-[9px] transition-transform ${open ? "rotate-90" : ""}`} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-30 overflow-hidden"
          >
            {/* Search inside dropdown */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-[11px] pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск специализации..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:border-blue-400 text-gray-700 placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto">
              <button
                onClick={() => { onChange(null); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                  value === null ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Все специализации
              </button>
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">Ничего не найдено</p>
              ) : (
                filtered.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => { onChange(spec); setOpen(false); setQuery(""); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                      value === spec ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {spec}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FontAwesomeIcon
          key={s}
          icon={faStar}
          className={`text-[10px] ${s <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const router = useRouter();
  const { token, user, openAuth } = useAuth();
  const isLoggedIn = !!token && !!user;

  const [step, setStep] = useState(1);
  const [consultationType, setConsultationType] = useState<ConsultationType>("online");
  const [selectedDate, setSelectedDate] = useState("");
  const [doctors, setDoctors] = useState<DoctorWithSlots[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithSlots | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpec, setFilterSpec] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "rating" | "experience" | "slots">("default");

  const specializations = useMemo(() => {
    const specs = doctors.map((d) => d.specialization).filter(Boolean) as string[];
    return Array.from(new Set(specs));
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    let list = [...doctors];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
          (d.specialization?.toLowerCase().includes(q) ?? false)
      );
    }
    if (filterSpec) {
      list = list.filter((d) => d.specialization === filterSpec);
    }
    if (sortBy === "rating") {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "experience") {
      list.sort((a, b) => (b.years_of_experience ?? 0) - (a.years_of_experience ?? 0));
    } else if (sortBy === "slots") {
      list.sort(
        (a, b) =>
          b.slots.filter((s) => s.status === "free").length -
          a.slots.filter((s) => s.status === "free").length
      );
    }
    return list;
  }, [doctors, searchQuery, filterSpec, sortBy]);
  const [result, setResult] = useState<{
    consultation_id: number;
    meeting_id: string;
    access_code: string;
    scheduled_at: string;
    doctor: { name: string; specialization: string | null };
  } | null>(null);

  const days = getNextDays();

  useEffect(() => {
    if (!selectedDate) return;
    setDoctors([]);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setSearchQuery("");
    setFilterSpec(null);
    setSortBy("default");
    setLoadingDoctors(true);
    api
      .get("/schedule/day/", { params: { date: selectedDate, consultation_type: consultationType === "diagnostics" ? "offline" : consultationType } })
      .then(({ data }) => {
        const withSlots = (data.doctors || []).filter(
          (d: DoctorWithSlots) => d.slots && d.slots.some((s) => s.status === "free")
        );
        setDoctors(withSlots);
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, [selectedDate, consultationType]);

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedSlot || !selectedDate) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/consultations/schedule/", {
        doctor_id: selectedDoctor.doctor_id,
        scheduled_date: selectedDate,
        scheduled_time: selectedSlot.start,
        symptoms,
        consultation_type: consultationType === "diagnostics" ? "offline" : consultationType,
      });
      setResult(data);
      setStep(4);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Ошибка при записи";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepProgress = step < 4 ? ((step - 1) / 2) * 100 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => (step > 1 && step < 4 ? setStep(step - 1) : router.back())}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline text-sm font-medium">Назад</span>
          </button>

          <h1 className="text-base font-bold text-gray-900 tracking-tight">
            Запланировать консультацию
          </h1>

          {/* Progress */}
          <div className="flex items-center gap-2 w-20">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                animate={{ width: `${stepProgress}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-400 shrink-0">
              {step < 4 ? `${step}/3` : "✓"}
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
        <AnimatePresence mode="wait">

          {/* ══════════════ STEP 1 ══════════════ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* Consultation type */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                  Тип консультации
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(
                    [
                      { key: "online",      icon: faVideo,        label: "Видеоконсультация", desc: "Видеозвонок",          bg: "#1d4ed8", activeShadow: "rgba(29,78,216,0.35)" },
                      { key: "offline",     icon: faHospital,     label: "Приём в клинике", desc: "Личный приём",         bg: "#0f766e", activeShadow: "rgba(15,118,110,0.35)" },
                      { key: "diagnostics", icon: faStethoscope,  label: "Диагностика", desc: "Анализы и обследование", bg: "#7c3aed", activeShadow: "rgba(124,58,237,0.35)" },
                    ] as const
                  ).map(({ key, icon, label, desc, bg, activeShadow }) => {
                    const isActive = consultationType === key;
                    return (
                      <motion.button
                        key={key}
                        whileHover={!isActive ? { y: -2, scale: 1.02 } : {}}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setConsultationType(key);
                          setDoctors([]);
                          setSelectedDoctor(null);
                          setSelectedSlot(null);
                        }}
                        className="group relative flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl overflow-hidden text-left transition-all duration-200"
                        style={
                          isActive
                            ? { backgroundColor: bg, boxShadow: `0 8px 24px ${activeShadow}`, outline: "2px solid white", outlineOffset: "2px" }
                            : { backgroundColor: "#f8fafc", border: "2px solid #e2e8f0" }
                        }
                      >
                        {/* hover overlay for inactive */}
                        {!isActive && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-200 rounded-2xl" />
                        )}
                        {/* active overlay shimmer */}
                        {isActive && (
                          <div className="absolute inset-0 bg-white/[0.06] rounded-2xl" />
                        )}

                        <div
                          className="relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                          style={
                            isActive
                              ? { background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)" }
                              : { background: "#eff6ff", border: "1px solid #dbeafe" }
                          }
                        >
                          <FontAwesomeIcon
                            icon={icon}
                            className="text-lg"
                            style={{ color: isActive ? "#fff" : bg }}
                          />
                        </div>

                        <div className="relative flex-1 min-w-0">
                          <p className="text-sm font-bold leading-tight" style={{ color: isActive ? "#fff" : "#1e293b" }}>{label}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: isActive ? "rgba(255,255,255,0.65)" : "#94a3b8" }}>{desc}</p>
                        </div>

                        {isActive && (
                          <div className="relative flex-shrink-0">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Date picker */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                  Выберите дату
                </p>
                <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ background: "#f8fafc" }}>
                  {/* Week rows */}
                  {[days.slice(0, 7), days.slice(7)].map((week, wi) => (
                    <div key={wi} className={`grid grid-cols-7 gap-1 p-2 ${wi === 0 ? "border-b border-gray-100" : ""}`}>
                      {week.map((day) => {
                        const isSelected = selectedDate === day.value;
                        return (
                          <motion.button
                            key={day.value}
                            whileHover={!isSelected ? { scale: 1.08 } : {}}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setSelectedDate(day.value)}
                            className="relative flex flex-col items-center py-2.5 px-1 rounded-xl transition-all duration-200"
                            style={
                              isSelected
                                ? { background: "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)", boxShadow: "0 4px 12px rgba(29,78,216,0.4)" }
                                : day.isWeekend
                                ? { background: "transparent" }
                                : { background: "transparent" }
                            }
                          >
                            {day.isToday && !isSelected && (
                              <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                            )}
                            <span className="text-[9px] font-bold uppercase" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : day.isWeekend ? "#cbd5e1" : "#94a3b8" }}>
                              {day.dayLabel}
                            </span>
                            <span className="text-sm font-extrabold mt-0.5 leading-none" style={{ color: isSelected ? "#fff" : day.isWeekend ? "#cbd5e1" : "#1e293b" }}>
                              {day.dateLabel.split(" ")[0]}
                            </span>
                            <span className="text-[9px] mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.6)" : "#cbd5e1" }}>
                              {day.dateLabel.split(" ")[1]}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(2)}
                disabled={!selectedDate}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                style={selectedDate
                  ? { background: "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)", boxShadow: "0 8px 24px rgba(29,78,216,0.35)" }
                  : { background: "#e2e8f0" }
                }
              >
                <FontAwesomeIcon icon={faUserMd} />
                Показать врачей
                <FontAwesomeIcon icon={faChevronRight} className="opacity-70" />
              </motion.button>
            </motion.div>
          )}

          {/* ══════════════ STEP 2 ══════════════ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Context bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  consultationType === "online" ? "bg-blue-100 text-blue-700"
                  : consultationType === "offline" ? "bg-teal-100 text-teal-700"
                  : "bg-purple-100 text-purple-700"
                }`}>
                  <FontAwesomeIcon icon={consultationType === "online" ? faVideo : consultationType === "offline" ? faHospital : faStethoscope} />
                  {consultationType === "online" ? "Видеоконсультация" : consultationType === "offline" ? "Приём в клинике" : "Диагностика"}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600">
                  <FontAwesomeIcon icon={faCalendar} />
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                </div>
                {!loadingDoctors && doctors.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-700">
                    {filteredDoctors.length !== doctors.length
                      ? `${filteredDoctors.length} из ${doctors.length}`
                      : doctors.length}{" "}
                    врач{doctors.length === 1 ? "" : doctors.length <= 4 ? "а" : "ей"}
                  </div>
                )}
              </div>

              <p className="text-lg font-bold text-gray-900 px-1">Выберите врача и время</p>

              {/* ── Filters ── */}
              {!loadingDoctors && doctors.length > 0 && (
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по имени или специализации..."
                      className="w-full pl-10 pr-10 py-3 bg-white border-2 border-gray-100 rounded-2xl text-sm text-gray-800 placeholder:text-gray-300 focus:border-blue-400 focus:outline-none transition-colors shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-[9px] text-gray-500" />
                      </button>
                    )}
                  </div>

                  {/* Specialization dropdown + Sort */}
                  <div className="flex items-center gap-2">
                    {/* Spec searchable dropdown */}
                    {specializations.length > 0 && (
                      <SpecDropdown
                        specializations={specializations}
                        value={filterSpec}
                        onChange={setFilterSpec}
                      />
                    )}

                    {/* Sort dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="appearance-none pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none focus:border-blue-400 cursor-pointer hover:border-gray-300 transition-colors"
                      >
                        <option value="default">По умолчанию</option>
                        <option value="rating">По рейтингу</option>
                        <option value="experience">По опыту</option>
                        <option value="slots">По слотам</option>
                      </select>
                      <FontAwesomeIcon
                        icon={faSortAmountDown}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* No results after filtering */}
                  {filteredDoctors.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-10 flex flex-col items-center gap-3 text-center px-6">
                      <FontAwesomeIcon icon={faSearch} className="text-2xl text-gray-200" />
                      <p className="text-sm font-semibold text-gray-600">Ничего не найдено</p>
                      <button
                        onClick={() => { setSearchQuery(""); setFilterSpec(null); }}
                        className="text-xs text-blue-500 font-semibold hover:underline"
                      >
                        Сбросить фильтры
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Loading */}
              {loadingDoctors && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <FontAwesomeIcon icon={faSpinner} className="text-2xl text-blue-500 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Загружаем врачей</p>
                    <p className="text-xs text-gray-400 mt-1">Это займёт секунду</p>
                  </div>
                </div>
              )}

              {/* Empty */}
              {!loadingDoctors && doctors.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-4 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUserMd} className="text-2xl text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Нет доступных врачей</p>
                    <p className="text-xs text-gray-400 mt-1">Попробуйте другую дату или тип консультации</p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="mt-1 px-5 py-2.5 rounded-xl border-2 border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                    Изменить дату
                  </button>
                </div>
              )}

              {/* Doctor list */}
              {!loadingDoctors && filteredDoctors.length > 0 && (
                <div className="space-y-3">
                  {filteredDoctors.map((doc, idx) => {
                    const isSelected = selectedDoctor?.doctor_id === doc.doctor_id;
                    const freeSlots = doc.slots.filter((s) => s.status === "free");
                    const grad = AVATAR_GRADIENTS[doc.doctor_id % AVATAR_GRADIENTS.length];

                    return (
                      <motion.div
                        key={doc.doctor_id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? "border-blue-500 shadow-xl shadow-blue-100/60"
                            : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-md shadow-sm"
                        }`}
                      >
                        {/* Card header */}
                        <button
                          onClick={() => {
                            setSelectedDoctor(isSelected ? null : doc);
                            setSelectedSlot(null);
                          }}
                          className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                            isSelected ? "bg-gradient-to-r from-blue-50 to-indigo-50/60" : "bg-white"
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg`}>
                            {doc.first_name.charAt(0)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">
                              {doc.first_name} {doc.last_name}
                            </p>
                            {doc.specialization && (
                              <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                                <FontAwesomeIcon icon={faStethoscope} className="text-[10px]" />
                                {doc.specialization}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {doc.rating != null && doc.rating > 0 && (
                                <StarRating rating={doc.rating} />
                              )}
                              {doc.years_of_experience != null && doc.years_of_experience > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                  <FontAwesomeIcon icon={faBriefcaseMedical} className="text-[9px]" />
                                  {doc.years_of_experience} лет
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                              freeSlots.length > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {freeSlots.length} слот{freeSlots.length === 1 ? "" : freeSlots.length <= 4 ? "а" : "ов"}
                            </span>
                            <FontAwesomeIcon
                              icon={isSelected ? faChevronLeft : faChevronRight}
                              className={`text-xs transition-colors ${isSelected ? "text-blue-500" : "text-gray-300"}`}
                            />
                          </div>
                        </button>

                        {/* Time slots */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-blue-100 bg-blue-50/40 px-4 pb-4 pt-3">
                                <p className="text-[11px] font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                                  <FontAwesomeIcon icon={faClock} className="text-blue-400" />
                                  Доступное время
                                  <span className="text-gray-400 font-normal">· {doc.preferred_consultation_duration} мин</span>
                                </p>
                                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                                  {freeSlots.map((slot) => {
                                    const isSlotSelected = selectedSlot?.start === slot.start;
                                    return (
                                      <motion.button
                                        key={slot.start}
                                        whileTap={{ scale: 0.93 }}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                                          isSlotSelected
                                            ? "bg-gradient-to-b from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200"
                                            : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
                                        }`}
                                      >
                                        {slot.start}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {selectedDoctor && selectedSlot && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-200/60 hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5"
                >
                  Продолжить
                  <FontAwesomeIcon icon={faChevronRight} className="text-blue-200" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ══════════════ STEP 3 ══════════════ */}
          {step === 3 && selectedDoctor && selectedSlot && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                Детали записи
              </p>

              {/* Booking summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Doctor banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[selectedDoctor.doctor_id % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white/30`}>
                    {selectedDoctor.first_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      {selectedDoctor.first_name} {selectedDoctor.last_name}
                    </p>
                    {selectedDoctor.specialization && (
                      <p className="text-blue-200 text-xs mt-0.5">{selectedDoctor.specialization}</p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="px-5 py-4 space-y-3">
                  {[
                    {
                      icon: faCalendar,
                      label: "Дата и время",
                      value: formatScheduledAt(selectedDate, selectedSlot.start),
                      color: "text-blue-500",
                    },
                    {
                      icon: consultationType === "online" ? faVideo : consultationType === "offline" ? faHospital : faStethoscope,
                      label: "Формат",
                      value: `${consultationType === "online" ? "Онлайн-консультация" : consultationType === "offline" ? "Личный приём" : "Диагностика"} · ${selectedDoctor.preferred_consultation_duration} мин`,
                      color: consultationType === "online" ? "text-blue-500" : consultationType === "offline" ? "text-teal-500" : "text-purple-500",
                    },
                  ].map(({ icon, label, value, color }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center ${color} shrink-0 mt-0.5`}>
                        <FontAwesomeIcon icon={icon} className="text-sm" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Жалобы{" "}
                  <span className="font-normal text-gray-400 text-xs">— необязательно</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">Опишите симптомы, чтобы врач мог подготовиться</p>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Например: головная боль, температура 37.5, началось 3 дня назад..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-400 focus:outline-none resize-none text-sm text-gray-700 placeholder:text-gray-300 bg-gray-50/50 transition-colors"
                />
              </div>

              {isLoggedIn ? (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-200/60 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2.5"
                  >
                    {submitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Создаём запись...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Подтвердить запись
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 px-4">
                    После подтверждения вы получите код доступа на email
                  </p>
                </>
              ) : (
                /* ── Auth gate ── */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>
                    <FontAwesomeIcon icon={faLock} className="text-xl text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Войдите в аккаунт</h3>
                    <p className="text-sm text-gray-500 mt-1">Для записи к врачу необходимо войти или зарегистрироваться</p>
                  </div>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => openAuth("login", true)}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                      style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)", boxShadow: "0 6px 20px rgba(29,78,216,0.3)" }}
                    >
                      <FontAwesomeIcon icon={faRightToBracket} />
                      Войти
                    </button>
                    <button
                      onClick={() => openAuth("register", true)}
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-gray-50"
                      style={{ border: "2px solid #1d4ed8", color: "#1d4ed8" }}
                    >
                      <FontAwesomeIcon icon={faUserPlus} />
                      Зарегистрироваться
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Вход по Email или номеру телефона</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════ STEP 4 ══════════════ */}
          {step === 4 && result && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              {/* Success banner */}
              <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl p-8 text-center text-white shadow-2xl shadow-emerald-200/60">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, delay: 0.15 }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-white" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h2 className="text-2xl font-extrabold mb-1">Запись создана!</h2>
                  <p className="text-emerald-100 text-sm">Консультация успешно запланирована</p>
                </motion.div>
              </div>

              {/* Details card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-5 pt-5 pb-4 space-y-3">
                  {[
                    { label: "Врач", value: result.doctor.name + (result.doctor.specialization ? ` · ${result.doctor.specialization}` : "") },
                    {
                      label: "Время", value: new Date(result.scheduled_at).toLocaleString("ru-RU", {
                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      }),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-400 font-medium shrink-0">{label}</span>
                      <span className="text-sm font-semibold text-gray-800 text-right">{value}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400 font-medium">Код доступа</span>
                    <span className="font-mono font-extrabold text-lg text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl tracking-[0.2em] border border-blue-100">
                      {result.access_code}
                    </span>
                  </div>

                  {/* Consultation link */}
                  {result.meeting_id && (
                    <div className="pt-3 border-t border-gray-50">
                      <p className="text-xs text-gray-400 font-medium mb-2">Ссылка на консультацию</p>
                      <a
                        href={`/video-call/patient?meetingId=${result.meeting_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                        style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #bfdbfe" }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)" }}>
                          <FontAwesomeIcon icon={faVideo} className="text-white text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-blue-700">Перейти к консультации</p>
                          <p className="text-xs text-blue-400 truncate">/video-call/patient?meetingId={result.meeting_id.slice(0, 8)}...</p>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} className="text-blue-400 text-xs group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50/60 border-t border-amber-100 px-5 py-3">
                  <p className="text-xs text-amber-700 font-medium text-center">
                    Код доступа и ссылка отправлены на ваш email
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-3"
              >
                <button
                  onClick={() => router.push("/")}
                  className="py-3.5 border-2 border-gray-200 text-gray-600 rounded-2xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  На главную
                </button>
                <button
                  onClick={() => router.push("/patient")}
                  className="py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-200/60 hover:scale-[1.02] transition-all"
                >
                  Мои записи
                </button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
