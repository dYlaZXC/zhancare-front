"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

export default function NurseProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new nurse dashboard structure
    router.replace("/nurse/home-visits");
  }, [router]);

  return <PremiumLoadingScreen message="Перенаправление в кабинет медсестры" />;
}
