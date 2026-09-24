"use client";

import { RefObject } from "react";
import { ChevronDown, Clock, Loader2, X } from "lucide-react";
import SearchSelect from "../../../components/SearchSelect";
import { DURATION_OPTIONS } from "../../../utils/durationOptions";
import { DateCalendarPicker } from "./DateCalendarPicker";
import type { ConsultationType, DiagService, DiagSlot, DoctorSlot } from "../types/addEventTypes";

export function DateTimeSection({
  consultationType,
  date,
  onDateChange,
  time,
  onTimeChange,
  duration,
  onDurationChange,
  defaultDuration = null,
  doctorId,
  loadingAvailability,
  slots,
  availabilityEntry,
  timePickerOpen,
  onTimePickerToggle,
  timePickerRef,
  selectedDiagService,
  diagSlots,
  loadingDiagSlots,
}: {
  consultationType: ConsultationType;
  date: string;
  onDateChange: (val: string) => void;
  time: string;
  onTimeChange: (val: string) => void;
  duration: number;
  onDurationChange: (val: number) => void;
  /** The selected staff member's own preferred consultation duration — used
   * only as a hint ("по умолчанию: X") once the admin has picked someone;
   * it no longer locks the field. `null` when nobody's selected yet, or the
   * selected person has no preference configured. */
  defaultDuration?: number | null;
  doctorId: string;
  loadingAvailability: boolean;
  slots: DoctorSlot[];
  availabilityEntry: { start_time: string; end_time: string } | null;
  timePickerOpen: boolean;
  onTimePickerToggle: () => void;
  timePickerRef: RefObject<HTMLDivElement>;
  selectedDiagService: DiagService | null;
  diagSlots: DiagSlot[];
  loadingDiagSlots: boolean;
}) {
  const selectedSlot = slots.find(s => s.start === time);
  const freeCount = slots.filter(s => !s.busy).length;

  return (
    <>
      {/* Duration (hidden for diagnostics) — defaults to the selected staff
          member's own preferred duration (see handleDoctorChange), but stays
          editable so the admin can pick a different one for THIS visit.
          Booking then correctly locks exactly that window (see
          BookingService.acquire_slot_for_time), and every schedule listing
          shows the real duration actually booked — not this default. */}
      {consultationType !== 'diagnostics' && (
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
            Продолжительность (минут)
          </label>
          <SearchSelect
            options={DURATION_OPTIONS}
            value={String(duration)}
            onChange={(val) => onDurationChange(parseInt(val))}
            placeholder="Выберите продолжительность..."
          />
          {defaultDuration != null && (
            duration === defaultDuration ? (
              <p className="text-xs text-gray-400 mt-1.5">По умолчанию для этого специалиста</p>
            ) : (
              <p className="text-xs text-amber-600 mt-1.5">
                Обычно у этого специалиста {DURATION_OPTIONS.find(o => o.id === defaultDuration)?.label?.toLowerCase() ?? `${defaultDuration} минут`}.{' '}
                <button
                  type="button"
                  onClick={() => onDurationChange(defaultDuration)}
                  className="underline font-semibold hover:text-amber-700"
                >
                  Вернуть по умолчанию
                </button>
              </p>
            )
          )}
        </div>
      )}

      {/* Date — a proper dropdown calendar, not the browser's native picker.
          Once a doctor/nurse is selected, it also shades in which days they
          actually work, resolved with the exact same "mixed as fallback"
          precedence the time picker below already uses — so the admin can
          see at a glance where there's any point clicking, instead of
          picking a date blind and only then finding out it's a day off. */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
          Дата
        </label>
        <DateCalendarPicker
          value={date}
          onChange={onDateChange}
          doctorId={consultationType !== 'diagnostics' ? doctorId : undefined}
          consultationType={consultationType}
          slots={consultationType !== 'diagnostics' ? slots : undefined}
          loadingSlots={loadingAvailability}
          time={time}
          onTimeChange={consultationType !== 'diagnostics' ? onTimeChange : undefined}
        />
      </div>

      {/* Time — simple picker for diagnostics, slot-based for doctor/nurse */}
      <div ref={consultationType !== 'diagnostics' ? timePickerRef : undefined}>
        <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
          Время
        </label>
        {consultationType === 'diagnostics' ? (
          !selectedDiagService ? (
            <div className="px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-400">Сначала выберите услугу</p>
            </div>
          ) : loadingDiagSlots ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span className="text-sm text-gray-400">Загрузка слотов...</span>
            </div>
          ) : diagSlots.length === 0 ? (
            <div className="px-4 py-3 rounded-2xl border-2 border-amber-200 bg-amber-50">
              <p className="text-sm text-amber-700">⚠️ На эту дату нет свободных слотов для «{selectedDiagService.name}»</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {diagSlots.map(slot => (
                <button key={slot.label} type="button" onClick={() => onTimeChange(slot.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    time === slot.label
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                  }`}
                  style={time === slot.label ? { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' } : undefined}>
                  {slot.label}
                  {slot.available !== null && <span className="ml-1 opacity-70">· {slot.available}</span>}
                </button>
              ))}
              <input type="text" value={time} required readOnly className="sr-only" tabIndex={-1} />
            </div>
          )
        ) : doctorId && date ? (() => {
          if (loadingAvailability) {
            return (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Загрузка расписания...</span>
              </div>
            );
          }

          if (slots.length === 0) {
            const staffLabel = consultationType === 'home' ? 'медсестры' : 'доктора';
            return (
              <div className="px-4 py-3 rounded-2xl border-2 border-amber-200 bg-amber-50">
                <p className="text-sm text-amber-700">
                  {availabilityEntry
                    ? `⚠️ На сегодня рабочее время у выбранного ${staffLabel} уже закончилось (${availabilityEntry.start_time}–${availabilityEntry.end_time})`
                    : `⚠️ У выбранного ${staffLabel} нет рабочих часов на эту дату`}
                </p>
              </div>
            );
          }

          return (
            <div className="relative">
              <div onClick={onTimePickerToggle}
                className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 cursor-pointer transition-colors bg-white ${timePickerOpen ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                <Clock className={`w-4 h-4 flex-shrink-0 ${selectedSlot ? 'text-blue-500' : 'text-gray-400'}`} />
                {selectedSlot ? (
                  <>
                    <span className="flex-1 text-sm font-semibold text-gray-900">{selectedSlot.start} – {selectedSlot.end}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onTimeChange(''); }} className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </>
                ) : (
                  <span className="flex-1 text-sm text-gray-400">Выберите время</span>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${timePickerOpen ? 'rotate-180' : ''}`} />
              </div>

              {timePickerOpen && (
                <div className="absolute z-20 w-full mt-1.5 bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {freeCount} {freeCount === 1 ? 'слот свободен' : 'слота свободно'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-gray-400"><div className="w-2 h-2 rounded-full bg-emerald-400" />Свободно</span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400"><div className="w-2 h-2 rounded-full bg-gray-300" />Занято</span>
                    </div>
                  </div>
                  <div className="p-3 max-h-56 overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-3 gap-1.5">
                      {slots.map(slot => {
                        const isSelected = slot.start === time;
                        return (
                          <button key={slot.start} type="button" disabled={slot.busy}
                            onClick={() => { if (!slot.busy) { onTimeChange(slot.start); onTimePickerToggle(); } }}
                            className={`group relative flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${isSelected ? 'text-white shadow-sm' : slot.busy ? 'bg-gray-50 border border-gray-100 cursor-not-allowed' : 'bg-emerald-50 border border-emerald-200 hover:bg-[linear-gradient(135deg,#3772ff_0%,#2c5bcc_100%)] hover:border-transparent cursor-pointer'}`}
                            style={isSelected ? { background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' } : undefined}>
                            <span className={`text-[11px] font-black leading-tight ${isSelected ? 'text-white' : slot.busy ? 'text-gray-300 line-through' : 'text-emerald-700 group-hover:text-white'}`}>{slot.start}</span>
                            <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : slot.busy ? 'text-gray-300' : 'text-emerald-500 group-hover:text-blue-100'}`}>{slot.busy ? 'занято' : `– ${slot.end}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <input type="text" value={time} required readOnly className="sr-only" tabIndex={-1} />
            </div>
          );
        })() : (
          <div>
            <div className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 cursor-not-allowed">
              <Clock className="w-4 h-4 text-gray-300" />
              <span className="text-sm text-gray-400">Выберите {consultationType === 'home' ? 'медсестру' : 'доктора'} и дату</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">💡 Сначала выберите {consultationType === 'home' ? 'медсестру' : 'доктора'}, чтобы увидеть доступное время</p>
          </div>
        )}
      </div>
    </>
  );
}
