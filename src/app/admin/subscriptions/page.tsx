"use client";

import { useAuth } from "@/context/AuthContext";
import SubscriptionsOverview from "@/components/services/admin/subscriptions/SubscriptionsOverview";

export default function AdminSubscriptionsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <SubscriptionsOverview />;
}
