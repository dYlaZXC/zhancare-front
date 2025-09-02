"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import { ActivityLog } from "@/components/services/ActivityLog";

export default function ActivityPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <ActivityLog />
      </TabLayout>
    </AuthRedirect>
  );
}