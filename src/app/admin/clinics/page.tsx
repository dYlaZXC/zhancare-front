"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ClinicManagement from "@/components/services/admin/ClinicManagement";

export default function ClinicsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isSuperAdmin = !!(user?.profiles?.admin as any)?.is_super_admin;
  useEffect(() => {
    if (user && !isSuperAdmin) router.replace("/admin");
  }, [user, isSuperAdmin, router]);
  if (!user || !isSuperAdmin) return null;
  return <ClinicManagement />;
}
