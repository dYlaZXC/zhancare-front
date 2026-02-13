// utils/api.ts - JWT-based API client

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as Sentry from "@sentry/nextjs";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const baseURLImg = process.env.NEXT_PUBLIC_API_IMG_URL || "http://localhost:8000/api/v1";

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

// In-flight refresh promise to prevent multiple simultaneous refresh requests
let refreshPromise: Promise<string> | null = null;

// WebSocket URL configuration
export const getWebSocketURL = () => {
  const wsEnv = process.env.NEXT_PUBLIC_WS_URL;
  const wssEnv = process.env.NEXT_PUBLIC_WSS_URL;

  if (typeof window === 'undefined') {
    return wssEnv || wsEnv || 'ws://localhost:8000/ws';
  }

  const isSecure = window.location.protocol === 'https:';
  const envUrl = isSecure ? (wssEnv || wsEnv) : (wsEnv || wssEnv);
  const defaultProtocol = isSecure ? 'wss' : 'ws';
  const defaultWsUrl = `${defaultProtocol}://${window.location.host}/ws`;
  const baseWsUrl = envUrl || defaultWsUrl;

  // Auto-adjust protocol if env var is http-only and page is secure
  if (isSecure && baseWsUrl.startsWith('ws://')) {
    return baseWsUrl.replace(/^ws:\/\//, 'wss://');
  }

  return baseWsUrl;
};

// Get API base URL without /api/v1 suffix for WebSocket
export const getAPIHost = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return apiUrl.replace('/api/v1', '');
};

// Token management functions
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  paramsSerializer: (params: any) => new URLSearchParams(params).toString(),
});

// Request Interceptor - Attach JWT Bearer token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = getAccessToken();
      if (token) {
        // Use Bearer token format for JWT
        config.headers.Authorization = `Bearer ${token}`;
      }

      // withCredentials for CORS if backend requires it
      config.withCredentials = true;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh access token
async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.error("🔐 No refresh token found in localStorage");
    throw new Error("No refresh token found");
  }

  console.log("🔄 Attempting to refresh access token...");

  try {
    // Call the JWT refresh endpoint (simplejwt format)
    const response = await axios.post(`${baseURL}/auth/token/refresh/`, {
      refresh: refreshToken,
    });

    const { access, refresh: newRefreshToken } = response.data;

    // Store new tokens (both access and refresh are rotated when ROTATE_REFRESH_TOKENS is enabled)
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      // ✅ Update refresh token if backend returns a new one (token rotation)
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        console.log("✅ Token refresh successful (with rotation)");
      } else {
        console.log("✅ Token refresh successful");
      }
    }

    return access;
  } catch (error: any) {
    console.error("❌ Token refresh failed:", error.response?.data || error.message);
    throw error;
  }
}

// Response Interceptor - Handle 401 with token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip refresh for auth endpoints
    const isAuthRequest =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/token/refresh");

    if (error.response?.status === 401 && !isAuthRequest && !originalRequest?._retry) {
      console.log("🔐 Received 401 error, attempting token refresh...", originalRequest?.url);
      originalRequest._retry = true;

      try {
        // Use existing refresh promise if one is in flight (prevent race conditions)
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }

        const newAccessToken = await refreshPromise;
        refreshPromise = null;

        console.log("✅ Retrying original request with new token:", originalRequest?.url);
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        console.warn("🔐 Token refresh failed. Logging out...");

        // Clear tokens and emit logout event
        clearTokens();

        // Dispatch event for AuthContext to handle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent('auth:logout', {
            detail: { message: '⏳ Ваша сессия истекла. Пожалуйста, войдите снова.' }
          }));
        }

        return Promise.reject(refreshError);
      }
    }

    // Report to Sentry
    if (error.response) {
      Sentry.captureException(error, {
        extra: {
          status: error.response.status,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response.data,
        },
      });
    } else {
      Sentry.captureException(error, {
        extra: { message: "No server response", originalError: error.message },
      });
    }

    return Promise.reject(error);
  }
);

// Manual logout function
export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await axiosInstance.post("/auth/logout/", { refresh_token: refreshToken });
    }
  } catch (err) {
    console.warn("🔐 Manual logout error or already logged out");
  } finally {
    clearTokens();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { message: '🚪 Вы вышли из системы.' }
      }));
    }
  }
};

export const api = axiosInstance;
