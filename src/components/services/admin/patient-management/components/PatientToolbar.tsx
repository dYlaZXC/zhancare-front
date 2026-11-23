"use client";

import { motion } from "framer-motion";
import { Search, Users, CheckCircle, XCircle, Building, ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE } from "../types/patientTypes";

type FilterStatus = 'all' | 'active' | 'inactive' | 'clinic_created';

export function PatientToolbar({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  filteredCount,
  clinicCreatedCount,
  currentPage,
  totalPages,
  onPageChange,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterStatus: FilterStatus;
  onFilterChange: (v: FilterStatus) => void;
  filteredCount: number;
  clinicCreatedCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (updater: (p: number) => number) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по имени, email или телефону..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Compact pagination in toolbar */}
      {filteredCount > PAGE_SIZE && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onPageChange(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-600 px-3 py-2.5 rounded-2xl border-2 border-gray-200 bg-white min-w-[72px] text-center tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Filter Buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange('all')}
          className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
            filterStatus === 'all'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
          }`}
        >
          <Users className="w-5 h-5" />
          Все
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange('active')}
          className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
            filterStatus === 'active'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          Активные
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange('inactive')}
          className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
            filterStatus === 'inactive'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
          }`}
        >
          <XCircle className="w-5 h-5" />
          Неактивные
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange('clinic_created')}
          className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
            filterStatus === 'clinic_created'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
          }`}
        >
          <Building className="w-5 h-5" />
          Созданные клиникой
          {clinicCreatedCount > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              filterStatus === 'clinic_created' ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
              {clinicCreatedCount}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
