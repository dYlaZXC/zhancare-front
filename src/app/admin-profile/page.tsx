"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

export default function AdminProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new admin dashboard structure
    router.replace("/admin/profile");
  }, [router]);

  return <PremiumLoadingScreen message="Перенаправление в панель администратора" />;
}
