"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, Check, Stethoscope, Building2 } from "lucide-react";
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

interface SearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
  icon: React.ReactNode;
  placeholder: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  value,
  onChange,
  options,
  allLabel,
  icon,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = [{ value: "all", label: allLabel }, ...options.map(o => ({ value: o, label: o }))];
  const filtered = allOptions.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const selected = allOptions.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  const isActive = value !== "all";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
          isActive
            ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span className={`flex-shrink-0 ${isActive ? "text-blue-500" : "text-gray-400"}`}>
          {icon}
        </span>
        <span className="flex-1 truncate text-xs sm:text-sm">
          {selected?.label ?? allLabel}
        </span>
        {isActive ? (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange("all"); }}
            className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-700 flex items-center justify-center transition-colors"
          >
            <X size={10} />
          </span>
        ) : (
          <ChevronDown
            size={14}
            className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 overflow-hidden"
          >
            {/* Search inside dropdown */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">Ничего не найдено</div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      opt.value === value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.value === value && <Check size={13} className="text-blue-500 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
      {/* Search bar */}
      <div className="relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
        />
        <input
          type="text"
          placeholder="Поиск врача..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all text-sm placeholder-gray-400 shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 flex items-center justify-center transition-colors"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-2 gap-2">
        <SearchDropdown
          value={filterByType}
          onChange={onFilterChange}
          options={doctorTypes}
          allLabel="Все специальности"
          icon={<Stethoscope size={14} />}
          placeholder="Найти специальность..."
        />
        <SearchDropdown
          value={filterByClinic}
          onChange={onClinicFilterChange}
          options={clinics}
          allLabel="Все клиники"
          icon={<Building2 size={14} />}
          placeholder="Найти клинику..."
        />
      </div>
    </motion.div>
  );
};

export default DoctorSearchAndFilters;
