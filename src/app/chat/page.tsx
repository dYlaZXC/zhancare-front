"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import ChatDoctors from "@/components/services/ChatDoctors";

export default function ChatPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <ChatDoctors />
      </TabLayout>
    </AuthRedirect>
  );
}