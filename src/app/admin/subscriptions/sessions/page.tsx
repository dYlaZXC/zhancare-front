"use client";

import { useAuth } from "@/context/AuthContext";
import ClassSessionsView from "@/components/services/admin/subscriptions/ClassSessionsView";

export default function AdminClassSessionsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <ClassSessionsView />;
}
