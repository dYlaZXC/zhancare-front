"use client";

import { useAuth } from "@/context/AuthContext";
import PatientSubscriptionsView from "@/components/services/admin/subscriptions/PatientSubscriptionsView";

export default function AdminPatientSubscriptionsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <PatientSubscriptionsView />;
}
