"use client";

import { useAuth } from "@/context/AuthContext";
import ScheduleView from "@/components/services/admin/ScheduleView";

export default function AdminSchedulePage() {
  const { user } = useAuth();

  if (!user) return null;

  return <ScheduleView user={user} />;
}
