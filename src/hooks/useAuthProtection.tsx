"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAuthProtection = () => {
  const { user, loading, setIsAuthOpen } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, show auth popup immediately and redirect
      setIsAuthOpen(true);
      router.replace('/');
    }
  }, [loading, user, setIsAuthOpen, router]);

  const redirectToHome = () => {
    router.push('/');
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    redirectToHome
  };
};