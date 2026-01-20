"use client";

import { useAuth } from "@/context/AuthContext";
import AdminProfileDashboard from "@/components/services/admin/AdminProfileDashboard";

export default function AdminProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return <AdminProfileDashboard user={user} />;
}
