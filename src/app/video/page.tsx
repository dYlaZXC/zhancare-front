"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import VideoConsultationFlow from "@/components/services/VideoConsultationFlow";

export default function VideoPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <VideoConsultationFlow />
      </TabLayout>
    </AuthRedirect>
  );
}