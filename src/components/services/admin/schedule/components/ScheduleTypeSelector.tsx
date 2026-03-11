"use client";

import { Calendar, Clock } from "lucide-react";

interface ScheduleTypeSelectorProps {
  scheduleType: 'weekly' | 'constant';
  onChange: (type: 'weekly' | 'constant') => void;
}

/**
 * Schedule Type Selector Component
 * Allows selection between Weekly (Недельное) and Constant (Постоянное) schedules
 */
export default function ScheduleTypeSelector({ scheduleType, onChange }: ScheduleTypeSelectorProps) {
  return (
    <div className="flex gap-3">
      {/* Weekly Schedule Button */}
      <button
        type="button"
        onClick={() => onChange('weekly')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
          scheduleType === 'weekly'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="font-medium">Недельное</span>
      </button>

      {/* Constant Schedule Button */}
      <button
        type="button"
        onClick={() => onChange('constant')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
          scheduleType === 'constant'
            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        <Clock className="w-5 h-5" />
        <span className="font-medium">Постоянное</span>
      </button>
    </div>
  );
}
