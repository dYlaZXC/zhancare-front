"use client";

import { useAuth } from "@/context/AuthContext";
import { TreatmentPlansView } from "@/components/services/admin/treatmentPlans/TreatmentPlansView";

export default function AdminTreatmentPlansPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <TreatmentPlansView user={user} />;
}
