import { getWebSocketURL } from '@/utils/api';

interface Doctor {
  id: number;
  name: string;
  email: string;
  doctor_type: string;
  availability_status?: string;
  availability_note?: string;
  specialization?: {
    id: number;
    name_ru: string;
    name_kz: string;
    name_en: string;
  } | null;
}

interface DoctorAvailabilityChangeData {
  doctor_id: number;
  availability_status: string;
  availability_note: string;
  old_status: string;
  data?: any; // Full doctor data from backend
  doctor_info?: {
    id: number;
    name: string;
    email: string;
    specialization: string;
  };
  timestamp: string;
}

interface WebSocketConfig {
  maxReconnectAttempts: number;
  reconnectInterval: number;
  pingInterval: number;
  connectionTimeout: number;
  heartbeatTimeout: number;
}

interface ConnectionState {
  isConnected: boolean;
  isAuthenticated: boolean;
  reconnectAttempts: number;
  lastPingTime: number;
  lastPongTime: number;
}

type EventCallback = (data: any) => void;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'authenticating';

class WebSocketService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private eventCallbacks: Map<string, EventCallback[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;

  // ✅ Optimized configuration
  private config: WebSocketConfig = {
    maxReconnectAttempts: 10,
    reconnectInterval: 1000, // Start with 1 second
    pingInterval: 30000, // 30 seconds
    connectionTimeout: 15000, // 15 seconds
    heartbeatTimeout: 60000, // 1 minute
  };

  // ✅ Connection state management
  private state: ConnectionState = {
    isConnected: false,
    isAuthenticated: false,
    reconnectAttempts: 0,
    lastPingTime: 0,
    lastPongTime: 0,
  };

  private status: ConnectionStatus = 'disconnected';
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();

  constructor() {
    // console.log('🔌 WebSocketService initialized with optimized configuration');

    // ✅ Listen for network status changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleNetworkOnline.bind(this));
      window.addEventListener('offline', this.handleNetworkOffline.bind(this));

      // ✅ Listen for visibility changes to manage connections efficiently
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

      // ✅ Handle page unload to clean up connections
      window.addEventListener('beforeunload', this.cleanup.bind(this));
    }
  }

  /**
   * ✅ Handle network coming back online
   */
  private handleNetworkOnline() {
    // console.log('🌐 Network is back online, attempting to reconnect WebSocket');
    if (!this.state.isConnected && this.token) {
      this.connect(this.token).catch(() => {
        // Error is already logged in connect method, no need to re-log
      });
    }
  }

  /**
   * ✅ Handle network going offline
   */
  private handleNetworkOffline() {
    // console.log('🌐 Network went offline, pausing WebSocket reconnection attempts');
    this.clearTimers();
  }

  /**
   * ✅ Handle page visibility changes to optimize connection usage
   */
  private handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, reduce ping frequency
      this.stopPingInterval();
      this.startPingInterval(60000); // Ping every minute when hidden
    } else {
      // Page is visible, resume normal ping frequency
      this.stopPingInterval();
      this.startPingInterval(this.config.pingInterval);
    }
  }

  /**
   * ✅ Cleanup resources and timers
   */
  private cleanup() {
    this.clearTimers();
    if (this.socket) {
      this.socket.close(1000, 'Page unload');
    }
  }

  /**
   * ✅ Clear all timers
   */
  private clearTimers() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * ✅ Set connection status and notify listeners
   */
  private setStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.statusCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in status callback:', error);
        }
      });
    }
  }

  /**
   * ✅ Subscribe to connection status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  /**
   * Get authentication token from storage
   */
  private getStoredToken(): string | null {
    // Prioritize access_token (CustomToken) over auth_token (potential JWT)
    return (
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token') ||
      null
    );
  }

  /**
   * Check if token is expired (for JWT tokens)
   */
  private isTokenExpired(token: string): boolean {
    try {
      // Handle empty or null token
      if (!token || typeof token !== 'string') {
        return true;
      }

      // Check if it's a JWT token (has 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        // If it's not a JWT token, assume it's valid for now
        // Let the server validate it
        return false;
      }
      
      // Decode and check expiration for JWT tokens
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if exp field exists
      if (!payload.exp) {
        // If no expiration, assume token is valid
        return false;
      }
      
      // Check if token is expired (with 30 second buffer)
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 30 * 1000; // 30 seconds
      
      return expirationTime <= (currentTime + bufferTime);
    } catch (error) {
      console.warn('⚠️ Could not parse token for expiration check:', error);
      // If we can't parse it, let the server decide if it's valid
      return false;
    }
  }

  /**
   * ✅ Connect to WebSocket server with improved error handling and configuration
   */
  async connect(token?: string): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnect(token);

    try {
      await this.connectionPromise;
    } catch (error) {
      // console.log('🔌 WebSocket connection failed, will retry automatically:', error instanceof Error ? error.message : error);
      // Don't re-throw the error to avoid unhandled promise rejections
      // The reconnection logic will handle retries automatically
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * ✅ Perform the actual connection logic
   */
  private async performConnect(token?: string): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // console.log('🔌 WebSocket already connected');
      return;
    }

    this.setStatus('connecting');

    // Get token from parameter or storage
    this.token = token || this.getStoredToken();

    if (!this.token) {
      console.error('❌ No authentication token available');
      this.setStatus('error');
      this.triggerCallbacks('authentication_error', {
        message: 'No authentication token found'
      });
      throw new Error('No authentication token available');
    }

    // Check if token is expired (only for JWT tokens)
    if (this.isTokenExpired(this.token)) {
      console.error('❌ Authentication token is expired');
      this.setStatus('error');
      this.triggerCallbacks('authentication_error', {
        message: 'Authentication token is expired'
      });
      throw new Error('Authentication token is expired');
    }

    // console.log('🔌 Connecting to Django Channels WebSocket...');

    // ✅ Use the centralized URL configuration. Auth is no longer carried in
    // the URL — the browser attaches the httpOnly zha_access cookie to the WS
    // handshake automatically, and the backend's JWTCookieAuthMiddleware
    // resolves scope['user'] from it before the consumer accepts.
    const baseWsUrl = getWebSocketURL();
    const wsUrl = `${baseWsUrl}/socketio/`;

    // console.log('🔍 Debug info:', {
    //   baseWsUrl,
    //   finalUrl: wsUrl.replace(/token=[^&]+/, 'token=[REDACTED]'),
    //   tokenExists: !!this.token,
    //   tokenLength: this.token?.length,
    //   protocol: window.location.protocol
    // });

    try {
      // Validate environment
      this.validateEnvironment();

      this.socket = new WebSocket(wsUrl);
      this.setupEventHandlers();

      // ✅ Set optimized connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.state.isConnected) {
          console.error(`❌ WebSocket connection timeout after ${this.config.connectionTimeout}ms`);
          this.setStatus('error');
          this.socket?.close();
          this.triggerCallbacks('connect_error', {
            message: 'Connection timeout - server may be unavailable',
            timeout: true
          });
        }
      }, this.config.connectionTimeout);

      // Wait for connection to complete
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.connectionTimeout);

        const cleanup = () => {
          clearTimeout(timeoutId);
        };

        this.socket!.addEventListener('open', () => {
          cleanup();
          resolve();
        }, { once: true });

        this.socket!.addEventListener('error', (error) => {
          cleanup();
          reject(error);
        }, { once: true });
      });

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.setStatus('error');
      this.triggerCallbacks('connect_error', {
        error,
        message: error instanceof Error ? error.message : 'Unknown connection error'
      });
      throw error;
    }
  }

  /**
   * ✅ Validate environment for WebSocket support
   */
  private validateEnvironment() {
    if (typeof window === 'undefined') {
      throw new Error('WebSocket requires browser environment');
    }

    if (!window.WebSocket) {
      throw new Error('WebSocket is not supported by this browser');
    }

    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }
  }

  /**
   * ✅ Setup WebSocket event handlers with improved state management
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('✅ WebSocket connected to Django Channels');
      this.state.isConnected = true;
      this.state.reconnectAttempts = 0;
      this.setStatus('connected');

      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Start optimized ping interval for keepalive
      this.startPingInterval(this.config.pingInterval);

      // Start heartbeat monitoring
      this.startHeartbeatMonitoring();

      // Trigger connect callbacks
      this.triggerCallbacks('connect', { connected: true, timestamp: Date.now() });
    };

    this.socket.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      this.state.isConnected = false;
      this.state.isAuthenticated = false;
      this.setStatus('disconnected');
      this.stopPingInterval();
      this.stopHeartbeatMonitoring();

      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.triggerCallbacks('disconnect', {
        code: event.code,
        reason: event.reason,
        timestamp: Date.now()
      });

      // Handle specific error codes
      if (event.code === 4001) {
        // Custom code for authentication error
        console.error('❌ WebSocket authentication failed');
        this.setStatus('error');
        this.triggerCallbacks('authentication_error', {
          message: 'Invalid authentication token'
        });
        this.clearStoredTokens();
      } else if (event.code !== 1000 && event.code !== 1001) {
        // Auto-reconnect for unexpected disconnections (not normal closure or going away)
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      // Reduce log noise for normal disconnections
      if (this.socket?.readyState === WebSocket.CLOSED || this.socket?.readyState === WebSocket.CLOSING) {
        // console.log('🔌 WebSocket disconnected normally');
      } else {
        // Extract meaningful error information instead of logging the Event object
        const errorMessage = error instanceof ErrorEvent
          ? error.message || 'WebSocket connection failed'
          : 'WebSocket error occurred';

        console.warn('⚠️ WebSocket error:', errorMessage);
        console.warn('⚠️ WebSocket connection details:', {
          readyState: this.socket?.readyState,
          url: this.socket?.url ? this.socket.url.replace(/token=[^&]+/, 'token=[REDACTED]') : undefined,
          protocol: this.socket?.protocol,
          extensions: this.socket?.extensions,
          binaryType: this.socket?.binaryType
        });
      }

      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Try to provide more meaningful error information
      let errorDetails = {
        error,
        message: 'WebSocket connection failed',
        readyState: this.socket?.readyState,
        url: this.socket?.url,
        timestamp: new Date().toISOString()
      };

      // Check common connection issues
      if (this.socket?.readyState === WebSocket.CLOSED) {
        errorDetails.message = 'WebSocket connection was closed';
      } else if (this.socket?.readyState === WebSocket.CLOSING) {
        errorDetails.message = 'WebSocket connection is closing';
      } else if (!navigator.onLine) {
        errorDetails.message = 'No internet connection available';
      }

      this.triggerCallbacks('connect_error', errorDetails);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log('📨 WebSocket message received:', data);

        // Handle different message types
        // console.log('📨 WebSocket message received:', { type: data.type, data: data.data });

        switch (data.type) {
          case 'connect':
            // The backend only accepts the connection after authenticating
            // the zha_access cookie (see JWTCookieAuthMiddleware) — no
            // separate authenticate message needed.
            console.log('🔌 WebSocket connected and authenticated');
            this.state.isAuthenticated = true;
            this.triggerCallbacks('connect', data.data);
            this.triggerCallbacks('authenticated', data.data);
            break;
          case 'authenticated':
            console.log('✅ WebSocket authenticated:', data.data);
            this.state.isAuthenticated = true;
            this.triggerCallbacks('authenticated', data.data);
            break;
          case 'authentication_error':
            console.error('❌ WebSocket authentication error:', data.data);
            this.state.isAuthenticated = false;
            this.triggerCallbacks('authentication_error', data.data);
            this.clearStoredTokens();
            break;
          case 'doctor_availability_changed':
            console.log('👩‍⚕️ Doctor availability changed:', data.data);
            this.triggerCallbacks('doctor_availability_changed', { data: data.data });
            break;
          case 'message':
            // console.log('💬 WebSocket message:', data.data);
            this.triggerCallbacks('message', data.data);
            break;
          case 'notification':
            // console.log('🔔 WebSocket notification:', data.data);
            this.triggerCallbacks('notification', data.data);
            break;
          case 'error':
            console.error('❌ WebSocket error:', data.data);
            this.triggerCallbacks('error', data.data);
            break;
          case 'pong':
            // ✅ Handle pong response with heartbeat tracking
            this.state.lastPongTime = Date.now();
            // Calculate latency for potential future use
            // const latency = this.state.lastPongTime - this.state.lastPingTime;
            // console.log(`🏓 Received pong (latency: ${latency}ms)`);

            // Restart heartbeat monitoring
            this.startHeartbeatMonitoring();
            break;
          case 'consultation_created':
            // console.log('🆕 New consultation created:', data.data || data);
            this.triggerCallbacks('consultation_created', data.data || data);
            break;
          case 'consultation_updated':
            // console.log('📋 Consultation updated:', data.data || data);
            this.triggerCallbacks('consultation_updated', data.data || data);
            break;
          case 'consultation_status_changed':
            console.log('🔄 Consultation status changed:', data.data || data);
            this.triggerCallbacks('consultation_status_changed', data.data || data);
            break;
          default:
            // console.log('📨 Unknown message type:', data.type, data);
        }
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error, event.data);
      }
    };
  }

  /**
   * Clear stored authentication tokens
   */
  private clearStoredTokens() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('access_token');
    this.token = null;
  }

  /**
   * ✅ Start optimized ping interval for keepalive
   */
  private startPingInterval(interval: number = this.config.pingInterval) {
    this.stopPingInterval(); // Clear any existing interval
    this.pingInterval = setInterval(() => {
      this.ping();
    }, interval);
  }

  /**
   * ✅ Stop ping interval
   */
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * ✅ Start heartbeat monitoring
   */
  private startHeartbeatMonitoring() {
    this.stopHeartbeatMonitoring();
    this.heartbeatTimeout = setTimeout(() => {
      const timeSinceLastPong = Date.now() - this.state.lastPongTime;
      if (timeSinceLastPong > this.config.heartbeatTimeout) {
        console.warn('💔 Heartbeat timeout - connection may be stale');
        this.socket?.close(1000, 'Heartbeat timeout');
      }
    }, this.config.heartbeatTimeout);
  }

  /**
   * ✅ Stop heartbeat monitoring
   */
  private stopHeartbeatMonitoring() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * ✅ Attempt to reconnect with improved exponential backoff and jitter
   */
  private attemptReconnect() {
    // Don't attempt reconnection if offline
    if (!navigator.onLine) {
      // console.log('🌐 Offline, skipping reconnection attempt');
      return;
    }

    if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.setStatus('error');
      this.triggerCallbacks('max_reconnect_attempts_reached', {
        attempts: this.state.reconnectAttempts
      });
      return;
    }

    // Exponential backoff with jitter to prevent thundering herd
    const baseDelay = this.config.reconnectInterval * Math.pow(2, this.state.reconnectAttempts);
    const jitter = Math.random() * 1000; // 0-1 second jitter
    const delay = Math.min(baseDelay + jitter, 30000); // Max 30 seconds

    this.state.reconnectAttempts++;

    // console.log(`🔄 Attempting to reconnect in ${Math.round(delay)}ms (attempt ${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.triggerCallbacks('reconnecting', {
      attempt: this.state.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
      delay: Math.round(delay)
    });

    this.reconnectTimeout = setTimeout(async () => {
      if (!this.state.isConnected) {
        try {
          // Try to get fresh token before reconnecting
          const freshToken = this.getStoredToken();
          if (freshToken && !this.isTokenExpired(freshToken)) {
            await this.connect(freshToken);
          } else {
            console.error('❌ Cannot reconnect: No valid token available');
            this.setStatus('error');
            this.triggerCallbacks('authentication_error', {
              message: 'No valid token for reconnection'
            });
          }
        } catch (error) {
          console.error('❌ Reconnection failed:', error);
          // Continue with exponential backoff
          this.attemptReconnect();
        }
      }
    }, delay);
  }

  /**
   * Send a message to the WebSocket
   */
  private sendMessage(type: string, data: any = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
      return false;
    }

    const message = {
      type,
      data
    };

    try {
      // console.log('📤 Sending WebSocket message:', message);
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Join a room/channel
   */
  joinRoom(roomName: string) {
    if (!this.connected) {
      console.warn('⚠️ Cannot join room: WebSocket not connected');
      return false;
    }

    // console.log(`🏠 Joining room: ${roomName}`);
    return this.sendMessage('join_room', {
      room: roomName
    });
  }

  /**
   * Leave a room/channel
   */
  leaveRoom(roomName: string) {
    if (!this.connected) {
      console.warn('⚠️ Cannot leave room: WebSocket not connected');
      return false;
    }

    // console.log(`🚪 Leaving room: ${roomName}`);
    return this.sendMessage('leave_room', {
      room: roomName
    });
  }

  /**
   * Send a message to a room
   */
  sendRoomMessage(roomName: string, message: string) {
    if (!this.connected) {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
      return false;
    }

    return this.sendMessage('send_message', {
      room: roomName,
      message: message
    });
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: EventCallback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)?.push(callback);

    const callbackCount = this.eventCallbacks.get(event)?.length || 0;
    console.log(`📢 Subscribed to event: ${event} (Total callbacks: ${callbackCount})`);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback?: EventCallback) {
    if (!callback) {
      // Remove all callbacks for this event
      this.eventCallbacks.delete(event);
      console.log(`📢 Unsubscribed from all callbacks for event: ${event}`);
      return;
    }

    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        const remainingCount = callbacks.length;
        console.log(`📢 Unsubscribed from event: ${event} (Remaining callbacks: ${remainingCount})`);
      } else {
        console.warn(`⚠️ Tried to unsubscribe from ${event} but callback not found in list`);
      }
    }
  }

  /**
   * Trigger callbacks for an event
   */
  private triggerCallbacks(event: string, data: any) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      if (event === 'doctor_availability_changed') {
        console.log(`🔔 Triggering ${callbacks.length} callback(s) for ${event}`);
      }
      callbacks.forEach((callback, index) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in callback for event ${event}:`, error);
        }
      });
    }
  }

  /**
   * ✅ Send ping for keepalive with state tracking
   */
  ping() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    this.state.lastPingTime = Date.now();
    this.sendMessage('ping', { timestamp: this.state.lastPingTime });
  }

  /**
   * ✅ Disconnect from WebSocket with proper cleanup
   */
  disconnect() {
    if (this.socket) {
      // console.log('🔌 Disconnecting WebSocket...');
      this.clearTimers();

      this.socket.close(1000, 'Client disconnect'); // Normal closure
      this.socket = null;
      this.state.isConnected = false;
      this.state.isAuthenticated = false;
      this.state.reconnectAttempts = 0;
      this.setStatus('disconnected');
    }
  }

  /**
   * Test server connectivity before WebSocket connection
   */
  private async testServerConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:8000/api/health/', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // console.log('✅ Server connectivity test passed');
        return true;
      } else {
        console.warn('⚠️ Server responded but not OK:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Server connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Connect to WebSocket server with connectivity test
   */
  async connectWithTest(token?: string) {
    this.token = token || this.getStoredToken();
    
    if (!this.token) {
      console.error('❌ No authentication token available');
      this.triggerCallbacks('authentication_error', { 
        message: 'No authentication token found' 
      });
      return;
    }

    // Test server connectivity first
    // console.log('🔍 Testing server connectivity...');
    const isServerReachable = await this.testServerConnectivity();
    
    if (!isServerReachable) {
      this.triggerCallbacks('connect_error', {
        message: 'Server is not reachable. Please check if the Django server is running on localhost:8000'
      });
      return;
    }

    // Proceed with WebSocket connection
    this.connect(token).catch(() => {
      // Error is already logged in connect method, no need to re-log
    });
  }
  // ✅ Public getters for connection state
  get connected(): boolean {
    return this.state.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  get authenticated(): boolean {
    return this.state.isAuthenticated;
  }

  get connectionStatus(): ConnectionStatus {
    return this.status;
  }

  get reconnectAttempts(): number {
    return this.state.reconnectAttempts;
  }

  get maxReconnectAttempts(): number {
    return this.config.maxReconnectAttempts;
  }

  get latency(): number {
    return this.state.lastPongTime - this.state.lastPingTime;
  }

  /**
   * Refresh connection with new token
   */
  refreshConnection(newToken: string) {
    // console.log('🔄 Refreshing WebSocket connection with new token');
    this.disconnect();

    // Wait a bit before reconnecting
    setTimeout(() => {
      this.connect(newToken).catch(() => {
        // Error is already logged in connect method, no need to re-log
      });
    }, 1000);
  }

  /**
   * Utility methods for doctor availability updates
   */
  onDoctorAvailabilityChanged(callback: (data: DoctorAvailabilityChangeData) => void) {
    this.on('doctor_availability_changed', callback);
  }

  offDoctorAvailabilityChanged(callback?: (data: DoctorAvailabilityChangeData) => void) {
    this.off('doctor_availability_changed', callback);
  }

  /**
   * Utility method for authentication errors
   */
  onAuthenticationError(callback: (data: any) => void) {
    this.on('authentication_error', callback);
  }

  offAuthenticationError(callback?: (data: any) => void) {
    this.off('authentication_error', callback);
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export { websocketService, WebSocketService };
export type { Doctor, DoctorAvailabilityChangeData };