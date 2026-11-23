"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { useStaffActivityContext } from "../context/StaffActivityContext";
import { filterByOngoing } from "../utils/activityFilter";
import type { StaffMember } from "../types/staffTypes";
import { PAGE_SIZE } from "../types/staffTypes";
import { StaffCard } from "./StaffCard";

interface StaffActivityGridProps {
  /** Already filtered by search/role/status/showDeleted and sorted —
   * everything that does NOT depend on live activity. `onlyOngoing`
   * filtering happens in here instead, since it's the one filter that
   * needs activityById. */
  members: StaffMember[];
  onlyOngoing: boolean;
  initialLoad: boolean;
  showDeleted: boolean;
  currentPage: number;
  onEdit: (member: StaffMember) => void;
  onToggleStatus: (memberId: number, currentStatus: string | undefined) => void;
  onSchedule: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
  onRestore: (member: StaffMember) => void;
}

/**
 * Renders the staff cards. Reads live activity via useStaffActivityContext()
 * — NOT its own useStaffActivityFeed() call — so this shares the single
 * WS subscription a StaffActivityProvider higher up the tree owns, rather
 * than opening a second, redundant connection. Must be mounted somewhere
 * inside a StaffActivityProvider.
 */
export function StaffActivityGrid({
  members,
  onlyOngoing,
  initialLoad,
  showDeleted,
  currentPage,
  onEdit,
  onToggleStatus,
  onSchedule,
  onDelete,
  onRestore,
}: StaffActivityGridProps) {
  const activityById = useStaffActivityContext();

  const filteredMembers = useMemo(
    () => filterByOngoing(members, activityById, onlyOngoing),
    [members, activityById, onlyOngoing]
  );

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (filteredMembers.length === 0) {
    return (
      <div className="text-center py-20">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-xl font-semibold text-gray-600 mb-2">Персонал не найден</p>
        <p className="text-gray-500">Попробуйте изменить параметры поиска или фильтры</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      {paginatedMembers.map((member, index) => (
        <StaffCard
          key={member.id}
          member={member}
          initial={initialLoad}
          index={index}
          showDeleted={showDeleted}
          activity={activityById[member.id]}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onSchedule={onSchedule}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      ))}
    </AnimatePresence>
  );
}
