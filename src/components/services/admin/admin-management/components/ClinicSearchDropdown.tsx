"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Search, X, ChevronDown, CheckCircle } from "lucide-react";
import type { Clinic } from "../types/adminTypes";

// ─── Searchable Clinic Dropdown ───────────────────────────────────────────────

const ClinicSearchDropdown = ({
  clinics,
  value,
  onChange,
  nullLabel = "— Без клиники —",
}: {
  clinics: Clinic[];
  value: string;
  onChange: (val: string) => void;
  nullLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = clinics.find((c) => String(c.id) === String(value));
  const searchTrimmed = search.trim();
  const filtered = searchTrimmed
    ? clinics.filter((c) => c.name.toLowerCase().includes(searchTrimmed.toLowerCase()))
    : clinics.slice(0, 60);

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
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
          open
            ? "border-blue-400 bg-white ring-2 ring-blue-500/20"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Building2 className={`w-4 h-4 flex-shrink-0 ${selected ? "text-blue-500" : "text-gray-300"}`} />
          <span className={`truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
            {selected ? selected.name : nullLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="w-4 h-4 rounded-full hover:bg-red-100 flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5 text-gray-400 hover:text-red-500" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 right-0 mt-1.5 z-[60] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}
          >
            <div className="p-2.5 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск клиники..."
                  className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 px-0.5">
                {searchTrimmed
                  ? `${filtered.length} из ${clinics.length} клиник`
                  : `${filtered.length} из ${clinics.length} — введите для поиска`}
              </p>
            </div>
            <div className="overflow-y-auto max-h-52">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  !value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-3 h-3 text-gray-400" />
                </div>
                {nullLabel}
              </button>
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">Не найдено</div>
              ) : (
                filtered.map((clinic) => {
                  const isSelected = String(clinic.id) === String(value);
                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      onClick={() => { onChange(String(clinic.id)); setOpen(false); setSearch(""); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {clinic.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm truncate ${isSelected ? "text-blue-700 font-semibold" : "text-gray-700"}`}>
                        {clinic.name}
                      </span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-blue-500" />}
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
};

export default ClinicSearchDropdown;
