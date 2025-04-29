import axios from 'axios';
import * as Sentry from "@sentry/nextjs";

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://zhancareai-back.vercel.app/api/v1';
export const baseURLImg = process.env.NEXT_PUBLIC_API_IMG_URL || 'https://zhancareai-back.vercel.app/api/v1';

const axiosInstance = axios.create({
  baseURL,
  paramsSerializer: (params: any) => new URLSearchParams(params).toString(),
});

// Attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check for 401 and that we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');
        if (!refresh_token) {
          throw new Error("No refresh token found.");
        }

        const { data } = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh_token,
        });

        const newAccessToken = data.access_token;
        localStorage.setItem('access_token', newAccessToken);

        // Update Authorization header and retry the original request
        originalRequest.headers.Authorization = `Token ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn("🔐 Refresh token failed, logging out...");
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
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

export const api = axiosInstance;
