"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoctorProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new doctor dashboard structure
    router.replace("/doctor/consultations");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Redirecting...</div>
    </div>
  );
}
