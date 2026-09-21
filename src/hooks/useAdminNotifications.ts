"use client";

/**
 * Thin wrapper around the ALREADY-BUILT notification pipeline — the
 * websocketService singleton already parses incoming
 * {type: 'notification', data: {...}} frames into a dispatchable
 * 'notification' event (see websocketService.ts), and the backend already
 * pushes admin_tasks reminders through it. This hook just fetches the
 * initial unread list/count on mount and appends live pushes as they
 * arrive — it does NOT open a second raw WebSocket (unlike
 * useStaffActivitySocket.ts, which talks to a different endpoint
 * entirely); admin/layout.tsx is responsible for calling
 * websocketService.connect(token) once, same as DoctorHeader.tsx already
 * does for doctors.
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { websocketService } from "@/services/websocketService";

export interface AdminNotification {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  admin_task: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data?.results ?? []);
      setUnreadCount(res.data?.unread_count ?? 0);
    } catch {
      // best-effort — the bell just stays at its previous/default state
    }
  }, []);

  useEffect(() => {
    fetchInitial();

    const handleLive = (data: any) => {
      const notif: AdminNotification = {
        id: data.id,
        notification_type: data.notification_type,
        title: data.title,
        body: data.body,
        admin_task: data.admin_task_id ?? null,
        is_read: false,
        read_at: null,
        created_at: data.created_at,
      };
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    websocketService.on("notification", handleLive);
    return () => websocketService.off("notification", handleLive);
  }, [fetchInitial]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.post(`/notifications/${id}/mark_read/`);
    } catch {
      // optimistic update stands even if the request fails silently
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await api.post("/notifications/mark_all_read/");
    } catch {
      // optimistic update stands
    }
  }, []);

  return { notifications, unreadCount, markRead, markAllRead };
}
