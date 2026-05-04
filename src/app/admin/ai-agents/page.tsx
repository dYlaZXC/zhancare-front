"use client";

import { useAuth } from "@/context/AuthContext";
import AIAgentsView from "@/components/services/admin/AIAgentsView";

export default function AIAgentsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <AIAgentsView />;
}
