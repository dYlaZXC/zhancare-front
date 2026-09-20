"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Animated wrapper for a sidebar submenu (the group of child links revealed
 * under a parent item like "Управление"). Shared by every role sidebar
 * (Admin/SuperAdmin, Doctor, Patient) — they used to each render an abrupt
 * `{isOpen && <div>...}` with no transition; this animates height+opacity
 * instead so the submenu slides open/closed smoothly.
 */
export function CollapsibleSubmenu({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          {/* pr-2: the active item gets a permanent `scale-105` transform
              (see renderSubItem) — a transform bleeds past its own layout
              box without changing it, so without this buffer its right edge
              gets clipped by overflow-hidden above, flattening its rounded
              corner instead of just clipping empty space. overflow-x can't
              be left `visible` here to dodge this — combined with the
              overflow-y-hidden this animation needs, the CSS spec forces
              `visible` on one axis to compute as `auto` when the other
              isn't `visible`, which is exactly what produced the stray
              horizontal scrollbar. */}
          <div className="space-y-1 ml-3 border-l border-white/10 pl-2 pr-2 pt-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
