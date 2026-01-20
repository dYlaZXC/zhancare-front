"use client";

import { useAuth } from "@/context/AuthContext";
import ActivityView from "@/components/services/admin/ActivityView";

export default function AdminActivityPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <ActivityView user={user} />;
}
