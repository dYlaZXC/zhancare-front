"use client";

/**
 * Live staff-activity feed for StaffManagement.tsx — replaces the old 60s
 * `setInterval(fetchActivity, 60_000)` poll with: a best-effort snapshot on
 * mount (so the page renders real data even if the WebSocket never
 * connects), an authoritative snapshot+event-buffering resync every time
 * the WS reaches `open` (first connect AND every reconnect — same code
 * path), epoch-scoped version ordering so out-of-order/duplicate events
 * can never overwrite newer state, a narrow degraded-mode fallback poll
 * (60s) that runs ONLY while the realtime path is actually unhealthy, and a
 * midnight rollover timer so a continuously-open tab still rolls onto the
 * next day's schedule with no DB event to tell it to.
 *
 * See the "Live staff-activity updates" implementation plan for the full
 * protocol rationale — this is a direct implementation of it.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import { useStaffActivitySocket } from "@/hooks/useStaffActivitySocket";
import type {
  StaffActivityWsEvent,
  TodayActivity,
  TodayActivityResponse,
} from "@/components/services/admin/staff-management/types/staffTypes";

const DEGRADED_RETRY_MS = 60_000;

function isWorkEndPassed(activity: TodayActivity, now: number): boolean {
  if (activity.state !== "has_free_slots" && activity.state !== "fully_booked") return false;
  return new Date(activity.work_end).getTime() <= now;
}

export function useStaffActivityFeed() {
  const [activityById, setActivityById] = useState<Record<number, TodayActivity>>({});

  const versionByIdRef = useRef<Record<number, number>>({});
  const epochRef = useRef<string | null>(null);
  const nextRolloverAtRef = useRef<string | null>(null);
  const resyncingRef = useRef(false);
  const bufferRef = useRef<StaffActivityWsEvent[]>([]);
  const resyncPromiseRef = useRef<Promise<void> | null>(null);
  const rolloverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const degradedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectedRef = useRef(false);
  const resyncRef = useRef<() => Promise<void>>(async () => {});

  const applyEvent = useCallback((event: StaffActivityWsEvent) => {
    versionByIdRef.current[event.staff_id] = event.version;
    // `version` rides the event envelope (event.version), not inside
    // event.activity itself (see StaffActivityConsumer/broadcast_staff_activity
    // on the backend) — merge it in here so the stored TodayActivity object
    // matches the REST snapshot's shape (today_activity attaches `version`
    // per item there), instead of leaving it undefined after a live update.
    setActivityById((prev) => ({ ...prev, [event.staff_id]: { ...event.activity, version: event.version } }));
  }, []);

  const clearDegradedTimer = useCallback(() => {
    if (degradedTimerRef.current) {
      clearTimeout(degradedTimerRef.current);
      degradedTimerRef.current = null;
    }
  }, []);

  const armDegradedTimer = useCallback(() => {
    clearDegradedTimer();
    // The ONLY polling in this whole feed — armed only while realtime is
    // unhealthy (WS down, or the snapshot couldn't compute an epoch, e.g.
    // Redis is down). Cleared the instant a resync comes back healthy.
    degradedTimerRef.current = setTimeout(() => {
      void resyncRef.current();
    }, DEGRADED_RETRY_MS);
  }, [clearDegradedTimer]);

  const armRolloverTimer = useCallback((nextRolloverAt: string) => {
    nextRolloverAtRef.current = nextRolloverAt;
    if (rolloverTimerRef.current) clearTimeout(rolloverTimerRef.current);
    const delay = Math.max(new Date(nextRolloverAt).getTime() - Date.now(), 0);
    rolloverTimerRef.current = setTimeout(() => {
      void resyncRef.current();
    }, delay);
  }, []);

  const resync = useCallback((): Promise<void> => {
    if (resyncPromiseRef.current) return resyncPromiseRef.current;

    const run = async () => {
      resyncingRef.current = true;
      bufferRef.current = [];
      try {
        const res = await api.get<TodayActivityResponse>("/staff/today-activity/");
        const snapshot = res.data;

        const byId: Record<number, TodayActivity> = {};
        const versions: Record<number, number> = {};
        for (const item of snapshot.staff) {
          byId[item.id] = item;
          versions[item.id] = item.version;
        }
        epochRef.current = snapshot.epoch;
        versionByIdRef.current = versions;
        setActivityById(byId);

        // Drain buffered events. >= (not strict >) because the snapshot's
        // own version read can race a commit mid-computation and land on
        // the exact same version as a buffered event — strict > would
        // silently drop it forever.
        const buffered = bufferRef.current;
        bufferRef.current = [];
        for (const event of buffered) {
          if (event.epoch !== snapshot.epoch) continue;
          const known = versionByIdRef.current[event.staff_id] ?? 0;
          if (event.version >= known) {
            versionByIdRef.current[event.staff_id] = event.version;
            setActivityById((prev) => ({ ...prev, [event.staff_id]: { ...event.activity, version: event.version } }));
          }
        }

        armRolloverTimer(snapshot.next_rollover_at);

        const healthy = isConnectedRef.current && snapshot.epoch !== null;
        if (healthy) clearDegradedTimer();
        else armDegradedTimer();
      } catch {
        // Snapshot fetch itself failed (network blip) — keep whatever data
        // we already had rendered, and let the degraded fallback retry.
        armDegradedTimer();
      } finally {
        resyncingRef.current = false;
        resyncPromiseRef.current = null;
      }
    };

    const promise = run();
    resyncPromiseRef.current = promise;
    return promise;
  }, [armDegradedTimer, armRolloverTimer, clearDegradedTimer]);

  resyncRef.current = resync;

  const handleWsEvent = useCallback(
    (event: StaffActivityWsEvent) => {
      if (resyncingRef.current) {
        bufferRef.current.push(event);
        return;
      }
      if (epochRef.current === null) {
        // Degraded — never apply an event without ordering metadata to
        // trust it against. A non-null event epoch suggests realtime has
        // recovered server-side; pull a fresh authoritative snapshot
        // instead of guessing at ordering.
        if (event.epoch) void resync();
        return;
      }
      if (event.epoch !== epochRef.current) {
        void resync();
        return;
      }
      const known = versionByIdRef.current[event.staff_id] ?? 0;
      if (event.version > known) {
        applyEvent(event);
      }
    },
    [applyEvent, resync]
  );

  const handleWsOpen = useCallback(() => {
    void resync();
  }, [resync]);

  const { isConnected } = useStaffActivitySocket({ onOpen: handleWsOpen, onEvent: handleWsEvent });
  isConnectedRef.current = isConnected;

  // Best-effort snapshot immediately on mount, purely for display — the
  // real authoritative resync runs separately from the WS 'open' handler,
  // so the page never depends on the WebSocket to show real data.
  useEffect(() => {
    api
      .get<TodayActivityResponse>("/staff/today-activity/")
      .then((res) => {
        const byId: Record<number, TodayActivity> = {};
        const versions: Record<number, number> = {};
        for (const item of res.data.staff) {
          byId[item.id] = item;
          versions[item.id] = item.version;
        }
        setActivityById(byId);
        // Only seed versions/epoch/rollover if the WS-open resync hasn't
        // already run (or isn't already running) — its data is equally
        // authoritative and additionally carries proper resync semantics
        // this best-effort call doesn't.
        if (!resyncPromiseRef.current && epochRef.current === null) {
          versionByIdRef.current = versions;
          epochRef.current = res.data.epoch;
          armRolloverTimer(res.data.next_rollover_at);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // visibilitychange: recompute local clock-derived transitions, and force
  // a resync if the socket isn't healthy or the day has rolled over
  // underneath a healthy one (midnight is not a DB event, nothing else
  // would ever tell a continuously-open-but-backgrounded tab about it).
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;

      const now = Date.now();
      setActivityById((prev) => {
        let changed = false;
        const next: Record<number, TodayActivity> = { ...prev };
        for (const activity of Object.values(prev)) {
          if (isWorkEndPassed(activity, now)) {
            changed = true;
            next[activity.id] = {
              id: activity.id,
              state: "not_working_today",
              last_seen: null,
              server_time: new Date(now).toISOString(),
              version: versionByIdRef.current[activity.id] ?? 0,
            };
          }
        }
        return changed ? next : prev;
      });

      const rolloverDue =
        nextRolloverAtRef.current !== null && now >= new Date(nextRolloverAtRef.current).getTime();
      const unhealthy = !isConnectedRef.current || epochRef.current === null;
      if (unhealthy || rolloverDue) {
        void resync();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [resync]);

  useEffect(() => {
    return () => {
      if (rolloverTimerRef.current) clearTimeout(rolloverTimerRef.current);
      clearDegradedTimer();
    };
  }, [clearDegradedTimer]);

  return { activityById };
}
