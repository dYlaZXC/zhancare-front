"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  FlaskConical,
  UserCircle,
  LogIn,
  UserPlus,
  Mail,
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import type { DiagnosticsServiceItem } from "@/lib/ai";

interface DiagnosticsBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: (details: {
    serviceName: string;
    scheduledTime: string;
    price?: string | null;
    durationMinutes: number;
  }) => void;
  language: string;
  service: DiagnosticsServiceItem | null;
}

type Step = "timeslots" | "login-required" | "emailcollect" | "confirmation";

const localDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const generateCalendarDates = (daysCount: number = 7) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < daysCount; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      date: localDateStr(date),
      dayName: date.toLocaleDateString("ru-RU", { weekday: "short" }),
      dayNumber: date.getDate(),
      isToday: i === 0,
    });
  }
  return dates;
};

// Fallback hours used when a service has no explicit weekday schedule rows.
const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

function generateSlots(service: DiagnosticsServiceItem, dateStr: string): string[] {
  const duration = service.duration_minutes || 30;
  const jsWeekday = new Date(`${dateStr}T00:00:00`).getDay(); // 0=Sun..6=Sat
  const modelWeekday = (jsWeekday + 6) % 7; // 0=Mon..6=Sun

  const ranges = (service.schedules ?? [])
    .filter((s) => s.is_active && s.weekday === modelWeekday)
    .map((s) => ({ start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5) }));

  const effectiveRanges = ranges.length > 0 ? ranges : [{ start: DEFAULT_START, end: DEFAULT_END }];

  const now = new Date();
  const isToday = dateStr === localDateStr(now);
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

  const slots: string[] = [];
  for (const range of effectiveRanges) {
    const [startH, startM] = range.start.split(":").map(Number);
    const [endH, endM] = range.end.split(":").map(Number);
    let cur = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    while (cur + duration <= endMin) {
      if (!(isToday && cur <= nowMinutes)) {
        const h = String(Math.floor(cur / 60)).padStart(2, "0");
        const m = String(cur % 60).padStart(2, "0");
        slots.push(`${h}:${m}`);
      }
      cur += duration;
    }
  }
  return slots;
}

export default function DiagnosticsBookingModal({
  isOpen,
  onClose,
  onBookingComplete,
  language,
  service,
}: DiagnosticsBookingModalProps) {
  const { token, user, openAuth } = useAuth();
  const isLoggedIn = !!token && !!user;
  const lang = language as "en" | "ru" | "kz" | "uz";

  const [step, setStep] = useState<Step>("timeslots");
  const [selectedDate, setSelectedDate] = useState<string>(localDateStr(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationEmail, setConsultationEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const calendarDates = generateCalendarDates(7);
  const slots = useMemo(() => (service ? generateSlots(service, selectedDate) : []), [service, selectedDate]);

  useEffect(() => {
    if (isOpen) {
      setStep("timeslots");
      setSelectedTime(null);
      setBookingError(null);
      if (user?.email) setConsultationEmail(user.email);
    }
  }, [isOpen, user?.email]);

  const t = {
    title: { en: "Book diagnostics", ru: "Запись на диагностику", kz: "Диагностикаға жазылу", uz: "Diagnostikaga yozilish" },
    selectTime: { en: "Select time", ru: "Выберите время", kz: "Уақытты таңдаңыз", uz: "Vaqtni tanlang" },
    chooseDate: { en: "Choose date", ru: "Выберите дату", kz: "Күнді таңдаңыз", uz: "Sanani tanlang" },
    availableTime: { en: "Available time", ru: "Доступное время", kz: "Қолжетімді уақыт", uz: "Mavjud vaqt" },
    noSlots: { en: "No available slots for this date", ru: "Нет доступных слотов на эту дату", kz: "Бұл күнге бос слот жоқ", uz: "Bu sanada bo'sh vaqt yo'q" },
    loginTitle: { en: "Sign in to your account", ru: "Войдите в аккаунт", kz: "Аккаунтқа кіріңіз", uz: "Hisobingizga kiring" },
    loginSubtitle: { en: "You need to sign in or register to book diagnostics", ru: "Для записи на диагностику необходимо войти или зарегистрироваться", kz: "Диагностикаға жазылу үшін кіру немесе тіркелу қажет", uz: "Diagnostikaga yozilish uchun kirish yoki ro'yxatdan o'tish kerak" },
    login: { en: "Sign in", ru: "Войти", kz: "Кіру", uz: "Kirish" },
    register: { en: "Register", ru: "Зарегистрироваться", kz: "Тіркелу", uz: "Ro'yxatdan o'tish" },
    emailLabel: { en: "Email for confirmation *", ru: "Email для подтверждения *", kz: "Растау үшін email *", uz: "Tasdiqlash uchun email *" },
    emailContinue: { en: "Continue", ru: "Продолжить", kz: "Жалғастыру", uz: "Davom etish" },
    requiredField: { en: "Required field", ru: "Обязательное поле", kz: "Міндетті өріс", uz: "Majburiy maydon" },
    invalidEmail: { en: "Invalid email format", ru: "Неверный формат email", kz: "Email форматы қате", uz: "Email formati noto'g'ri" },
    confirmTitle: { en: "Confirm booking", ru: "Подтвердите запись", kz: "Жазылуды растаңыз", uz: "Yozilishni tasdiqlang" },
    service: { en: "Service", ru: "Услуга", kz: "Қызмет", uz: "Xizmat" },
    date: { en: "Date", ru: "Дата", kz: "Күні", uz: "Sana" },
    time: { en: "Time", ru: "Время", kz: "Уақыты", uz: "Vaqt" },
    price: { en: "Price", ru: "Стоимость", kz: "Бағасы", uz: "Narxi" },
    confirm: { en: "Confirm booking", ru: "Подтвердить запись", kz: "Жазылуды растау", uz: "Yozilishni tasdiqlash" },
    loading: { en: "Loading...", ru: "Загрузка...", kz: "Жүктелуде...", uz: "Yuklanmoqda..." },
    backToTimes: { en: "← Choose another time", ru: "← Выбрать другое время", kz: "← Басқа уақыт таңдау", uz: "← Boshqa vaqtni tanlash" },
    bookingErrorGeneric: { en: "Could not create the booking. Please try again later.", ru: "Не удалось создать запись. Попробуйте позже.", kz: "Жазылуды жасау мүмкін болмады. Кейінірек көріңіз.", uz: "Yozilishni yaratib bo'lmadi. Keyinroq urinib ko'ring." },
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (!isLoggedIn) {
      setStep("login-required");
    } else if (!user?.email) {
      setStep("emailcollect");
    } else {
      setStep("confirmation");
    }
  };

  const handleEmailSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!consultationEmail.trim()) {
      setEmailError(t.requiredField[lang]);
      return;
    }
    if (!emailRegex.test(consultationEmail.trim())) {
      setEmailError(t.invalidEmail[lang]);
      return;
    }
    setEmailError("");
    setStep("confirmation");
  };

  const handleLoginClick = (tab: "login" | "register") => {
    openAuth(tab, true);
  };

  const handleBack = () => {
    if (step === "login-required" || step === "emailcollect") {
      setStep("timeslots");
      setSelectedTime(null);
    } else if (step === "confirmation") {
      setStep(user?.email ? "timeslots" : "emailcollect");
    }
  };

  const handleConfirm = async () => {
    if (!service || !selectedTime) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Token ${token}`;

      await api.post(
        "/diagnostics/appointments/",
        {
          service_id: service.id,
          scheduled_time: `${selectedDate}T${selectedTime}:00`,
        },
        { headers }
      );

      onBookingComplete({
        serviceName: service.name,
        scheduledTime: `${selectedDate}T${selectedTime}:00`,
        price: service.price,
        durationMinutes: service.duration_minutes,
      });
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.error || t.bookingErrorGeneric[lang];
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isOpen || !service) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step !== "timeslots" && (
                  <button onClick={handleBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-bold">{t.title[lang]}</h2>
                  <p className="text-sm text-white/80">{service.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)]">
            {step === "timeslots" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{t.chooseDate[lang]}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {calendarDates.map((d) => (
                      <button
                        key={d.date}
                        onClick={() => { setSelectedDate(d.date); setSelectedTime(null); }}
                        className={`flex-shrink-0 w-14 py-2 rounded-xl text-center transition-all ${
                          selectedDate === d.date
                            ? "bg-blue-600 text-white shadow-lg"
                            : d.isToday
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <div className="text-xs font-medium">{d.dayName}</div>
                        <div className="text-lg font-bold">{d.dayNumber}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{t.availableTime[lang]}</p>
                  {slots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>{t.noSlots[lang]}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className="px-3 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg font-medium text-sm transition-all border border-transparent hover:border-blue-300"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "login-required" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <UserCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t.loginTitle[lang]}</h3>
                <p className="text-sm text-gray-500 mb-6">{t.loginSubtitle[lang]}</p>
                <button
                  onClick={() => handleLoginClick("login")}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-base hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-3"
                >
                  <LogIn size={18} />
                  {t.login[lang]}
                </button>
                <button
                  onClick={() => handleLoginClick("register")}
                  className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-base hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  {t.register[lang]}
                </button>
              </div>
            )}

            {step === "emailcollect" && (
              <div className="space-y-5">
                <div className="text-center py-2">
                  <div className="w-14 h-14 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Mail className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{t.emailLabel[lang]}</h3>
                </div>
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={consultationEmail}
                      onChange={(e) => { setConsultationEmail(e.target.value); setEmailError(""); }}
                      placeholder="example@mail.com"
                      autoFocus
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                        emailError ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                </div>
                <button
                  onClick={handleEmailSubmit}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
                >
                  {t.emailContinue[lang]}
                </button>
              </div>
            )}

            {step === "confirmation" && selectedTime && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{t.confirmTitle[lang]}</h3>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">{t.service[lang]}</p>
                      <p className="font-bold text-gray-900">{service.name}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">{t.date[lang]}</p>
                      <p className="font-bold text-gray-900">{selectedDate}</p>
                      <p className="text-lg font-bold text-blue-600">{selectedTime}</p>
                    </div>
                  </div>
                  {service.price && (
                    <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center text-blue-600 font-bold text-sm">₸</div>
                      <div>
                        <p className="text-sm text-gray-500">{t.price[lang]}</p>
                        <p className="font-bold text-gray-900">{Number(service.price).toLocaleString()} ₸</p>
                      </div>
                    </div>
                  )}
                </div>

                {bookingError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-red-700">{bookingError}</p>
                    <button
                      onClick={() => { setBookingError(null); setSelectedTime(null); setStep("timeslots"); }}
                      className="self-start text-xs font-bold text-red-600 underline underline-offset-2 hover:text-red-800 transition-colors"
                    >
                      {t.backToTimes[lang]}
                    </button>
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={bookingLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.loading[lang]}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {t.confirm[lang]}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
