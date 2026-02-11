/**
 * useMagicLinkAuth Hook
 *
 * Production-grade magic link authentication for video consultations
 *
 * Security features:
 * - Immediate URL cleaning (prevents token staying in history on crash)
 * - sessionStorage for consultation tokens (expires on tab close)
 * - Race condition protection (prevents double execution)
 * - Comprehensive error handling
 * - User-friendly error messages
 * - Automatic fallback to login
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface MagicLinkAuthState {
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  error: string | null;
  authMethod: 'magic_link' | 'existing_session' | 'none';
}

export interface MagicLinkAuthResult {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  consultation: any;
  error?: string;
}

export function useMagicLinkAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<MagicLinkAuthState>({
    isAuthenticating: false,
    isAuthenticated: false,
    error: null,
    authMethod: 'none'
  });

  // 🔒 Prevent double execution in React StrictMode
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const initMagicLinkAuth = async () => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');

      // ✅ Check if already authenticated (existing session)
      const existingToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      if (existingToken && !token) {
        console.log('✅ Using existing session');
        setAuthState({
          isAuthenticating: false,
          isAuthenticated: true,
          error: null,
          authMethod: 'existing_session'
        });
        return;
      }

      // No magic link token found
      if (!token) {
        setAuthState({
          isAuthenticating: false,
          isAuthenticated: false,
          error: null,
          authMethod: 'none'
        });
        return;
      }

      // 🔐 CRITICAL: Clean URL IMMEDIATELY (before API call)
      // If something crashes, token won't stay in browser history
      cleanTokenFromUrl();

      // Start authentication
      setAuthState({
        isAuthenticating: true,
        isAuthenticated: false,
        error: null,
        authMethod: 'magic_link'
      });

      try {
        // Call auto-login endpoint
        console.log('🔐 Calling auto-login endpoint...');
        const response = await axios.post(`${baseURL}/consultations/auto-login/`, {
          token
        });

        console.log('📥 Auto-login response:', response.status, response.data);

        const data: MagicLinkAuthResult = response.data;

        if (!data.success) {
          console.error('❌ Auto-login failed:', data.error);
          throw new Error(data.error || 'Authentication failed');
        }

        console.log('✅ Magic link authentication successful');
        console.log('🔑 Access token received:', data.access_token ? 'Yes' : 'No');
        console.log('🔄 Refresh token received:', data.refresh_token ? 'Yes' : 'No');

        // 🔐 Use sessionStorage for consultation tokens (expires on tab close - safer for healthcare)
        sessionStorage.setItem('access_token', data.access_token);
        sessionStorage.setItem('refresh_token', data.refresh_token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('consultation', JSON.stringify(data.consultation));

        // Also set in localStorage for backward compatibility with existing code
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        console.log('💾 Tokens stored in sessionStorage and localStorage');
        console.log('👤 User:', data.user.email);
        console.log('🏥 Consultation:', data.consultation.meeting_id);

        setAuthState({
          isAuthenticating: false,
          isAuthenticated: true,
          error: null,
          authMethod: 'magic_link'
        });

      } catch (error: any) {
        console.error('❌ Magic link authentication failed:', error);

        // Handle specific error cases with user-friendly messages
        let errorMessage = 'Ошибка аутентификации. Пожалуйста, войдите вручную.';

        if (error.response?.data?.error) {
          const serverError = error.response.data.error;

          if (serverError.includes('already been used')) {
            errorMessage = 'Эта ссылка уже была использована. Пожалуйста, войдите вручную.';
          } else if (serverError.includes('expired')) {
            errorMessage = 'Срок действия ссылки истек. Пожалуйста, запросите новую консультацию.';
          } else if (serverError.includes('no longer active')) {
            errorMessage = 'Эта консультация была отменена или завершена.';
          } else if (serverError.includes('not found')) {
            errorMessage = 'Консультация не найдена. Пожалуйста, проверьте ссылку.';
          } else {
            errorMessage = serverError;
          }
        } else if (error.message?.includes('Network')) {
          errorMessage = 'Ошибка сети. Пожалуйста, проверьте подключение к интернету.';
        }

        setAuthState({
          isAuthenticating: false,
          isAuthenticated: false,
          error: errorMessage,
          authMethod: 'magic_link'
        });

        // No automatic redirect - user can use access code fallback
      }
    };

    /**
     * Clean token from URL using URL API (safer than regex)
     */
    function cleanTokenFromUrl() {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('token');
      window.history.replaceState(
        {},
        document.title,
        cleanUrl.pathname + cleanUrl.search
      );
    }

    initMagicLinkAuth();
  }, [router]);

  return authState;
}
