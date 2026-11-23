"use client";

import SmartConsultationFlow from "@/components/services/SmartConsultationFlow";
import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";

export default function SmartConsultationPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <SmartConsultationFlow />
      </TabLayout>
    </AuthRedirect>
  );
}
