"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import MedicalTourism from "@/components/services/MedicalTourism";

export default function ChatPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <MedicalTourism />
      </TabLayout>
    </AuthRedirect>
  );
}