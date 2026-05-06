"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  User,
  Star,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Building2,
  MapPin,
  Video,
  Phone,
  Mail,
  UserCircle,
  LogIn,
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useVoiceGuide } from "@/hooks/useVoiceGuide";
import type { Doctor, TimeSlot } from "@/components/services/consultations/types/doctor";
import PhoneInput from "@/components/ui/PhoneInput";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: (bookingDetails: {
    doctorName: string;
    doctorType: string;
    scheduledTime: string;
    isGuest?: boolean;
  }) => void;
  language: string;
  preselectedDoctor?: Doctor | null;
}

interface GuestInfo {
  name: string;
  phone: string;
  email?: string;
}

type BookingStep = "doctors" | "timeslots" | "guestinfo" | "emailcollect" | "confirmation";

const formatTime = (timeString: string): string => {
  return new Date(timeString).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (timeString: string, language: string): string => {
  const locale = language === "kz" ? "kk-KZ" : language === "en" ? "en-US" : "ru-RU";
  return new Date(timeString).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const generateCalendarDates = (daysCount: number = 14) => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      date: date.toISOString().split("T")[0],
      dayName: date.toLocaleDateString("ru-RU", { weekday: "short" }),
      dayNumber: date.getDate(),
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }

  return dates;
};

const translations = {
  ru: {
    title: "Запись к врачу",
    selectDoctor: "Выберите врача",
    selectTime: "Выберите время",
    yourInfo: "Ваши данные",
    confirmation: "Подтверждение",
    back: "Назад",
    next: "Далее",
    confirm: "Подтвердить запись",
    close: "Закрыть",
    loading: "Загрузка...",
    noSlots: "Нет доступных слотов на эту дату",
    selectOtherDate: "Выберите другую дату",
    available: "Доступен",
    busy: "Занят",
    experience: "лет опыта",
    online: "Онлайн консультация",
    bookingSuccess: "Консультация успешно назначена!",
    scheduledFor: "Запланировано на",
    doctor: "Врач",
    noDoctors: "Нет доступных врачей",
    tryLater: "Попробуйте позже",
    guestName: "Ваше имя",
    guestPhone: "Номер телефона",
    guestEmail: "Email *",
    guestNamePlaceholder: "Введите ваше имя",
    guestPhonePlaceholder: "+7 (___) ___-__-__",
    guestEmailPlaceholder: "example@mail.com",
    continueAsGuest: "Продолжить как гость",
    orLogin: "или войдите в аккаунт",
    loginToBook: "Войти",
    requiredField: "Обязательное поле",
    invalidPhone: "Неверный формат телефона",
    invalidEmail: "Неверный формат email",
    patient: "Пациент",
    emailStep: "Ваш email",
    emailLabel: "Email для ссылки на консультацию *",
    emailHint: "Мы отправим ссылку для подключения к онлайн-консультации на этот адрес.",
    emailContinue: "Продолжить",
    consultationEmail: "Email для связи",
    consultationPhone: "Телефон",
  },
  en: {
    title: "Book Appointment",
    selectDoctor: "Select Doctor",
    selectTime: "Select Time",
    yourInfo: "Your Information",
    confirmation: "Confirmation",
    back: "Back",
    next: "Next",
    confirm: "Confirm Booking",
    close: "Close",
    loading: "Loading...",
    noSlots: "No available slots for this date",
    selectOtherDate: "Select another date",
    available: "Available",
    busy: "Busy",
    experience: "years experience",
    online: "Online consultation",
    bookingSuccess: "Appointment booked successfully!",
    scheduledFor: "Scheduled for",
    doctor: "Doctor",
    noDoctors: "No available doctors",
    tryLater: "Try again later",
    guestName: "Your Name",
    guestPhone: "Phone Number",
    guestEmail: "Email *",
    guestNamePlaceholder: "Enter your name",
    guestPhonePlaceholder: "+7 (___) ___-__-__",
    guestEmailPlaceholder: "example@mail.com",
    continueAsGuest: "Continue as guest",
    orLogin: "or login to your account",
    loginToBook: "Login",
    requiredField: "Required field",
    invalidPhone: "Invalid phone format",
    invalidEmail: "Invalid email format",
    patient: "Patient",
    emailStep: "Your email",
    emailLabel: "Email for consultation link *",
    emailHint: "We will send you a link to join the online consultation at this address.",
    emailContinue: "Continue",
    consultationEmail: "Email",
    consultationPhone: "Phone",
  },
  kz: {
    title: "Дәрігерге жазылу",
    selectDoctor: "Дәрігерді таңдаңыз",
    selectTime: "Уақытты таңдаңыз",
    yourInfo: "Сіздің деректеріңіз",
    confirmation: "Растау",
    back: "Артқа",
    next: "Келесі",
    confirm: "Жазылуды растау",
    close: "Жабу",
    loading: "Жүктелуде...",
    noSlots: "Бұл күнге бос слоттар жоқ",
    selectOtherDate: "Басқа күнді таңдаңыз",
    available: "Қол жетімді",
    busy: "Бос емес",
    experience: "жыл тәжірибе",
    online: "Онлайн кеңес",
    bookingSuccess: "Кеңес сәтті тағайындалды!",
    scheduledFor: "Жоспарланған",
    doctor: "Дәрігер",
    noDoctors: "Қол жетімді дәрігерлер жоқ",
    tryLater: "Кейінірек көріңіз",
    guestName: "Сіздің атыңыз",
    guestPhone: "Телефон нөмірі",
    guestEmail: "Email *",
    guestNamePlaceholder: "Атыңызды енгізіңіз",
    guestPhonePlaceholder: "+7 (___) ___-__-__",
    guestEmailPlaceholder: "example@mail.com",
    continueAsGuest: "Қонақ ретінде жалғастыру",
    orLogin: "немесе аккаунтқа кіріңіз",
    loginToBook: "Кіру",
    requiredField: "Міндетті өріс",
    invalidPhone: "Телефон форматы қате",
    invalidEmail: "Email форматы қате",
    patient: "Пациент",
    emailStep: "Сіздің email",
    emailLabel: "Кеңеске сілтеме үшін email *",
    emailHint: "Онлайн-кеңеске қосылу сілтемесін осы мекенжайға жібереміз.",
    emailContinue: "Жалғастыру",
    consultationEmail: "Email",
    consultationPhone: "Телефон",
  },
};

export default function BookingModal({
  isOpen,
  onClose,
  onBookingComplete,
  language,
  preselectedDoctor,
}: BookingModalProps) {
  const { token, user, setIsAuthOpen } = useAuth();
  const t = translations[language as keyof typeof translations] || translations.ru;

  // State
  const [step, setStep] = useState<BookingStep>("doctors");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTimeslot, setSelectedTimeslot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Guest user state
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    name: "",
    phone: "",
    email: "",
  });
  const [guestErrors, setGuestErrors] = useState<Partial<GuestInfo>>({});

  // Email + phone for consultation link (used for logged-in users; guests use guestInfo.*)
  const [consultationEmail, setConsultationEmail] = useState("");
  const [consultationPhone, setConsultationPhone] = useState("");
  const [emailError, setEmailError] = useState("");

  const calendarDates = generateCalendarDates(14);
  const isLoggedIn = !!token && !!user;

  // When modal opens, either jump to timeslots (preselected) or fetch doctors list
  useEffect(() => {
    if (isOpen) {
      // Pre-fill contact details from logged-in user's account
      if (user?.email) setConsultationEmail(user.email);
      if (user?.phone) setConsultationPhone(user.phone);
      if (preselectedDoctor) {
        setSelectedDoctor(preselectedDoctor);
        setStep("timeslots");
      } else {
        fetchDoctors();
      }
    }
  }, [isOpen, preselectedDoctor]);

  // Fetch timeslots when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      fetchTimeslots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor]); // eslint-disable-line

  // Re-fetch when date changes (real per-day schedule)
  useEffect(() => {
    if (selectedDoctor && step === "timeslots") {
      fetchTimeslots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDate]); // eslint-disable-line

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("doctors");
      setSelectedDoctor(null);
      setSelectedTimeslot(null);
      setTimeslots([]);
      setGuestInfo({ name: "", phone: "", email: "" });
      setGuestErrors({});
      setConsultationEmail("");
      setConsultationPhone("");
      setEmailError("");
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      // Fetch doctors - works for both logged in and guest users
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Token ${token}`;
      }

      const res = await api.get("/auth/doctor/available/", {
        headers,
        params: { lang: language },
      });

      const filtered = res.data?.doctors?.filter(
        (doc: Doctor) => doc.doctor_type !== "Сестринское дело"
      );
      setDoctors(filtered || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeslots = async (doctorId: number, date?: string) => {
    const targetDate = date || selectedDate;
    setLoading(true);
    setTimeslots([]);
    try {
      const { data } = await api.get("/schedule/day/", {
        params: { date: targetDate, consultation_type: "online", doctor_id: doctorId },
      });

      const doctorData = (data.doctors || []).find(
        (d: { doctor_id: number }) => d.doctor_id === doctorId
      );

      if (doctorData?.slots?.length) {
        const now = new Date();
        const converted: TimeSlot[] = doctorData.slots
          .map((slot: { start: string; end: string; status: string }) => {
            // Keep as local datetime string — do NOT convert to UTC via toISOString()
            const startLocal = `${targetDate}T${slot.start}:00`;
            const endLocal = `${targetDate}T${slot.end}:00`;
            const isBooked = slot.status === "booked";
            return {
              id: new Date(startLocal).getTime() + doctorId,
              start_time: startLocal,
              end_time: endLocal,
              available_spots: isBooked ? 0 : 1,
              max_consultations: 1,
              is_booked: isBooked,
            };
          })
          .filter((slot: TimeSlot) => new Date(slot.start_time) > now);
        setTimeslots(converted);
      } else {
        setTimeslots([]);
      }
    } catch {
      setTimeslots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep("timeslots");
  };

  const handleTimeslotSelect = (timeslot: TimeSlot) => {
    setSelectedTimeslot(timeslot);
    // Logged-in users go to email collection, guests fill in their info first
    if (isLoggedIn) {
      setStep("emailcollect");
    } else {
      setStep("guestinfo");
    }
  };

  const handleEmailSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!consultationEmail.trim()) {
      setEmailError(t.requiredField);
      return;
    }
    if (!emailRegex.test(consultationEmail.trim())) {
      setEmailError(t.invalidEmail);
      return;
    }
    setEmailError("");
    setStep("confirmation");
  };

  const validateGuestInfo = (): boolean => {
    const errors: Partial<GuestInfo> = {};

    if (!guestInfo.name.trim()) {
      errors.name = t.requiredField;
    }

    if (!guestInfo.phone.trim()) {
      errors.phone = t.requiredField;
    } else if (!/^\+?[0-9]{10,15}$/.test(guestInfo.phone.replace(/[\s()-]/g, ""))) {
      errors.phone = t.invalidPhone;
    }

    if (!guestInfo.email?.trim()) {
      errors.email = t.requiredField;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email.trim())) {
      errors.email = t.invalidEmail;
    }

    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGuestInfoSubmit = () => {
    if (validateGuestInfo()) {
      setStep("confirmation");
    }
  };

  const handleLoginClick = () => {
    onClose();
    setIsAuthOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedTimeslot) return;

    // For guests, we need name and phone at minimum
    if (!isLoggedIn && (!guestInfo.name.trim() || !guestInfo.phone.trim())) {
      setStep("guestinfo");
      return;
    }

    setBookingLoading(true);
    try {
      // start_time is "YYYY-MM-DDTHH:MM:00" (local) — convert to UTC ISO for correct backend storage
      const localDate = new Date(selectedTimeslot.start_time);
      const bookingData: any = {
        doctor_id: selectedDoctor.id,
        scheduled_time: localDate.toISOString(),
      };

      // Add guest info if not logged in
      if (!isLoggedIn) {
        bookingData.guest_name = guestInfo.name;
        bookingData.guest_phone = guestInfo.phone;
        bookingData.guest_email = guestInfo.email;
        bookingData.is_guest = true;
      } else {
        // For logged-in users, pass the contact details they confirmed
        bookingData.consultation_email = consultationEmail;
        if (consultationPhone.trim()) {
          bookingData.consultation_phone = consultationPhone.trim();
        }
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Token ${token}`;
      }

      const res = await api.post(
        "/consultations/book-dynamic-slot/",
        bookingData,
        { headers }
      );

      if (res.data?.consultation || res.data?.success) {
        onBookingComplete({
          doctorName: selectedDoctor.name,
          doctorType: selectedDoctor.doctor_type,
          scheduledTime: selectedTimeslot.start_time,
          isGuest: !isLoggedIn,
        });
        onClose();
      }
    } catch (error: any) {
      console.error("Error booking consultation:", error);
      // Show more user-friendly error message
      const errorMessage = error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Ошибка при записи. Попробуйте снова.";
      alert(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "timeslots") {
      if (preselectedDoctor) {
        onClose();
      } else {
        setStep("doctors");
        setSelectedDoctor(null);
      }
    } else if (step === "guestinfo") {
      setStep("timeslots");
      setSelectedTimeslot(null);
    } else if (step === "emailcollect") {
      setStep("timeslots");
      setSelectedTimeslot(null);
    } else if (step === "confirmation") {
      if (isLoggedIn) {
        setStep("emailcollect");
      } else {
        setStep("guestinfo");
      }
    }
  };

  const now = new Date();
  const filteredTimeslots = timeslots.filter((slot) => {
    const slotDate = new Date(slot.start_time);
    const selectedDateObj = new Date(selectedDate + "T00:00:00");
    const slotLocalDate = new Date(
      slotDate.getFullYear(),
      slotDate.getMonth(),
      slotDate.getDate()
    );
    const targetLocalDate = new Date(
      selectedDateObj.getFullYear(),
      selectedDateObj.getMonth(),
      selectedDateObj.getDate()
    );
    return slotLocalDate.getTime() === targetLocalDate.getTime() && slotDate > now;
  });

  const availableTimeslots = filteredTimeslots.filter(
    (slot) => !slot.is_booked && (slot.available_spots ?? 1) > 0
  );

  if (!isOpen) return null;

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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step !== "doctors" && (
                  <button
                    onClick={handleBack}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-bold">{t.title}</h2>
                  <p className="text-sm text-white/80">
                    {step === "doctors" && t.selectDoctor}
                    {step === "timeslots" && t.selectTime}
                    {step === "guestinfo" && t.yourInfo}
                    {step === "emailcollect" && t.emailStep}
                    {step === "confirmation" && t.confirmation}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Indicator - different for logged in vs guest */}
            <div className="flex gap-2 mt-4">
              {(isLoggedIn
                ? ["doctors", "timeslots", "emailcollect", "confirmation"]
                : ["doctors", "timeslots", "guestinfo", "confirmation"]
              ).map((s, i, arr) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    i <= arr.indexOf(step)
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500">{t.loading}</p>
              </div>
            ) : (
              <>
                {/* Step 1: Doctor Selection */}
                {step === "doctors" && (
                  <div className="space-y-3">
                    {doctors.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">{t.noDoctors}</p>
                        <p className="text-sm">{t.tryLater}</p>
                      </div>
                    ) : (
                      doctors.map((doctor) => (
                        <motion.div
                          key={doctor.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDoctorSelect(doctor)}
                          className="p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 cursor-pointer transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {doctor.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900">
                                {doctor.name}
                              </h3>
                              <div className="flex items-center gap-1 text-blue-600 text-sm">
                                <Stethoscope size={14} />
                                <span>{doctor.doctor_type}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                {doctor.experience && (
                                  <span>
                                    {doctor.experience} {t.experience}
                                  </span>
                                )}
                                {doctor.rating && (
                                  <span className="flex items-center gap-1">
                                    <Star
                                      size={12}
                                      className="text-yellow-400 fill-yellow-400"
                                    />
                                    {doctor.rating}
                                  </span>
                                )}
                              </div>
                              {doctor.clinic && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                  <Building2 size={12} />
                                  <span>{doctor.clinic.name}</span>
                                </div>
                              )}
                            </div>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                doctor.availability_status === "available"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {doctor.availability_status === "available"
                                ? t.available
                                : t.busy}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {/* Step 2: Timeslot Selection */}
                {step === "timeslots" && selectedDoctor && (
                  <div className="space-y-4">
                    {/* Selected Doctor Info */}
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {selectedDoctor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {selectedDoctor.name}
                          </p>
                          <p className="text-sm text-blue-600">
                            {selectedDoctor.doctor_type}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date Selector */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Выберите дату
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {calendarDates.slice(0, 7).map((dateItem) => (
                          <button
                            key={dateItem.date}
                            onClick={() => setSelectedDate(dateItem.date)}
                            className={`flex-shrink-0 w-14 py-2 rounded-xl text-center transition-all ${
                              selectedDate === dateItem.date
                                ? "bg-blue-600 text-white shadow-lg"
                                : dateItem.isToday
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <div className="text-xs font-medium">
                              {dateItem.dayName}
                            </div>
                            <div className="text-lg font-bold">
                              {dateItem.dayNumber}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeslots */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Доступное время
                      </p>
                      {availableTimeslots.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          <p>{t.noSlots}</p>
                          <p className="text-sm">{t.selectOtherDate}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {availableTimeslots.slice(0, 16).map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => handleTimeslotSelect(slot)}
                              className="px-3 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg font-medium text-sm transition-all border border-transparent hover:border-blue-300"
                            >
                              {formatTime(slot.start_time)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3 (Guest): Guest Info */}
                {step === "guestinfo" && selectedDoctor && selectedTimeslot && (
                  <div className="space-y-4">
                    {/* Selected appointment summary */}
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {selectedDoctor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {selectedDoctor.name}
                          </p>
                          <p className="text-sm text-blue-600">
                            {selectedDoctor.doctor_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} className="text-blue-600" />
                        <span>
                          {formatDate(selectedTimeslot.start_time, language)} в{" "}
                          {formatTime(selectedTimeslot.start_time)}
                        </span>
                      </div>
                    </div>

                    {/* Guest Info Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.guestName} *
                        </label>
                        <div className="relative">
                          <UserCircle
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                          />
                          <input
                            type="text"
                            value={guestInfo.name}
                            onChange={(e) =>
                              setGuestInfo({ ...guestInfo, name: e.target.value })
                            }
                            placeholder={t.guestNamePlaceholder}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                              guestErrors.name
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                        </div>
                        {guestErrors.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {guestErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.guestPhone} *
                        </label>
                        <PhoneInput
                          value={guestInfo.phone}
                          onChange={(e164) => setGuestInfo({ ...guestInfo, phone: e164 })}
                          placeholder={t.guestPhonePlaceholder}
                          error={guestErrors.phone}
                          inputClassName="pr-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.guestEmail}
                        </label>
                        <div className="relative">
                          <Mail
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                          />
                          <input
                            type="email"
                            value={guestInfo.email}
                            onChange={(e) =>
                              setGuestInfo({ ...guestInfo, email: e.target.value })
                            }
                            placeholder={t.guestEmailPlaceholder}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                              guestErrors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                            }`}
                          />
                        </div>
                        {guestErrors.email && (
                          <p className="text-red-500 text-xs mt-1">{guestErrors.email}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Мы отправим ссылку для подключения к онлайн-консультации на этот адрес.</p>
                      </div>
                    </div>

                    {/* Continue Button */}
                    <button
                      onClick={handleGuestInfoSubmit}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {t.continueAsGuest}
                      <ChevronRight size={20} />
                    </button>

                    {/* Login Option */}
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">{t.orLogin}</p>
                      <button
                        onClick={handleLoginClick}
                        className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        <LogIn size={18} />
                        {t.loginToBook}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step: Email Collect (logged-in users only) */}
                {step === "emailcollect" && selectedDoctor && selectedTimeslot && (
                  <div className="space-y-5">
                    {/* Icon + title */}
                    <div className="text-center py-2">
                      <div className="w-14 h-14 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <Mail className="w-7 h-7 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{t.emailLabel}</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">{t.emailHint}</p>
                    </div>

                    {/* Appointment summary */}
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {selectedDoctor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{selectedDoctor.name}</p>
                          <p className="text-xs text-blue-600">{selectedDoctor.doctor_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock size={12} className="text-blue-600" />
                        <span>{formatDate(selectedTimeslot.start_time, language)}, {formatTime(selectedTimeslot.start_time)}</span>
                      </div>
                    </div>

                    {/* Email field */}
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
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {t.emailContinue}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}

                {/* Step 4 (or Step 3 for logged in): Confirmation */}
                {step === "confirmation" &&
                  selectedDoctor &&
                  selectedTimeslot && (
                    <div className="space-y-4">
                      {/* Success Icon */}
                      <div className="text-center py-4">
                        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Подтвердите запись
                        </h3>
                      </div>

                      {/* Booking Details */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        {/* Guest Info (if not logged in) */}
                        {!isLoggedIn && guestInfo.name && (
                          <div className="flex items-center gap-3">
                            <UserCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-500">{t.patient}</p>
                              <p className="font-bold text-gray-900">
                                {guestInfo.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {guestInfo.phone}
                              </p>
                            </div>
                          </div>
                        )}

                        {!isLoggedIn && guestInfo.name && (
                          <div className="border-t border-gray-200 pt-3" />
                        )}

                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-500">{t.doctor}</p>
                            <p className="font-bold text-gray-900">
                              {selectedDoctor.name}
                            </p>
                            <p className="text-sm text-blue-600">
                              {selectedDoctor.doctor_type}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-500">
                              {t.scheduledFor}
                            </p>
                            <p className="font-bold text-gray-900">
                              {formatDate(selectedTimeslot.start_time, language)}
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                              {formatTime(selectedTimeslot.start_time)}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
                          <Video className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {t.online}
                            </p>
                          </div>
                        </div>

                        {/* Email where link will be sent */}
                        {(isLoggedIn ? consultationEmail : guestInfo.email) && (
                          <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-500">{t.consultationEmail}</p>
                              <p className="font-medium text-gray-900">
                                {isLoggedIn ? consultationEmail : guestInfo.email}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Phone number */}
                        {(isLoggedIn ? consultationPhone : guestInfo.phone) && (
                          <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
                            <Phone className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-500">{t.consultationPhone}</p>
                              <p className="font-medium text-gray-900">
                                {isLoggedIn ? consultationPhone : guestInfo.phone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Button */}
                      <button
                        onClick={handleConfirmBooking}
                        disabled={bookingLoading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t.loading}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            {t.confirm}
                          </>
                        )}
                      </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
