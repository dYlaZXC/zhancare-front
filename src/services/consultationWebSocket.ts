/**
 * Optimized WebSocket Service for Consultation Management
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Type-safe event handling
 * - Role-based subscription management
 * - Built-in error handling and logging
 * - Consultation-specific event types
 */

import { toast } from 'react-toastify';
import { getWebSocketURL } from '@/utils/api';

// Types for consultation WebSocket events
export interface ConsultationData {
  id: number;
  meeting_id: string;
  patient_name: string;
  patient_email: string | null;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled' | 'missed';
  is_urgent?: boolean;
  symptoms?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  scheduled_at?: string;
  doctor_id?: number;
  patient_id?: number;
}

export interface ConsultationWebSocketEvent {
  type: 'consultation_created' | 'consultation_updated' | 'consultation_status_changed' | 'doctor_availability_changed';
  data: ConsultationData | any;
  timestamp: string;
}

export interface WebSocketConfig {
  onConsultationCreated?: (consultation: ConsultationData) => void;
  onConsultationUpdated?: (consultation: ConsultationData) => void;
  onConsultationStatusChanged?: (consultation: ConsultationData) => void;
  onDoctorAvailabilityChanged?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  userRole?: 'doctor' | 'patient' | 'admin';
  userId?: number;
}

class ConsultationWebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private token: string | null = null;
  private isConnected = false;
  private isReconnecting = false;
  private userRole: string | null = null;
  private hasAuthError = false;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  /**
   * Initialize WebSocket connection with configuration
   */
  initialize(config: WebSocketConfig, token: string): Promise<boolean> {
    this.config = config;
    this.token = token;
    this.userRole = config.userRole || null;
    this.hasAuthError = false;

    return new Promise((resolve) => {
      this.connect();

      // Wait for connection or timeout
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      const checkConnection = () => {
        if (this.isConnected) {
          clearTimeout(timeout);
          resolve(true);
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Use dedicated consultation WebSocket endpoint
      const wsUrl = this.buildWebSocketUrl();
      // console.log(`🔌 Connecting to consultation WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      // console.log('✅ Consultation WebSocket connected');
      this.isConnected = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      // Authenticate immediately after connection
      this.authenticate();

      this.config.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      // console.log(`🔌 Consultation WebSocket disconnected: ${event.code} - ${event.reason}`);
      this.isConnected = false;

      this.config.onDisconnect?.();

      // Only attempt reconnection if it wasn't a manual disconnect
      if (event.code !== 1000) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ Consultation WebSocket error:', error);
      if (this.hasAuthError) {
        return;
      }
      this.config.onError?.('WebSocket connection error');
    };
  }

  /**
   * Authenticate user and join appropriate groups
   */
  private authenticate(): void {
    if (!this.ws || !this.token) return;

    const authMessage = {
      type: 'authenticate',
      token: this.token,
      user_role: this.userRole,
      user_id: this.config.userId
    };

    // console.log('🔐 Authenticating consultation WebSocket:', { role: this.userRole });
    this.send(authMessage);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    // console.log('📥 Consultation WebSocket message:', message);

    switch (message.type) {
      case 'authenticated':
        // console.log(`✅ Consultation WebSocket authenticated as ${message.data?.role}`);
        this.handleAuthenticated(message.data);
        break;

      case 'consultation_created':
        // console.log('🆕 New consultation created:', message.data);
        this.config.onConsultationCreated?.(message.data);
        break;

      case 'consultation_updated':
        // console.log('📝 Consultation updated:', message.data);
        this.config.onConsultationUpdated?.(message.data);
        break;

      case 'consultation_status_changed':
        // console.log('🔄 Consultation status changed:', message.data);
        this.config.onConsultationStatusChanged?.(message.data);
        break;

      case 'doctor_availability_changed':
        // console.log('👨‍⚕️ Doctor availability changed:', message.data);
        this.config.onDoctorAvailabilityChanged?.(message.data);
        break;

      case 'error':
        this.handleErrorMessage(message.data?.message);
        break;

      default:
        // console.log('❓ Unknown consultation WebSocket message type:', message.type);
    }
  }

  /**
   * Handle error messages from the WebSocket server
   */
  private handleErrorMessage(rawMessage?: string): void {
    const normalizedMessage = rawMessage?.toLowerCase() || '';

    if (normalizedMessage.includes('authentication token')) {
      // Suppress reconnect loops when authentication fails
      this.hasAuthError = true;
      this.isReconnecting = false;
      this.reconnectAttempts = this.maxReconnectAttempts;
      this.ws?.close(4001, 'Authentication failed');
      console.warn('⚠️ Consultation WebSocket authentication failed:', rawMessage);
      return;
    }

    console.error('❌ Consultation WebSocket error:', rawMessage);
    this.config.onError?.(rawMessage || 'Unknown error');
  }

  /**
   * Handle successful authentication
   */
  private handleAuthenticated(data: any): void {
    if (data?.role === 'doctor') {
      // console.log('👨‍⚕️ Doctor authenticated - ready to receive consultation notifications');
      toast.success('🔗 Подключено к системе консультаций', {
        autoClose: 2000,
        position: 'top-right'
      });
    } else if (data?.role === 'patient') {
      // console.log('👤 Patient authenticated - ready to receive consultation updates');
    }
  }

  /**
   * Send message to WebSocket server
   */
  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ Cannot send message - WebSocket not connected');
    }
  }

  /**
   * Handle reconnection logic with exponential backoff
   */
  private handleReconnect(): void {
    if (
      this.hasAuthError ||
      this.isReconnecting ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // console.log(`🔄 Attempting to reconnect consultation WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);

    setTimeout(() => {
      this.connect();
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 16000);
    }, this.reconnectDelay);
  }

  /**
   * Build the full WebSocket URL for consultations.
   */
  private buildWebSocketUrl(): string {
    const baseUrl = getWebSocketURL().replace(/\/$/, '');
    return `${baseUrl}/consultations/`;
  }

  /**
   * Manually disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      // console.log('👋 Manually disconnecting consultation WebSocket');
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.isReconnecting = false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Send a custom message (for future extensibility)
   */
  sendMessage(type: string, data: any): void {
    this.send({ type, data });
  }
}

// Create singleton instance
export const consultationWebSocket = new ConsultationWebSocketService();

/**
 * React Hook for using consultation WebSocket
 */
import React from 'react';

export function useConsultationWebSocket(config: WebSocketConfig) {
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const enhancedConfig: WebSocketConfig = {
      ...config,
      onConnect: () => {
        setIsConnected(true);
        config.onConnect?.();
      },
      onDisconnect: () => {
        setIsConnected(false);
        config.onDisconnect?.();
      }
    };

    consultationWebSocket.initialize(enhancedConfig, token);

    return () => {
      consultationWebSocket.disconnect();
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    disconnect: () => consultationWebSocket.disconnect(),
    sendMessage: (type: string, data: any) => consultationWebSocket.sendMessage(type, data)
  };
}

export default consultationWebSocket;
