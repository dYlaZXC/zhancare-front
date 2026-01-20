"use client";

import { useAuth } from "@/context/AuthContext";
import ReportsView from "@/components/services/admin/ReportsView";

export default function AdminReportsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <ReportsView user={user} />;
}
