"use client";

import { useAuth } from "@/context/AuthContext";
import AnalyticsView from "@/components/services/admin/AnalyticsView";

export default function AdminReportsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <AnalyticsView user={user} initialTab="reports" />;
}
