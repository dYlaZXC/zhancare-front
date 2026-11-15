"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { api, setTokens, clearTokens, getAccessToken, getRefreshToken, ACCESS_TOKEN_KEY } from "@/utils/api";

const _ROLE_PRIORITY = ["admin", "academy_admin", "doctor", "nurse", "teacher", "patient"] as const;

export const ROLE_DISPLAY_MAP: Record<string, string> = {
  admin: "Администратор",
  academy_admin: "Администратор академии",
  doctor: "Доктор",
  nurse: "Медсестра",
  teacher: "Преподаватель",
  patient: "Пациент",
  student: "Студент",
};

/** Compute the highest-priority display role from roles[]. */
export function computeRole(roles?: string[]): string {
  if (!roles?.length) return "patient";
  return _ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0] ?? "patient";
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string | null;
  /** @deprecated Computed from roles[] — do not read from API response directly */
  role?: string;
  roles?: string[];
  profiles?: Record<string, Record<string, unknown>>;

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

  must_change_password?: boolean;
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
  authDefaultTab: "login" | "register";
  authNoRedirect: boolean;
  openAuth: (tab?: "login" | "register", noRedirect?: boolean) => void;
  user: User | null;
  token: string | null;
  loading: boolean;
  sessions: Session[];
  sessionsLoading: boolean;
  loginUser: (accessToken: string, refreshToken: string, userData: User) => void;
  logoutUser: (showMessage?: boolean) => Promise<void>;
  mustChangePassword: boolean;
  clearMustChangePassword: () => void;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: number) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  // Role helpers — prefer these over user.role for multi-role support
  isDoctor: boolean;
  isNurse: boolean;
  isAdmin: boolean;
  isPatient: boolean;
}

const defaultAuthContext: AuthContextProps = {
  isAuthOpen: false,
  setIsAuthOpen: () => {},
  authDefaultTab: "login",
  authNoRedirect: false,
  openAuth: () => {},
  user: null,
  token: null,
  loading: true,
  sessions: [],
  sessionsLoading: false,
  loginUser: () => {},
  logoutUser: async () => {},
  mustChangePassword: false,
  clearMustChangePassword: () => {},
  fetchSessions: async () => {},
  revokeSession: async () => {},
  revokeAllOtherSessions: async () => {},
  updateUser: () => {},
  isDoctor: false,
  isNurse: false,
  isAdmin: false,
  isPatient: false,
};

const AuthContext = createContext<AuthContextProps>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "register">("login");
  const [authNoRedirect, setAuthNoRedirect] = useState(false);
  const openAuth = (tab: "login" | "register" = "login", noRedirect = false) => {
    setAuthDefaultTab(tab);
    setAuthNoRedirect(noRedirect);
    setIsAuthOpen(true);
  };
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Set axios default Authorization header (Bearer for JWT)
  const setAuthHeader = useCallback((accessToken: string | null) => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, []);

  // Shared tail end of every "this session is over" path (manual logout,
  // another tab logging out, or the interceptor discovering the refresh
  // token itself is dead) — clear React state, drop the middleware's
  // presence cookie, and hard-navigate to /login. Never calls the server:
  // callers that still have a live session to revoke do that themselves
  // first (see logoutUser()); the other two paths above only ever run once
  // there is nothing left to revoke.
  const clearLocalSessionAndRedirect = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessions([]);
    setAuthHeader(null);
    document.cookie = "zha_auth=; path=/; max-age=0";
    window.location.href = "/login";
  }, [setAuthHeader]);

  // Listen for logout events from the API interceptor's own refresh-failure
  // path — fires when the refresh token itself is expired/invalid, i.e. a
  // session that died on its own rather than a user clicking "Выйти". No
  // server call belongs here: by the time this fires, refreshAccessToken()
  // has already tried and failed, so there is no live session left to
  // revoke. Still needs the same end state as a manual logout — otherwise a
  // silently-expired session would leave the cabinet sitting open with
  // whatever medical data it last fetched, waiting for the user to notice.
  useEffect(() => {
    const handleLogoutEvent = (event: CustomEvent) => {
      if (event.detail?.message) {
        toast.warning(event.detail.message);
      }
      clearLocalSessionAndRedirect();
    };

    window.addEventListener('auth:logout', handleLogoutEvent as EventListener);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent as EventListener);
  }, [clearLocalSessionAndRedirect]);

  // Cross-tab logout sync. localStorage.removeItem() fires a native
  // `storage` event in every OTHER same-origin tab automatically (never in
  // the tab that made the change — the browser guarantees that), so a tab
  // that didn't initiate the logout learns about it here. It must NOT POST
  // /auth/logout/ again — whichever tab (or the interceptor) triggered the
  // real logout already revoked the server-side session, or found there was
  // none left to revoke; this just mirrors local state and leaves.
  useEffect(() => {
    const handleStorageLogout = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY && event.newValue === null) {
        clearLocalSessionAndRedirect();
      }
    };

    window.addEventListener('storage', handleStorageLogout);
    return () => window.removeEventListener('storage', handleStorageLogout);
  }, [clearLocalSessionAndRedirect]);

  // Keep token React state in sync when api interceptor silently refreshes the token
  useEffect(() => {
    const handleTokenRefreshed = (event: CustomEvent) => {
      const newAccess = event.detail?.access;
      if (newAccess) {
        setToken(newAccess);
        setAuthHeader(newAccess);
      }
    };
    window.addEventListener('auth:token-refreshed', handleTokenRefreshed as EventListener);
    return () => window.removeEventListener('auth:token-refreshed', handleTokenRefreshed as EventListener);
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
          // Ensure auth cookie is present (may have been lost on browser restart)
          document.cookie = `zha_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

          // Refresh user data from API to pick up role/profile changes
          try {
            const res = await api.get("/user-profile/profile/");
            const freshUser: User = { ...res.data, role: computeRole(res.data.roles) };
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

  const clearMustChangePassword = useCallback(() => setMustChangePassword(false), []);

  // Login
  const loginUser = useCallback((accessToken: string, refreshToken: string, userData: User) => {
    const enriched: User = { ...userData, role: computeRole(userData.roles) };
    setToken(accessToken);
    setUser(enriched);
    setTokens(accessToken, refreshToken);
    localStorage.setItem("user", JSON.stringify(enriched));
    setAuthHeader(accessToken);
    // Set auth presence cookie for middleware SSR guard
    document.cookie = `zha_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    if (userData.must_change_password) {
      setMustChangePassword(true);
    }
  }, [setAuthHeader]);

  // Logout — the single exit point for every role/cabinet. Revokes the
  // session on the server FIRST (so the tokens/cookies being cleared below
  // can't be replayed from another tab, a saved copy, or a shared device —
  // see POST /auth/logout/ in zhancare-back, which blacklists the refresh
  // token, marks the UserSession revoked, and clears the httpOnly cookies),
  // then tears down all local state and does a full browser navigation to
  // /login — never a soft SPA navigation, so no stale Next.js Router Cache
  // segment or in-memory React state can survive for a subsequent Back.
  const isLoggingOutRef = useRef(false);
  const logoutUser = useCallback(async (showMessage = true) => {
    if (isLoggingOutRef.current) return; // guard against double-invocation (double-click, re-entrant call)
    isLoggingOutRef.current = true;

    const refreshToken = getRefreshToken();
    let serverRevoked = false;
    try {
      await api.post(
        "/auth/logout/",
        refreshToken ? { refresh_token: refreshToken } : {},
        { withCredentials: true }
      );
      serverRevoked = true;
    } catch (err) {
      // Network/server failure — the server-side session cannot be assumed
      // revoked. Local state is still cleared below (the user asked to
      // leave this device), but this must not be reported as a clean
      // revoke, since a copy of the refresh token/cookie could still work
      // elsewhere until it naturally expires.
      console.warn("logoutUser: server-side session revoke failed; clearing local session only", err);
    } finally {
      clearTokens();

      if (showMessage) {
        toast[serverRevoked ? "success" : "warning"](
          serverRevoked
            ? "🚪 Вы вышли из системы."
            : "🚪 Вы вышли из системы (не удалось подтвердить выход на сервере)."
        );
      }

      // Clears React state, drops the non-httpOnly presence flag the
      // middleware checks (the real httpOnly zha_access/zha_refresh cookies
      // were cleared by the server response above), and hard-navigates to
      // /login.
      clearLocalSessionAndRedirect();
    }
  }, [clearLocalSessionAndRedirect]);

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

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthOpen,
        setIsAuthOpen,
        authDefaultTab,
        authNoRedirect,
        openAuth,
        user,
        token,
        loading,
        sessions,
        sessionsLoading,
        loginUser,
        logoutUser,
        mustChangePassword,
        clearMustChangePassword,
        fetchSessions,
        revokeSession,
        revokeAllOtherSessions,
        updateUser,
        isDoctor: !!user?.roles?.includes("doctor"),
        isNurse: !!user?.roles?.includes("nurse"),
        isAdmin: !!user?.roles?.includes("admin"),
        isPatient: !!user?.roles?.includes("patient"),
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
