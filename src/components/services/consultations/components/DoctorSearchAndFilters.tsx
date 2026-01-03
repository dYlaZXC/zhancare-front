"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Language } from "../types/doctor";

interface DoctorSearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterByType: string;
  onFilterChange: (value: string) => void;
  filterByClinic: string;
  onClinicFilterChange: (value: string) => void;
  language: Language;
  onLanguageChange: (value: Language) => void;
  doctorTypes: string[];
  clinics: string[];
}

const DoctorSearchAndFilters: React.FC<DoctorSearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterByType,
  onFilterChange,
  filterByClinic,
  onClinicFilterChange,
  language,
  onLanguageChange,
  doctorTypes,
  clinics,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-2"
    >
      <input
        type="text"
        placeholder="Поиск врача..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={filterByType}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all bg-white text-sm"
        >
          <option value="all">Все специальности</option>
          {doctorTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={filterByClinic}
          onChange={(e) => onClinicFilterChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all bg-white text-sm"
        >
          <option value="all">Все клиники</option>
          {clinics.map(clinic => (
            <option key={clinic} value={clinic}>{clinic}</option>
          ))}
        </select>
      </div>
    </motion.div>
  );
};

export default DoctorSearchAndFilters;