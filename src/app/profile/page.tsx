"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      router.replace('/doctor-profile');
    } else if (isNurse) {
      router.replace('/nurse-profile');
    } else if (isAdmin) {
      router.replace('/admin-profile');
    } else {
      router.replace('/patient/profile');
    }
  }, [user, loading, isDoctor, isNurse, isAdmin, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Перенаправление на страницу профиля пользователя...</div>
    </div>
  );
}
