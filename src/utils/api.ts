import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { logoutUser } from "@/utils/auth";
import Cookies from "js-cookie"; // ✅ Required to read CSRF cookie

// 🛡️ Proxy all frontend requests through Next.js API route
const baseURL = "/api/frontend";
export const baseURLImg = "/api/frontend";

// ✅ Axios instance for proxied backend requests
const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // 🔐 Required for CSRF + cookies
  paramsSerializer: (params: any) => new URLSearchParams(params).toString(),
});

// ✅ Request Interceptor — Attach access token and CSRF token
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }

      // 🔐 Attach CSRF token from cookie for non-GET requests
      const csrfToken = Cookies.get("csrftoken");
      if (csrfToken && config.method && config.method.toLowerCase() !== "get") {
        config.headers["X-CSRFToken"] = csrfToken;
      } else {
        // Log or handle missing CSRF token for non-GET requests
        console.warn("⚠️ CSRF token is missing for non-GET request");
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor — Handle 401 token refresh logic
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

        const { data } = await axios.post(
          `${baseURL}/auth/refresh/`,
          { refresh_token },
          { withCredentials: true } // 🚨 CSRF-safe
        );

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
    Sentry.captureException(error, {
      extra: {
        status: error.response?.status,
        url: originalRequest?.url,
        method: originalRequest?.method,
        data: error.response?.data,
      },
    });

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

// ✅ CSRF initializer to call once before POST/PUT/DELETE
export const initCsrf = async () => {
  try {
    await axios.get("/api/frontend/auth/csrf/", { withCredentials: true });
    console.log("✅ CSRF cookie set");
  } catch (err) {
    console.warn("⚠️ Failed to initialize CSRF cookie", err);
  }
};

export const api = axiosInstance;
