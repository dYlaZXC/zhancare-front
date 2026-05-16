"use client";

import React from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  Video,
  Phone,
  MapPin,
  Bot,
  Stethoscope,
  Building2,
  Zap,
  Star,
  Calendar,
} from "lucide-react";

import type { Doctor, TimeSlot, Language } from "../types/doctor";
import { getSpecializationName } from "../utils/doctorUtils";
import { formatTime } from "../utils/timeslotUtils";
import { getCurrencySymbol } from "@/utils/currency";

interface DoctorCardProps {
  doctor: Doctor;
  isRecommended?: boolean;
  isSelected?: boolean;
  language: Language;
  clinicCurrency?: string;
  timeslots?: TimeSlot[];
  selectedDate?: string;
  onTimeslotSelect?: (timeslot: TimeSlot) => void;
  onDateSelect?: (date: string) => void;
}

const GRADIENTS = [
  ['#3772ff', '#2c5bcc'],
  ['#8b5cf6', '#7c3aed'],
  ['#f43f5e', '#e11d48'],
  ['#f59e0b', '#d97706'],
  ['#10b981', '#059669'],
  ['#06b6d4', '#0891b2'],
];

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  isRecommended = false,
  isSelected = false,
  language = 'ru',
  clinicCurrency = 'KZT',
  timeslots = [],
  selectedDate,
  onTimeslotSelect,
  onDateSelect,
}) => {
  const [g1, g2] = GRADIENTS[doctor.id % GRADIENTS.length];

  const statusDotColor =
    doctor.availability_status === 'available' ? 'bg-green-500' :
    doctor.availability_status === 'busy' ? 'bg-yellow-500' :
    doctor.availability_status === 'break' ? 'bg-blue-500' :
    'bg-gray-400';

  const availabilityLabel =
    doctor.availability_status === 'available' ? 'Доступен' :
    doctor.availability_status === 'busy' ? 'Занят' :
    doctor.availability_status === 'break' ? 'На перерыве' :
    'Не работает';

  const availabilityClass =
    doctor.availability_status === 'available' ? 'bg-green-100 text-green-700' :
    doctor.availability_status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
    doctor.availability_status === 'break' ? 'bg-blue-100 text-blue-700' :
    'bg-gray-100 text-gray-500';

  // Earliest free slot across all dates (for ⚡ chip)
  const earliestSlot = timeslots.find(s => !s.is_booked && (s.available_spots ?? 1) > 0);
  const earliestLabel = (() => {
    if (!earliestSlot) return null;
    const d = new Date(earliestSlot.start_time);
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return `${date}, ${time}`;
  })();

  // Slots for the globally selected date, excluding past times
  const now = new Date();
  const slotsForDate = selectedDate
    ? timeslots
        .filter(s => {
          const d = new Date(s.start_time);
          const t = new Date(selectedDate + 'T00:00:00');
          return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
        })
        .filter(s => new Date(s.start_time) > now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    : [];

  const freeCount = slotsForDate.filter(s => !s.is_booked && (s.available_spots ?? 1) > 0).length;
  const displaySlots = slotsForDate.slice(0, 6);
  const hiddenCount = slotsForDate.length - 6;


  return (
    <div
      className={clsx(
        "relative border rounded-2xl transition-all duration-200 overflow-hidden flex flex-col",
        isSelected
          ? "shadow-xl ring-2 -translate-y-0.5"
          : isRecommended
          ? "shadow-lg ring-2 hover:-translate-y-1 hover:shadow-xl"
          : "bg-white border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:border-blue-200"
      )}
      style={isSelected ? {
        background: `linear-gradient(160deg, ${g1}12 0%, white 40%)`,
        borderColor: g1,
        boxShadow: `0 8px 32px ${g1}30, 0 2px 8px ${g1}20`,
      } : isRecommended ? {
        background: 'linear-gradient(160deg, #eff6ff 0%, white 50%)',
        borderColor: '#3772ff',
        boxShadow: '0 8px 32px rgba(55,114,255,0.18), 0 2px 8px rgba(55,114,255,0.10)',
      } : undefined}
    >
      {/* Top accent bar */}
      {(isSelected || isRecommended) && (
        <div className="h-1 w-full flex-shrink-0" style={{
          background: isSelected
            ? `linear-gradient(90deg, ${g1}, ${g2})`
            : 'linear-gradient(90deg, #3772ff, #6366f1)'
        }} />
      )}

      {/* AI badge OR rating */}
      {isRecommended ? (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3772ff, #6366f1)' }}>
          <Bot size={11} />
          AI рекомендует
        </div>
      ) : doctor.rating ? (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-center justify-center bg-white border border-amber-200 rounded-xl px-2 py-1.5 shadow-sm gap-0.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => {
              const val = Number(doctor.rating);
              const fillPct = Math.round(Math.min(Math.max((val - (i - 1)) * 100, 0), 100));
              return (
                <div key={i} className="relative w-2.5 h-2.5">
                  <Star size={10} className="absolute inset-0 text-gray-200 fill-gray-200" />
                  {fillPct > 0 && (
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-black text-amber-600 leading-none">
            {Number(doctor.rating).toFixed(2)}
            {doctor.reviews_count ? <span className="text-gray-400 font-normal"> ({doctor.reviews_count})</span> : null}
          </span>
        </div>
      ) : null}

      {/* Header */}
      <div className="p-4 pb-3">
        {/* Avatar + name row */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
            >
              {doctor.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
              ) : (
                <span>{doctor.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className={clsx("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white", statusDotColor)} />
            {isSelected && (
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                <CheckCircle2 size={10} className="text-white" />
              </div>
            )}
          </div>

          {/* Name + spec + badges */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* leave room for the absolute badge (top-3 right-3 ≈ 80px wide) */}
            <p className="text-sm font-bold text-gray-900 leading-tight truncate pr-[72px]">{doctor.name || 'Имя не указано'}</p>
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              <Stethoscope size={9} className="text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-600 font-medium truncate">{getSpecializationName(doctor, language)}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={clsx("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", availabilityClass)}>
                {availabilityLabel}
              </span>
              {doctor.years_of_experience ? (
                <span className="text-[10px] text-gray-400">{doctor.years_of_experience} лет</span>
              ) : null}
            </div>
            {earliestLabel && (
              <div className="flex items-center gap-1 mt-1.5 min-w-0">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full truncate">
                  <Zap size={8} className="fill-blue-400 text-blue-400 flex-shrink-0" />
                  {earliestLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Price block — full width, stacks cleanly */}
        {doctor.online_consultation_price ? (() => {
          const price = Number(doctor.online_consultation_price);
          const duration = doctor.preferred_consultation_duration || 30;
          const perMin = Math.round(price / duration);
          return (
            <div className="flex items-center justify-between mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                  <Video size={8} />Видео
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-medium">
                  <Phone size={8} />Аудио
                </span>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-sm font-black text-emerald-600 leading-none">
                  {price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {getCurrencySymbol(clinicCurrency)}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium leading-none mt-0.5">за {duration} мин · ≈{perMin} {getCurrencySymbol(clinicCurrency)}/мин</span>
              </div>
            </div>
          );
        })() : (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium">
              <Video size={8} />Видео
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-medium">
              <Phone size={8} />Аудио
            </span>
          </div>
        )}

        {/* Clinic + location row */}
        <div className="flex items-center gap-2 mt-2 min-w-0">
          {doctor.clinic ? (
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg min-w-0 flex-1 overflow-hidden">
              {doctor.clinic.logo ? (
                <div className="w-5 h-5 rounded-md overflow-hidden bg-white border border-blue-100 flex-shrink-0 flex items-center justify-center p-0.5">
                  <img src={doctor.clinic.logo} alt={doctor.clinic.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-md bg-blue-100 flex-shrink-0 flex items-center justify-center">
                  <Building2 size={10} className="text-blue-500" />
                </div>
              )}
              <span className="text-[10px] font-semibold text-blue-700 truncate">{doctor.clinic.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg flex-1">
              <Building2 size={10} className="text-gray-400 flex-shrink-0" />
              <span className="text-[10px] text-gray-400">Независимый врач</span>
            </div>
          )}
          <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-gray-400">
            <MapPin size={9} /><span>Онлайн</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-4" />

      {/* Slots for selected date */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        {slotsForDate.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {freeCount} свободно
              </span>
              {slotsForDate.length - freeCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  {slotsForDate.length - freeCount} занято
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {displaySlots.map(slot => {
                const isFree = !slot.is_booked && (slot.available_spots ?? 1) > 0;
                return (
                  <button
                    key={slot.id}
                    disabled={!isFree}
                    onClick={() => isFree && onTimeslotSelect?.(slot)}
                    className={clsx(
                      "flex items-center justify-center py-1.5 rounded-lg transition-all",
                      isFree
                        ? "bg-emerald-50 border border-emerald-200 hover:text-white hover:border-transparent cursor-pointer"
                        : "bg-gray-50 border border-gray-100 cursor-not-allowed"
                    )}
                    onMouseEnter={(e) => {
                      if (isFree) (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${g1}, ${g2})`;
                    }}
                    onMouseLeave={(e) => {
                      if (isFree) (e.currentTarget as HTMLButtonElement).style.background = '';
                    }}
                  >
                    <span className={clsx("text-[11px] font-black", isFree ? "text-emerald-700" : "text-gray-300 line-through")}>
                      {formatTime(slot.start_time)}
                    </span>
                  </button>
                );
              })}
              {hiddenCount > 0 && (
                <div className="flex items-center justify-center py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <span className="text-[10px] font-bold text-gray-400">+{hiddenCount}</span>
                </div>
              )}
            </div>
          </>
        ) : earliestSlot ? (
          <button
            onClick={() => {
              const d = new Date(earliestSlot.start_time);
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              onDateSelect?.(dateStr);
            }}
            className="w-full flex flex-col items-center justify-center py-3 gap-1.5 rounded-xl border border-dashed transition-all"
            style={{ borderColor: g1, color: g1 }}
            onMouseEnter={e => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = `linear-gradient(135deg, ${g1}, ${g2})`;
              btn.style.borderColor = 'transparent';
              btn.style.color = 'white';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = '';
              btn.style.borderColor = g1;
              btn.style.color = g1;
            }}
          >
            <div className="flex items-center gap-1">
              <Zap size={10} className="fill-current flex-shrink-0" />
              <span className="text-[10px] font-bold">Ближайший слот</span>
            </div>
            <span className="text-[11px] font-black">{earliestLabel}</span>
            <span className="text-[9px] opacity-60">Нажмите, чтобы перейти</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <Calendar className="w-4 h-4 text-gray-300" />
            <p className="text-[10px] text-gray-400">Нет свободных слотов</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DoctorCard);
