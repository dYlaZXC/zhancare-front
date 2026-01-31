"use client";

import { useAuth } from "@/context/AuthContext";
import StaffManagement from "@/components/services/admin/StaffManagement";

export default function AdminStaffPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <StaffManagement user={user} />;
}
