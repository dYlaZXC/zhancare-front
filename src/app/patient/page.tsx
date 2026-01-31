"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile page by default
    router.replace("/patient/profile");
  }, [router]);

  return null;
}
