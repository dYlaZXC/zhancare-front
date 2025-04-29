"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin"; // ✅ Add role typing
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

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user session on page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAccessToken = localStorage.getItem("access_token");
      const storedUser = localStorage.getItem("user");

      if (storedAccessToken && storedUser) {
        setToken(storedAccessToken);
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  // ✅ Login function
  const loginUser = (accessToken: string, refreshToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);
  
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };
  

  // ✅ Logout function
  const logoutUser = (showMessage = true) => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    // setIsAuthOpen(true); // 🔓 Open login popup automatically

    // if (showMessage) {
    //   toast.warning("⏳ Ваша сессия истекла. Пожалуйста, войдите снова.");
    // }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthOpen, setIsAuthOpen, user, token, loading, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook to use AuthContext easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
