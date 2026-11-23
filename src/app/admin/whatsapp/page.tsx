"use client";

import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import WhatsAppInbox from "@/components/services/admin/WhatsAppInbox";

export default function WhatsAppPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? undefined;

  if (!user) return null;
  return (
    <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 -mb-4 sm:-mb-6 flex-1 min-h-0 overflow-hidden">
      <WhatsAppInbox initialPhone={phone} />
    </div>
  );
}
