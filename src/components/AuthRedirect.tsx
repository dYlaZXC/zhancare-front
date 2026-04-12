"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

interface AuthRedirectProps {
  children: React.ReactNode;
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, loading, setIsAuthOpen, isDoctor } = useAuth();
  const router = useRouter();
  const [hasShownLoadingScreen, setHasShownLoadingScreen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Only show loading screen on the very first authentication check
  useEffect(() => {
    // Check if this is the first time loading the CRM (coming from outside)
    const isFirstLoad = !sessionStorage.getItem('crm_initialized');
    
    if (loading && !hasShownLoadingScreen && isFirstLoad) {
      setShowLoading(true);
      setHasShownLoadingScreen(true);
      sessionStorage.setItem('crm_initialized', 'true');
      
      // Minimum loading time
      const timer = setTimeout(() => {
        setMinTimeElapsed(true);
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Skip loading screen for subsequent navigations
      setMinTimeElapsed(true);
    }
  }, [loading, hasShownLoadingScreen]);

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, show auth popup and redirect
      setIsAuthOpen(true);
      router.replace('/');
      return;
    }
    
    if (!loading && isDoctor) {
      router.replace("/doctor-profile");
    }

    // Hide loading screen when auth check is done and minimum time elapsed
    if (!loading && minTimeElapsed && showLoading) {
      setShowLoading(false);
    }
  }, [loading, user, isDoctor, router, setIsAuthOpen, minTimeElapsed, showLoading]);

  // Show loading screen only on first CRM entry
  if (showLoading && !minTimeElapsed) {
    return <LoadingScreen message="Проверка авторизации..." />;
  }

  // Show simple loading for quick auth checks without fancy loading screen
  if (loading) {
    return null; // Just show nothing briefly
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}