"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoctorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to consultations page by default
    router.replace("/doctor/consultations");
  }, [router]);

  return null;
}
