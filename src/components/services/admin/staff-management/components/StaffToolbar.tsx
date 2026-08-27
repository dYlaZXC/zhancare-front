"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Search, Trash2, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchSelect from "../../schedule/components/SearchSelect";
import { PAGE_SIZE } from "../types/staffTypes";

type FilterRole = 'all' | 'doctor' | 'nurse';
type FilterStatus = 'all' | 'available' | 'busy' | 'offline' | 'break';

function FiltersPopover({ onlyOngoing, onToggleOnlyOngoing }: { onlyOngoing: boolean; onToggleOnlyOngoing: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all border-2 ${
          onlyOngoing ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-200'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="hidden lg:inline">Фильтры</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 min-w-[220px]"
          >
            <label className="flex items-center gap-2.5 px-1 py-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyOngoing}
                onChange={onToggleOnlyOngoing}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Сейчас на приёме</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StaffToolbar({
  searchQuery,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  filterStatus,
  onFilterStatusChange,
  filteredCount,
  currentPage,
  totalPages,
  onPageChange,
  showDeleted,
  onToggleShowDeleted,
  onlyOngoing,
  onToggleOnlyOngoing,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterRole: FilterRole;
  onFilterRoleChange: (v: FilterRole) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (v: FilterStatus) => void;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (updater: (p: number) => number) => void;
  showDeleted: boolean;
  onToggleShowDeleted: () => void;
  onlyOngoing: boolean;
  onToggleOnlyOngoing: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Compact pagination in toolbar */}
      {filteredCount > PAGE_SIZE && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onPageChange(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-600 px-3 py-2.5 rounded-2xl border-2 border-gray-200 bg-white min-w-[72px] text-center tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Filter */}
      <div className="w-full md:w-48">
        <SearchSelect
          options={[
            { id: 'all', label: 'Все роли' },
            { id: 'doctor', label: 'Доктора' },
            { id: 'nurse', label: 'Медсестры' },
          ]}
          value={filterRole}
          onChange={(val) => onFilterRoleChange((val || 'all') as FilterRole)}
          placeholder="Все роли"
          activeFill={filterRole !== 'all'}
        />
      </div>

      {/* Status Filter */}
      <div className="w-full md:w-48">
        <SearchSelect
          options={[
            { id: 'all', label: 'Все статусы' },
            { id: 'available', label: 'Доступен' },
            { id: 'busy', label: 'Занят' },
            { id: 'break', label: 'На перерыве' },
            { id: 'offline', label: 'Не работает' },
          ]}
          value={filterStatus}
          onChange={(val) => onFilterStatusChange((val || 'all') as FilterStatus)}
          placeholder="Все статусы"
          activeFill={filterStatus !== 'all'}
        />
      </div>

      {/* Show Deleted Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleShowDeleted}
        className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${
          showDeleted
            ? 'bg-red-100 text-red-700 border-2 border-red-300'
            : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
        }`}
        title={showDeleted ? 'Показать активных сотрудников' : 'Показать удаленных сотрудников'}
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden lg:inline">
          {showDeleted ? 'Удаленные' : 'Активные'}
        </span>
      </motion.button>

      <FiltersPopover onlyOngoing={onlyOngoing} onToggleOnlyOngoing={onToggleOnlyOngoing} />
    </div>
  );
}
