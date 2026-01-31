"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NurseProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new nurse dashboard structure
    router.replace("/nurse/home-visits");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Redirecting...</div>
    </div>
  );
}
