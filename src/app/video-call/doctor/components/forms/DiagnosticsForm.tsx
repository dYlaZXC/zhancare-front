"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faPlus,
  faXmark,
  faCalendarCheck,
  faClock,
  faCircleCheck,
  faChevronDown,
  faChevronUp,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { aiService } from "@/lib/ai/aiService";
import { DiagnosticsServiceItem } from "@/lib/ai/types";

// The persisted source of truth for this section (type="diagnostics_referral")
// is {referrals, comment} — see consultations/template_utils.py::validate_diagnostics_referral_value.
// Referrals are real structured data now (not text lines embedded in a string),
// so they survive a reload like everything else.
export interface DiagnosticReferral {
  serviceId: number;
  name: string;
  categoryLabel?: string;
  price?: string | null;
  bookedAt?: string;
  appointmentId?: number;
}

interface DiagnosticsFormProps {
  comment: string;
  onCommentChange: (value: string) => void;
  clinicId?: number;
  patientId?: number;
  doctorId?: number;
  referrals: DiagnosticReferral[];
  onReferralsChange: (referrals: DiagnosticReferral[]) => void;
}

interface BookingSlot {
  start: string;
  end: string;
  label: string;
  available: number;
}

const formatPrice = (price?: string | null): string | null => {
  if (!price) return null;
  const num = Number(price);
  if (Number.isNaN(num)) return price;
  return `${num.toLocaleString("ru-RU")} ₸`;
};

const DiagnosticsForm: React.FC<DiagnosticsFormProps> = ({
  comment,
  onCommentChange,
  clinicId,
  patientId,
  doctorId,
  referrals,
  onReferralsChange,
}) => {
  const [clinicServices, setClinicServices] = useState<DiagnosticsServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServicePanel, setShowServicePanel] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [bookingServiceId, setBookingServiceId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [bookingSlotsLoading, setBookingSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Booking requires both a patient to book for and a referring doctor to
  // attribute the referral to — without either, only the plain "add without
  // booking" action (which needs neither) stays available.
  const canBook = Boolean(patientId && doctorId);

  useEffect(() => {
    if (!clinicId) {
      setClinicServices([]);
      return;
    }
    setServicesLoading(true);
    aiService
      .getDiagnosticsServices(clinicId)
      .then(setClinicServices)
      .catch(() => setClinicServices([]))
      .finally(() => setServicesLoading(false));
  }, [clinicId]);

  const filteredServices = clinicServices.filter((s) => {
    const matchCat = activeCategory === "all" || s.category === activeCategory;
    const q = serviceSearch.trim().toLowerCase();
    const matchSearch =
      !q || s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const uniqueCategories = Array.from(
    new Map(clinicServices.map((s) => [s.category, s.category_label])).entries()
  );

  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("ru-KZ", { weekday: "short", day: "numeric", month: "short" }),
    };
  });

  const openBooking = (service: DiagnosticsServiceItem) => {
    if (bookingServiceId === service.id) {
      setBookingServiceId(null);
      return;
    }
    setBookingServiceId(service.id);
    setBookingDate("");
    setBookingSlots([]);
    setSelectedSlot(null);
  };

  const fetchSlots = async (serviceId: number, date: string) => {
    setBookingDate(date);
    setSelectedSlot(null);
    setBookingSlots([]);
    setBookingSlotsLoading(true);
    try {
      const { data } = await api.get<{ slots: BookingSlot[] }>(
        `/diagnostics/services/${serviceId}/available-slots/?date=${date}&patient_id=${patientId}`
      );
      setBookingSlots(data.slots ?? []);
    } catch {
      setBookingSlots([]);
    } finally {
      setBookingSlotsLoading(false);
    }
  };

  const handleAddReferral = (service: DiagnosticsServiceItem) => {
    if (referrals.some((r) => r.serviceId === service.id)) return;
    onReferralsChange([
      ...referrals,
      { serviceId: service.id, name: service.name, categoryLabel: service.category_label, price: service.price },
    ]);
  };

  const handleBook = async (service: DiagnosticsServiceItem) => {
    if (!selectedSlot || !canBook) return;
    setBookingSubmitting(true);
    try {
      const { data } = await api.post<{ appointment: { id: number } }>("/diagnostics/appointments/", {
        service_id: service.id,
        patient_id: patientId,
        // Referring doctor = the doctor running this consultation (drives
        // commission on the backend) — never an appointment/consultation PK.
        doctor_id: doctorId,
        scheduled_time: selectedSlot,
      });
      const appointmentId = data?.appointment?.id;
      const slotObj = bookingSlots.find((s) => s.start === selectedSlot);
      const dateLabel = nextDays.find((d) => d.iso === bookingDate)?.label ?? bookingDate;
      const timeLabel = slotObj?.label ?? selectedSlot;
      const updated: DiagnosticReferral = {
        serviceId: service.id,
        name: service.name,
        categoryLabel: service.category_label,
        price: service.price,
        bookedAt: selectedSlot,
        appointmentId,
      };

      const existing = referrals.some((r) => r.serviceId === service.id);
      onReferralsChange(
        existing
          ? referrals.map((r) => (r.serviceId === service.id ? updated : r))
          : [...referrals, updated]
      );

      toast.success(`Записано: ${service.name} — ${dateLabel}, ${timeLabel}`);
      setBookingServiceId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка при записи");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleRemoveReferral = (referral: DiagnosticReferral) => {
    if (referral.appointmentId) {
      const confirmed = window.confirm(
        "Приём уже создан в системе. Удаление уберёт направление из этого списка — сама запись на приём останется активной. Продолжить?"
      );
      if (!confirmed) return;
    }
    onReferralsChange(referrals.filter((r) => r.serviceId !== referral.serviceId));
  };

  return (
    <div className="h-full flex flex-col">
      {clinicId && (
        <div className="mb-4 rounded-xl border overflow-hidden flex-shrink-0" style={{ borderColor: '#283353' }}>
          <button
            type="button"
            onClick={() => setShowServicePanel((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-colors"
            style={{ backgroundColor: '#202942', color: '#ebf1ff' }}
          >
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} className="text-xs" style={{ color: '#06b6d4' }} />
              Добавить услугу из каталога клиники
            </span>
            <FontAwesomeIcon
              icon={showServicePanel ? faChevronUp : faChevronDown}
              className="text-xs"
              style={{ color: '#bcc0ca' }}
            />
          </button>

          {showServicePanel && (
            <div className="p-3" style={{ backgroundColor: '#1e263e' }}>
              <div className="relative mb-3">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: '#bcc0ca' }}
                />
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Поиск услуги..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ backgroundColor: '#202942', borderColor: '#283353', color: '#ebf1ff' }}
                />
              </div>

              {uniqueCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                    style={
                      activeCategory === "all"
                        ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                        : { backgroundColor: '#202942', color: '#bcc0ca' }
                    }
                  >
                    Все
                  </button>
                  {uniqueCategories.map(([cat, label]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                      style={
                        activeCategory === cat
                          ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                          : { backgroundColor: '#202942', color: '#bcc0ca' }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                {servicesLoading && (
                  <p className="text-xs text-center py-4" style={{ color: '#bcc0ca' }}>Загрузка услуг...</p>
                )}
                {!servicesLoading && filteredServices.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: '#bcc0ca' }}>Ничего не найдено</p>
                )}
                {filteredServices.map((service) => {
                  const isAdded = referrals.some((r) => r.serviceId === service.id);
                  const isBookingOpen = bookingServiceId === service.id;
                  const priceLabel = formatPrice(service.price);
                  return (
                    <div key={service.id} className="rounded-lg p-2.5" style={{ backgroundColor: '#202942' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#ebf1ff' }}>{service.name}</p>
                          <p className="text-xs" style={{ color: '#bcc0ca' }}>
                            {service.category_label}
                            {priceLabel ? ` · ${priceLabel}` : ""}
                            {service.duration_minutes ? ` · ${service.duration_minutes} мин` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddReferral(service)}
                            disabled={isAdded}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            style={
                              isAdded
                                ? { backgroundColor: '#1e263e', color: '#10b981' }
                                : { backgroundColor: '#283353', color: '#ebf1ff' }
                            }
                          >
                            <FontAwesomeIcon icon={isAdded ? faCircleCheck : faPlus} className="text-xs" />
                            {isAdded ? "Добавлено" : "Добавить"}
                          </button>
                          {canBook && (
                            <button
                              type="button"
                              onClick={() => openBooking(service)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              style={
                                isBookingOpen
                                  ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                                  : { backgroundColor: '#06b6d4', color: '#0f1424' }
                              }
                            >
                              Записать
                            </button>
                          )}
                        </div>
                      </div>

                      {isBookingOpen && (
                        <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: '#283353' }}>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2">
                            {nextDays.map((d) => (
                              <button
                                key={d.iso}
                                type="button"
                                onClick={() => fetchSlots(service.id, d.iso)}
                                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors"
                                style={
                                  bookingDate === d.iso
                                    ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                                    : { backgroundColor: '#1e263e', color: '#bcc0ca' }
                                }
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>

                          {bookingSlotsLoading && (
                            <p className="text-xs" style={{ color: '#bcc0ca' }}>Загрузка слотов...</p>
                          )}
                          {!bookingSlotsLoading && bookingDate && bookingSlots.length === 0 && (
                            <p className="text-xs" style={{ color: '#bcc0ca' }}>Нет свободных слотов на эту дату</p>
                          )}
                          {bookingSlots.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {bookingSlots.map((slot) => (
                                <button
                                  key={slot.start}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot.start)}
                                  className="px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1"
                                  style={
                                    selectedSlot === slot.start
                                      ? { backgroundColor: '#3772ff', color: '#ebf1ff' }
                                      : { backgroundColor: '#1e263e', color: '#bcc0ca' }
                                  }
                                >
                                  <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                                  {slot.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {selectedSlot && (
                            <button
                              type="button"
                              onClick={() => handleBook(service)}
                              disabled={bookingSubmitting}
                              className="w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                              style={{ backgroundColor: '#10b981', color: '#0f1424' }}
                            >
                              <FontAwesomeIcon icon={faCalendarCheck} className="text-xs" />
                              {bookingSubmitting ? "Записываем..." : "Подтвердить запись"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {referrals.length > 0 && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {referrals.map((r) => (
              <div
                key={r.serviceId}
                className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs"
                style={{ backgroundColor: '#202942', color: '#ebf1ff' }}
              >
                {r.appointmentId && (
                  <FontAwesomeIcon icon={faCalendarCheck} className="text-[10px]" style={{ color: '#10b981' }} />
                )}
                <span>{r.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveReferral(r)}
                  className="w-4 h-4 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: '#283353', color: '#bcc0ca' }}
                  title={r.appointmentId ? "Убрать из списка (запись останется активной)" : "Удалить"}
                >
                  <FontAwesomeIcon icon={r.appointmentId ? faTriangleExclamation : faXmark} className="text-[9px]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Проведённые обследования, анализы, результаты..."
        className="flex-1 w-full border rounded-xl px-4 py-3 text-sm transition-all resize-none focus:outline-none focus:ring-2"
        style={{
          backgroundColor: '#1e263e',
          borderColor: '#283353',
          color: '#ebf1ff',
          caretColor: '#3772ff',
          minHeight: '200px'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3772ff';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55, 114, 255, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#283353';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      <div className="mt-4 p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: '#1e263e' }}>
        <p className="text-xs" style={{ color: '#bcc0ca' }}>
          💡 Совет: Укажите результаты анализов, инструментальных исследований, заключения специалистов
        </p>
      </div>
    </div>
  );
};

export default DiagnosticsForm;
