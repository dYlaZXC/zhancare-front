"use client";

import { useAuth } from "@/context/AuthContext";
import CheckinQRView from "@/components/services/admin/subscriptions/CheckinQRView";

export default function AdminCheckinQRPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <CheckinQRView />;
}
