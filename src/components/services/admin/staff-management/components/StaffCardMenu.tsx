"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Trash2, RotateCcw } from "lucide-react";
import type { StaffMember } from "../types/staffTypes";

export function StaffCardMenu({
  member,
  showDeleted,
  onDelete,
  onRestore,
}: {
  member: StaffMember;
  showDeleted: boolean;
  onDelete: (member: StaffMember) => void;
  onRestore: (member: StaffMember) => void;
}) {
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
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
        title="Ещё"
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 min-w-[170px]"
          >
            {showDeleted ? (
              <button
                onClick={() => { setOpen(false); onRestore(member); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-left"
              >
                <RotateCcw className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-800">Восстановить</span>
              </button>
            ) : (
              <button
                onClick={() => { setOpen(false); onDelete(member); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-gray-800">Удалить</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
