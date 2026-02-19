"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Redirect to home if not authenticated
      router.replace('/');
      return;
    }

    // Redirect to appropriate profile based on role
    if (user.role === 'doctor') {
      router.replace('/doctor-profile');
    } else if (user.role === 'nurse') {
      router.replace('/nurse-profile');
    } else if (user.role === 'admin') {
      router.replace('/admin-profile');
    } else {
      // Default to patient dashboard
      router.replace('/patient/profile');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Перенаправление на страницу профиля пользователя...</div>
    </div>
  );
}
