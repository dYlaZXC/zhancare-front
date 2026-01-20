"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new admin dashboard structure
    router.replace("/admin/profile");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Redirecting...</div>
    </div>
  );
}
