"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user === undefined) return;
    const isSuperAdmin = !!(user?.profiles?.admin as any)?.is_super_admin;
    router.replace(isSuperAdmin ? "/admin/dashboard" : "/admin/profile");
  }, [router, user]);

  return null;
}
