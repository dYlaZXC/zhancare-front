"use client";

import { useAuth } from "@/context/AuthContext";
import PatientManagement from "@/components/services/admin/PatientManagement";

export default function AdminPatientsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <PatientManagement user={user} />;
}
