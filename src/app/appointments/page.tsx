"use client";

import AuthRedirect from "@/components/AuthRedirect";
import TabLayout from "@/components/layout/TabLayout";
import Appointments from "@/components/services/HomeAppointments";

export default function AppointmentsPage() {
  return (
    <AuthRedirect>
      <TabLayout>
        <Appointments />
      </TabLayout>
    </AuthRedirect>
  );
}