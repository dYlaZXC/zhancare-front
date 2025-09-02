"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface AuthRedirectProps {
  children: React.ReactNode;
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, loading, setIsAuthOpen } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, show auth popup and redirect immediately
      setIsAuthOpen(true);
      router.replace('/');
      return;
    }
    
    if (!loading && user?.role === "doctor") {
      router.replace("/doctor-profile");
    }
  }, [loading, user, router, setIsAuthOpen]);

  // Don't render anything while loading or if user is not authenticated
  if (loading || !user) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}