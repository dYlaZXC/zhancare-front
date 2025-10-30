// utils/axiosInstance.ts

import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { logoutUser } from "@/utils/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const baseURLImg = process.env.NEXT_PUBLIC_API_IMG_URL || "http://localhost:8000/api/v1";

// ✅ WebSocket URL configuration
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

// ✅ Get API base URL without /api/v1 suffix for WebSocket
export const getAPIHost = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return apiUrl.replace('/api/v1', '');
};

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // ✅ Include cookies like csrftoken in requests
  paramsSerializer: (params: any) => new URLSearchParams(params).toString(),
});

// ✅ Helper: Extract CSRF token from cookies
function getCSRFToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

// ✅ Request Interceptor — Attach token + CSRF
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }

      const method = config.method?.toLowerCase();
      const csrfToken = getCSRFToken();

      if (csrfToken && ["post", "put", "patch", "delete"].includes(method || "")) {
        config.headers["X-CSRFToken"] = csrfToken;
      }

      config.withCredentials = true;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor — Handle 401 refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRequest =
      originalRequest.url?.includes("/auth/login/") ||
      originalRequest.url?.includes("/auth/register/");

    if (error.response?.status === 401 && !isAuthRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem("refresh_token");
        if (!refresh_token) throw new Error("No refresh token found.");

        const { data } = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh_token,
        });

        const newAccessToken = data.access_token;
        localStorage.setItem("access_token", newAccessToken);

        originalRequest.headers.Authorization = `Token ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn("🔐 Refresh token failed. Logging out...");
        logoutUser("⏳ Ваша сессия истекла. Пожалуйста, войдите снова.");
        return Promise.reject(refreshError);
      }
    }

    // 🔎 Report to Sentry
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

// ✅ Manual logout
export const logout = async () => {
  try {
    await axiosInstance.post("/auth/logout/");
  } catch (err) {
    console.warn("🔐 Manual logout error or already logged out");
  } finally {
    logoutUser("🚪 Вы вышли из системы.");
  }
};

export const api = axiosInstance;
