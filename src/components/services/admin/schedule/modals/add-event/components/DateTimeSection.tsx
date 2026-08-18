"use client";

import { RefObject } from "react";
import { ChevronDown, Clock, Loader2, X } from "lucide-react";
import SearchSelect from "../../../components/SearchSelect";
import type { ConsultationType, DiagService, DiagSlot, DoctorSlot } from "../types/addEventTypes";

const DURATION_OPTIONS = [
  { id: 15, label: '15 минут' }, { id: 30, label: '30 минут' },
  { id: 45, label: '45 минут' }, { id: 60, label: '1 час' },
  { id: 90, label: '1.5 часа' }, { id: 120, label: '2 часа' },
  { id: 150, label: '2.5 часа' }, { id: 180, label: '3 часа' },
];

export function DateTimeSection({
  consultationType,
  date,
  onDateChange,
  time,
  onTimeChange,
  duration,
  onDurationChange,
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
      {/* Duration (hidden for diagnostics) */}
      {consultationType !== 'diagnostics' && (
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
            Продолжительность (минут)
          </label>
          {doctorId ? (
            <div className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 select-none cursor-default">
              <span className="flex-1 font-medium text-gray-700">
                {DURATION_OPTIONS.find(o => o.id === duration)?.label ?? `${duration} минут`}
              </span>
              <span className="text-xs text-gray-400">из профиля врача</span>
            </div>
          ) : (
            <SearchSelect
              options={DURATION_OPTIONS}
              value={String(duration)}
              onChange={(val) => onDurationChange(parseInt(val))}
              placeholder="Выберите продолжительность..."
            />
          )}
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
          Дата
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
          required
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
