"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import VideoConsultation from "@/components/services/VideoConsultation";

export default function VideoPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <VideoConsultation />
      </TabLayout>
    </AuthRedirect>
  );
}