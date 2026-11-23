"use client";

import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import TelegramInbox from "@/components/services/admin/TelegramInbox";

export default function TelegramPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");
  const patientId = patientIdParam ? Number(patientIdParam) : undefined;

  if (!user) return null;
  return (
    <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 -mb-4 sm:-mb-6 flex-1 min-h-0 overflow-hidden">
      <TelegramInbox initialPatientId={patientId} />
    </div>
  );
}
