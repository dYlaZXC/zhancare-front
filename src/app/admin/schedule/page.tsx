"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import ScheduleView from "@/components/services/admin/ScheduleView";

const VALID_TABS = ['week', 'month', 'doctors', 'services', 'rooms', 'referrals'] as const;

export default function AdminSchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Group classes moved to Абонементы → Занятия; keep old links working.
  useEffect(() => {
    if (tabParam === "classes") router.replace("/admin/subscriptions/classes");
  }, [tabParam, router]);
  const initialTab = (VALID_TABS as readonly string[]).includes(tabParam || "")
    ? (tabParam as typeof VALID_TABS[number])
    : undefined;

  if (!user || tabParam === "classes") return null;

  return <ScheduleView user={user} initialTab={initialTab} />;
}
