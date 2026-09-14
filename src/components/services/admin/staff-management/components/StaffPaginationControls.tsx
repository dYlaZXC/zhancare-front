"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStaffActivityContext } from "../context/StaffActivityContext";
import { filterByOngoing } from "../utils/activityFilter";
import type { StaffMember } from "../types/staffTypes";
import { PAGE_SIZE } from "../types/staffTypes";

interface StaffPaginationControlsProps {
  /** Same activity-independent list StaffActivityGrid receives. */
  members: StaffMember[];
  onlyOngoing: boolean;
  currentPage: number;
  onPageChange: (updater: (p: number) => number) => void;
}

/**
 * The "‹ page N/M ›" control that used to live inline in StaffToolbar.
 * Pulled out into its own component because it needs the activity-filtered
 * count (via useStaffActivityContext) to show the right totals — same
 * reasoning as StaffActivityGrid, kept separate only because it renders in
 * a different spot in the layout (the toolbar row, not the card list).
 * Slotted into StaffToolbar via its `paginationSlot` prop so StaffToolbar
 * itself stays activity-agnostic.
 */
export function StaffPaginationControls({ members, onlyOngoing, currentPage, onPageChange }: StaffPaginationControlsProps) {
  const activityById = useStaffActivityContext();

  const filteredCount = useMemo(
    () => filterByOngoing(members, activityById, onlyOngoing).length,
    [members, activityById, onlyOngoing]
  );

  if (filteredCount <= PAGE_SIZE) return null;

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-gray-600 px-3 py-2.5 rounded-2xl border-2 border-gray-200 bg-white min-w-[72px] text-center tabular-nums">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
