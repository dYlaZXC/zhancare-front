"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ChevronDown, Search, X } from "lucide-react";
import type { Clinic } from "../types/staffTypes";

// ── Premium Searchable Clinic Dropdown ────────────────────────────────────────
export function ClinicSearchDropdown({
  clinics,
  value,
  onChange,
  hasError,
}: {
  clinics: Clinic[];
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = clinics.find((c) => String(c.id) === String(value));

  const MAX_VISIBLE = 50;
  const searchTrimmed = search.trim();
  const filtered = searchTrimmed
    ? clinics.filter((c) => c.name.toLowerCase().includes(searchTrimmed.toLowerCase()))
    : clinics.slice(0, MAX_VISIBLE);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${
          hasError
            ? "border-red-400 bg-red-50"
            : open
            ? "border-blue-500 bg-white shadow-md shadow-blue-100"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-blue-600" : "bg-gray-100"}`}>
            <svg className={`w-4 h-4 ${selected ? "text-white" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className={`text-sm font-medium truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
            {selected ? selected.name : "Выберите клинику"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selected && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors"
            >
              <X size={11} className="text-gray-500 hover:text-red-500" />
            </button>
          )}
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}
          >
            {/* Search bar */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск клиники..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X size={13} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 px-1">
                {searchTrimmed
                  ? `${filtered.length} из ${clinics.length} клиник`
                  : `Показано ${filtered.length} из ${clinics.length} — введите название для поиска`}
              </p>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-56">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Клиника не найдена</div>
              ) : (
                filtered.map((clinic) => {
                  const isSelected = String(clinic.id) === String(value);
                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      onClick={() => { onChange(String(clinic.id)); setOpen(false); setSearch(""); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {clinic.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm truncate ${isSelected ? "text-blue-700 font-semibold" : "text-gray-700"}`}>
                        {clinic.name}
                      </span>
                      {isSelected && <CheckCircle size={14} className="ml-auto flex-shrink-0 text-blue-500" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
