"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { api, setTokens, clearTokens, getAccessToken } from "@/utils/api";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: "patient" | "doctor" | "admin" | "nurse";
  role_display?: string;

  // Personal details
  birth_date?: string;
  gender?: "male" | "female" | "other";
  gender_display?: string;
  address?: string;
  city?: string;
  language?: "kz" | "ru" | "en" | "other";
  language_display?: string;
  citizenship?: string;
  marital_status?: "single" | "married" | "divorced" | "widowed";
  marital_status_display?: string;
  profession?: string;

  // Medical details
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  blood_type_display?: string;

  // Doctor specific
  doctor_type?: string;
  availability_status?: 'available' | 'busy' | 'offline' | 'break';
  availability_note?: string;
  last_seen?: string;

  // Timestamps
  date_joined?: string;
}

interface Session {
  id: number;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  ip_address: string | null;
  last_activity: string;
  is_current: boolean;
  created_at: string;
}

interface AuthContextProps {
  isAuthOpen: boolean;
  setIsAuthOpen: (isOpen: boolean) => void;
  user: User | null;
  token: string | null;
  loading: boolean;
  sessions: Session[];
  sessionsLoading: boolean;
  loginUser: (accessToken: string, refreshToken: string, userData: User) => void;
  logoutUser: (showMessage?: boolean) => void;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: number) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;
}

const defaultAuthContext: AuthContextProps = {
  isAuthOpen: false,
  setIsAuthOpen: () => {},
  user: null,
  token: null,
  loading: true,
  sessions: [],
  sessionsLoading: false,
  loginUser: () => {},
  logoutUser: () => {},
  fetchSessions: async () => {},
  revokeSession: async () => {},
  revokeAllOtherSessions: async () => {},
};

const AuthContext = createContext<AuthContextProps>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Set axios default Authorization header (Bearer for JWT)
  const setAuthHeader = useCallback((accessToken: string | null) => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, []);

  // Listen for logout events from API interceptor
  useEffect(() => {
    const handleLogoutEvent = (event: CustomEvent) => {
      setUser(null);
      setToken(null);
      setSessions([]);
      setAuthHeader(null);

      if (event.detail?.message) {
        toast.warning(event.detail.message);
      }
    };

    window.addEventListener('auth:logout', handleLogoutEvent as EventListener);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent as EventListener);
  }, [setAuthHeader]);

  // Load user session on first load and refresh from API
  useEffect(() => {
    const init = async () => {
      if (typeof window !== "undefined") {
        const storedAccessToken = getAccessToken();
        const storedUser = localStorage.getItem("user");

        if (storedAccessToken && storedUser) {
          setToken(storedAccessToken);
          setUser(JSON.parse(storedUser));
          setAuthHeader(storedAccessToken);

          // Refresh user data from API to pick up role/profile changes
          try {
            const res = await api.get("/user-profile/profile/");
            const freshUser: User = res.data;
            setUser(freshUser);
            localStorage.setItem("user", JSON.stringify(freshUser));
          } catch {
            // If refresh fails, keep the cached user
          }
        } else {
          setAuthHeader(null);
        }
      }
      setLoading(false);
    };
    init();
  }, [setAuthHeader]);

  // Login
  const loginUser = useCallback((accessToken: string, refreshToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);
    setTokens(accessToken, refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setAuthHeader(accessToken);
  }, [setAuthHeader]);

  // Logout
  const logoutUser = useCallback((showMessage = true) => {
    clearTokens();
    setUser(null);
    setToken(null);
    setSessions([]);
    setAuthHeader(null);

    if (showMessage) {
      toast.warning("⏳ Ваша сессия истекла. Пожалуйста, войдите снова.");
    }
  }, [setAuthHeader]);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    if (!token) return;

    setSessionsLoading(true);
    try {
      const response = await api.get('/sessions/');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Не удалось загрузить список сессий');
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  // Revoke a specific session
  const revokeSession = useCallback(async (sessionId: number) => {
    try {
      await api.post(`/sessions/${sessionId}/revoke/`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Сессия успешно завершена');
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Невозможно завершить текущую сессию. Используйте выход.');
      } else {
        toast.error('Не удалось завершить сессию');
      }
    }
  }, []);

  // Revoke all other sessions
  const revokeAllOtherSessions = useCallback(async () => {
    try {
      const response = await api.post('/sessions/revoke-all-others/');
      setSessions(prev => prev.filter(s => s.is_current));
      toast.success(`Завершено ${response.data.revoked_count} сессий`);
    } catch (error) {
      toast.error('Не удалось завершить сессии');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthOpen,
        setIsAuthOpen,
        user,
        token,
        loading,
        sessions,
        sessionsLoading,
        loginUser,
        logoutUser,
        fetchSessions,
        revokeSession,
        revokeAllOtherSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
