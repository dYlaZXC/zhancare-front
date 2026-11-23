"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

export default function ProfilePage() {
  const { user, loading, isDoctor, isNurse, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/');
      return;
    }

    if (isDoctor) {
      router.replace('/doctor/consultations');
    } else if (isNurse) {
      router.replace('/nurse/home-visits');
    } else if (isAdmin) {
      router.replace('/admin/profile');
    } else {
      router.replace('/patient/profile');
    }
  }, [user, loading, isDoctor, isNurse, isAdmin, router]);

  return <PremiumLoadingScreen message="Перенаправление на страницу профиля" />;
}
