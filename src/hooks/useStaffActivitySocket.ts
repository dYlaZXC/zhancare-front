"use client";

/**
 * Transport-only WebSocket hook for live staff-activity updates
 * (ws/staff-activity/). Deliberately dumb: it only connects, reconnects
 * (exponential backoff), heartbeats, and hands parsed events up — the
 * resync/versioning/epoch protocol lives in StaffManagement.tsx, not here,
 * so this hook stays reusable if another screen ever needs the same feed.
 *
 * Modeled on consultationWebSocket.ts's connect/reconnect/type-switch shape
 * (cookie-based auth — the httpOnly access cookie rides the handshake, no
 * token needed), plus websocketService.ts's ping/heartbeat-timeout logic,
 * which consultationWebSocket.ts itself does NOT have: it only reconnects on
 * a real `close` event, which never fires for a socket the browser still
 * reports OPEN but that a NAT/proxy has silently dropped. Client sends
 * {type:"ping"} periodically; if no {type:"pong"} arrives within the
 * timeout, the socket is forced closed so the normal reconnect path (and
 * the caller's resync-on-open logic) takes over.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getWebSocketURL } from "@/utils/api";
import type { StaffActivityWsEvent } from "@/components/services/admin/staff-management/types/staffTypes";

const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 90_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 16_000;

interface UseStaffActivitySocketOptions {
  /** Fires every time the socket reaches OPEN — first connect AND every
   * reconnect alike, so the caller can run one unified resync protocol
   * instead of treating "initial connect" as a special case. */
  onOpen: () => void;
  onEvent: (event: StaffActivityWsEvent) => void;
}

export function useStaffActivitySocket({ onOpen, onEvent }: UseStaffActivitySocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manuallyClosedRef = useRef(false);

  // Latest-callback refs so connect()'s handlers always invoke the current
  // onOpen/onEvent without needing them in the effect's dependency array
  // (which would tear down and reconnect the live socket every render).
  const onOpenRef = useRef(onOpen);
  const onEventRef = useRef(onEvent);
  onOpenRef.current = onOpen;
  onEventRef.current = onEvent;

  const clearPongTimeout = useCallback(() => {
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  const clearPingTimer = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const armPongTimeout = useCallback(() => {
    clearPongTimeout();
    pongTimeoutRef.current = setTimeout(() => {
      // No pong within the window — transport looks alive to the browser
      // but nothing is actually getting through. Force-close so the normal
      // onclose → reconnect → resync path takes over.
      wsRef.current?.close();
    }, PONG_TIMEOUT_MS);
  }, [clearPongTimeout]);

  const startHeartbeat = useCallback(() => {
    clearPingTimer();
    armPongTimeout();
    pingTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, PING_INTERVAL_MS);
  }, [armPongTimeout, clearPingTimer]);

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const url = `${getWebSocketURL().replace(/\/$/, "")}/staff-activity/`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    // A WebSocket's `close` event always fires asynchronously — never
    // synchronously inside a `.close()` call. That means a socket closed by
    // an EARLIER effect run (e.g. React StrictMode's dev-only mount →
    // cleanup → mount double-invoke, which closes the first socket while
    // it's still CONNECTING) can have its `onclose` fire AFTER a later
    // connect() has already replaced wsRef.current with a new, live socket.
    // Without this guard, that stale onclose would null out the live
    // socket's ref and schedule a spurious extra reconnect — observed
    // directly as a 3rd WS connection opening on every page load. Every
    // handler below checks isCurrent() first so a superseded socket's
    // events are inert.
    const isCurrent = () => wsRef.current === ws;

    ws.onopen = () => {
      if (!isCurrent()) return;
      setIsConnected(true);
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
      startHeartbeat();
      onOpenRef.current();
    };

    ws.onmessage = (evt) => {
      if (!isCurrent()) return;
      let message: any;
      try {
        message = JSON.parse(evt.data);
      } catch {
        return;
      }
      if (message?.type === "pong") {
        armPongTimeout(); // still alive — push the deadline out again
        return;
      }
      if (message?.type === "staff_activity.update") {
        onEventRef.current(message as StaffActivityWsEvent);
      }
    };

    ws.onclose = () => {
      if (!isCurrent()) return;
      setIsConnected(false);
      clearPingTimer();
      clearPongTimeout();
      wsRef.current = null;
      if (manuallyClosedRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        connect();
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY_MS);
      }, reconnectDelayRef.current);
    };

    ws.onerror = () => {
      // Browsers fire close right after error — reconnect is handled there.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armPongTimeout, clearPingTimer, clearPongTimeout, startHeartbeat]);

  useEffect(() => {
    manuallyClosedRef.current = false;
    connect();
    return () => {
      manuallyClosedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearPingTimer();
      clearPongTimeout();
      wsRef.current?.close(1000, "component unmounted");
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isConnected };
}
