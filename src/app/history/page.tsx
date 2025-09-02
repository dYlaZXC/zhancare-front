"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import MedicalHistory from "@/components/services/MedicalHistory";

export default function HistoryPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <MedicalHistory />
      </TabLayout>
    </AuthRedirect>
  );
}