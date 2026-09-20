"use client";

import { useAuth } from "@/context/AuthContext";
import { RoomsView } from "@/components/services/admin/RoomsView";

export default function AdminRoomsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <RoomsView user={user} />;
}
