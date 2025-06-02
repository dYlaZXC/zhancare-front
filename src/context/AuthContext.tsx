"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "@/utils/api"; // 💡 импорт axiosInstance

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin";
}

interface AuthContextProps {
  isAuthOpen: boolean;
  setIsAuthOpen: (isOpen: boolean) => void;
  user: User | null;
  token: string | null;
  loading: boolean;
  loginUser: (accessToken: string, refreshToken: string, userData: User) => void;
  logoutUser: (showMessage?: boolean) => void;
}

const defaultAuthContext: AuthContextProps = {
  isAuthOpen: false,
  setIsAuthOpen: () => {},
  user: null,
  token: null,
  loading: true,
  loginUser: () => {},
  logoutUser: () => {},
};

const AuthContext = createContext<AuthContextProps>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Set axios default Authorization header
  const setAuthHeader = (token: string | null) => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Token ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  };

  // ✅ Load user session on first load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAccessToken = localStorage.getItem("access_token");
      const storedUser = localStorage.getItem("user");

      if (storedAccessToken && storedUser) {
        setToken(storedAccessToken);
        setUser(JSON.parse(storedUser));
        setAuthHeader(storedAccessToken);
      } else {
        // 🟦 Clear header if no token found
        setAuthHeader(null);
      }
    }
    setLoading(false);
  }, []);

  // ✅ Login
  const loginUser = (accessToken: string, refreshToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));

    setAuthHeader(accessToken);
  };

  // ✅ Logout
  const logoutUser = (showMessage = true) => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);
    setAuthHeader(null);

    if (showMessage) {
      toast.warning("⏳ Ваша сессия истекла. Пожалуйста, войдите снова.");
    } else {
      toast.info("🚪 Вы вышли из системы.");
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthOpen, setIsAuthOpen, user, token, loading, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
