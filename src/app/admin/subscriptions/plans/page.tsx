"use client";

import { useAuth } from "@/context/AuthContext";
import SubscriptionPlansView from "@/components/services/admin/subscriptions/SubscriptionPlansView";

export default function AdminSubscriptionPlansPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <SubscriptionPlansView />;
}
