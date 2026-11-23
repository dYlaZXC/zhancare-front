"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import {
  X, Search, Loader2, Clock, CalendarDays, CheckCircle2, AlertCircle,
} from "lucide-react";

interface DiagnosticServiceItem {
  id: number;
  name: string;
  category_label?: string;
  price?: number | string | null;
  duration_minutes?: number;
}

interface BookingSlot {
  start: string;
  end: string;
  label: string;
  available: number;
}

export interface ScheduleReferralTarget {
  id: number;
  service_name: string;
  service_id: number | null;
  clinic_id: number | null;
  patient_id: number;
  original_text?: string;
}

interface ScheduleReferralModalProps {
  referral: ScheduleReferralTarget;
  onScheduled: (appointment: any) => void;
  onClose: () => void;
}

export default function ScheduleReferralModal({ referral, onScheduled, onClose }: ScheduleReferralModalProps) {
  const [services, setServices] = useState<DiagnosticServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceSearch, setServiceSearch] = useState(referral.service_name);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(referral.service_id);

  const [nextDays] = useState(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("ru-KZ", { weekday: "short", day: "numeric", month: "short" }),
    };
  }));
  const [bookingDate, setBookingDate] = useState("");
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [plainDateTime, setPlainDateTime] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!referral.clinic_id || selectedServiceId) return;
    setServicesLoading(true);
    api.get<DiagnosticServiceItem[] | { results: DiagnosticServiceItem[] }>(
      `/diagnostics/services/?clinic=${referral.clinic_id}`
    )
      .then(({ data }) => setServices(Array.isArray(data) ? data : (data as any)?.results ?? []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, [referral.clinic_id, selectedServiceId]);

  const filteredServices = services.filter(s =>
    !serviceSearch.trim() || s.name.toLowerCase().includes(serviceSearch.trim().toLowerCase())
  );

  const fetchSlots = async (date: string) => {
    if (!selectedServiceId) return;
    setBookingDate(date);
    setSelectedSlot(null);
    setSlots([]);
    setSlotsLoading(true);
    try {
      const { data } = await api.get<{ slots: BookingSlot[] }>(
        `/diagnostics/services/${selectedServiceId}/available-slots/?date=${date}&patient_id=${referral.patient_id}`
      );
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const scheduledTime = selectedServiceId ? selectedSlot : plainDateTime;
    if (!scheduledTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(`/diagnostics/appointments/${referral.id}/schedule/`, {
        scheduled_time: scheduledTime,
        service_id: selectedServiceId ?? undefined,
      });
      onScheduled(data.appointment);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Не удалось записать пациента");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = selectedServiceId ? !!selectedSlot : !!plainDateTime;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex flex-col overflow-hidden shadow-2xl w-full max-w-lg max-h-[85vh] rounded-3xl bg-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-gray-800">Записать на приём</p>
            <p className="text-xs text-gray-400 mt-0.5">{referral.service_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {referral.original_text && referral.original_text !== referral.service_name && (
            <p className="text-xs text-gray-400 italic">Из исходного текста: «{referral.original_text}»</p>
          )}

          {!referral.service_id && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Сопоставить с услугой каталога (необязательно)
              </p>
              <div className="relative mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  placeholder="Поиск услуги..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              {selectedServiceId ? (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-100">
                  <span className="text-sm font-semibold text-blue-700">
                    {services.find(s => s.id === selectedServiceId)?.name ?? "Услуга выбрана"}
                  </span>
                  <button
                    onClick={() => { setSelectedServiceId(null); setBookingDate(""); setSlots([]); setSelectedSlot(null); }}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Изменить
                  </button>
                </div>
              ) : servicesLoading ? (
                <p className="text-xs text-gray-400 text-center py-3">Загрузка услуг...</p>
              ) : (
                <div className="max-h-40 overflow-y-auto rounded-2xl border border-gray-100 divide-y divide-gray-50">
                  {filteredServices.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">Ничего не найдено</p>
                  ) : filteredServices.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedServiceId(s.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-1.5">
                Можно записать и без каталожной услуги — просто выберите дату и время ниже.
              </p>
            </div>
          )}

          {selectedServiceId ? (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Дата
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-3">
                {nextDays.map(d => (
                  <button
                    key={d.iso}
                    onClick={() => fetchSlots(d.iso)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      bookingDate === d.iso
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {slotsLoading ? (
                <p className="text-xs text-gray-400 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Загрузка слотов...</p>
              ) : bookingDate && slots.length === 0 ? (
                <p className="text-xs text-gray-400">Нет свободных слотов на эту дату</p>
              ) : slots.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {slots.map(slot => (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot.start)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1 ${
                        selectedSlot === slot.start
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                      }`}
                    >
                      <Clock className="w-3 h-3" /> {slot.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Дата и время
              </p>
              <input
                type="datetime-local"
                value={plainDateTime}
                onChange={e => setPlainDateTime(e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-500 text-xs">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Записать
          </button>
        </div>
      </div>
    </div>
  );
}
