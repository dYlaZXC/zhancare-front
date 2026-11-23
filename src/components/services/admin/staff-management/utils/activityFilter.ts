import type { StaffMember, TodayActivity } from "../types/staffTypes";

/**
 * The one activity-dependent filter (onlyOngoing). Shared by
 * StaffActivityGrid (renders the cards) and StaffPaginationControls (shows
 * the count/page numbers in the toolbar) so the two can never drift apart
 * and disagree on what "N results" means vs. what's actually rendered.
 */
export function filterByOngoing(
  members: StaffMember[],
  activityById: Record<number, TodayActivity>,
  onlyOngoing: boolean
): StaffMember[] {
  if (!onlyOngoing) return members;
  return members.filter((m) => activityById[m.id]?.state === "ongoing");
}
