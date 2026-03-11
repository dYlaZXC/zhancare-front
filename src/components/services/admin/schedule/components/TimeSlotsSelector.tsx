"use client";

import { ChevronDown } from "lucide-react";

interface TimeSlotsSelectorProps {
  eventType: 'consultation' | 'appointment';
  formData: {
    time: string;
    doctor_id: string;
    date: string;
  };
  onChange: (time: string) => void;
  availableSlots: Array<{
    id: number;
    start_time: string;
    end_time: string;
    available_capacity: number;
  }>;
  loadingSlots: boolean;
}

export default function TimeSlotsSelector({
  eventType,
  formData,
  onChange,
  availableSlots,
  loadingSlots
}: TimeSlotsSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
        Время
      </label>
      {/* Show available slots dropdown for consultations with selected doctor */}
      {eventType === 'consultation' && formData.doctor_id && formData.date ? (
        <div className="relative">
          <select
            value={formData.time}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none appearance-none"
            required
            disabled={loadingSlots}
          >
            {loadingSlots ? (
              <option value="">Загрузка доступных слотов...</option>
            ) : availableSlots.length === 0 ? (
              <option value="">Нет доступных слотов</option>
            ) : (
              <>
                <option value="">Выберите время</option>
                {availableSlots.map((slot) => (
                  <option key={slot.id} value={slot.start_time}>
                    {slot.start_time} - {slot.end_time} ({slot.available_capacity} доступно)
                  </option>
                ))}
              </>
            )}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          {!loadingSlots && availableSlots.length === 0 && formData.doctor_id && formData.date && (
            <p className="mt-2 text-sm text-amber-600">
              ⚠️ У выбранного доктора нет доступных слотов на эту дату
            </p>
          )}
        </div>
      ) : (
        <div>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            required
            disabled={eventType === 'consultation' && !formData.doctor_id}
          />
          {eventType === 'consultation' && !formData.doctor_id && (
            <p className="mt-2 text-sm text-gray-500">
              💡 Сначала выберите доктора, чтобы увидеть доступное время
            </p>
          )}
        </div>
      )}
    </div>
  );
}
