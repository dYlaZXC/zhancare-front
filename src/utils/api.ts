import axios from 'axios';
import * as Sentry from "@sentry/nextjs";

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://zhancareai-back.vercel.app/api/v1';
export const baseURLImg = process.env.NEXT_PUBLIC_API_IMG_URL || 'https://zhancareai-back.vercel.app/api/v1';

const axiosInstance = axios.create({
  baseURL,
  paramsSerializer: (params: any) => new URLSearchParams(params).toString(),
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        console.warn('⛔️ Unauthorized, redirecting to login...');
        window.location.href = '/login';
      }
    }

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
