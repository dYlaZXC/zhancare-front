"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useConsultationPayment } from "@/components/payment/useConsultationPayment";
import type { DoctorRecommendation } from "@/lib/ai";

interface InlineSlot {
  start_time: string;
  end_time: string;
  start_utc?: string;
  is_booked: boolean;
}

interface BookingDetails {
  doctorName: string;
  doctorType: string;
  scheduledTime: string;
  consultationType: "online" | "offline";
  clinicName?: string;
  clinicAddress?: string;
  roomNumber?: string | null;
  gis2Url?: string;
}

interface Props {
  doctor: DoctorRecommendation;
  language: string;
  accentColor: string;
  consultationType?: "online" | "offline";
  onBookingComplete: (details: BookingDetails) => void;
}

const T = {
  ru: {
    title: "Запись к врачу",
    selectDate: "Дата",
    selectTime: "Доступное время",
    noSlots: "Нет доступных слотов на этот день",
    confirm: "Записаться",
    signIn: "Войдите, чтобы записаться",
    booking: "Запись...",
    bookingError: "Ошибка при записи. Попробуйте снова.",
  },
  en: {
    title: "Book appointment",
    selectDate: "Date",
    selectTime: "Available times",
    noSlots: "No available slots for this day",
    confirm: "Book appointment",
    signIn: "Sign in to book",
    booking: "Booking...",
    bookingError: "Booking error. Please try again.",
  },
  kz: {
    title: "Дәрігерге жазылу",
    selectDate: "Күн",
    selectTime: "Қолжетімді уақыт",
    noSlots: "Бұл күнге слоттар жоқ",
    confirm: "Жазылу",
    signIn: "Жазылу үшін кіріңіз",
    booking: "Жазылу...",
    bookingError: "Қате орын алды. Қайталап көріңіз.",
  },
  uz: {
    title: "Vrachga yozilish",
    selectDate: "Sana",
    selectTime: "Mavjud vaqtlar",
    noSlots: "Bu kun uchun vaqt yo'q",
    confirm: "Yozilish",
    signIn: "Yozilish uchun kiring",
    booking: "Yozilmoqda...",
    bookingError: "Yozilishda xatolik. Qayta urinib ko'ring.",
  },
};

const DAY_NAMES: Record<string, string[]> = {
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  kz: ["Жс", "Дс", "Сс", "Ср", "Бс", "Жм", "Сб"],
  uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
};

const MONTH_SHORT: Record<string, string[]> = {
  ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  kz: ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"],
  uz: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
};

export default function InlineBookingCard({
  doctor,
  language,
  accentColor,
  consultationType = "online",
  onBookingComplete,
}: Props) {
  const lang = (language as keyof typeof T) in T ? (language as keyof typeof T) : "ru";
  const t = T[lang];
  const { token, user, openAuth } = useAuth();
  const isLoggedIn = !!token && !!user;
  const { pay: payForConsultation } = useConsultationPayment();

  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [slots, setSlots] = useState<InlineSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<InlineSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const fetchSlots = useCallback(
    async (date: string) => {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const { data } = await api.get("/schedule/day/", {
          params: { date, consultation_type: consultationType, doctor_id: doctor.id },
        });
        const doctorData = (data.doctors || []).find(
          (d: { doctor_id: number }) => d.doctor_id === doctor.id
        );
        if (doctorData?.slots?.length) {
          const now = new Date();
          const converted: InlineSlot[] = doctorData.slots
            .map((slot: { start: string; end: string; status: string; start_utc?: string }) => ({
              start_time: `${date}T${slot.start}:00`,
              end_time: `${date}T${slot.end}:00`,
              start_utc: slot.start_utc,
              is_booked: slot.status === "booked",
            }))
            .filter((slot: InlineSlot) => !slot.is_booked && new Date(slot.start_time) > now);
          setSlots(converted);
        }
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [doctor.id, consultationType]
  );

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    if (!isLoggedIn) {
      openAuth("login");
      return;
    }
    setBooking(true);
    setBookingError(null);
    try {
      const doctorSpec = doctor.specialization
        ? doctor.specialization[lang as keyof typeof doctor.specialization] ||
          doctor.doctor_type ||
          ""
        : doctor.doctor_type || "";
      const firstName = doctor.name.split(" ")[0];
      const description =
        consultationType === "offline"
          ? `Офлайн приём у ${firstName}`
          : `Онлайн консультация с ${firstName}`;

      await payForConsultation({
        paymentType: consultationType === "offline" ? "offline" : "online",
        amount: doctor.online_consultation_price ? Number(doctor.online_consultation_price) : 0,
        description,
        bookingData: {
          doctor_id: doctor.id,
          scheduled_time: selectedSlot.start_utc ?? selectedSlot.start_time,
          consultation_type: consultationType,
        },
      });

      onBookingComplete({
        doctorName: doctor.name,
        doctorType: doctorSpec,
        scheduledTime: selectedSlot.start_time,
        consultationType,
        clinicName: doctor.clinic?.name,
        clinicAddress: doctor.clinic?.address,
        roomNumber: doctor.room_number ?? null,
        gis2Url: doctor.clinic?.gis2_url,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e?.message !== "Payment cancelled") {
        setBookingError(t.bookingError);
      }
    } finally {
      setBooking(false);
    }
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const days = DAY_NAMES[lang] ?? DAY_NAMES.ru;
    const months = MONTH_SHORT[lang] ?? MONTH_SHORT.ru;
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] };
  };

  const formatSlotTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const specialization = doctor.specialization
    ? doctor.specialization[lang as keyof typeof doctor.specialization] ||
      doctor.doctor_type ||
      "Врач"
    : doctor.doctor_type || "Врач";

  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
      }}
    >
      {/* Doctor header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}07 100%)`,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accentColor }}
        >
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "#111827" }}>
            {doctor.name}
          </p>
          <p className="text-xs truncate" style={{ color: "#6b7280" }}>
            {specialization}
          </p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <p className="text-xs font-semibold" style={{ color: accentColor }}>
            {t.title}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Date strip */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9ca3af" }}>
            {t.selectDate}
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {dates.map((dateStr) => {
              const { day, date, month } = formatDay(dateStr);
              const isSelected = dateStr === selectedDate;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className="flex-shrink-0 flex flex-col items-center rounded-xl transition-all duration-150"
                  style={{
                    background: isSelected ? accentColor : "rgba(0,0,0,0.04)",
                    color: isSelected ? "#ffffff" : "#374151",
                    minWidth: 48,
                    padding: "8px 6px",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.75, lineHeight: 1 }}>
                    {day}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{date}</span>
                  <span style={{ fontSize: 9, opacity: 0.7, lineHeight: 1 }}>{month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9ca3af" }}>
            {t.selectTime}
          </p>
          {loadingSlots ? (
            <div className="flex justify-center py-5">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                stroke={accentColor}
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M21 12a9 9 0 1 1-18 0" />
              </svg>
            </div>
          ) : slots.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: "#9ca3af" }}>
              {t.noSlots}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.start_time === slot.start_time;
                return (
                  <button
                    key={slot.start_time}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setBookingError(null);
                    }}
                    className="rounded-lg transition-all duration-150"
                    style={{
                      padding: "8px 4px",
                      background: isSelected ? accentColor : "rgba(0,0,0,0.04)",
                      color: isSelected ? "#ffffff" : "#374151",
                      fontSize: 12,
                      fontWeight: 600,
                      border: isSelected ? "none" : "1px solid transparent",
                    }}
                  >
                    {formatSlotTime(slot.start_time)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {bookingError && (
          <p className="text-xs text-center" style={{ color: "#ef4444" }}>
            {bookingError}
          </p>
        )}

        {/* Confirm / sign-in button — shown once a slot is selected */}
        {selectedSlot && (
          <button
            onClick={handleConfirm}
            disabled={booking}
            className="w-full rounded-xl font-bold transition-all duration-150 disabled:opacity-60"
            style={{
              padding: "12px 16px",
              fontSize: 14,
              background: isLoggedIn ? accentColor : "#f3f4f6",
              color: isLoggedIn ? "#ffffff" : "#374151",
              boxShadow: isLoggedIn ? `0 4px 16px ${accentColor}40` : "none",
            }}
          >
            {booking ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 12a9 9 0 1 1-18 0" />
                </svg>
                {t.booking}
              </span>
            ) : isLoggedIn ? (
              t.confirm
            ) : (
              t.signIn
            )}
          </button>
        )}
      </div>
    </div>
  );
}
