"use client";

import { useAuth } from "@/context/AuthContext";
import WhatsAppInbox from "@/components/services/admin/WhatsAppInbox";

export default function WhatsAppPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <WhatsAppInbox />;
}
