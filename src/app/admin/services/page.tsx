"use client";

import { useAuth } from "@/context/AuthContext";
import { ServicesView } from "@/components/services/admin/ServicesView";

export default function AdminServicesPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <ServicesView user={user} />;
}
