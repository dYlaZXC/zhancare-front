"use client";

import { useAuth } from "@/context/AuthContext";
import ClassSessionsCalendarView from "@/components/services/admin/subscriptions/ClassSessionsCalendarView";

export default function AdminClassSessionsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <ClassSessionsCalendarView />;
}
