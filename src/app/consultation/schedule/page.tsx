"use client";

import { useState, useEffect } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api } from "@/utils/api";

// ── Types ─────────────────────────────────────────────────────────────────────
type ConsultationType = "online" | "offline";

interface SlotInfo {
  start: string; // "HH:MM"
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getNextDays(n = 14) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      value: d.toLocaleDateString("sv-SE"),
      dayLabel: d.toLocaleDateString("ru-RU", { weekday: "short" }),
      dateLabel: d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      }),
      isToday: i === 0,
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const router = useRouter();

  // Step state: 1=type+date, 2=doctor+slot, 3=symptoms+confirm, 4=success
  const [step, setStep] = useState(1);

  // Selections
  const [consultationType, setConsultationType] =
    useState<ConsultationType>("online");
  const [selectedDate, setSelectedDate] = useState("");
  const [doctors, setDoctors] = useState<DoctorWithSlots[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithSlots | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [symptoms, setSymptoms] = useState("");

  // UI states
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    consultation_id: number;
    access_code: string;
    scheduled_at: string;
    doctor: { name: string; specialization: string | null };
  } | null>(null);

  const days = getNextDays();

  // Load doctors+slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    setDoctors([]);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setLoadingDoctors(true);
    api
      .get("/schedule/day/", {
        params: {
          date: selectedDate,
          consultation_type: consultationType,
        },
      })
      .then(({ data }) => {
        const withSlots = (data.doctors || []).filter(
          (d: DoctorWithSlots) =>
            d.slots && d.slots.some((s) => s.status === "free")
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
        consultation_type: consultationType,
      });
      setResult(data);
      setStep(4);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Ошибка при записи";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <button
            onClick={() => (step > 1 && step < 4 ? setStep(step - 1) : router.back())}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="hidden sm:inline">Назад</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            Запланировать консультацию
          </h1>
          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  s < step
                    ? "bg-blue-500"
                    : s === step
                    ? "bg-blue-600 scale-110"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: Type + Date ═══ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              {/* Type */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Тип консультации
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { key: "online", icon: faVideo, label: "Онлайн", desc: "Видеозвонок" },
                      { key: "offline", icon: faHospital, label: "Офлайн", desc: "Личный приём" },
                    ] as const
                  ).map(({ key, icon, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setConsultationType(key);
                        setDoctors([]);
                        setSelectedDoctor(null);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                        consultationType === key
                          ? key === "online"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <FontAwesomeIcon icon={icon} className="text-2xl" />
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs opacity-70">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Выберите дату
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {days.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => setSelectedDate(day.value)}
                      className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 transition-all ${
                        selectedDate === day.value
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-gray-200 hover:border-blue-300 text-gray-700"
                      }`}
                    >
                      <span className="text-xs font-medium">{day.dayLabel}</span>
                      <span className="text-sm font-bold mt-0.5">{day.dateLabel}</span>
                      {day.isToday && (
                        <span className={`text-[10px] mt-0.5 font-semibold ${selectedDate === day.value ? "text-blue-200" : "text-blue-500"}`}>
                          Сегодня
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedDate}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                Показать врачей
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </motion.div>
          )}

          {/* ═══ STEP 2: Doctor + Slot ═══ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              {/* Summary bar */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-3 text-sm text-gray-600">
                <FontAwesomeIcon
                  icon={consultationType === "online" ? faVideo : faHospital}
                  className={consultationType === "online" ? "text-blue-500" : "text-purple-500"}
                />
                <span className="font-semibold">
                  {consultationType === "online" ? "Онлайн" : "Офлайн"}
                </span>
                <span className="text-gray-300">·</span>
                <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                <span>
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "ru-RU",
                    { day: "numeric", month: "long" }
                  )}
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 px-1">
                Выберите врача и время
              </h2>

              {loadingDoctors ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3 text-gray-400">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="text-3xl animate-spin text-blue-400"
                  />
                  <span className="text-sm">Загружаем доступных врачей...</span>
                </div>
              ) : doctors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3 text-gray-400">
                  <FontAwesomeIcon icon={faUserMd} className="text-4xl opacity-30" />
                  <p className="text-sm font-medium">
                    Нет доступных врачей на эту дату
                  </p>
                  <p className="text-xs text-gray-400">
                    Попробуйте другую дату или тип консультации
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="mt-2 px-5 py-2 rounded-xl border-2 border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-1.5" />
                    Изменить дату
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctor?.doctor_id === doc.doctor_id;
                    const freeSlots = doc.slots.filter((s) => s.status === "free");
                    return (
                      <div
                        key={doc.doctor_id}
                        className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${
                          isSelected
                            ? "border-blue-500"
                            : "border-gray-100 hover:border-blue-200"
                        }`}
                      >
                        {/* Doctor card header */}
                        <button
                          onClick={() => {
                            setSelectedDoctor(isSelected ? null : doc);
                            setSelectedSlot(null);
                          }}
                          className="w-full flex items-center gap-4 p-4 text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {doc.first_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900">
                              {doc.first_name} {doc.last_name}
                            </p>
                            {doc.specialization && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <FontAwesomeIcon
                                  icon={faStethoscope}
                                  className="text-xs"
                                />
                                {doc.specialization}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                              {freeSlots.length} слот{freeSlots.length === 1 ? "" : freeSlots.length <= 4 ? "а" : "ов"}
                            </span>
                            <FontAwesomeIcon
                              icon={isSelected ? faChevronLeft : faChevronRight}
                              className="text-gray-400 text-sm"
                            />
                          </div>
                        </button>

                        {/* Slots — shown when doctor is selected */}
                        {isSelected && (
                          <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                              <FontAwesomeIcon icon={faClock} />
                              Доступное время
                              <span className="ml-1 text-gray-400">
                                ({doc.preferred_consultation_duration} мин)
                              </span>
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {freeSlots.map((slot) => (
                                <button
                                  key={slot.start}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-2 px-1 rounded-xl border-2 text-sm font-semibold transition-all ${
                                    selectedSlot?.start === slot.start
                                      ? "border-blue-500 bg-blue-600 text-white"
                                      : "border-gray-200 text-gray-700 hover:border-blue-300"
                                  }`}
                                >
                                  {slot.start}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedDoctor && selectedSlot && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setStep(3)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  Продолжить
                  <FontAwesomeIcon icon={faChevronRight} />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 3: Symptoms + Confirm ═══ */}
          {step === 3 && selectedDoctor && selectedSlot && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-5"
            >
              {/* Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="text-lg font-bold text-gray-900">
                  Детали записи
                </h2>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faUserMd}
                      className="text-blue-400 w-4"
                    />
                    <span className="font-semibold">
                      {selectedDoctor.first_name} {selectedDoctor.last_name}
                    </span>
                    {selectedDoctor.specialization && (
                      <span className="text-gray-400">
                        · {selectedDoctor.specialization}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-blue-400 w-4"
                    />
                    <span>
                      {formatScheduledAt(selectedDate, selectedSlot.start)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={consultationType === "online" ? faVideo : faHospital}
                      className="text-blue-400 w-4"
                    />
                    <span>
                      {consultationType === "online" ? "Онлайн" : "Офлайн"} ·{" "}
                      {selectedDoctor.preferred_consultation_duration} мин
                    </span>
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Опишите жалобы{" "}
                  <span className="font-normal text-gray-400">(необязательно)</span>
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Расскажите, что вас беспокоит, чтобы врач мог подготовиться к приёму..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-sm"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Запись...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Подтвердить запись
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                После подтверждения вы получите код доступа на email. Врач
                сможет начать звонок в назначенное время.
              </p>
            </motion.div>
          )}

          {/* ═══ STEP 4: Success ═══ */}
          {step === 4 && result && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-center"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-4xl" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Запись создана!</h2>
                <p className="text-green-100">
                  Консультация успешно запланирована
                </p>
              </div>

              <div className="p-8 space-y-5">
                <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm text-gray-700 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Врач</span>
                    <span className="font-semibold">
                      {result.doctor.name}
                      {result.doctor.specialization && (
                        <span className="text-gray-400 font-normal ml-1">
                          · {result.doctor.specialization}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Время</span>
                    <span className="font-semibold">
                      {new Date(result.scheduled_at).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Код доступа</span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg tracking-widest">
                      {result.access_code}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Код доступа и ссылка на консультацию отправлены на ваш email
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push("/")}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    На главную
                  </button>
                  <button
                    onClick={() => router.push("/patient")}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                  >
                    Мои консультации
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
