"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading, setIsAuthOpen } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // User is already logged in, redirect to their profile
      switch (user.role) {
        case "admin":
          router.replace("/admin/profile");
          break;
        case "doctor":
          router.replace("/doctor/profile");
          break;
        case "nurse":
          router.replace("/nurse/profile");
          break;
        case "patient":
        default:
          router.replace("/patient/profile");
          break;
      }
    } else {
      // Open auth modal and redirect to home
      setIsAuthOpen(true);
      router.replace("/");
    }
  }, [loading, user, router, setIsAuthOpen]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Перенаправление...</p>
      </div>
    </div>
  );
}
