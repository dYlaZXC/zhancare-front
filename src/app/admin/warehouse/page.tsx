"use client";

import { useAuth } from "@/context/AuthContext";
import { WarehouseView } from "@/components/services/admin/WarehouseView";

export default function AdminWarehousePage() {
  const { user } = useAuth();

  if (!user) return null;

  return <WarehouseView />;
}
