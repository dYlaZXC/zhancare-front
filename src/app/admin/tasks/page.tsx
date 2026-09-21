"use client";

import { useAuth } from "@/context/AuthContext";
import { TasksView } from "@/components/services/admin/TasksView";

export default function AdminTasksPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <TasksView user={user} />;
}
