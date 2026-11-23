"use client";

import { useAuth } from "@/context/AuthContext";
import SuperAdminDashboard from "@/components/services/admin/SuperAdminDashboard";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <SuperAdminDashboard user={user} />;
}
