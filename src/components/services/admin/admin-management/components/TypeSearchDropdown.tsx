"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CheckCircle } from "lucide-react";

// ─── Searchable Type Dropdown ─────────────────────────────────────────────────

const TypeSearchDropdown = ({
  value,
  onChange,
}: {
  value: "clinic" | "manager";
  onChange: (val: "clinic" | "manager") => void;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options: { value: "clinic" | "manager"; label: string; color: string; bg: string }[] = [
    { value: "clinic", label: "Администратор клиники", color: "text-blue-700", bg: "bg-blue-50" },
    { value: "manager", label: "Менеджер", color: "text-green-700", bg: "bg-green-50" },
  ];
  const selected = options.find((o) => o.value === value)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
          open
            ? "border-blue-400 bg-white ring-2 ring-blue-500/20"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <span className={`font-medium ${selected.color}`}>{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 right-0 mt-1.5 z-[60] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  value === opt.value ? opt.bg : ""
                }`}
              >
                <span className={value === opt.value ? `font-semibold ${opt.color}` : "text-gray-700"}>
                  {opt.label}
                </span>
                {value === opt.value && <CheckCircle className={`w-4 h-4 ${opt.color}`} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TypeSearchDropdown;
