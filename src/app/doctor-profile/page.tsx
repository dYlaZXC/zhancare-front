"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PremiumLoadingScreen } from "@/components/layout/PremiumLoadingScreen";

export default function DoctorProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new doctor dashboard structure
    router.replace("/doctor/consultations");
  }, [router]);

  return <PremiumLoadingScreen message="Перенаправление в кабинет врача" />;
}
