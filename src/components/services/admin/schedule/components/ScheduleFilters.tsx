"use client";

import { Search } from "lucide-react";
import { FilterType, FilterStatus } from '../types/scheduleTypes';

interface ScheduleFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
}

export default function ScheduleFilters({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus
}: ScheduleFiltersProps) {
  return (
    <div className="flex flex-col gap-2 md:gap-4 mt-3 md:mt-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      <div className="flex gap-2 md:gap-4">
        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option value="all">Все типы</option>
          <option value="consultation">Онлайн</option>
          <option value="appointment">Оффлайн</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option value="all">Все статусы</option>
          <option value="scheduled">Запланировано</option>
          <option value="in_progress">В процессе</option>
          <option value="completed">Завершено</option>
          <option value="cancelled">Отменено</option>
        </select>
      </div>
    </div>
  );
}
