"use client";

import { useAuth } from "@/context/AuthContext";
import { PathOfPatientView } from "@/components/services/admin/pathOfPatient/PathOfPatientView";

export default function AdminPathOfPatientPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <PathOfPatientView user={user} />;
}
