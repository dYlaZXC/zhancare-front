"use client";

import { Users } from "lucide-react";
import { ViewMode } from '../types/scheduleTypes';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export default function ViewModeSelector({ viewMode, setViewMode }: ViewModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 md:gap-2 bg-gray-100 p-1 rounded-lg md:rounded-xl overflow-x-auto scrollbar-hide">
      {(['week', 'month', 'doctors'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all flex items-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${
            viewMode === mode
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {mode === 'week' && 'Неделя'}
          {mode === 'month' && 'Месяц'}
          {mode === 'doctors' && (
            <>
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">График врачей</span>
              <span className="sm:hidden">Врачи</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
