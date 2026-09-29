"use client";

import { useAuth } from "@/context/AuthContext";
import { DealsView } from "@/components/services/admin/deals/DealsView";

export default function AdminDealsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <DealsView user={user} />;
}
