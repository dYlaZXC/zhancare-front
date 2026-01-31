"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile page by default
    router.replace("/admin/profile");
  }, [router]);

  return null;
}
