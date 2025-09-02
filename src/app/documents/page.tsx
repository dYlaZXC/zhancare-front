"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";

export default function DocumentsPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <div>📄 Раздел документов в разработке...</div>
      </TabLayout>
    </AuthRedirect>
  );
}