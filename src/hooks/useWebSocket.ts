import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

interface WebSocketMessage {
  type: 'consultation_created' | 'consultation_updated' | 'consultation_status_changed';
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { token, user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [webSocketDisabled, setWebSocketDisabled] = useState(false);

  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!token || !user || webSocketDisabled) return;

    try {
      // Check if WebSocket is supported and backend is ready
      if (typeof WebSocket === 'undefined') {
        console.warn('⚠️ WebSocket not supported in this browser');
        setWebSocketDisabled(true);
        return;
      }

      // Use secure WebSocket protocol in production, regular in development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // For development, use the Django backend port
      const host = process.env.NODE_ENV === 'development' ? 'localhost:8002' : window.location.host;
      // Auth is no longer carried in the URL — the browser attaches the
      // httpOnly zha_access cookie to the WS handshake automatically
      // (same-site for any *.zhan.care host). The backend's JWTCookieAuthMiddleware
      // resolves scope['user'] from that cookie before the consumer even accepts.
      const wsUrl = `${protocol}//${host}/ws/consultations/`;

      // console.log('🔌 Attempting WebSocket connection:', wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = (event) => {
        // console.log('✅ WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        options.onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // console.log('📥 WebSocket message received:', message);
          options.onMessage?.(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        // console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Don't show disconnect errors if WebSocket server is not implemented yet
        if (event.code === 1006 || event.code === 1002 || event.code === 1005) {
          // console.log('💡 WebSocket server not ready - disabling WebSocket and falling back to polling');
          setReconnectAttempts(maxReconnectAttempts); // Prevent further reconnection attempts
          setWebSocketDisabled(true); // Disable future connection attempts
          return; // Don't attempt reconnection or show errors for unimplemented server
        }

        options.onDisconnect?.();

        // Attempt to reconnect if not manually closed and server exists
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          // console.log(`🔄 Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts && event.code !== 1006 && event.code !== 1002 && event.code !== 1005) {
          // console.log('❌ Max reconnection attempts reached for a real server issue');
          toast.error('⚠️ Соединение потеряно. Обновите страницу.');
        }
      };

      ws.current.onerror = (error) => {
        // console.log('💡 WebSocket connection failed - server likely not ready');
        // Don't call options.onError for expected failures
        if (reconnectAttempts === 0) {
          // First attempt failed, likely server not ready
          setWebSocketDisabled(true);
          // console.log('🔄 Disabling WebSocket attempts and using polling fallback');
        }
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
    }
  }, [token, user, options, reconnectAttempts, webSocketDisabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    setIsConnected(false);
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      // console.log('📤 WebSocket message sent:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  useEffect(() => {
    if (token && user && !webSocketDisabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, user, connect, disconnect, webSocketDisabled]);

  return {
    isConnected,
    sendMessage,
    reconnect: connect,
    disconnect
  };
};