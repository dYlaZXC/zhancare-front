import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { logoutUser } from "@/utils/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://exp-admin.smartalmaty.kz/api/v1";
export const baseURLImg = process.env.NEXT_PUBLIC_API_IMG_URL || "https://exp-admin.smartalmaty.kz/api/v1";

const axiosInstance = axios.create({
  baseURL,
  paramsSerializer: (params: any) => new URLSearchParams(params).toString(),
});


// Request Interceptor — Attach access token
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

// Response Interceptor — Handle 401 + Refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if access token is expired (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem("refresh_token");
        if (!refresh_token) {
          throw new Error("No refresh token found.");
        }

        // Attempt to refresh the access token
        const { data } = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh_token,
        });

        const newAccessToken = data.access_token;
        localStorage.setItem("access_token", newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Token ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn("🔐 Refresh token failed. Logging out...");

        logoutUser("⏳ Ваша сессия истекла. Пожалуйста, войдите снова.");
        return Promise.reject(refreshError);
      }
    }

    // Sentry error logging
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

// Optional manual logout helper
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
