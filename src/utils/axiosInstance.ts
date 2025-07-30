// utils/axiosInstance.ts

import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { logoutUser } from "@/utils/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
export const baseURLImg = process.env.NEXT_PUBLIC_API_IMG_URL || "http://127.0.0.1:8000/api/v1";

const axiosInstance = axios.create({
  baseURL,
  paramsSerializer: (params: any) => new URLSearchParams(params).toString(),
});

// ✅ Request Interceptor — Attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor — Handle 401 refresh (excluding login/register)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ⛔ Skip refresh logic for login and register requests
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

        // Set new token on original request and retry it
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

// ✅ Manual logout handler
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
