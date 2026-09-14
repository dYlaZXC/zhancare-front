"use client";

/**
 * Single shared subscription point for live staff activity. Exactly one
 * StaffActivityProvider should be mounted per staff page — it's the only
 * place useStaffActivityFeed() (and therefore the one WebSocket connection)
 * gets called. Everything that needs activityById (the card grid, the
 * activity-aware pagination count in the toolbar) reads it via
 * useStaffActivityContext() instead of each calling the feed hook
 * independently, which would open duplicate WS connections and duplicate
 * resync/degraded-fallback machinery for no reason.
 *
 * Consumers of this context re-render on every live update, by design —
 * that's the whole point. Anything that must NOT re-render on activity
 * changes (StaffManagement itself, and therefore the CRUD modals it also
 * renders) simply never calls useStaffActivityContext(): a context
 * Provider's value changing only re-renders components that actually read
 * it, never its own ancestors or non-consuming siblings/children.
 */
import { createContext, useContext } from "react";
import { useStaffActivityFeed } from "@/hooks/useStaffActivityFeed";
import type { TodayActivity } from "../types/staffTypes";

const StaffActivityContext = createContext<Record<number, TodayActivity>>({});

export function StaffActivityProvider({ children }: { children: React.ReactNode }) {
  const { activityById } = useStaffActivityFeed();
  return <StaffActivityContext.Provider value={activityById}>{children}</StaffActivityContext.Provider>;
}

export function useStaffActivityContext(): Record<number, TodayActivity> {
  return useContext(StaffActivityContext);
}
