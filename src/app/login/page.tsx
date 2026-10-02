"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

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

  return <PremiumLoadingScreen message="Перенаправление" />;
}
