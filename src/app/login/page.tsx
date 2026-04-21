"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading, setIsAuthOpen, isAdmin, isDoctor, isNurse } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (isAdmin) {
        router.replace("/admin/profile");
      } else if (isDoctor) {
        router.replace("/doctor/profile");
      } else if (isNurse) {
        router.replace("/nurse/profile");
      } else {
        router.replace("/patient/profile");
      }
    } else {
      setIsAuthOpen(true);
      router.replace("/");
    }
  }, [loading, user, isAdmin, isDoctor, isNurse, router, setIsAuthOpen]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Перенаправление...</p>
      </div>
    </div>
  );
}
